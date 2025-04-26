import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from fastapi_users.schemas import BaseUser, BaseUserCreate, BaseUserUpdate


class UserRead(BaseUser[uuid.UUID]):
    full_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserCreate(BaseUserCreate):
    full_name: Optional[str] = None


class UserUpdate(BaseUserUpdate):
    full_name: Optional[str] = None


# Public registration schema
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None


# For backward compatibility with existing code
class User(UserRead):
    pass


# For internal use
class UserInDB(UserRead):
    hashed_password: str
