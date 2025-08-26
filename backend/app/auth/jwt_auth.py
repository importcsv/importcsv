"""
JWT authentication utilities for NextAuth integration.
"""
import logging
from typing import Dict, Optional, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt.exceptions import PyJWTError

from app.core.config import settings
from app.models.user import User
from sqlalchemy.orm import Session
from app.db.base import get_db

logger = logging.getLogger(__name__)

# Security scheme for Bearer token authentication
security = HTTPBearer()


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    """
    Verify the JWT token from NextAuth.
    
    Args:
        credentials: The HTTP Authorization credentials containing the JWT token.
    
    Returns:
        Dict[str, Any]: The decoded JWT payload.
    
    Raises:
        HTTPException: If the token is invalid.
    """
    logger.info(f"Verifying token: scheme={credentials.scheme}")
    
    try:
        # NextAuth uses HS256 by default with NEXTAUTH_SECRET
        payload = jwt.decode(
            credentials.credentials,
            settings.NEXTAUTH_SECRET or settings.SECRET_KEY,
            algorithms=["HS256"],
        )
        logger.info(f"Token verified successfully. Payload contains: {list(payload.keys())}")
        return payload
    except PyJWTError as e:
        logger.error(f"JWT verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}"
        )


async def get_current_user_id(
    payload: Dict[str, Any] = Depends(verify_token)
) -> str:
    """
    Extract the user ID from the verified JWT payload.
    
    Args:
        payload: The decoded JWT payload.
    
    Returns:
        str: The user ID (from email or sub claim).
    """
    logger.info(f"Extracting user ID from payload with keys: {list(payload.keys())}")
    
    # NextAuth puts user info in different claims
    # Try to get email first (NextAuth credentials provider)
    user_email = payload.get("email")
    if user_email:
        logger.info(f"Extracted user email: {user_email}")
        return user_email
    
    # Fallback to sub claim (OAuth providers)
    user_id = payload.get("sub")
    if not user_id:
        logger.error("No 'email' or 'sub' claim found in token payload")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
        )
    
    logger.info(f"Extracted user ID from sub: {user_id}")
    return user_id


async def get_current_user(
    user_identifier: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
) -> User:
    """
    Get the current user from the database based on their identifier.
    
    Args:
        user_identifier: The user identifier (email or ID).
        db: The database session.
    
    Returns:
        User: The user object.
    
    Raises:
        HTTPException: If the user is not found.
    """
    logger.info(f"Looking up user with identifier: {user_identifier}")
    
    # Try to find by email first
    if "@" in user_identifier:
        user = db.query(User).filter(User.email == user_identifier).first()
    else:
        # Try by ID if not an email
        user = db.query(User).filter(User.id == user_identifier).first()
    
    if not user:
        logger.error(f"No user found with identifier: {user_identifier}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    logger.info(f"Found user: id={user.id}, email={user.email}")
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


async def get_optional_user(
    token: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Get the current user if authenticated, otherwise return None.
    
    Args:
        token: The HTTP Authorization credentials.
        db: The database session.
    
    Returns:
        Optional[User]: The user object or None.
    """
    if not token:
        return None
    
    try:
        payload = jwt.decode(
            token.credentials,
            settings.NEXTAUTH_SECRET or settings.SECRET_KEY,
            algorithms=["HS256"],
        )
        
        # Get user identifier
        user_identifier = payload.get("email") or payload.get("sub")
        if not user_identifier:
            return None
        
        # Find user
        if "@" in user_identifier:
            user = db.query(User).filter(User.email == user_identifier).first()
        else:
            user = db.query(User).filter(User.id == user_identifier).first()
        
        return user
    except Exception:
        return None