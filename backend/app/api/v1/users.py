from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.base import get_db
from app.services.auth import get_current_user, get_current_active_superuser
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, User as UserSchema

router = APIRouter()

@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current user
    """
    return current_user

@router.get("/", response_model=List[UserSchema])
async def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Retrieve users (superuser only)
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=UserSchema)
async def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_superuser),
):
    """
    Create new user (superuser only)
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_superuser=user_in.is_superuser,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
