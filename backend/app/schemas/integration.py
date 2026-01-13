"""Schemas for Integration API."""
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.integration import IntegrationType


class IntegrationCredentials(BaseModel):
    """Credentials schema - validated but never returned."""
    url: str = Field(..., min_length=1)
    service_key: Optional[str] = None  # Required for Supabase
    headers: Optional[Dict[str, str]] = None  # Optional for webhooks


class IntegrationCreate(BaseModel):
    """Schema for creating an integration."""
    name: str = Field(..., min_length=1, max_length=255)
    type: IntegrationType
    credentials: Dict[str, Any]

    @model_validator(mode='after')
    def validate_credentials(self):
        if self.type == IntegrationType.SUPABASE:
            if not self.credentials.get('url'):
                raise ValueError('Supabase integration requires url')
            if not self.credentials.get('service_key'):
                raise ValueError('Supabase integration requires service_key')
        elif self.type == IntegrationType.WEBHOOK:
            if not self.credentials.get('url'):
                raise ValueError('Webhook integration requires url')
        return self


class IntegrationUpdate(BaseModel):
    """Schema for updating an integration."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    credentials: Optional[Dict[str, Any]] = None


class IntegrationResponse(BaseModel):
    """Schema for integration response - credentials hidden."""
    id: UUID
    name: str
    type: IntegrationType
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class IntegrationWithSecretResponse(BaseModel):
    """Schema for integration response that includes webhook secret."""
    id: UUID
    name: str
    type: IntegrationType
    webhook_secret: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class IntegrationTestResult(BaseModel):
    """Schema for connection test result."""
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None


class SupabaseTablesResponse(BaseModel):
    """Schema for Supabase tables list response."""
    tables: list[str]


class SupabaseColumnSchema(BaseModel):
    """Schema for a single column definition."""
    column_name: str
    data_type: str
    is_nullable: bool
    column_default: Optional[str] = None


class SupabaseTableSchemaResponse(BaseModel):
    """Schema for Supabase table schema response."""
    table_name: str
    columns: list[SupabaseColumnSchema]
