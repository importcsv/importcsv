from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.core.config import settings
from app.schemas.user import UserRead, UserCreate, UserUpdate
from app.schemas.auth import RefreshTokenRequest, PasswordResetRequest
from app.models.user import User as UserModel

from app.auth.users import (
    fastapi_users,
    jwt_backend,
    cookie_backend,
    get_current_active_user as current_active_user,
)
from app.auth.token import (
    verify_refresh_token,
    revoke_token,
    revoke_all_user_tokens,
)

router = APIRouter()



# Include the FastAPI Users routers
# JWT Authentication (Bearer token)
router.include_router(
    fastapi_users.get_auth_router(jwt_backend),
    prefix="",  # Removed '/jwt' prefix to simplify the endpoint path
    tags=["auth"],
)

# Cookie Authentication (for web applications)
router.include_router(
    fastapi_users.get_auth_router(cookie_backend),
    prefix="/cookie",
    tags=["auth"],
)

# User registration
router.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="",  # No prefix to match the frontend URL: /api/v1/auth/register
    tags=["auth"],
)

# Password reset
router.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/reset-password",
    tags=["auth"],
)

# Email verification
router.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/verify",
    tags=["auth"],
)

# User management
router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)


@router.post("/refresh", response_model=Dict[str, str])
async def refresh_token_endpoint(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    """
    Refresh an access token using a refresh token
    """
    try:
        # Verify the refresh token
        token_data = verify_refresh_token(request.refresh_token, db)

        # Create a new access token using FastAPI-Users JWT backend
        # This ensures we're using the same token generation method as the login endpoint
        user = await fastapi_users.get_user_manager().get_by_id(token_data.user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User is inactive or not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Generate a new token using the JWT backend
        token = await jwt_backend.get_login_response(user, None)

        return {
            "access_token": token.access_token,
            "token_type": "bearer"
        }
    except Exception as e:
        print(f"Refresh token error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/logout")
async def logout(
    request: Request,
    user: UserModel = Depends(current_active_user),
    db: Session = Depends(get_db),
):
    """
    Logout the current user by revoking their current token
    """
    # Get the token from the Authorization header
    authorization = request.headers.get("Authorization")
    if not authorization:
        raise HTTPException(status_code=400, detail="Authorization header missing")

    try:
        # Extract the token
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=400, detail="Invalid authentication scheme")

        # Decode the token to get the JTI (token ID)
        try:
            # Decode with verification to extract the JTI
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )

            # Extract the JTI and revoke the token
            if "jti" in payload:
                token_id = payload["jti"]
                if revoke_token(token_id, db):
                    return {"detail": "Successfully logged out"}
                else:
                    raise HTTPException(status_code=500, detail="Error revoking token")
            else:
                raise HTTPException(status_code=400, detail="Invalid token format (missing JTI)")
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"}
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid token format: {str(e)}")


@router.post("/logout-all")
async def logout_all_devices(
    user: UserModel = Depends(current_active_user),
    db: Session = Depends(get_db),
):
    """
    Logout from all devices by revoking all tokens for the user
    """
    success = revoke_all_user_tokens(user.id, db)
    if success:
        return {"detail": "Successfully logged out from all devices"}
    else:
        raise HTTPException(status_code=500, detail="Error logging out from all devices")


@router.post("/request-password-reset", response_model=Dict[str, str])
async def request_password_reset(
    request: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    """
    Request a password reset for a user
    This endpoint is already provided by FastAPI Users, but we're adding it here
    for clarity and to potentially customize it in the future.
    """
    # This will be handled by FastAPI Users
    # We're just redirecting to their endpoint
    return {"detail": "If your email is registered, you will receive a password reset link"}


@router.get("/me", response_model=Dict[str, Any])
async def get_user_me(
    user: UserModel = Depends(current_active_user),
):
    """
    Get the current user's information
    """
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "is_verified": user.is_verified,
    }
