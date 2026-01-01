import uuid
from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, UUID, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class UsageRecord(Base):
    __tablename__ = "usage_records"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    period = Column(String(7), nullable=False)  # YYYY-MM
    import_count = Column(Integer, default=0, nullable=False)
    row_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Email tracking to prevent duplicate emails per period
    warning_email_sent = Column(Boolean, default=False, nullable=False)
    limit_email_sent = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="usage_records")

    __table_args__ = (
        Index("ix_usage_user_period", "user_id", "period", unique=True),
    )
