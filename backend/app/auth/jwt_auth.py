"""
JWT authentication utilities for backend-driven auth.
Supports both Authorization header (API consumers) and HTTP-only cookies (browser auth).
"""
import logging
from typing import Dict, Optional, Any

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt.exceptions import PyJWTError

from app.core.config import settings
from app.models.user import User
from sqlalchemy.orm import Session
from app.db.base import get_db

logger = logging.getLogger(__name__)

# Security scheme for Bearer token authentication (auto_error=False to allow cookie fallback)
security = HTTPBearer(auto_error=False)


async def verify_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    access_token: Optional[str] = Cookie(default=None),
) -> Dict[str, Any]:
    """
    Verify JWT token from either Authorization header or cookie.

    Priority:
    1. Authorization: Bearer <token> header (for API consumers)
    2. access_token cookie (for browser-based auth)

    Args:
        credentials: The HTTP Authorization credentials containing the JWT token.
        access_token: The access_token from HTTP-only cookie.

    Returns:
        Dict[str, Any]: The decoded JWT payload.

    Raises:
        HTTPException: If no token is provided or token is invalid.
    """
    token = None

    # Try Authorization header first
    if credentials:
        token = credentials.credentials
        logger.debug("Using token from Authorization header")
    # Fall back to cookie
    elif access_token:
        token = access_token
        logger.debug("Using token from access_token cookie")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Support both NextAuth (legacy) and new backend-issued tokens
        payload = jwt.decode(
            token,
            settings.NEXTAUTH_SECRET or settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        logger.debug(f"Token verified successfully. Payload contains: {list(payload.keys())}")
        return payload
    except PyJWTError as e:
        logger.warning(f"JWT verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_id(
    payload: Dict[str, Any] = Depends(verify_token)
) -> str:
    """
    Extract the user ID from the verified JWT payload.

    Args:
        payload: The decoded JWT payload.

    Returns:
        str: The user ID (from sub claim) or email.
    """
    # Try sub claim first (standard JWT)
    user_id = payload.get("sub")
    if user_id:
        logger.debug(f"Extracted user ID from sub: {user_id}")
        return user_id

    # Fallback to email (NextAuth legacy)
    user_email = payload.get("email")
    if user_email:
        logger.debug(f"Extracted user email: {user_email}")
        return user_email

    logger.error("No 'sub' or 'email' claim found in token payload")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token payload",
    )


async def get_current_user(
    user_identifier: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> User:
    """
    Get the current user from the database based on their identifier.

    Args:
        user_identifier: The user identifier (ID or email).
        db: The database session.

    Returns:
        User: The user object.

    Raises:
        HTTPException: If the user is not found.
    """
    logger.debug(f"Looking up user with identifier: {user_identifier}")

    # Try to find by email if identifier contains @
    if "@" in user_identifier:
        user = db.query(User).filter(User.email == user_identifier).first()
    else:
        # Try by ID
        user = db.query(User).filter(User.id == user_identifier).first()

    if not user:
        logger.warning(f"No user found with identifier: {user_identifier}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    logger.debug(f"Found user: id={user.id}, email={user.email}")
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get the current active user.

    Args:
        current_user: The current user.

    Returns:
        User: The current active user.

    Raises:
        HTTPException: If the user is inactive.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Get the current superuser.

    Args:
        current_user: The current active user.

    Returns:
        User: The current superuser.

    Raises:
        HTTPException: If the user is not a superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a superuser",
        )
    return current_user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    access_token: Optional[str] = Cookie(default=None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Get current user if authenticated, None otherwise.
    Does not raise exceptions - useful for optional authentication.

    Args:
        credentials: The HTTP Authorization credentials.
        access_token: The access_token from HTTP-only cookie.
        db: The database session.

    Returns:
        Optional[User]: The user object or None if not authenticated.
    """
    token = None
    if credentials:
        token = credentials.credentials
    elif access_token:
        token = access_token

    if not token:
        return None

    try:
        payload = jwt.decode(
            token,
            settings.NEXTAUTH_SECRET or settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        # Get user identifier
        user_id = payload.get("sub") or payload.get("email")
        if not user_id:
            return None

        # Find user
        if "@" in user_id:
            user = db.query(User).filter(User.email == user_id).first()
        else:
            user = db.query(User).filter(User.id == user_id).first()

        return user
    except PyJWTError:
        return None


# Alias for backward compatibility
get_optional_user = get_current_user_optional
