"""Tests for checkout session creation with trial support."""
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch, MagicMock

import pytest


@pytest.fixture
def trialing_user(db_session):
    """User currently on a trial."""
    from app.models.user import User

    user = User(
        id=uuid.uuid4(),
        email="trialing@example.com",
        subscription_tier="pro",
        subscription_status="trialing",
        trial_started_at=datetime.now(timezone.utc) - timedelta(days=5),
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=9),
        has_been_paying_customer=False,
        stripe_customer_id="cus_test123",
    )
    db_session.add(user)
    db_session.commit()
    return user


@patch('app.services.billing.stripe')
def test_checkout_for_trialing_user_includes_trial_end(mock_stripe, db_session, trialing_user):
    """Checkout for trialing user should include trial_end in subscription_data."""
    from app.services.billing import BillingService

    mock_session = MagicMock()
    mock_session.url = "https://checkout.stripe.com/test"
    mock_stripe.checkout.Session.create.return_value = mock_session

    service = BillingService(db_session)
    service.create_checkout_session(
        user=trialing_user,
        tier="pro",
        success_url="https://example.com/success",
        cancel_url="https://example.com/cancel",
    )

    # Verify subscription_data.trial_end was passed
    call_kwargs = mock_stripe.checkout.Session.create.call_args.kwargs
    assert "subscription_data" in call_kwargs
    assert "trial_end" in call_kwargs["subscription_data"]

    # Verify trial_end matches user's trial_ends_at (handle timezone normalization)
    trial_ends_at = trialing_user.trial_ends_at
    if trial_ends_at.tzinfo is None:
        trial_ends_at = trial_ends_at.replace(tzinfo=timezone.utc)
    expected_trial_end = int(trial_ends_at.timestamp())
    assert call_kwargs["subscription_data"]["trial_end"] == expected_trial_end


@patch('app.services.billing.stripe')
def test_checkout_for_non_trialing_user_no_trial_end(mock_stripe, db_session):
    """Checkout for non-trialing user should not include trial_end."""
    from app.models.user import User
    from app.services.billing import BillingService

    user = User(
        id=uuid.uuid4(),
        email="regular@example.com",
        subscription_tier="free",
        subscription_status="free",
        has_been_paying_customer=False,
        stripe_customer_id="cus_regular123",
    )
    db_session.add(user)
    db_session.commit()

    mock_session = MagicMock()
    mock_session.url = "https://checkout.stripe.com/test"
    mock_stripe.checkout.Session.create.return_value = mock_session

    service = BillingService(db_session)
    service.create_checkout_session(
        user=user,
        tier="pro",
        success_url="https://example.com/success",
        cancel_url="https://example.com/cancel",
    )

    # Verify subscription_data does NOT have trial_end
    call_kwargs = mock_stripe.checkout.Session.create.call_args.kwargs
    subscription_data = call_kwargs.get("subscription_data", {})
    assert "trial_end" not in subscription_data
