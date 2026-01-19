import uuid

from sqlalchemy import Column, String, Boolean, DateTime, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for OAuth users
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Profile
    profile_image = Column(String, nullable=True)

    # Billing fields
    stripe_customer_id = Column(String(255), unique=True, index=True, nullable=True)
    subscription_id = Column(String(255), nullable=True)
    subscription_tier = Column(String(20), default="free", nullable=False)
    subscription_status = Column(String(20), default="active", nullable=False)
    grace_period_ends_at = Column(DateTime(timezone=True), nullable=True)

    # Trial fields
    trial_started_at = Column(DateTime(timezone=True), nullable=True)
    trial_ends_at = Column(DateTime(timezone=True), nullable=True)
    has_been_paying_customer = Column(Boolean, default=False, nullable=False)
    trial_warning_sent_at = Column(DateTime(timezone=True), nullable=True)

    # Svix integration (for webhook delivery in cloud mode)
    svix_app_id = Column(String(255), nullable=True, index=True)

    # Relationships - using simple string references
    importers = relationship("Importer", back_populates="user")
    import_jobs = relationship("ImportJob", back_populates="user")
    webhook_events = relationship("WebhookEvent", back_populates="user")
    usage_records = relationship("UsageRecord", back_populates="user")
    integrations = relationship("Integration", back_populates="user")