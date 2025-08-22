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
    required: bool = Field(False, description="Whether this field is required")
    
    # Support Column format (these are computed properties)
    @property
    def id(self) -> str:
        """Alias for name to support Column format"""
        return self.name
    
    @property
    def label(self) -> str:
        """Alias for display_name to support Column format"""
        return self.display_name or self.name
    description: Optional[str] = Field(None, description="Field description")
    must_match: bool = Field(
        False, description="Require that users must match this column"
    )
    not_blank: bool = Field(False, description="Value cannot be blank")
    example: Optional[str] = Field(None, description="Example value for the field")
    validation_error_message: Optional[str] = Field(
        None, description="Custom validation error message"
    )
    validation_format: Optional[str] = Field(
        None, description="For date format, regex pattern, or select options"
    )
    validation: Optional[Dict[str, Any]] = Field(
        None, description="JSON Schema validation rules"
    )
    template: Optional[str] = Field(
        None,
        description="Template for boolean or select fields (e.g., 'true/false', 'yes/no', '1/0')",
    )

    @field_validator("type")
    def validate_field_type(cls, v):
        # Validate that the field type is one of the allowed types
        allowed_types = [t.value for t in FieldType]
        if v not in allowed_types:
            raise ValueError(f"Field type must be one of: {', '.join(allowed_types)}")
        return v

    def dict(self, *args, **kwargs):
        # Ensure all fields are serializable
        result = super().dict(*args, **kwargs)
        # Remove None values to keep the JSON clean
        result = {k: v for k, v in result.items() if v is not None}
        
        # Add Column format fields
        result['id'] = self.name
        result['label'] = self.display_name or self.name
        
        # Build validators array for Column format
        validators = []
        if self.required:
            validators.append({'type': 'required'})
        if self.validation_format and self.type != 'select':
            validators.append({
                'type': 'regex',
                'pattern': self.validation_format
            })
        if validators:
            result['validators'] = validators
            
        return result

    class Config:
        from_attributes = True


# Base Importer model
class ImporterBase(BaseModel):
    name: str = Field(..., description="Name of the importer")
    description: Optional[str] = Field(None, description="Description of the importer")
    fields: List[ImporterField] = Field(..., description="Fields to import")
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
        orm_mode = True
        from_attributes = True
        json_encoders = {uuid.UUID: str}


# Importer to return via API
class Importer(ImporterInDBBase):
    # Inherits all fields and configuration from ImporterInDBBase
    pass
