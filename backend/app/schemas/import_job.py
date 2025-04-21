import uuid
from pydantic import BaseModel, Field, computed_field
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.models.import_job import ImportStatus

# Base ImportJob model
class ImportJobBase(BaseModel):
    importer_id: uuid.UUID
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

# ImportJob to return via API (Uses computed_field with different names and aliases)
class ImportJob(ImportJobInDBBase):
    
    @computed_field(alias='id') # Keep 'id' in JSON output using alias
    @property
    def id_str(self) -> str: # Change property name
        return str(self.id) 

    @computed_field(alias='user_id') # Keep 'user_id' in JSON output
    @property
    def user_id_str(self) -> str: # Change property name
        return str(self.user_id)

    @computed_field(alias='importer_id') # Keep 'importer_id' in JSON output
    @property
    def importer_id_str(self) -> str: # Change property name
        return str(self.importer_id)

    class Config:
        from_attributes = True
        # Exclude the original UUID fields from the response if needed, 
        # though aliasing might handle this implicitly. Let's try without exclude first.
        # exclude = {'id', 'user_id', 'importer_id'} 

# Column mapping model
class ColumnMapping(BaseModel):
    file_column: str
    importer_field: str
    confidence: float = 0.0
    
# Column mapping request
class ColumnMappingRequest(BaseModel):
    mappings: List[ColumnMapping]
