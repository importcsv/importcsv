from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from typing import Generator, AsyncGenerator

from app.core.config import settings

# Create SQLAlchemy engine for synchronous operations
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Check connection before using it
    pool_recycle=3600,   # Recycle connections after 1 hour
    pool_size=5,         # Maintain a pool of 5 connections
    max_overflow=10,     # Allow up to 10 additional connections
    echo=False  # Disable SQL logging
)

# Create session factory for synchronous operations
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create async SQLAlchemy engine for FastAPI Users
async_engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    pool_pre_ping=True,
    echo=False,  # Disable SQL logging
)

# Create async session factory
async_session_maker = sessionmaker(
    async_engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# Create base class for models
Base = declarative_base()

# Import all models to ensure they are registered with SQLAlchemy
# This must be done after Base is defined but before any relationships are used
from app.db.models import *  # noqa

# Dependency to get DB session for synchronous operations
def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Dependency to get DB session for asynchronous operations
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
