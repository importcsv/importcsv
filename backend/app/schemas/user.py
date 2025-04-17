import uuid
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from fastapi_users import schemas

class UserRead(schemas.BaseUser[uuid.UUID]):
    full_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserCreate(schemas.BaseUserCreate):
    full_name: Optional[str] = None

class UserUpdate(schemas.BaseUserUpdate):
    full_name: Optional[str] = None

# For backward compatibility with existing code
class User(UserRead):
    pass

# For internal use
class UserInDB(UserRead):
    hashed_password: str
