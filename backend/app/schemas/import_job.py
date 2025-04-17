import uuid
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.models.import_job import ImportStatus

# Base ImportJob model
class ImportJobBase(BaseModel):
    schema_id: uuid.UUID
    file_name: str
    file_type: str

# ImportJob creation model
class ImportJobCreate(ImportJobBase):
    pass

# ImportJob update model
class ImportJobUpdate(BaseModel):
    status: Optional[ImportStatus] = None
    processed_rows: Optional[int] = None
    error_count: Optional[int] = None
    errors: Optional[Dict[str, Any]] = None
    column_mapping: Optional[Dict[str, str]] = None
    file_metadata: Optional[Dict[str, Any]] = None

# ImportJob in DB
class ImportJobInDBBase(ImportJobBase):
    id: uuid.UUID
    user_id: uuid.UUID
    status: ImportStatus
    row_count: int
    processed_rows: int
    error_count: int
    errors: Optional[Dict[str, Any]] = None
    column_mapping: Optional[Dict[str, str]] = None
    file_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ImportJob to return via API
class ImportJob(ImportJobInDBBase):
    pass

# Column mapping model
class ColumnMapping(BaseModel):
    file_column: str
    schema_field: str
    confidence: float = 0.0
    
# Column mapping request
class ColumnMappingRequest(BaseModel):
    mappings: List[ColumnMapping]
