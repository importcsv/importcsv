"""Webhook handlers for external services."""

import logging
import time
from datetime import UTC, datetime

import httpx
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.jwt_auth import get_current_active_user
from app.core.config import settings
from app.core.features import get_tier_import_limit, get_tier_max_rows, is_cloud_mode
from app.db.base import get_db
from app.models.stripe_webhook import ProcessedStripeEvent
from app.models.user import User
from app.services.billing import BillingService
from app.services.delivery import is_safe_webhook_url
from app.services.email import email_service
from app.services.events import events
from app.services.events.types import EventType

logger = logging.getLogger(__name__)
router = APIRouter()

# HTTP status code constants
HTTP_SUCCESS_MIN = 200
HTTP_SUCCESS_MAX = 300


class TestWebhookRequest(BaseModel):
    """Request body for testing a webhook URL."""

    url: str


class TestWebhookResponse(BaseModel):
    """Response from testing a webhook URL."""

    success: bool
    status_code: int | None = None
    duration_ms: int
    error: str | None = None


@router.post("/test", response_model=TestWebhookResponse)
async def check_webhook_url(
    request: TestWebhookRequest,
    current_user: User = Depends(get_current_active_user),  # noqa: ARG001
) -> TestWebhookResponse:
    """
    Test a webhook URL before saving.

    Sends a generic test payload to verify the URL is reachable and returns 2xx.
    """
    # Validate URL
    if not is_safe_webhook_url(request.url):
        return TestWebhookResponse(
            success=False,
            duration_ms=0,
            error="URL must use HTTPS and cannot target internal/private addresses",
        )

    # Generic test payload
    payload = {
        "event": "test",
        "message": "Test webhook from ImportCSV",
        "data": [{"sample_field": "sample_value"}],
        "row_count": 1,
        "timestamp": datetime.now(UTC).isoformat(),
    }

    start_time = time.time()
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                request.url,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
        duration_ms = int((time.time() - start_time) * 1000)

        is_success = HTTP_SUCCESS_MIN <= response.status_code < HTTP_SUCCESS_MAX
        return TestWebhookResponse(
            success=is_success,
            status_code=response.status_code,
            duration_ms=duration_ms,
            error=None if is_success else f"HTTP {response.status_code}",
        )

    except httpx.TimeoutException:
        duration_ms = int((time.time() - start_time) * 1000)
        return TestWebhookResponse(
            success=False,
            duration_ms=duration_ms,
            error="Connection timed out",
        )

    except httpx.RequestError as e:
        duration_ms = int((time.time() - start_time) * 1000)
        # Sanitize error message to avoid leaking internal network details
        error_type = type(e).__name__
        return TestWebhookResponse(
            success=False,
            duration_ms=duration_ms,
            error=f"Connection failed: {error_type}",
        )


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

    # Check if user is currently on a trial
    user = billing.db.query(User).filter(
        User.stripe_customer_id == customer_id
    ).first()

    if user and user.subscription_status == "trialing" and user.trial_ends_at:
        # User added CC during trial - just save subscription_id, don't change status
        user.subscription_id = subscription_id
        billing.db.commit()
        logger.info(f"User {user.id} added payment method during trial")
        # Do NOT send upgrade email - they're still trialing
        return

    # Normal checkout (no trial) - existing behavior
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
        # Emit internal event
        events.emit(
            EventType.SUBSCRIPTION_STARTED,
            {
                "email": user.email,
                "plan": tier,
            },
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
        # Emit internal event
        events.emit(
            EventType.SUBSCRIPTION_CANCELLED,
            {
                "email": user.email,
                "plan": user.subscription_tier or "unknown",
            },
        )


def handle_payment_failed(billing: BillingService, invoice: dict) -> None:
    """Handle failed payment - start grace period."""
    customer_id = invoice.get("customer")

    user = billing.start_grace_period(customer_id)

    if user and user.grace_period_ends_at:
        days_left = (user.grace_period_ends_at - datetime.now(timezone.utc)).days
        email_service.send_grace_period_reminder(user.email, days_left)

    # Emit internal event (even if user not found, for monitoring)
    if user:
        events.emit(
            EventType.SUBSCRIPTION_PAYMENT_FAILED,
            {
                "email": user.email,
            },
        )


def handle_payment_succeeded(billing: BillingService, invoice: dict) -> None:
    """Handle successful payment - clear grace period and mark as paying customer."""
    customer_id = invoice.get("customer")
    subscription_id = invoice.get("subscription")

    if not subscription_id:
        return

    user = billing.db.query(User).filter(
        User.stripe_customer_id == customer_id
    ).first()

    if not user:
        logger.warning(f"No user found for customer {customer_id}")
        return

    # Mark as paying customer (first real payment)
    was_trialing = user.subscription_status == "trialing"
    if not user.has_been_paying_customer:
        user.has_been_paying_customer = True

    # Clear trial state
    user.trial_ends_at = None
    user.subscription_status = "active"

    # Clear grace period if applicable
    if user.grace_period_ends_at:
        user.grace_period_ends_at = None

    billing.db.commit()

    # Send subscription started email if this was a trial conversion
    if was_trialing:
        if user.trial_started_at:
            tier = user.subscription_tier
            # Get amount from invoice (source of truth) instead of hardcoding
            amount_cents = invoice.get("amount_paid", 0)
            amount = f"${amount_cents / 100:.2f}" if amount_cents else None
            if amount:
                email_service.send_subscription_started(
                    user.email,
                    tier_name=tier.title(),
                    amount=amount,
                )
            else:
                logger.warning(f"No amount_paid in invoice for user {user.id}, skipping conversion email")
        else:
            logger.warning(f"User {user.id} was trialing but had no trial_started_at - skipping conversion email")

    logger.info(f"Payment succeeded for user {user.id}, status now active")
