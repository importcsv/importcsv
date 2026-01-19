"""Tests for integration schemas."""

from datetime import datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.integration import DestinationCreate, DestinationResponse


# ============================================================================
# Supabase Destination Tests
# ============================================================================


@pytest.mark.unit
def test_destination_create_with_context_mapping():
    """Test DestinationCreate accepts context_mapping."""
    dest = DestinationCreate(
        integration_id=uuid4(),
        table_name="contacts",
        column_mapping={"email": "email_address"},
        context_mapping={"org_id": "org_id"},
    )
    assert dest.context_mapping == {"org_id": "org_id"}


@pytest.mark.unit
def test_destination_create_context_mapping_defaults_to_empty():
    """Test context_mapping defaults to empty dict."""
    dest = DestinationCreate(
        integration_id=uuid4(),
        table_name="contacts",
    )
    assert dest.context_mapping == {}


@pytest.mark.unit
def test_destination_response_includes_context_mapping():
    """Test DestinationResponse includes context_mapping."""
    resp = DestinationResponse(
        id=uuid4(),
        importer_id=uuid4(),
        integration_id=uuid4(),
        table_name="contacts",
        column_mapping={"email": "email_address"},
        context_mapping={"org_id": "org_id"},
        created_at=datetime.now(),
    )
    assert resp.context_mapping == {"org_id": "org_id"}


@pytest.mark.unit
def test_destination_create_supabase_requires_integration_id():
    """Test that supabase destination requires integration_id."""
    with pytest.raises(ValidationError) as exc_info:
        DestinationCreate(
            destination_type="supabase",
            table_name="contacts",
        )
    assert "Supabase destination requires integration_id" in str(exc_info.value)


@pytest.mark.unit
def test_destination_create_supabase_defaults():
    """Test that destination_type defaults to supabase."""
    dest = DestinationCreate(
        integration_id=uuid4(),
        table_name="contacts",
    )
    assert dest.destination_type == "supabase"


# ============================================================================
# Webhook Destination Tests
# ============================================================================


@pytest.mark.unit
def test_destination_create_webhook_valid():
    """Test creating a valid webhook destination."""
    dest = DestinationCreate(
        destination_type="webhook",
        webhook_url="https://example.com/webhook",
    )
    assert dest.destination_type == "webhook"
    assert dest.webhook_url == "https://example.com/webhook"
    assert dest.integration_id is None


@pytest.mark.unit
def test_destination_create_webhook_requires_url():
    """Test that webhook destination requires webhook_url."""
    with pytest.raises(ValidationError) as exc_info:
        DestinationCreate(
            destination_type="webhook",
        )
    assert "Webhook destination requires webhook_url" in str(exc_info.value)


@pytest.mark.unit
def test_destination_create_webhook_requires_https():
    """Test that webhook URL must use HTTPS."""
    with pytest.raises(ValidationError) as exc_info:
        DestinationCreate(
            destination_type="webhook",
            webhook_url="http://example.com/webhook",
        )
    assert "Webhook URL must use HTTPS" in str(exc_info.value)


@pytest.mark.unit
def test_destination_create_invalid_type():
    """Test that invalid destination_type is rejected."""
    with pytest.raises(ValidationError) as exc_info:
        DestinationCreate(
            destination_type="invalid",
            webhook_url="https://example.com/webhook",
        )
    assert "String should match pattern" in str(exc_info.value)


@pytest.mark.unit
def test_destination_response_webhook_fields():
    """Test DestinationResponse includes webhook fields."""
    resp = DestinationResponse(
        id=uuid4(),
        importer_id=uuid4(),
        destination_type="webhook",
        webhook_url="https://example.com/webhook",
        signing_secret="whsec_test123",
        created_at=datetime.now(),
    )
    assert resp.destination_type == "webhook"
    assert resp.webhook_url == "https://example.com/webhook"
    assert resp.signing_secret == "whsec_test123"
    assert resp.integration_id is None
