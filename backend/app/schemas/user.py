import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserBase(BaseModel):
    """Base user properties"""
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    is_verified: bool = False


class UserCreate(UserBase):
    """Properties to receive on user creation"""
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """Properties to receive on user update"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    is_verified: Optional[bool] = None


class User(UserBase):
    """Properties to return to client"""
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True


class UserInDB(User):
    """Properties stored in DB"""
    hashed_password: Optional[str] = None  # Optional for OAuth users


# Public registration schema (alias for UserCreate)
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
