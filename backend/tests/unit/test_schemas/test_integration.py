# backend/tests/unit/test_schemas/test_integration.py
import pytest
from pydantic import ValidationError
from app.schemas.integration import IntegrationCreate, IntegrationResponse, IntegrationType


@pytest.mark.unit
def test_integration_create_supabase():
    """Test creating Supabase integration schema."""
    data = IntegrationCreate(
        name="My Supabase",
        type=IntegrationType.SUPABASE,
        credentials={"url": "https://test.supabase.co", "service_key": "my-key"},
    )
    assert data.name == "My Supabase"
    assert data.type == IntegrationType.SUPABASE


@pytest.mark.unit
def test_integration_create_webhook():
    """Test creating webhook integration schema."""
    data = IntegrationCreate(
        name="My Webhook",
        type=IntegrationType.WEBHOOK,
        credentials={"url": "https://hooks.zapier.com/xxx"},
    )
    assert data.type == IntegrationType.WEBHOOK


@pytest.mark.unit
def test_integration_create_missing_url():
    """Test that missing URL fails validation."""
    with pytest.raises(ValidationError):
        IntegrationCreate(
            name="Bad Integration",
            type=IntegrationType.SUPABASE,
            credentials={},  # Missing required url
        )


@pytest.mark.unit
def test_integration_response_hides_credentials_and_secret():
    """Test that response schema doesn't expose credentials or webhook secret."""
    # Verify at the schema level that sensitive fields are not present
    field_names = set(IntegrationResponse.model_fields.keys())
    assert 'credentials' not in field_names
    assert 'encrypted_credentials' not in field_names
    assert 'webhook_secret' not in field_names
