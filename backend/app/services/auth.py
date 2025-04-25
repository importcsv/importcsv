"""
Modern authentication service using FastAPI-Users.
"""
from typing import Optional, Dict, Any
from uuid import UUID

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.auth.users import get_current_active_user
from app.models.user import User


async def get_user_by_id(user_id: UUID, db: Session = Depends(get_db)) -> Optional[User]:
    """
    Get a user by ID
    """
    return db.query(User).filter(User.id == user_id).first()


async def get_user_by_email(email: str, db: Session = Depends(get_db)) -> Optional[User]:
    """
    Get a user by email
    """
    return db.query(User).filter(User.email == email).first()


async def get_current_user_data(
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """
    Get the current user's data
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
        "is_verified": current_user.is_verified,
    }
