import uuid
from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Schema(Base):
    __tablename__ = "schemas"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    fields = Column(JSON, nullable=False)  # JSON structure defining the schema fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="schemas")
    import_jobs = relationship("ImportJob", back_populates="schema")
