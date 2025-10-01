"""
Unit tests for database utilities.

Tests the db_transaction context manager and other database helper functions.
"""
import os
import uuid
import pytest
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.utils import db_transaction
from app.models.user import User


@pytest.mark.unit
def test_db_transaction_success(db_session: Session):
    """Test successful transaction commit."""
    user_id = uuid.uuid4()

    with db_transaction(db_session):
        user = User(
            id=user_id,
            email="transaction_test@example.com",
            full_name="Transaction Test",
            is_active=True,
        )
        db_session.add(user)

    # Verify the user was committed
    db_session.expire_all()  # Clear session cache
    saved_user = db_session.query(User).filter(User.id == user_id).first()
    assert saved_user is not None
    assert saved_user.email == "transaction_test@example.com"


@pytest.mark.unit
def test_db_transaction_rollback_on_exception(db_session: Session):
    """Test transaction rollback when exception occurs."""
    user_id = uuid.uuid4()

    with pytest.raises(ValueError):
        with db_transaction(db_session):
            user = User(
                id=user_id,
                email="rollback_test@example.com",
                full_name="Rollback Test",
                is_active=True,
            )
            db_session.add(user)
            # Raise an exception to trigger rollback
            raise ValueError("Test exception")

    # Verify the user was NOT committed
    db_session.expire_all()
    saved_user = db_session.query(User).filter(User.id == user_id).first()
    assert saved_user is None


@pytest.mark.unit
def test_db_transaction_nested_operations(db_session: Session):
    """Test transaction with multiple operations."""
    user_id_1 = uuid.uuid4()
    user_id_2 = uuid.uuid4()

    with db_transaction(db_session):
        user1 = User(
            id=user_id_1,
            email="user1@example.com",
            full_name="User One",
            is_active=True,
        )
        user2 = User(
            id=user_id_2,
            email="user2@example.com",
            full_name="User Two",
            is_active=True,
        )
        db_session.add(user1)
        db_session.add(user2)

    # Verify both users were committed
    db_session.expire_all()
    saved_user1 = db_session.query(User).filter(User.id == user_id_1).first()
    saved_user2 = db_session.query(User).filter(User.id == user_id_2).first()

    assert saved_user1 is not None
    assert saved_user2 is not None


@pytest.mark.unit
@pytest.mark.skipif(
    os.environ.get("DATABASE_URL", "").startswith("sqlite"),
    reason="SQLite transaction isolation differs from PostgreSQL - nested transactions behave differently"
)
def test_db_transaction_integrity_error(db_session: Session):
    """Test transaction rollback on database integrity error."""
    user_id = uuid.uuid4()

    # Create a user
    with db_transaction(db_session):
        user = User(
            id=user_id,
            email="unique@example.com",
            full_name="Unique User",
            is_active=True,
        )
        db_session.add(user)

    # Try to create another user with the same email (should fail)
    with pytest.raises(IntegrityError):
        with db_transaction(db_session):
            duplicate_user = User(
                id=uuid.uuid4(),
                email="unique@example.com",  # Duplicate email
                full_name="Duplicate User",
                is_active=True,
            )
            db_session.add(duplicate_user)

    # Verify only one user exists
    db_session.expire_all()
    users = db_session.query(User).filter(User.email == "unique@example.com").all()
    assert len(users) == 1


@pytest.mark.unit
def test_db_transaction_partial_rollback(db_session: Session):
    """Test that failed transaction doesn't affect previous committed data."""
    user_id_1 = uuid.uuid4()
    user_id_2 = uuid.uuid4()

    # First transaction succeeds
    with db_transaction(db_session):
        user1 = User(
            id=user_id_1,
            email="success@example.com",
            full_name="Success User",
            is_active=True,
        )
        db_session.add(user1)

    # Second transaction fails
    with pytest.raises(ValueError):
        with db_transaction(db_session):
            user2 = User(
                id=user_id_2,
                email="failure@example.com",
                full_name="Failure User",
                is_active=True,
            )
            db_session.add(user2)
            raise ValueError("Test exception")

    # Verify first user still exists, second doesn't
    db_session.expire_all()
    saved_user1 = db_session.query(User).filter(User.id == user_id_1).first()
    saved_user2 = db_session.query(User).filter(User.id == user_id_2).first()

    assert saved_user1 is not None
    assert saved_user2 is None


@pytest.mark.unit
def test_db_transaction_empty_transaction(db_session: Session):
    """Test transaction with no operations."""
    # This should not raise any errors
    with db_transaction(db_session):
        pass

    # Verify session is still usable
    user_count = db_session.query(User).count()
    assert user_count >= 0
