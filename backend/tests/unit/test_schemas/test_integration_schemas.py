"""Tests for integration schemas."""
import pytest
from uuid import uuid4
from datetime import datetime
from app.schemas.integration import DestinationCreate, DestinationResponse


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
