import uuid
from datetime import datetime

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Literal


# Schema field definition
class SchemaField(BaseModel):
    name: str
    display_name: Optional[str] = None
    type: str  # text, number, date, email, phone, boolean, select, custom_regex
    required: bool = False
    description: Optional[str] = None
    must_match: bool = False  # Require that users must match this column
    not_blank: bool = False  # Value cannot be blank
    example: Optional[str] = None  # Example value for the field
    validation_error_message: Optional[str] = None  # Custom validation error message
    validation_format: Optional[str] = (
        None  # For date format, regex pattern, or select options
    )
    validation: Optional[Dict[str, Any]] = None  # JSON Schema validation rules
    template: Optional[str] = (
        None  # Template for boolean or select fields (e.g., 'true/false', 'yes/no', '1/0')
    )

    def dict(self, *args, **kwargs):
        # Ensure all fields are serializable
        result = super().dict(*args, **kwargs)
        # Remove None values to keep the JSON clean
        return {k: v for k, v in result.items() if v is not None}

    class Config:
        from_attributes = True


# Base Schema model
class SchemaBase(BaseModel):
    name: str
    description: Optional[str] = None
    fields: List[SchemaField]

    class Config:
        from_attributes = True


# Schema creation model
class SchemaCreate(SchemaBase):
    pass


# Schema update model
class SchemaUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[List[SchemaField]] = None


# Schema in DB
class SchemaInDBBase(SchemaBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Schema to return via API
class Schema(SchemaInDBBase):
    # Convert UUID fields to strings for API responses
    id: str
    user_id: str

    class Config:
        from_attributes = True
