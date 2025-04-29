import logging

from contextlib import contextmanager

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from typing import Generator, AsyncGenerator, Any, Dict

from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure engine options with best practices
engine_options: Dict[str, Any] = {
    "pool_pre_ping": True,  # Verify connections before using them
    "pool_recycle": 3600,  # Recycle connections after 1 hour
    "pool_size": 5,  # Maintain a pool of 5 connections
    "max_overflow": 10,  # Allow up to 10 additional connections
    "pool_timeout": 30,  # Wait up to 30 seconds for a connection
    "echo": False,  # Disable SQL logging in production
}

# Create SQLAlchemy engine for synchronous operations
engine = create_engine(settings.DATABASE_URL, **engine_options)


# Add connection pool events for monitoring
@event.listens_for(engine, "connect")
def connect(dbapi_connection, connection_record):
    logger.info("Database connection established")


@event.listens_for(engine, "checkout")
def checkout(dbapi_connection, connection_record, connection_proxy):
    logger.info("Database connection checked out from pool")


@event.listens_for(engine, "checkin")
def checkin(dbapi_connection, connection_record):
    logger.info("Database connection returned to pool")


# Create session factory for synchronous operations
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create async SQLAlchemy engine for FastAPI Users with proper URL conversion
async_url = settings.DATABASE_URL
if async_url.startswith("postgresql://"):
    async_url = async_url.replace("postgresql://", "postgresql+asyncpg://")

async_engine = create_async_engine(
    async_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False,
)

# Create async session factory
async_session_maker = sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)

# Create base class for models
Base = declarative_base()

# Import all models to ensure they are registered with SQLAlchemy
# This must be done after Base is defined but before any relationships are used
from app.db.models import *  # noqa


# Enhanced dependency to get DB session for synchronous operations with error handling
def get_db() -> Generator[Session, None, None]:
    """Dependency that provides a SQLAlchemy session for synchronous operations"""
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise
    finally:
        db.close()


# Context manager for manual session handling
@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """Context manager for database sessions when not using FastAPI dependency injection"""
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise
    finally:
        db.close()


# Enhanced dependency to get DB session for asynchronous operations
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides a SQLAlchemy session for asynchronous operations"""
    async with async_session_maker() as session:
        try:
            yield session
        except SQLAlchemyError as e:
            await session.rollback()
            logger.error(f"Async database error: {str(e)}")
            raise
        finally:
            await session.close()
