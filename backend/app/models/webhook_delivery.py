"""WebhookDelivery model for tracking webhook delivery attempts."""

import enum
import uuid

from sqlalchemy import UUID, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class WebhookDeliveryStatus(str, enum.Enum):
    SUCCESS = "success"
    FAILED = "failed"
    RETRY_SUCCESS = "retry_success"


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    destination_id = Column(
        UUID,
        ForeignKey("importer_destinations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Request info
    request_url = Column(String(2048), nullable=False)
    request_payload_preview = Column(Text)  # First 1KB of payload

    # Response info
    status_code = Column(Integer)
    response_body_preview = Column(Text)  # First 1KB of response
    duration_ms = Column(Integer)

    # Status
    success = Column(Enum(WebhookDeliveryStatus), nullable=False)
    error_message = Column(Text)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    destination = relationship("ImporterDestination", back_populates="deliveries")
