"""Schemas for Integration API."""
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.integration import IntegrationType


class IntegrationCredentials(BaseModel):
    """Credentials schema - validated but never returned."""
    url: str = Field(..., min_length=1)
    service_key: str | None = None  # Required for Supabase
    headers: dict[str, str] | None = None  # Optional for webhooks


class IntegrationCreate(BaseModel):
    """Schema for creating an integration."""
    name: str = Field(..., min_length=1, max_length=255)
    type: IntegrationType
    credentials: dict[str, Any]

    @model_validator(mode="after")
    def validate_credentials(self):
        if self.type == IntegrationType.SUPABASE:
            if not self.credentials.get("url"):
                raise ValueError("Supabase integration requires url")
            if not self.credentials.get("service_key"):
                raise ValueError("Supabase integration requires service_key")
        elif self.type == IntegrationType.WEBHOOK:
            if not self.credentials.get("url"):
                raise ValueError("Webhook integration requires url")
        return self


class IntegrationUpdate(BaseModel):
    """Schema for updating an integration."""
    name: str | None = Field(None, min_length=1, max_length=255)
    credentials: dict[str, Any] | None = None


class IntegrationResponse(BaseModel):
    """Schema for integration response - credentials hidden."""
    id: UUID
    name: str
    type: IntegrationType
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class IntegrationWithSecretResponse(BaseModel):
    """Schema for integration response that includes webhook secret."""
    id: UUID
    name: str
    type: IntegrationType
    webhook_secret: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class IntegrationTestResult(BaseModel):
    """Schema for connection test result."""
    success: bool
    message: str
    details: dict[str, Any] | None = None


class SupabaseTablesResponse(BaseModel):
    """Schema for Supabase tables list response."""
    tables: list[str]


class SupabaseColumnSchema(BaseModel):
    """Schema for a single column definition."""
    column_name: str
    data_type: str
    is_nullable: bool
    column_default: str | None = None


class SupabaseTableSchemaResponse(BaseModel):
    """Schema for Supabase table schema response."""
    table_name: str
    columns: list[SupabaseColumnSchema]


class CategorizedColumnsResponse(BaseModel):
    """Schema for categorized columns response."""
    hidden: list[SupabaseColumnSchema]
    context: list[SupabaseColumnSchema]
    mapped: list[SupabaseColumnSchema]


# Destination schemas
class DestinationCreate(BaseModel):
    """Schema for creating/updating an importer destination."""
    integration_id: UUID
    table_name: str | None = None  # Required for Supabase
    column_mapping: dict[str, str] = Field(default_factory=dict)
    context_mapping: dict[str, str] = Field(default_factory=dict)


class DestinationResponse(BaseModel):
    """Schema for destination response."""
    id: UUID
    importer_id: UUID
    integration_id: UUID
    table_name: str | None = None
    column_mapping: dict[str, str]
    context_mapping: dict[str, str] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime | None = None

    # Include integration details for convenience
    integration_name: str | None = None
    integration_type: IntegrationType | None = None

    model_config = ConfigDict(from_attributes=True)
