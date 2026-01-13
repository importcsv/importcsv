"""Tests for trial fields on User model."""
import uuid
from datetime import datetime, timezone, timedelta

import pytest


def test_user_has_trial_started_at_field(db_session):
    """User model should have trial_started_at field."""
    from app.models.user import User

    user = User(
        id=uuid.uuid4(),
        email="trial@example.com",
        trial_started_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()

    assert user.trial_started_at is not None


def test_user_has_trial_ends_at_field(db_session):
    """User model should have trial_ends_at field."""
    from app.models.user import User

    user = User(
        id=uuid.uuid4(),
        email="trial2@example.com",
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=14),
    )
    db_session.add(user)
    db_session.commit()

    assert user.trial_ends_at is not None


def test_user_has_been_paying_customer_default_false(db_session):
    """User should have has_been_paying_customer defaulting to False."""
    from app.models.user import User

    user = User(
        id=uuid.uuid4(),
        email="trial3@example.com",
    )
    db_session.add(user)
    db_session.commit()

    assert user.has_been_paying_customer is False


def test_user_has_trial_warning_sent_at_field(db_session):
    """User model should have trial_warning_sent_at field."""
    from app.models.user import User

    user = User(
        id=uuid.uuid4(),
        email="trial4@example.com",
        trial_warning_sent_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()

    assert user.trial_warning_sent_at is not None
