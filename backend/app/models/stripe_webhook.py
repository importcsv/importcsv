"""Model for tracking processed Stripe webhook events for idempotency."""

from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func

from app.db.base import Base


class ProcessedStripeEvent(Base):
    """Track processed Stripe webhook events to ensure idempotency.

    Stripe may deliver webhook events multiple times (retry on failure,
    network issues). We store the event ID to avoid processing duplicates.
    """

    __tablename__ = "processed_stripe_events"

    event_id = Column(String(255), primary_key=True)
    event_type = Column(String(100), nullable=False)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())
