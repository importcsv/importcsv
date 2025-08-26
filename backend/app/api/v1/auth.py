"""
Authentication endpoints for NextAuth integration.
"""
import uuid
import secrets
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.db.base import get_db
from app.models.user import User as UserModel
from app.auth.jwt_auth import get_current_active_user
from app.schemas.user import UserCreate, User

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.NEXTAUTH_SECRET or settings.SECRET_KEY,
        algorithm="HS256"
    )
    return encoded_jwt


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    # Find user by email
    user = db.query(UserModel).filter(UserModel.email == form_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/register", response_model=User)
async def register(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate
) -> UserModel:
    """
    Create new user registration
    """
    # Check if user already exists
    existing_user = db.query(UserModel).filter(UserModel.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    
    # Create new user
    hashed_password = get_password_hash(user_in.password)
    db_user = UserModel(
        id=uuid.uuid4(),
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        is_active=user_in.is_active,
        is_superuser=user_in.is_superuser,
        is_verified=True,  # Auto-verify for now
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.post("/oauth/sync")
async def sync_oauth_user(
    *,
    db: Session = Depends(get_db),
    email: str,
    name: Optional[str] = None,
    provider: Optional[str] = None,
    providerId: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sync OAuth user with database (create if doesn't exist)
    """
    # Check if user exists
    user = db.query(UserModel).filter(UserModel.email == email).first()
    
    if not user:
        # Create new user from OAuth
        user = UserModel(
            id=uuid.uuid4(),
            email=email,
            hashed_password=None,  # OAuth users don't have passwords
            full_name=name,
            is_active=True,
            is_superuser=False,
            is_verified=True,  # OAuth users are pre-verified
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update existing user info if provided
        if name and not user.full_name:
            user.full_name = name
            db.commit()
    
    # Create access token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    return {
        "access_token": access_token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
        }
    }


@router.get("/me", response_model=Dict[str, Any])
async def get_user_me(
    user: UserModel = Depends(get_current_active_user),
):
    """
    Get the current user's information
    """
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "is_verified": user.is_verified,
        "profile_image": user.profile_image,
    }