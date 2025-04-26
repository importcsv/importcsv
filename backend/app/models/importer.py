import uuid
from sqlalchemy import (
    Column,
    Integer,
    String,
    JSON,
    DateTime,
    ForeignKey,
    UUID,
    Boolean,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class Importer(Base):
    __tablename__ = "importers"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    fields = Column(JSON, nullable=False)  # JSON structure defining the importer fields

    # Webhook settings
    webhook_url = Column(String, nullable=True)  # URL where imported data is sent to
    webhook_enabled = Column(
        Boolean, default=True
    )  # Whether to use webhook or onData callback
    include_data_in_webhook = Column(
        Boolean, default=True
    )  # Whether to include processed data in webhook
    webhook_data_sample_size = Column(
        Integer, default=5
    )  # Number of rows to include in webhook sample

    # Import settings
    include_unmatched_columns = Column(
        Boolean, default=False
    )  # Include all unmatched columns in import
    filter_invalid_rows = Column(
        Boolean, default=False
    )  # Filter rows that fail validation
    disable_on_invalid_rows = Column(
        Boolean, default=False
    )  # Disable importing all data if there are invalid rows

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships - using simple string references
    user = relationship("User", back_populates="importers")
    import_jobs = relationship("ImportJob", back_populates="importer")
