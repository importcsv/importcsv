"""Billing service for Stripe integration."""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID

import stripe
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.features import SubscriptionTier
from app.models.user import User

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class BillingService:
    """Service for managing Stripe billing operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_or_create_stripe_customer(self, user: User) -> str:
        """Get existing Stripe customer or create a new one."""
        if user.stripe_customer_id:
            return user.stripe_customer_id

        customer = stripe.Customer.create(
            email=user.email,
            name=user.full_name,
            metadata={"user_id": str(user.id)},
        )

        user.stripe_customer_id = customer.id
        self.db.commit()

        logger.info(f"Created Stripe customer {customer.id} for user {user.id}")
        return customer.id

    def create_checkout_session(
        self,
        user: User,
        tier: SubscriptionTier,
        success_url: str,
        cancel_url: str,
    ) -> str:
        """Create a Stripe Checkout session for subscription."""
        customer_id = self.get_or_create_stripe_customer(user)

        price_id = self._get_price_id_for_tier(tier)
        if not price_id:
            raise ValueError(f"No price configured for tier: {tier}")

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": str(user.id), "tier": tier},
        )

        logger.info(f"Created checkout session {session.id} for user {user.id}")
        return session.url

    def create_portal_session(self, user: User, return_url: str) -> str:
        """Create a Stripe Customer Portal session."""
        if not user.stripe_customer_id:
            raise ValueError("User has no Stripe customer ID")

        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=return_url,
        )

        return session.url

    def get_subscription_status(self, user: User) -> dict:
        """Get the current subscription status for a user."""
        return {
            "tier": user.subscription_tier,
            "status": user.subscription_status,
            "stripe_customer_id": user.stripe_customer_id,
            "subscription_id": user.subscription_id,
            "grace_period_ends_at": user.grace_period_ends_at.isoformat() if user.grace_period_ends_at else None,
            "is_in_grace_period": self._is_in_grace_period(user),
        }

    def update_subscription_from_webhook(
        self,
        stripe_customer_id: str,
        subscription_id: str,
        status: str,
        tier: Optional[SubscriptionTier] = None,
    ) -> Optional[User]:
        """Update user subscription from Stripe webhook."""
        user = self.db.query(User).filter(
            User.stripe_customer_id == stripe_customer_id
        ).first()

        if not user:
            logger.warning(f"No user found for Stripe customer {stripe_customer_id}")
            return None

        user.subscription_id = subscription_id
        user.subscription_status = self._map_stripe_status(status)

        if tier:
            user.subscription_tier = tier

        # Clear grace period if payment succeeded
        if status == "active":
            user.grace_period_ends_at = None

        self.db.commit()
        logger.info(f"Updated subscription for user {user.id}: status={status}, tier={tier}")

        return user

    def start_grace_period(self, stripe_customer_id: str) -> Optional[User]:
        """Start grace period for failed payment."""
        user = self.db.query(User).filter(
            User.stripe_customer_id == stripe_customer_id
        ).first()

        if not user:
            return None

        user.subscription_status = "past_due"
        user.grace_period_ends_at = datetime.now(timezone.utc) + timedelta(
            days=settings.PAYMENT_GRACE_PERIOD_DAYS
        )

        self.db.commit()
        logger.info(f"Started grace period for user {user.id}, ends at {user.grace_period_ends_at}")

        return user

    def end_grace_period(self, user: User) -> None:
        """End grace period and downgrade to free tier."""
        user.subscription_tier = "free"
        user.subscription_status = "canceled"
        user.subscription_id = None
        user.grace_period_ends_at = None

        self.db.commit()
        logger.info(f"Grace period ended for user {user.id}, downgraded to free tier")

    def _is_in_grace_period(self, user: User) -> bool:
        """Check if user is currently in grace period."""
        if not user.grace_period_ends_at:
            return False
        return datetime.now(timezone.utc) < user.grace_period_ends_at

    def _get_price_id_for_tier(self, tier: SubscriptionTier) -> Optional[str]:
        """Get Stripe price ID for a tier."""
        if tier == "pro":
            return settings.STRIPE_PRICE_ID_PRO
        elif tier == "business":
            return settings.STRIPE_PRICE_ID_BUSINESS
        return None

    def _map_stripe_status(self, stripe_status: str) -> str:
        """Map Stripe subscription status to our status."""
        mapping = {
            "active": "active",
            "past_due": "past_due",
            "canceled": "canceled",
            "unpaid": "past_due",
            "incomplete": "past_due",
            "incomplete_expired": "canceled",
            "trialing": "active",
            "paused": "paused",
        }
        if stripe_status not in mapping:
            logger.warning(f"Unknown Stripe subscription status: {stripe_status}, defaulting to past_due")
            return "past_due"
        return mapping[stripe_status]
