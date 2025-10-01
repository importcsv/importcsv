import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator
from typing import Dict, Any, List, Optional


# Field type enum for better type safety and validation
class FieldType(str, Enum):
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    EMAIL = "email"
    PHONE = "phone"
    BOOLEAN = "boolean"
    SELECT = "select"
    CUSTOM_REGEX = "custom_regex"


# Importer field definition
class ImporterField(BaseModel):
    name: str = Field(..., description="Unique identifier for the field")
    display_name: Optional[str] = Field(None, description="Human-readable name")
    type: str = Field(
        ..., description="Field data type"
    )  # Using str for backward compatibility
    
    # Support Column format (these are computed properties)
    @property
    def id(self) -> str:
        """Alias for name to support Column format"""
        return self.name
    
    @property
    def label(self) -> str:
        """Alias for display_name to support Column format"""
        if self.display_name:
            return self.display_name
        # Auto-generate from name: employee_id -> Employee ID
        return self.name.replace('_', ' ').replace('-', ' ').title()
    
    # New fields for validators and transformations
    validators: Optional[List[Dict[str, Any]]] = Field(
        None, 
        description="Array of validation rules",
        example=[
            {"type": "required"},
            {"type": "regex", "pattern": "^[A-Z].*", "message": "Must start with uppercase"},
            {"type": "min", "value": 0},
            {"type": "max", "value": 100},
            {"type": "min_length", "value": 3},
            {"type": "max_length", "value": 50},
            {"type": "unique"}
        ]
    )
    
    transformations: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Array of transformation rules",
        example=[
            {"type": "trim"},
            {"type": "uppercase"},
            {"type": "lowercase"},
            {"type": "capitalize"},
            {"type": "remove_special_chars"},
            {"type": "normalize_phone"},
            {"type": "normalize_date", "format": "YYYY-MM-DD"},
            {"type": "default", "value": "N/A"},
            {"type": "replace", "find": " ", "replace": "_"}
        ]
    )
    
    # Options for select fields
    options: Optional[List[str]] = Field(
        None,
        description="Options for select type fields",
        example=["Option 1", "Option 2", "Option 3"]
    )

    @field_validator("type")
    def validate_field_type(cls, v):
        # Validate that the field type is one of the allowed types
        allowed_types = [t.value for t in FieldType]
        if v not in allowed_types:
            raise ValueError(f"Field type must be one of: {', '.join(allowed_types)}")
        return v
    
    def __init__(self, **data):
        # Auto-generate display_name if not provided
        if 'display_name' not in data or not data.get('display_name'):
            if 'name' in data:
                # Convert snake_case, kebab-case to Title Case
                data['display_name'] = data['name'].replace('_', ' ').replace('-', ' ').title()
        super().__init__(**data)

    def dict(self, *args, **kwargs):
        # Ensure all fields are serializable
        result = super().dict(*args, **kwargs)
        # Remove None values to keep the JSON clean
        result = {k: v for k, v in result.items() if v is not None}
        
        # Add Column format fields
        result['id'] = self.name
        result['label'] = self.label  # Use the property which auto-generates if needed
            
        return result

    class Config:
        from_attributes = True


# Base Importer model
class ImporterBase(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the importer")
    description: Optional[str] = Field(None, description="Description of the importer")
    fields: List[ImporterField] = Field(..., min_length=1, description="Fields to import")
    webhook_url: Optional[str] = Field(
        None, description="URL where imported data is sent"
    )
    webhook_enabled: bool = Field(True, description="Whether to use webhook")
    include_data_in_webhook: Optional[bool] = Field(
        None, description="Include processed data in webhook"
    )
    webhook_data_sample_size: Optional[int] = Field(
        None, description="Number of rows to include in webhook sample"
    )
    include_unmatched_columns: bool = Field(
        False, description="Include all unmatched columns in import"
    )
    filter_invalid_rows: bool = Field(
        False, description="Filter rows that fail validation"
    )
    disable_on_invalid_rows: bool = Field(
        False, description="Disable importing all data if there are invalid rows"
    )
    dark_mode: bool = Field(
        False, description="Enable dark mode for the importer UI"
    )

    @field_validator("webhook_url")
    def validate_webhook_url(cls, v, info):
        webhook_enabled = (
            info.data.get("webhook_enabled", False) if hasattr(info, "data") else False
        )
        if webhook_enabled and not v:
            raise ValueError("webhook_url is required when webhook_enabled is True")
        return v

    class Config:
        from_attributes = True


# Importer creation model
class ImporterCreate(ImporterBase):
    pass


# Importer update model
class ImporterUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Name of the importer")
    description: Optional[str] = Field(None, description="Description of the importer")
    fields: Optional[List[ImporterField]] = Field(None, description="Fields to import")
    webhook_url: Optional[str] = Field(
        None, description="URL where imported data is sent"
    )
    webhook_enabled: Optional[bool] = Field(None, description="Whether to use webhook")
    include_data_in_webhook: Optional[bool] = Field(
        None, description="Include processed data in webhook"
    )
    webhook_data_sample_size: Optional[int] = Field(
        None, description="Number of rows to include in webhook sample"
    )
    include_unmatched_columns: Optional[bool] = Field(
        None, description="Include all unmatched columns in import"
    )
    filter_invalid_rows: Optional[bool] = Field(
        None, description="Filter rows that fail validation"
    )
    disable_on_invalid_rows: Optional[bool] = Field(
        None, description="Disable importing all data if there are invalid rows"
    )
    dark_mode: Optional[bool] = Field(
        None, description="Enable dark mode for the importer UI"
    )

    class Config:
        from_attributes = True


# Importer in DB
class ImporterInDBBase(ImporterBase):
    id: uuid.UUID
    key: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {uuid.UUID: str}


# Importer to return via API
class Importer(ImporterInDBBase):
    # Inherits all fields and configuration from ImporterInDBBase
    pass
