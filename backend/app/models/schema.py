from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Schema(Base):
    __tablename__ = "schemas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    fields = Column(JSON)  # JSON structure defining the schema fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="schemas")
    import_jobs = relationship("ImportJob", back_populates="schema")
