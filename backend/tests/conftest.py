"""
Test configuration and fixtures for the ImportCSV backend.

This module provides pytest fixtures for:
- Test database setup and teardown
- FastAPI test clients (sync and async)
- Authentication fixtures
- Mock external services
- Test data factories
"""
import os
import uuid
from typing import Generator, AsyncGenerator
from unittest.mock import Mock, patch, AsyncMock

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy import create_engine, TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.types import String

# Create a UUID type that works with SQLite (stores as TEXT)
class GUID(TypeDecorator):
    """Platform-independent GUID type.

    Uses PostgreSQL's UUID type, otherwise uses CHAR(36), storing as stringified hex values.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if isinstance(value, uuid.UUID):
                return str(value)
            else:
                return str(uuid.UUID(value))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if isinstance(value, uuid.UUID):
                return value
            else:
                return uuid.UUID(value)

# Set test environment variables before importing app modules
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-at-least-32-characters-long-for-testing"
os.environ["WEBHOOK_SECRET"] = "test-webhook-secret"
os.environ["NEXTAUTH_SECRET"] = "test-nextauth-secret"
os.environ["ENVIRONMENT"] = "development"
# Disable external services during tests
os.environ.pop("REDIS_URL", None)  # Disables event queue (prevents real Slack notifications)
os.environ.pop("SLACK_WEBHOOK_URL", None)  # Extra safety

# Patch engine creation to use SQLite-compatible options
from unittest.mock import patch as mock_patch

original_create_engine = None
original_create_async_engine = None

def patched_create_engine(url, **kwargs):
    """Create engine with SQLite-compatible options."""
    # Remove PostgreSQL-specific options for SQLite
    if url.startswith("sqlite"):
        sqlite_kwargs = {
            "connect_args": {"check_same_thread": False},
            "poolclass": StaticPool,
            "echo": kwargs.get("echo", False),
        }
        return original_create_engine(url, **sqlite_kwargs)
    return original_create_engine(url, **kwargs)

def patched_create_async_engine(url, **kwargs):
    """Create async engine with SQLite-compatible options."""
    # Remove PostgreSQL-specific options for SQLite
    if url.startswith("sqlite"):
        # Use aiosqlite for async SQLite
        async_url = url.replace("sqlite://", "sqlite+aiosqlite://")
        sqlite_kwargs = {
            "echo": kwargs.get("echo", False),
        }
        return original_create_async_engine(async_url, **sqlite_kwargs)
    return original_create_async_engine(url, **kwargs)

# Apply the patches before importing app modules
import sqlalchemy
import sqlalchemy.ext.asyncio
from sqlalchemy.dialects import registry

original_create_engine = sqlalchemy.create_engine
original_create_async_engine = sqlalchemy.ext.asyncio.create_async_engine
sqlalchemy.create_engine = patched_create_engine
sqlalchemy.ext.asyncio.create_async_engine = patched_create_async_engine

# Patch the UUID type to use our GUID implementation
import sqlalchemy.types as sqltypes
original_UUID = sqltypes.UUID

class PatchedUUID(GUID):
    """Patched UUID type that uses GUID for SQLite compatibility."""
    cache_ok = True

sqltypes.UUID = PatchedUUID
sqlalchemy.UUID = PatchedUUID

from app.db.base import Base, get_db
from app.auth.jwt_auth import get_current_active_user
from app.models.user import User
from app.models.importer import Importer
from app.core.config import settings


# ============================================================================
# Database Fixtures
# ============================================================================

@pytest.fixture(scope="session")
def test_engine():
    """
    Create a test database engine using SQLite in-memory.

    Uses StaticPool to ensure the in-memory database persists across connections
    within the test session.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)

    yield engine

    # Drop all tables after tests
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(test_engine) -> Generator[Session, None, None]:
    """
    Provide a clean database session for each test.

    Each test gets a fresh transaction that is rolled back after the test,
    ensuring test isolation.
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)(autocommit=False, autoflush=False)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


# ============================================================================
# FastAPI Client Fixtures
# ============================================================================

@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """
    Provide a FastAPI TestClient with overridden dependencies.

    The database dependency is overridden to use the test database session.
    """
    from app.main import app

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
async def async_client(db_session: Session) -> AsyncGenerator[AsyncClient, None]:
    """
    Provide an async FastAPI client for testing async endpoints.
    """
    from app.main import app

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# ============================================================================
# User and Authentication Fixtures
# ============================================================================

@pytest.fixture
def test_user(db_session: Session) -> User:
    """
    Create a test user in the database.
    """
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        full_name="Test User",
        is_active=True,
        is_superuser=False,
        is_verified=True,
        hashed_password="$2b$12$test_hashed_password",  # Mock bcrypt hash
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_superuser(db_session: Session) -> User:
    """
    Create a test superuser in the database.
    """
    user = User(
        id=uuid.uuid4(),
        email="admin@example.com",
        full_name="Admin User",
        is_active=True,
        is_superuser=True,
        is_verified=True,
        hashed_password="$2b$12$test_hashed_password",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_inactive_user(db_session: Session) -> User:
    """
    Create an inactive test user.
    """
    user = User(
        id=uuid.uuid4(),
        email="inactive@example.com",
        full_name="Inactive User",
        is_active=False,
        is_superuser=False,
        is_verified=True,
        hashed_password="$2b$12$test_hashed_password",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """
    Generate JWT authentication headers for the test user.
    """
    import jwt
    from datetime import datetime, timedelta

    # Create a JWT token matching NextAuth format
    payload = {
        "email": test_user.email,
        "sub": str(test_user.id),
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=30),
    }

    token = jwt.encode(
        payload,
        settings.NEXTAUTH_SECRET or settings.SECRET_KEY,
        algorithm="HS256"
    )

    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def superuser_auth_headers(test_superuser: User) -> dict:
    """
    Generate JWT authentication headers for the superuser.
    """
    import jwt
    from datetime import datetime, timedelta

    payload = {
        "email": test_superuser.email,
        "sub": str(test_superuser.id),
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=30),
    }

    token = jwt.encode(
        payload,
        settings.NEXTAUTH_SECRET or settings.SECRET_KEY,
        algorithm="HS256"
    )

    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_current_user(test_user: User):
    """
    Mock the get_current_active_user dependency to return the test user.
    """
    from app.main import app

    def override_get_current_active_user():
        return test_user

    app.dependency_overrides[get_current_active_user] = override_get_current_active_user

    yield test_user

    app.dependency_overrides.clear()


# ============================================================================
# Test Data Fixtures
# ============================================================================

@pytest.fixture
def sample_importer_data() -> dict:
    """
    Sample importer data for testing.
    """
    return {
        "name": "Test Importer",
        "description": "A test importer for unit tests",
        "fields": [
            {
                "name": "email",
                "label": "Email Address",
                "type": "email",
                "required": True,
            },
            {
                "name": "name",
                "label": "Full Name",
                "type": "text",
                "required": True,
            },
            {
                "name": "age",
                "label": "Age",
                "type": "number",
                "required": False,
            },
        ],
        "webhook_url": "https://example.com/webhook",
        "webhook_enabled": True,
        "include_unmatched_columns": False,
        "filter_invalid_rows": False,
        "disable_on_invalid_rows": False,
    }


@pytest.fixture
def sample_importer(db_session: Session, test_user: User) -> Importer:
    """
    Create a sample importer in the database.
    """
    importer = Importer(
        id=uuid.uuid4(),
        key=uuid.uuid4(),
        name="Test Importer",
        description="A test importer",
        user_id=test_user.id,
        fields=[
            {"name": "email", "label": "Email", "type": "email", "required": True},
            {"name": "name", "label": "Name", "type": "text", "required": True},
        ],
        webhook_url="https://example.com/webhook",
        webhook_enabled=True,
        include_unmatched_columns=False,
        filter_invalid_rows=False,
        disable_on_invalid_rows=False,
    )
    db_session.add(importer)
    db_session.commit()
    db_session.refresh(importer)
    return importer


@pytest.fixture
def sample_csv_content() -> str:
    """
    Sample CSV content for testing.
    """
    return """email,name,age
