"""User database utilities for FastAPI Users.

This module provides the necessary database dependencies for FastAPI Users.
"""
from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_async_session
from app.models.user import User

async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    """Get a SQLAlchemy user database instance.
    
    This is a dependency that will be used by FastAPI Users.
    """
    yield SQLAlchemyUserDatabase(session, User)
