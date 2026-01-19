"""Tests for destination config schemas."""

import pytest
from pydantic import ValidationError

from app.schemas.destination import (
    SupabaseDestinationConfig,
    WebhookDestinationConfig,
    validate_destination_config,
)


class TestSupabaseConfig:
    """Test Supabase destination config validation."""

    def test_valid_supabase_config(self):
        """Valid Supabase config should pass validation."""
        config = SupabaseDestinationConfig(
            integration_id="550e8400-e29b-41d4-a716-446655440000",
            table_name="contacts",
            column_mapping={"email": "email_address"},
            context_mapping={"org_id": "org_id"},
        )
        assert config.table_name == "contacts"

    def test_supabase_config_requires_integration_id(self):
        """Supabase config must have integration_id."""
        with pytest.raises(ValidationError):
            SupabaseDestinationConfig(
                table_name="contacts",
            )


class TestWebhookConfig:
    """Test webhook destination config validation."""

    def test_valid_webhook_config(self):
        """Valid webhook config should pass validation."""
        config = WebhookDestinationConfig(
            webhook_url="https://example.com/hook",
        )
        assert str(config.webhook_url) == "https://example.com/hook"

    def test_webhook_config_requires_https(self):
        """Webhook URL must be HTTPS."""
        with pytest.raises(ValidationError):
            WebhookDestinationConfig(
                webhook_url="http://example.com/hook",
            )

    def test_webhook_config_svix_endpoint_optional(self):
        """svix_endpoint_id should be optional."""
        config = WebhookDestinationConfig(
            webhook_url="https://example.com/hook",
        )
        assert config.svix_endpoint_id is None


class TestValidateDestinationConfig:
    """Test the validate_destination_config helper."""

    def test_validates_supabase_config(self):
        """Should validate supabase config correctly."""
        config = validate_destination_config(
            "supabase",
            {
                "integration_id": "550e8400-e29b-41d4-a716-446655440000",
                "table_name": "contacts",
            },
        )
        assert isinstance(config, SupabaseDestinationConfig)

    def test_validates_webhook_config(self):
        """Should validate webhook config correctly."""
        config = validate_destination_config("webhook", {"webhook_url": "https://example.com/hook"})
        assert isinstance(config, WebhookDestinationConfig)

    def test_raises_for_unknown_type(self):
        """Should raise for unknown destination type."""
        with pytest.raises(ValueError, match="Unknown destination type"):
            validate_destination_config("unknown", {})
