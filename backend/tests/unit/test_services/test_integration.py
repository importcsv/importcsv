# backend/tests/unit/test_services/test_integration.py
import uuid
import pytest
from sqlalchemy.orm import Session
from app.services.integration import (
    create_integration,
    get_integration,
    get_integrations,
    update_integration,
    delete_integration,
)
from app.schemas.integration import IntegrationCreate, IntegrationUpdate, IntegrationType
from app.models.user import User


@pytest.mark.unit
def test_create_integration(db_session: Session, test_user: User):
    """Test creating an integration."""
    data = IntegrationCreate(
        name="Test Supabase",
        type=IntegrationType.SUPABASE,
        credentials={"url": "https://test.supabase.co", "service_key": "key123"},
    )

    integration = create_integration(db_session, test_user.id, data)

    assert integration.id is not None
    assert integration.name == "Test Supabase"
    assert integration.user_id == test_user.id


@pytest.mark.unit
def test_get_integration_decrypts_credentials(db_session: Session, test_user: User):
    """Test that get_integration can decrypt credentials."""
    data = IntegrationCreate(
        name="Test",
        type=IntegrationType.SUPABASE,
        credentials={"url": "https://test.supabase.co", "service_key": "secret"},
    )
    integration = create_integration(db_session, test_user.id, data)

    retrieved, credentials = get_integration(db_session, integration.id, test_user.id, include_credentials=True)

    assert retrieved is not None
    assert credentials["service_key"] == "secret"


@pytest.mark.unit
def test_get_integrations_for_user(db_session: Session, test_user: User):
    """Test listing integrations for a user."""
    # Create two integrations
    for i in range(2):
        data = IntegrationCreate(
            name=f"Integration {i}",
            type=IntegrationType.WEBHOOK,
            credentials={"url": f"https://example{i}.com/hook"},
        )
        create_integration(db_session, test_user.id, data)

    integrations = get_integrations(db_session, test_user.id)

    assert len(integrations) == 2
