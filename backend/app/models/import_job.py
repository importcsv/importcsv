import uuid
from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Enum, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.db.base import Base

class ImportStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    VALIDATING = "validating"
    VALIDATED = "validated"
    IMPORTING = "importing"
    COMPLETED = "completed"
    FAILED = "failed"

class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    importer_id = Column(UUID, ForeignKey("importers.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # csv, xlsx, etc.
    status = Column(Enum(ImportStatus), default=ImportStatus.PENDING, nullable=False)
    row_count = Column(Integer, default=0, nullable=False)
    processed_rows = Column(Integer, default=0, nullable=False)
    error_count = Column(Integer, default=0, nullable=False)
    errors = Column(JSON, nullable=True)  # Store validation errors
    column_mapping = Column(JSON, nullable=True)  # Mapping of file columns to schema fields
    file_metadata = Column(JSON, nullable=True)  # Additional metadata
    processed_data = Column(JSON, nullable=True)  # Store processed data (valid and invalid records)
    error_message = Column(String, nullable=True)  # Store error message if processing fails
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="import_jobs")
    importer = relationship("Importer", back_populates="import_jobs")
    webhook_events = relationship("WebhookEvent", back_populates="import_job")
