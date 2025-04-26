import enum
import uuid
from sqlalchemy import (
    Column,
    Integer,
    JSON,
    DateTime,
    ForeignKey,
    Enum,
    Boolean,
    UUID,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class WebhookEventType(str, enum.Enum):
    IMPORT_STARTED = "import.started"
    IMPORT_VALIDATION_ERROR = "import.validation_error"
    IMPORT_PROGRESS = "import.progress"
    IMPORT_FINISHED = "import.finished"
    IMPORT_FAILED = "import.failed"


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    import_job_id = Column(UUID, ForeignKey("import_jobs.id"), nullable=False)
    event_type = Column(Enum(WebhookEventType), nullable=False)
    payload = Column(JSON, nullable=False)
    delivered = Column(Boolean, default=False, nullable=False)
    delivery_attempts = Column(Integer, default=0, nullable=False)
    last_delivery_attempt = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships - using simple string references
    user = relationship("User", back_populates="webhook_events")
    import_job = relationship("ImportJob", back_populates="webhook_events")
