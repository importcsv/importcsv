"""Tests for trial eligibility checking."""
import uuid
from datetime import datetime, timezone, timedelta

import pytest
from unittest.mock import Mock


@pytest.fixture
def fresh_user(db_session):
    """User who has never trialed or paid."""
    from app.models.user import User

    user = User(
        id=uuid.uuid4(),
        email="fresh@example.com",
        subscription_tier="free",
        subscription_status="free",
        trial_started_at=None,
        has_been_paying_customer=False,
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def trialed_user(db_session):
    """User who has already used their trial."""
    from app.models.user import User

    user = User(
        id=uuid.uuid4(),
        email="trialed@example.com",
        subscription_tier="free",
        subscription_status="free",
        trial_started_at=datetime.now(timezone.utc) - timedelta(days=30),
        has_been_paying_customer=False,
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def paying_user(db_session):
    """User who has been a paying customer."""
    from app.models.user import User

    user = User(
        id=uuid.uuid4(),
        email="paying@example.com",
        subscription_tier="free",
        subscription_status="free",
        trial_started_at=None,
        has_been_paying_customer=True,
    )
    db_session.add(user)
    db_session.commit()
    return user


def test_fresh_user_is_eligible_for_trial(db_session, fresh_user):
    """Fresh user should be eligible for trial."""
    from app.services.billing import BillingService

    service = BillingService(db_session)
    assert service.is_eligible_for_trial(fresh_user) is True


def test_trialed_user_not_eligible(db_session, trialed_user):
    """User who already trialed should not be eligible."""
    from app.services.billing import BillingService

    service = BillingService(db_session)
    assert service.is_eligible_for_trial(trialed_user) is False


def test_paying_user_not_eligible(db_session, paying_user):
    """User who has paid should not be eligible."""
    from app.services.billing import BillingService

    service = BillingService(db_session)
    assert service.is_eligible_for_trial(paying_user) is False


def test_start_trial_sets_fields(db_session, fresh_user):
    """start_trial should set trial fields correctly."""
    from app.services.billing import BillingService
    from app.core.config import settings

    service = BillingService(db_session)
    result = service.start_trial(fresh_user, "pro")

    assert fresh_user.trial_started_at is not None
    assert fresh_user.trial_ends_at is not None
    assert fresh_user.subscription_tier == "pro"
    assert fresh_user.subscription_status == "trialing"
    assert result["is_new_trial"] is True


def test_start_trial_upgrade_during_trial(db_session):
    """start_trial should allow tier upgrade during active trial."""
    from app.models.user import User
    from app.services.billing import BillingService
    from datetime import datetime, timezone, timedelta

    # User currently on Pro trial
    user = User(
        id=uuid.uuid4(),
        email="upgrading@example.com",
        subscription_tier="pro",
        subscription_status="trialing",
        trial_started_at=datetime.now(timezone.utc) - timedelta(days=5),
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=9),
        has_been_paying_customer=False,
    )
    db_session.add(user)
    db_session.commit()

    original_trial_ends_at = user.trial_ends_at

    service = BillingService(db_session)
    result = service.start_trial(user, "business")

    assert user.subscription_tier == "business"
    assert user.trial_ends_at == original_trial_ends_at  # Same end date
    assert result["is_new_trial"] is False


def test_start_trial_rejects_ineligible_user(db_session, trialed_user):
    """start_trial should raise error for ineligible user."""
    from app.services.billing import BillingService

    service = BillingService(db_session)

    with pytest.raises(ValueError, match="not eligible"):
        service.start_trial(trialed_user, "pro")


def test_cancel_trial_downgrades_to_free(db_session):
    """cancel_trial should downgrade user to free tier."""
    from app.models.user import User
    from app.services.billing import BillingService
    from datetime import datetime, timezone, timedelta

    user = User(
        id=uuid.uuid4(),
        email="canceling@example.com",
        subscription_tier="pro",
        subscription_status="trialing",
        trial_started_at=datetime.now(timezone.utc) - timedelta(days=5),
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=9),
        has_been_paying_customer=False,
    )
    db_session.add(user)
    db_session.commit()

    service = BillingService(db_session)
    service.cancel_trial(user)

    assert user.subscription_tier == "free"
    assert user.subscription_status == "free"
    assert user.trial_ends_at is None
    assert user.trial_started_at is not None  # Should be preserved


def test_cancel_trial_preserves_trial_started_at(db_session):
    """cancel_trial should preserve trial_started_at to prevent re-trial."""
    from app.models.user import User
    from app.services.billing import BillingService
    from datetime import datetime, timezone, timedelta

    trial_start = datetime.now(timezone.utc) - timedelta(days=5)
    user = User(
        id=uuid.uuid4(),
        email="preserving@example.com",
        subscription_tier="pro",
        subscription_status="trialing",
        trial_started_at=trial_start,
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=9),
        has_been_paying_customer=False,
    )
    db_session.add(user)
    db_session.commit()

    service = BillingService(db_session)
    service.cancel_trial(user)

    assert user.trial_started_at is not None  # Preserved


def test_start_trial_rejects_free_tier(db_session, fresh_user):
    """start_trial should reject 'free' tier."""
    from app.services.billing import BillingService

    service = BillingService(db_session)

    with pytest.raises(ValueError, match="not eligible for trial"):
        service.start_trial(fresh_user, "free")


def test_cancel_trial_rejects_non_trialing_user(db_session, fresh_user):
    """cancel_trial should reject user not currently on trial."""
    from app.services.billing import BillingService

    service = BillingService(db_session)

    with pytest.raises(ValueError, match="not currently on a trial"):
        service.cancel_trial(fresh_user)


def test_cancel_trial_rejects_active_subscription(db_session):
    """cancel_trial should reject user with active paid subscription."""
    from app.models.user import User
    from app.services.billing import BillingService

    user = User(
        id=uuid.uuid4(),
        email="active@example.com",
        subscription_tier="pro",
        subscription_status="active",
        has_been_paying_customer=True,
        subscription_id="sub_12345",
    )
    db_session.add(user)
    db_session.commit()

    service = BillingService(db_session)

    with pytest.raises(ValueError, match="not currently on a trial"):
        service.cancel_trial(user)
