import uuid
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.token import TokenBlacklist
from app.schemas.token import TokenData


def create_refresh_token(
    user_id: UUID, expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a refresh token with a longer expiry than the access token
    """
    if expires_delta:
        expire = datetime.now(datetime.timezone.utc) + expires_delta
    else:
        # Default to 7 days for refresh tokens
        expire = datetime.now(datetime.timezone.utc) + timedelta(days=7)

    # Generate a unique token ID
    token_id = str(uuid.uuid4())

    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(datetime.timezone.utc),
        "jti": token_id,
        "aud": ["fastapi-users:refresh"],
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def verify_refresh_token(token: str, db: Session) -> TokenData:
    """
    Verify a refresh token and return the user ID if valid
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode the token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            audience=["fastapi-users:refresh"]
        )

        # Extract data
        token_data = TokenData(**payload)
        user_id = UUID(token_data.sub)
        token_id = token_data.jti
        expires_at = datetime.fromtimestamp(token_data.exp)
        token_issued_at = datetime.fromtimestamp(token_data.iat)

        # Check if token is blacklisted
        blacklisted = db.query(TokenBlacklist).filter(
            TokenBlacklist.token_id == token_id
        ).first()

        if blacklisted:
            raise credentials_exception

        # Check if all tokens for this user have been invalidated before this token was issued
        # This handles the "logout from all devices" functionality
        invalidation_entry = db.query(TokenBlacklist).filter(
            TokenBlacklist.user_id == user_id,
            TokenBlacklist.invalidate_before.isnot(None),
            TokenBlacklist.invalidate_before > token_issued_at
        ).first()

        if invalidation_entry:
            raise credentials_exception

        # Check if token is expired
        if datetime.now(datetime.timezone.utc) > expires_at:
            raise credentials_exception

        return TokenData(
            user_id=user_id,
            token_id=token_id,
            expires_at=expires_at
        )

    except JWTError:
        raise credentials_exception


def revoke_token(token_id: str, db: Session) -> bool:
    """
    Add a token to the blacklist
    """
    try:
        # Create blacklist entry
        blacklist_entry = TokenBlacklist(token_id=token_id)
        db.add(blacklist_entry)
        db.commit()
        return True
    except Exception:
        db.rollback()
        return False


def revoke_all_user_tokens(user_id: UUID, db: Session) -> bool:
    """
    Revoke all tokens for a user (e.g., on password change or logout from all devices)

    In a production system, you would store all issued tokens for a user and revoke them.
    For this implementation, we'll add a special entry in the blacklist that can be
    checked during token verification to invalidate all tokens issued before a certain time.
    """
    try:
        # Create a special blacklist entry with the user_id and current timestamp
        # This will be used to invalidate all tokens issued before this time
        blacklist_entry = TokenBlacklist(
            token_id=f"all_tokens_{user_id}_{datetime.now(datetime.timezone.utc).timestamp()}",
            user_id=user_id,
            invalidate_before=datetime.now(datetime.timezone.utc)
        )
        db.add(blacklist_entry)
        db.commit()
        return True
    except Exception as e:
        print(f"Error revoking all tokens: {e}")
        db.rollback()
        return False
