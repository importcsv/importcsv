"""
Unit tests for JWT authentication module.

Tests token verification, user authentication, and authorization.
"""
import pytest
import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.auth.jwt_auth import (
    verify_token,
    get_current_user_id,
    get_current_user,
    get_current_active_user,
    get_current_superuser,
    get_optional_user,
)
from app.core.config import settings
from app.models.user import User


# ============================================================================
# Token Verification Tests
# ============================================================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_verify_token_valid():
    """Test verification of a valid JWT token."""
    # Create a valid token
    payload = {
        "email": "test@example.com",
        "sub": "test-user-id",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=30),
    }
    token = jwt.encode(
        payload,
        settings.NEXTAUTH_SECRET or settings.SECRET_KEY,
        algorithm="HS256"
    )

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    verified_payload = await verify_token(credentials)

    assert verified_payload["email"] == "test@example.com"
    assert verified_payload["sub"] == "test-user-id"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_verify_token_expired():
    """Test verification of an expired token."""
    # Create an expired token
    payload = {
        "email": "test@example.com",
        "sub": "test-user-id",
        "iat": datetime.utcnow() - timedelta(hours=2),
        "exp": datetime.utcnow() - timedelta(hours=1),
    }
    token = jwt.encode(
        payload,
        settings.NEXTAUTH_SECRET or settings.SECRET_KEY,
        algorithm="HS256"
    )

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    with pytest.raises(HTTPException) as exc_info:
        await verify_token(credentials)

    assert exc_info.value.status_code == 401


@pytest.mark.unit
@pytest.mark.asyncio
async def test_verify_token_invalid_signature():
    """Test verification of a token with invalid signature."""
    # Create a token with wrong secret
    payload = {
        "email": "test@example.com",
        "sub": "test-user-id",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=30),
    }
    token = jwt.encode(payload, "wrong-secret-key", algorithm="HS256")

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    with pytest.raises(HTTPException) as exc_info:
        await verify_token(credentials)

    assert exc_info.value.status_code == 401


@pytest.mark.unit
@pytest.mark.asyncio
async def test_verify_token_malformed():
    """Test verification of a malformed token."""
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="not-a-valid-jwt-token"
    )

    with pytest.raises(HTTPException) as exc_info:
        await verify_token(credentials)

    assert exc_info.value.status_code == 401


# ============================================================================
# User ID Extraction Tests
# ============================================================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_id_from_email():
    """Test extracting user ID from email claim."""
    payload = {
        "email": "user@example.com",
        "sub": "fallback-id",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=30),
    }

    user_id = await get_current_user_id(payload)
    assert user_id == "user@example.com"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_id_from_sub():
    """Test extracting user ID from sub claim when email is not present."""
    payload = {
        "sub": "user-uuid",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=30),
    }

    user_id = await get_current_user_id(payload)
    assert user_id == "user-uuid"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_id_missing_claims():
    """Test error when both email and sub are missing."""
    payload = {
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=30),
    }

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user_id(payload)

    assert exc_info.value.status_code == 401
    assert "Invalid user ID" in str(exc_info.value.detail)


# ============================================================================
# Get Current User Tests
# ============================================================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_by_email(db_session: Session, test_user: User):
    """Test retrieving current user by email."""
    user = await get_current_user(test_user.email, db_session)
    assert user.id == test_user.id
    assert user.email == test_user.email


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_by_id(db_session: Session, test_user: User):
    """Test retrieving current user by ID."""
    user = await get_current_user(str(test_user.id), db_session)
    assert user.id == test_user.id
    assert user.email == test_user.email


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_not_found(db_session: Session):
    """Test error when user is not found."""
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user("nonexistent@example.com", db_session)

    assert exc_info.value.status_code == 401
    assert "User not found" in str(exc_info.value.detail)


# ============================================================================
# Active User Tests
# ============================================================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_active_user_success(test_user: User):
    """Test getting active user succeeds for active users."""
    user = await get_current_active_user(test_user)
    assert user.id == test_user.id
    assert user.is_active is True


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_active_user_inactive(test_inactive_user: User):
    """Test error when user is inactive."""
    with pytest.raises(HTTPException) as exc_info:
        await get_current_active_user(test_inactive_user)

    assert exc_info.value.status_code == 403
    assert "Inactive user" in str(exc_info.value.detail)


# ============================================================================
# Superuser Tests
# ============================================================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_superuser_success(test_superuser: User):
    """Test getting superuser succeeds for superusers."""
    user = await get_current_superuser(test_superuser)
    assert user.id == test_superuser.id
    assert user.is_superuser is True


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_superuser_not_superuser(test_user: User):
    """Test error when user is not a superuser."""
    with pytest.raises(HTTPException) as exc_info:
        await get_current_superuser(test_user)

    assert exc_info.value.status_code == 403
    assert "Not a superuser" in str(exc_info.value.detail)


# ============================================================================
# Optional User Tests
# ============================================================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_optional_user_with_valid_token(db_session: Session, test_user: User):
    """Test getting optional user with valid token."""
    # Create a valid token
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

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    user = await get_optional_user(credentials, db_session)

    assert user is not None
    assert user.id == test_user.id


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_optional_user_with_invalid_token(db_session: Session):
    """Test getting optional user with invalid token returns None."""
    credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="invalid-token"
    )
    user = await get_optional_user(credentials, db_session)
    assert user is None


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_optional_user_no_token(db_session: Session):
    """Test getting optional user without token returns None."""
    user = await get_optional_user(None, db_session)
    assert user is None


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_optional_user_user_not_found(db_session: Session):
    """Test getting optional user when user doesn't exist returns None."""
    # Create a valid token for non-existent user
    payload = {
        "email": "nonexistent@example.com",
        "sub": "nonexistent-id",
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(minutes=30),
    }
    token = jwt.encode(
        payload,
        settings.NEXTAUTH_SECRET or settings.SECRET_KEY,
        algorithm="HS256"
    )

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    user = await get_optional_user(credentials, db_session)
    assert user is None
