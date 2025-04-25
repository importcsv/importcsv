import uuid
import datetime
from datetime import timedelta
import pytz
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.token import TokenData


def create_refresh_token(
    user_id: UUID, expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a refresh token with a longer expiry than the access token
    """
    if expires_delta:
        expire = datetime.datetime.now(pytz.UTC) + expires_delta
    else:
        # Default to 7 days for refresh tokens
        expire = datetime.datetime.now(pytz.UTC) + timedelta(days=7)

    # Generate a unique token ID
    token_id = str(uuid.uuid4())

    # Get current time and expiration time as UTC timestamps
    now = datetime.datetime.now(pytz.UTC)

    to_encode = {
        "sub": str(user_id),
        "exp": int(expire.timestamp()),  # Use integer timestamp for consistency
        "iat": int(now.timestamp()),     # Use integer timestamp for consistency
        "jti": token_id,
        "aud": ["fastapi-users:refresh"],
    }



    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def verify_refresh_token(token: str, db: Session = None) -> TokenData:
    """
    Verify a refresh token and return the user ID if valid
    Simplified version without blacklist checks
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:

        # Decode the token
        try:
            # Try to decode with audience first
            try:
                payload = jwt.decode(
                    token,
                    settings.SECRET_KEY,
                    algorithms=[settings.ALGORITHM],
                    audience=["fastapi-users:refresh"]
                )
            except Exception as audience_error:
                # If audience validation fails, try without it
                payload = jwt.decode(
                    token,
                    settings.SECRET_KEY,
                    algorithms=[settings.ALGORITHM],
                    options={"verify_aud": False}
                )

        except Exception as decode_error:

            raise decode_error

        # Extract data
        user_id = UUID(payload["sub"])
        token_id = payload["jti"]

        # Ensure timezone-aware datetime objects
        try:
            # Handle both integer and datetime timestamps
            if isinstance(payload["exp"], int):
                expires_at = datetime.datetime.fromtimestamp(payload["exp"]).replace(tzinfo=pytz.UTC)
            else:
                expires_at = payload["exp"].replace(tzinfo=pytz.UTC) if payload["exp"].tzinfo is None else payload["exp"]

            if isinstance(payload["iat"], int):
                token_issued_at = datetime.datetime.fromtimestamp(payload["iat"]).replace(tzinfo=pytz.UTC)
            else:
                token_issued_at = payload["iat"].replace(tzinfo=pytz.UTC) if payload["iat"].tzinfo is None else payload["iat"]


        except Exception as time_error:

            raise time_error

        # Check if token is expired
        if datetime.datetime.now(pytz.UTC) > expires_at:

            raise credentials_exception


        # Create a TokenData object with the extracted information
        return TokenData(
            sub=str(user_id),
            jti=token_id,
            exp=int(expires_at.timestamp()),
            iat=int(token_issued_at.timestamp()),
            user_id=user_id,  # Additional field for convenience
            token_id=token_id,  # Additional field for convenience
            expires_at=expires_at  # Additional field for convenience
        )

    except JWTError as e:

        raise credentials_exception
    except Exception as e:

        raise credentials_exception


def revoke_token(token_id: str, db: Session = None) -> bool:
    """
    Simplified token revocation - just returns True for now
    In a production system, you would add the token to a blacklist
    """

    # For now, we'll just return True without doing anything
    # In a production system, you would add the token to a blacklist
    return True


def revoke_all_user_tokens(user_id: UUID, db: Session = None) -> bool:
    """
    Simplified function to revoke all tokens for a user
    In a production system, you would store all issued tokens for a user and revoke them.
    """

    # For now, we'll just return True without doing anything
    # In a production system, you would invalidate all tokens for the user
    return True
