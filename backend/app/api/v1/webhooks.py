"""Webhook handlers for external services."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session

import stripe

from app.db.base import get_db
from app.core.config import settings
from app.core.features import is_cloud_mode, get_tier_import_limit, get_tier_max_rows
from app.services.billing import BillingService
from app.services.email import email_service
from app.models.stripe_webhook import ProcessedStripeEvent

logger = logging.getLogger(__name__)
router = APIRouter()


def _is_event_processed(db: Session, event_id: str) -> bool:
    """Check if a Stripe event has already been processed."""
    return db.query(ProcessedStripeEvent).filter(
        ProcessedStripeEvent.event_id == event_id
    ).first() is not None


def _mark_event_processed(db: Session, event_id: str, event_type: str) -> None:
    """Mark a Stripe event as processed."""
    db.add(ProcessedStripeEvent(event_id=event_id, event_type=event_type))
    db.commit()


@router.post("/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events."""
    if not is_cloud_mode():
        raise HTTPException(status_code=404, detail="Not available")

    # Validate webhook secret is configured
    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET not configured")
        raise HTTPException(status_code=500, detail="Webhook not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing signature")

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            settings.STRIPE_WEBHOOK_SECRET,
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Idempotency check - skip if already processed
    event_id = event["id"]
    event_type = event["type"]

    if _is_event_processed(db, event_id):
        logger.info(f"Skipping duplicate Stripe webhook: {event_id}")
        return {"status": "ok", "skipped": True}

    logger.info(f"Processing Stripe webhook: {event_type} ({event_id})")

    billing = BillingService(db)
    data = event["data"]["object"]

    try:
        if event_type == "checkout.session.completed":
            handle_checkout_completed(billing, data)

        elif event_type == "customer.subscription.updated":
            handle_subscription_updated(billing, data)

        elif event_type == "customer.subscription.deleted":
            handle_subscription_deleted(billing, data)

        elif event_type == "invoice.payment_failed":
            handle_payment_failed(billing, data)

        elif event_type == "invoice.payment_succeeded":
            handle_payment_succeeded(billing, data)

        # Mark as processed after successful handling
        _mark_event_processed(db, event_id, event_type)

    except Exception as e:
        logger.error(f"Error processing webhook {event_type}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Webhook processing failed")

    return {"status": "ok"}


def handle_checkout_completed(billing: BillingService, session: dict) -> None:
    """Handle successful checkout session."""
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    tier = session.get("metadata", {}).get("tier", "pro")

    if not customer_id or not subscription_id:
        logger.warning("Checkout completed but missing customer or subscription")
        return

    user = billing.update_subscription_from_webhook(
        stripe_customer_id=customer_id,
        subscription_id=subscription_id,
        status="active",
        tier=tier,
    )

    if user:
        email_service.send_upgrade_confirmation(
            user.email,
            tier_name=tier.title(),
            import_limit=get_tier_import_limit(tier),
            row_limit=get_tier_max_rows(tier),
        )


def handle_subscription_updated(billing: BillingService, subscription: dict) -> None:
    """Handle subscription update."""
    customer_id = subscription.get("customer")
    subscription_id = subscription.get("id")
    status = subscription.get("status")

    # Determine tier from price
    tier = None
    items = subscription.get("items", {}).get("data", [])
    if items:
        price_id = items[0].get("price", {}).get("id")
        if price_id == settings.STRIPE_PRICE_ID_PRO:
            tier = "pro"
        elif price_id == settings.STRIPE_PRICE_ID_BUSINESS:
            tier = "business"

    billing.update_subscription_from_webhook(
        stripe_customer_id=customer_id,
        subscription_id=subscription_id,
        status=status,
        tier=tier,
    )


def handle_subscription_deleted(billing: BillingService, subscription: dict) -> None:
    """Handle subscription cancellation."""
    customer_id = subscription.get("customer")
    subscription_id = subscription.get("id")

    user = billing.update_subscription_from_webhook(
        stripe_customer_id=customer_id,
        subscription_id=subscription_id,
        status="canceled",
        tier="free",
    )

    if user:
        email_service.send_subscription_paused(user.email)


def handle_payment_failed(billing: BillingService, invoice: dict) -> None:
    """Handle failed payment - start grace period."""
    customer_id = invoice.get("customer")

    user = billing.start_grace_period(customer_id)

    if user and user.grace_period_ends_at:
        days_left = (user.grace_period_ends_at - datetime.now(timezone.utc)).days
        email_service.send_grace_period_reminder(user.email, days_left)


def handle_payment_succeeded(billing: BillingService, invoice: dict) -> None:
    """Handle successful payment - clear grace period."""
    customer_id = invoice.get("customer")
    subscription_id = invoice.get("subscription")

    if subscription_id:
        billing.update_subscription_from_webhook(
            stripe_customer_id=customer_id,
            subscription_id=subscription_id,
            status="active",
        )
