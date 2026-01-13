"""Integration model for storing third-party service credentials."""
import enum
import secrets
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class IntegrationType(str, enum.Enum):
    SUPABASE = "supabase"
    WEBHOOK = "webhook"


class Integration(Base):
    """Account-level integration for storing credentials."""
    __tablename__ = "integrations"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum(IntegrationType), nullable=False)
    encrypted_credentials = Column(Text, nullable=False)
    webhook_secret = Column(String(64), nullable=True, default=lambda: secrets.token_hex(32))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="integrations")
    importer_destinations = relationship("ImporterDestination", back_populates="integration")