john@example.com,John Doe,30
jane@example.com,Jane Smith,25
bob@example.com,Bob Johnson,35
"""


# ============================================================================
# Mock External Services
# ============================================================================

@pytest.fixture
def mock_redis():
    """
    Mock Redis Queue operations.
    """
    with patch("app.services.queue.get_redis_connection") as mock:
        mock_conn = Mock()
        mock.return_value = mock_conn
        yield mock


@pytest.fixture
def mock_rq_queue():
    """
    Mock RQ Queue for background jobs.
    """
    with patch("rq.Queue") as mock:
        mock_queue = Mock()
        mock_queue.enqueue.return_value = Mock(id="test-job-id")
        mock.return_value = mock_queue
        yield mock_queue


@pytest.fixture
def mock_litellm():
    """
    Mock LiteLLM API calls for column mapping.
    """
    with patch("litellm.acompletion") as mock:
        mock.return_value = AsyncMock(
            choices=[
                {
                    "message": {
                        "content": '{"email": "email_col", "name": "name_col"}'
                    }
                }
            ]
        )
        yield mock


@pytest.fixture
def mock_baml_client():
    """
    Mock BAML client for data transformations.
    """
    with patch("app.services.transformation.b") as mock:
        mock_transform = AsyncMock()
        mock_transform.return_value = {"status": "success", "data": {}}
        mock.TransformData = mock_transform
        yield mock


@pytest.fixture
def mock_httpx_client():
    """
    Mock httpx.AsyncClient for webhook delivery.
    """
    with patch("httpx.AsyncClient") as mock:
        mock_client = AsyncMock()
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.text = "OK"
        mock_client.post.return_value = mock_response
        mock.return_value.__aenter__.return_value = mock_client
        yield mock_client


# ============================================================================
# Utility Fixtures
# ============================================================================

@pytest.fixture
def anyio_backend():
    """
    Configure the async backend for pytest-asyncio.
    """
    return "asyncio"
