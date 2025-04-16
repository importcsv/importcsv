from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base

class WebhookEventType(str, enum.Enum):
    IMPORT_STARTED = "import.started"
    IMPORT_VALIDATION_ERROR = "import.validation_error"
    IMPORT_PROGRESS = "import.progress"
    IMPORT_FINISHED = "import.finished"

class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    import_job_id = Column(Integer, ForeignKey("import_jobs.id"))
    event_type = Column(Enum(WebhookEventType))
    payload = Column(JSON)
    delivered = Column(Boolean, default=False)
    delivery_attempts = Column(Integer, default=0)
    last_delivery_attempt = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="webhook_events")
    import_job = relationship("ImportJob", back_populates="webhook_events")
