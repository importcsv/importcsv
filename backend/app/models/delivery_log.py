"""DeliveryLog model for tracking delivery attempts and status."""
import enum
import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, Text, UUID
from sqlalchemy.sql import func

from app.db.base import Base


class DeliveryStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    RETRYING = "retrying"


class DeliveryLog(Base):
    """Track delivery attempts to integrations."""
    __tablename__ = "delivery_logs"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    import_job_id = Column(UUID, ForeignKey("import_jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    integration_id = Column(UUID, ForeignKey("integrations.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(Enum(DeliveryStatus), nullable=False, default=DeliveryStatus.PENDING)
    attempts = Column(Integer, nullable=False, default=0)
    last_error = Column(Text, nullable=True)
    rows_delivered = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
