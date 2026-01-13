"""ImporterDestination model for linking importers to integrations."""
import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class ImporterDestination(Base):
    """Per-importer destination configuration."""
    __tablename__ = "importer_destinations"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    importer_id = Column(UUID, ForeignKey("importers.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    integration_id = Column(UUID, ForeignKey("integrations.id", ondelete="CASCADE"), nullable=False, index=True)
    table_name = Column(String(255), nullable=True)  # For Supabase
    column_mapping = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    importer = relationship("Importer", back_populates="destination")
    integration = relationship("Integration", back_populates="importer_destinations")
