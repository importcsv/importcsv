import uuid
from pydantic import BaseModel, Field, HttpUrl
from typing import Dict, Any, List, Optional
from datetime import datetime

# Importer field definition
class ImporterField(BaseModel):
    name: str
    display_name: Optional[str] = None
    type: str  # text, number, date, email, phone, boolean, select, custom_regex
    required: bool = False
    description: Optional[str] = None
    must_match: bool = False  # Require that users must match this column
    not_blank: bool = False  # Value cannot be blank
    example: Optional[str] = None  # Example value for the field
    validation_error_message: Optional[str] = None  # Custom validation error message
    validation_format: Optional[str] = None  # For date format, regex pattern, or select options
    validation: Optional[Dict[str, Any]] = None  # JSON Schema validation rules
    # Remove self-reference to avoid circular dependency
    # fields: Optional[List[ImporterField]] = None

    def dict(self, *args, **kwargs):
        # Ensure all fields are serializable
        result = super().dict(*args, **kwargs)
        # Remove None values to keep the JSON clean
        return {k: v for k, v in result.items() if v is not None}
        
    class Config:
        from_attributes = True

# Base Importer model
class ImporterBase(BaseModel):
    name: str
    description: Optional[str] = None
    fields: List[ImporterField]
    webhook_url: Optional[str] = None
    webhook_enabled: bool = True
    include_unmatched_columns: bool = False
    filter_invalid_rows: bool = False
    disable_on_invalid_rows: bool = False
    
    class Config:
        from_attributes = True

# Importer creation model
class ImporterCreate(ImporterBase):
    pass

# Importer update model
class ImporterUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[List[ImporterField]] = None
    webhook_url: Optional[str] = None
    webhook_enabled: Optional[bool] = None
    include_unmatched_columns: Optional[bool] = None
    filter_invalid_rows: Optional[bool] = None
    disable_on_invalid_rows: Optional[bool] = None

# Importer in DB
class ImporterInDBBase(ImporterBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
        from_attributes = True

# Importer to return via API
class Importer(ImporterInDBBase):
    class Config:
        from_attributes = True
