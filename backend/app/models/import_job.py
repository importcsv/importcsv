from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Enum
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

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    schema_id = Column(Integer, ForeignKey("schemas.id"))
    file_name = Column(String)
    file_path = Column(String)
    file_type = Column(String)  # csv, xlsx, etc.
    status = Column(Enum(ImportStatus), default=ImportStatus.PENDING)
    row_count = Column(Integer, default=0)
    processed_rows = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    errors = Column(JSON, nullable=True)  # Store validation errors
    column_mapping = Column(JSON, nullable=True)  # Mapping of file columns to schema fields
    file_metadata = Column(JSON, nullable=True)  # Additional metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="import_jobs")
    schema = relationship("Schema", back_populates="import_jobs")
    webhook_events = relationship("WebhookEvent", back_populates="import_job")
