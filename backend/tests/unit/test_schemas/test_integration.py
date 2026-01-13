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
def test_integration_response_hides_credentials():
    """Test that response schema doesn't expose credentials."""
    # IntegrationResponse should not have credentials field
    import uuid
    from datetime import datetime

    response = IntegrationResponse(
        id=uuid.uuid4(),
        name="My Supabase",
        type=IntegrationType.SUPABASE,
        created_at=datetime.now(),
    )
    assert not hasattr(response, 'credentials')
    assert not hasattr(response, 'encrypted_credentials')
