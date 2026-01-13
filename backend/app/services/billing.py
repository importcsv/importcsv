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
        """Create a Stripe Checkout session for subscription or upgrade existing."""
        customer_id = self.get_or_create_stripe_customer(user)

        price_id = self._get_price_id_for_tier(tier)
        if not price_id:
            raise ValueError(f"No price configured for tier: {tier}")

        # If user has an active subscription, modify it instead of creating new
        if user.subscription_id and user.subscription_status == "active":
            return self._change_subscription(user, tier, price_id, success_url)

        # If user has a subscription and is trialing (CC already added), modify it
        if user.subscription_id and user.subscription_status == "trialing":
            return self._change_subscription_during_trial(user, tier, price_id, success_url)

        # Build subscription_data
        subscription_data = {
            "metadata": {"user_id": str(user.id), "tier": tier},
        }

        # If user is on a local trial (no subscription yet), preserve trial end date
        if user.subscription_status == "trialing" and user.trial_ends_at:
            trial_ends_at = self._ensure_tz_aware(user.trial_ends_at)
            subscription_data["trial_end"] = int(trial_ends_at.timestamp())

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": str(user.id), "tier": tier},
            subscription_data=subscription_data,
        )

        logger.info(f"Created checkout session {session.id} for user {user.id}")
        return session.url

    def _change_subscription_during_trial(
        self,
        user: User,
        tier: SubscriptionTier,
        price_id: str,
        success_url: str,
    ) -> str:
        """Change subscription tier during trial (user already has CC on file)."""
        if user.subscription_tier == tier:
            raise ValueError(f"Already on {tier} tier")

        try:
            subscription = stripe.Subscription.retrieve(user.subscription_id)

            stripe.Subscription.modify(
                user.subscription_id,
                items=[{
                    "id": subscription["items"]["data"][0]["id"],
                    "price": price_id,
                }],
                proration_behavior="none",  # No proration during trial
                metadata={"tier": tier},
            )
        except stripe.error.StripeError as e:
            logger.error(f"Stripe API error during trial tier change: {e}")
            raise ValueError(f"Failed to change subscription: {e.user_message}")

        user.subscription_tier = tier
        self.db.commit()

        logger.info(f"Changed trial tier for user {user.id} to {tier}")
        return success_url

    def _change_subscription(
        self,
        user: User,
        tier: SubscriptionTier,
        price_id: str,
        success_url: str,
    ) -> str:
        """Change an existing subscription to a different tier (upgrade or downgrade)."""
        # Validate tier change is meaningful
        if user.subscription_tier == tier:
            raise ValueError(f"Already subscribed to {tier} tier")

        try:
            # Get the current subscription
            subscription = stripe.Subscription.retrieve(user.subscription_id)

            # Update the subscription with the new price (replaces the old one)
            stripe.Subscription.modify(
                user.subscription_id,
                items=[{
                    "id": subscription["items"]["data"][0]["id"],
                    "price": price_id,
                }],
                proration_behavior="create_prorations",
                metadata={"tier": tier},
            )
        except stripe.error.StripeError as e:
            logger.error(f"Stripe API error during subscription change for user {user.id}: {e}")
            raise ValueError(f"Failed to change subscription: {e.user_message}")

        # Update local user record
        user.subscription_tier = tier
        self.db.commit()

        logger.info(f"Changed subscription for user {user.id} to {tier}")

        # Return success URL directly since no checkout needed
        return success_url

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
        now = datetime.now(timezone.utc)

        # Calculate trial days remaining
        trial_days_remaining = None
        if user.trial_ends_at:
            # Handle both timezone-aware and naive datetimes
            trial_end = user.trial_ends_at
            if trial_end.tzinfo is None:
                trial_end = trial_end.replace(tzinfo=timezone.utc)
            delta = trial_end - now
            trial_days_remaining = max(0, delta.days)

        return {
            "tier": user.subscription_tier,
            "status": user.subscription_status,
            "stripe_customer_id": user.stripe_customer_id,
            "subscription_id": user.subscription_id,
            "grace_period_ends_at": user.grace_period_ends_at.isoformat() if user.grace_period_ends_at else None,
            "is_in_grace_period": self._is_in_grace_period(user),
            # Trial fields
            "is_trialing": user.subscription_status == "trialing",
            "trial_ends_at": user.trial_ends_at.isoformat() if user.trial_ends_at else None,
            "trial_days_remaining": trial_days_remaining,
            "has_payment_method": user.subscription_id is not None,
            "is_eligible_for_trial": self.is_eligible_for_trial(user),
        }

    def is_eligible_for_trial(self, user: User) -> bool:
        """Check if user is eligible for a free trial.

        A user is eligible if:
        1. They have never started a trial (trial_started_at is None)
        2. They have never been a paying customer
        """
        return (
            user.trial_started_at is None and
            not user.has_been_paying_customer
        )

    def start_trial(self, user: User, tier: SubscriptionTier) -> dict:
        """Start a free trial for a user or upgrade tier during trial.

        Args:
            user: The user to start trial for
            tier: The tier to trial ('pro' or 'business')

        Returns:
            dict with trial info including is_new_trial flag

        Raises:
            ValueError if user is not eligible and not already trialing,
                or if tier is not valid for trial
        """
        # Validate tier is eligible for trial
        if tier not in ("pro", "business"):
            raise ValueError(f"Tier '{tier}' is not eligible for trial. Choose 'pro' or 'business'.")

        now = datetime.now(timezone.utc)
        is_new_trial = False

        # Check if user is currently on an active trial
        trial_ends_at = self._ensure_tz_aware(user.trial_ends_at)

        if user.subscription_status == "trialing" and trial_ends_at and trial_ends_at > now:
            # Upgrade/downgrade during trial - just change tier (trial_ends_at preserved)
            user.subscription_tier = tier
            self.db.commit()
            logger.info(f"User {user.id} changed trial tier to {tier}")
        elif self.is_eligible_for_trial(user):
            # Start new trial
            user.trial_started_at = now
            user.trial_ends_at = now + timedelta(days=settings.TRIAL_DURATION_DAYS)
            user.subscription_tier = tier
            user.subscription_status = "trialing"
            is_new_trial = True
            self.db.commit()
            logger.info(f"Started {tier} trial for user {user.id}")
        else:
            raise ValueError("User is not eligible for a trial. Please add a payment method to subscribe.")

        # Calculate days remaining (use max to avoid negative values for expired trials)
        trial_ends_at = self._ensure_tz_aware(user.trial_ends_at)
        days_remaining = max(0, (trial_ends_at - now).days) if trial_ends_at else 0

        return {
            "status": "trialing",
            "tier": user.subscription_tier,
            "trial_ends_at": user.trial_ends_at.isoformat() if user.trial_ends_at else None,
            "trial_days_remaining": days_remaining,
            "is_new_trial": is_new_trial,
        }

    def cancel_trial(self, user: User) -> dict:
        """Cancel an active trial and downgrade to free tier.

        Note: trial_started_at is preserved to prevent re-trial abuse.

        Args:
            user: The user whose trial to cancel

        Returns:
            dict with new subscription status

        Raises:
            ValueError if user is not currently on a trial
        """
        # Guard: only allow cancelling if user is actually on a trial
        if user.subscription_status != "trialing":
            raise ValueError("User is not currently on a trial")

        # If user has Stripe subscription (added CC during trial), cancel it
        if user.subscription_id:
            try:
                stripe.Subscription.cancel(user.subscription_id)
                logger.info(f"Cancelled Stripe subscription {user.subscription_id} for user {user.id}")
            except stripe.error.StripeError as e:
                logger.error(f"Failed to cancel Stripe subscription: {e}")
                # Continue with local cancellation even if Stripe fails

        user.subscription_tier = "free"
        user.subscription_status = "free"
        user.trial_ends_at = None
        user.subscription_id = None
        # Note: trial_started_at is intentionally NOT cleared

        self.db.commit()
        logger.info(f"Cancelled trial for user {user.id}")

        return {
            "status": "free",
            "tier": "free",
            "message": "Your trial has been cancelled.",
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

    def _ensure_tz_aware(self, dt: Optional[datetime]) -> Optional[datetime]:
        """Ensure datetime is timezone-aware (assume UTC for naive datetimes).

        SQLite doesn't preserve timezone info, so datetimes retrieved from
        the test database may be naive. This helper normalizes them to UTC.
        """
        if dt is not None and dt.tzinfo is None:
            return dt.replace(tzinfo=timezone.utc)
        return dt

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
            "trialing": "trialing",  # Preserve trialing status
            "paused": "paused",
        }
        if stripe_status not in mapping:
            logger.warning(f"Unknown Stripe subscription status: {stripe_status}, defaulting to past_due")
            return "past_due"
        return mapping[stripe_status]
