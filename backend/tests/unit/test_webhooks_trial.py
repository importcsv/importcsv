"""Tests for webhook handlers with trial support."""
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import Mock, patch, MagicMock

import pytest


@pytest.fixture
def trialing_user_with_stripe(db_session):
    """User on trial who just added CC via checkout."""
    from app.models.user import User

    user = User(
        id=uuid.uuid4(),
        email="trialing-stripe@example.com",
        subscription_tier="pro",
        subscription_status="trialing",
        trial_started_at=datetime.now(timezone.utc) - timedelta(days=5),
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=9),
        has_been_paying_customer=False,
        stripe_customer_id="cus_trialing123",
    )
    db_session.add(user)
    db_session.commit()
    return user


def test_checkout_completed_preserves_trial_status(db_session, trialing_user_with_stripe):
    """checkout.session.completed should preserve trialing status when user adds CC during trial."""
    from app.services.billing import BillingService
    from app.api.v1.webhooks import handle_checkout_completed

    billing = BillingService(db_session)

    session_data = {
        "customer": trialing_user_with_stripe.stripe_customer_id,
        "subscription": "sub_new123",
        "metadata": {"tier": "pro"},
    }

    with patch('app.api.v1.webhooks.email_service'):
        handle_checkout_completed(billing, session_data)

    db_session.refresh(trialing_user_with_stripe)

    # Status should stay trialing, not become active
    assert trialing_user_with_stripe.subscription_status == "trialing"
    assert trialing_user_with_stripe.subscription_id == "sub_new123"
    assert trialing_user_with_stripe.has_been_paying_customer is False


def test_payment_succeeded_marks_paying_customer(db_session, trialing_user_with_stripe):
    """invoice.payment_succeeded should mark user as paying customer."""
    from app.services.billing import BillingService
    from app.api.v1.webhooks import handle_payment_succeeded

    trialing_user_with_stripe.subscription_id = "sub_test123"
    db_session.commit()

    billing = BillingService(db_session)

    invoice_data = {
        "customer": trialing_user_with_stripe.stripe_customer_id,
        "subscription": "sub_test123",
        "amount_paid": 4900,  # $49.00 in cents
    }

    with patch('app.api.v1.webhooks.email_service'):
        handle_payment_succeeded(billing, invoice_data)

    db_session.refresh(trialing_user_with_stripe)

    assert trialing_user_with_stripe.has_been_paying_customer is True
    assert trialing_user_with_stripe.subscription_status == "active"
    assert trialing_user_with_stripe.trial_ends_at is None
