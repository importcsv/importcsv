"""Tests for trial expiry worker."""

import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest

from app.models.user import User
from app.workers.trial_worker import process_expired_trials, send_trial_warning_emails


@pytest.fixture
def expired_trial_user(db_session):
    """User whose trial has expired (no CC)."""
    user = User(
        id=uuid.uuid4(),
        email="expired@example.com",
        subscription_tier="pro",
        subscription_status="trialing",
        trial_started_at=datetime.now(UTC) - timedelta(days=15),
        trial_ends_at=datetime.now(UTC) - timedelta(hours=1),
        has_been_paying_customer=False,
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def active_trial_user(db_session):
    """User with active trial."""
    user = User(
        id=uuid.uuid4(),
        email="active@example.com",
        subscription_tier="pro",
        subscription_status="trialing",
        trial_started_at=datetime.now(UTC) - timedelta(days=5),
        trial_ends_at=datetime.now(UTC) + timedelta(days=9),
        has_been_paying_customer=False,
    )
    db_session.add(user)
    db_session.commit()
    return user


def test_process_expired_trials_downgrades_user(db_session, expired_trial_user):
    """process_expired_trials should downgrade expired trial users to free."""
    with patch("app.workers.trial_worker.email_service"):
        process_expired_trials(db_session)

    db_session.refresh(expired_trial_user)

    assert expired_trial_user.subscription_tier == "free"
    assert expired_trial_user.subscription_status == "free"
    assert expired_trial_user.trial_ends_at is None
    assert expired_trial_user.trial_started_at is not None  # Preserved


def test_process_expired_trials_skips_active_trials(db_session, active_trial_user):
    """process_expired_trials should not affect active trials."""
    with patch("app.workers.trial_worker.email_service"):
        process_expired_trials(db_session)

    db_session.refresh(active_trial_user)

    assert active_trial_user.subscription_status == "trialing"
    assert active_trial_user.subscription_tier == "pro"


def test_process_expired_trials_skips_users_with_subscription_id(db_session):
    """process_expired_trials should skip users who have a Stripe subscription (CC added)."""
    user = User(
        id=uuid.uuid4(),
        email="has-subscription@example.com",
        subscription_tier="pro",
        subscription_status="trialing",
        trial_started_at=datetime.now(UTC) - timedelta(days=15),
        trial_ends_at=datetime.now(UTC) - timedelta(hours=1),
        has_been_paying_customer=False,
        subscription_id="sub_stripe123",  # Has Stripe subscription - should be skipped
    )
    db_session.add(user)
    db_session.commit()

    with patch("app.workers.trial_worker.email_service"):
        process_expired_trials(db_session)

    db_session.refresh(user)

    # Should NOT be downgraded - Stripe handles this user
    assert user.subscription_status == "trialing"
    assert user.subscription_tier == "pro"


# Tests for send_trial_warning_emails


@pytest.fixture
def user_needing_warning(db_session):
    """User whose trial ends soon and needs a warning email."""
    user = User(
        id=uuid.uuid4(),
        email="needs-warning@example.com",
        subscription_tier="pro",
        subscription_status="trialing",
        trial_started_at=datetime.now(UTC) - timedelta(days=12),
        trial_ends_at=datetime.now(UTC) + timedelta(days=2),  # Within warning window
        has_been_paying_customer=False,
        trial_warning_sent_at=None,  # No warning sent yet
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def user_already_warned(db_session):
    """User who has already received a warning email."""
    user = User(
        id=uuid.uuid4(),
        email="already-warned@example.com",
        subscription_tier="pro",
        subscription_status="trialing",
        trial_started_at=datetime.now(UTC) - timedelta(days=12),
        trial_ends_at=datetime.now(UTC) + timedelta(days=2),
        has_been_paying_customer=False,
        trial_warning_sent_at=datetime.now(UTC) - timedelta(days=1),  # Already warned
    )
    db_session.add(user)
    db_session.commit()
    return user


def test_send_trial_warning_emails_sends_to_eligible_user(db_session, user_needing_warning):
    """send_trial_warning_emails should send email to users within warning window."""
    with patch("app.workers.trial_worker.email_service") as mock_email:
        result = send_trial_warning_emails(db_session)

    assert result == 1
    mock_email.send_trial_ending_soon.assert_called_once()

    db_session.refresh(user_needing_warning)
    assert user_needing_warning.trial_warning_sent_at is not None


def test_send_trial_warning_emails_skips_already_warned_user(db_session, user_already_warned):
    """send_trial_warning_emails should skip users who already received warning."""
    original_warning_time = user_already_warned.trial_warning_sent_at

    with patch("app.workers.trial_worker.email_service") as mock_email:
        result = send_trial_warning_emails(db_session)

    assert result == 0
    mock_email.send_trial_ending_soon.assert_not_called()

    db_session.refresh(user_already_warned)
    assert user_already_warned.trial_warning_sent_at == original_warning_time


def test_send_trial_warning_emails_skips_user_with_subscription_id(db_session):
    """send_trial_warning_emails should skip users who have added CC (have subscription_id)."""
    user = User(
        id=uuid.uuid4(),
        email="has-cc@example.com",
        subscription_tier="pro",
        subscription_status="trialing",
        trial_started_at=datetime.now(UTC) - timedelta(days=12),
        trial_ends_at=datetime.now(UTC) + timedelta(days=2),
        has_been_paying_customer=False,
        trial_warning_sent_at=None,
        subscription_id="sub_stripe456",  # Has CC on file
    )
    db_session.add(user)
    db_session.commit()

    with patch("app.workers.trial_worker.email_service") as mock_email:
        result = send_trial_warning_emails(db_session)

    assert result == 0
    mock_email.send_trial_ending_soon.assert_not_called()


def test_send_trial_warning_emails_skips_user_not_in_warning_window(db_session):
    """send_trial_warning_emails should skip users whose trial ends outside warning window."""
    user = User(
        id=uuid.uuid4(),
        email="not-soon@example.com",
        subscription_tier="pro",
        subscription_status="trialing",
        trial_started_at=datetime.now(UTC) - timedelta(days=5),
        trial_ends_at=datetime.now(UTC) + timedelta(days=9),  # Outside 3-day warning window
        has_been_paying_customer=False,
        trial_warning_sent_at=None,
    )
    db_session.add(user)
    db_session.commit()

    with patch("app.workers.trial_worker.email_service") as mock_email:
        result = send_trial_warning_emails(db_session)

    assert result == 0
    mock_email.send_trial_ending_soon.assert_not_called()
