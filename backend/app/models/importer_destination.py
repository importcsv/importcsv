"""ImporterDestination model for linking importers to destinations."""

import uuid

from sqlalchemy import JSON, UUID, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class ImporterDestination(Base):
    """Per-importer destination configuration.

    Supports multiple destination types:
    - supabase: Direct insert to Supabase table
    - webhook: POST to user's webhook URL

    The config field stores type-specific configuration as JSON.
    """

    __tablename__ = "importer_destinations"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    importer_id = Column(
        UUID,
        ForeignKey("importers.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Type discriminator
    destination_type = Column(String(50), nullable=False, default="supabase")

    # Type-specific configuration stored as JSON
    config = Column(JSON, nullable=False, default=dict)

    # Legacy fields for Supabase (kept for migration compatibility)
    integration_id = Column(
        UUID,
        ForeignKey("integrations.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    table_name = Column(String(255), nullable=True)  # For Supabase
    column_mapping = Column(JSON, nullable=False, default=dict)
    context_mapping = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    importer = relationship("Importer", back_populates="destination")
    integration = relationship("Integration", back_populates="importer_destinations")
    deliveries = relationship(
        "WebhookDelivery",
        back_populates="destination",
        cascade="all, delete-orphan",
        order_by="WebhookDelivery.created_at.desc()",
    )
