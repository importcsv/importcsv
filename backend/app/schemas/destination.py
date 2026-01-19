"""Schemas for destination configuration.

Each destination type has its own config schema. The config is stored
as JSON in the database and validated at runtime using these schemas.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class SupabaseDestinationConfig(BaseModel):
    """Configuration for Supabase destination."""

    integration_id: UUID = Field(..., description="ID of the Supabase integration")
    table_name: str = Field(..., min_length=1, max_length=255)
    column_mapping: dict[str, str] = Field(default_factory=dict)
    context_mapping: dict[str, str] = Field(default_factory=dict)


class WebhookDestinationConfig(BaseModel):
    """Configuration for webhook destination."""

    webhook_url: HttpUrl = Field(..., description="HTTPS URL to POST data to")
    svix_endpoint_id: str | None = Field(None, description="Svix endpoint ID (cloud only)")

    @field_validator("webhook_url")
    @classmethod
    def validate_https(cls, v: HttpUrl) -> HttpUrl:
        """Ensure webhook URL uses HTTPS."""
        if str(v).startswith("http://"):
            raise ValueError("Webhook URL must use HTTPS")
        return v


# Type alias for any destination config
DestinationConfig = SupabaseDestinationConfig | WebhookDestinationConfig


def validate_destination_config(
    destination_type: str,
    config: dict,
) -> DestinationConfig:
    """Validate config dict against the appropriate schema.

    Args:
        destination_type: Type of destination ("supabase" or "webhook")
        config: Configuration dictionary to validate

    Returns:
        Validated config object

    Raises:
        ValueError: If destination_type is unknown
        ValidationError: If config is invalid
    """
    schemas = {
        "supabase": SupabaseDestinationConfig,
        "webhook": WebhookDestinationConfig,
    }

    schema = schemas.get(destination_type)
    if schema is None:
        raise ValueError(f"Unknown destination type: {destination_type}")

    return schema(**config)


class WebhookDeliveryResponse(BaseModel):
    """Response schema for a webhook delivery attempt."""

    id: UUID
    status_code: int | None
    success: str  # "success", "failed", "retry_success"
    duration_ms: int | None
    error_message: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WebhookDeliveryListResponse(BaseModel):
    """Response schema for a list of webhook deliveries."""

    deliveries: list[WebhookDeliveryResponse]
