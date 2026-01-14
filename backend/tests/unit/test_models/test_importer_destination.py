# backend/tests/unit/test_models/test_importer_destination.py
import uuid
import pytest
from sqlalchemy.orm import Session
from app.models.importer_destination import ImporterDestination
from app.models.importer import Importer
from app.models.user import User


@pytest.mark.unit
def test_create_importer_destination(db_session: Session, sample_importer: Importer, test_user: User):
    """Test creating an importer destination."""
    from app.models.integration import Integration, IntegrationType
    from app.core.encryption import encrypt_credentials

    # Create integration first
    integration = Integration(
        user_id=test_user.id,
        name="Test Supabase",
        type=IntegrationType.SUPABASE,
        encrypted_credentials=encrypt_credentials({"url": "https://test.supabase.co", "service_key": "key"}),
    )
    db_session.add(integration)
    db_session.commit()

    # Create destination
    destination = ImporterDestination(
        importer_id=sample_importer.id,
        integration_id=integration.id,
        table_name="energy_profiles",
        column_mapping={"date": "profile_date", "kwh": "consumption_kwh"},
    )
    db_session.add(destination)
    db_session.commit()
    db_session.refresh(destination)

    assert destination.id is not None
    assert destination.table_name == "energy_profiles"
    assert destination.column_mapping["date"] == "profile_date"


@pytest.mark.unit
def test_importer_destination_with_context_mapping(db_session: Session, sample_importer: Importer, test_user: User):
    """Test that context_mapping field works correctly."""
    from app.models.integration import Integration, IntegrationType
    from app.core.encryption import encrypt_credentials

    # Create a new importer for this test to avoid unique constraint violation
    new_importer = Importer(
        user_id=test_user.id,
        name="Context Test Importer",
        fields=[{"name": "email", "type": "email"}],
    )
    db_session.add(new_importer)
    db_session.commit()
    db_session.refresh(new_importer)

    # Create integration
    integration = Integration(
        user_id=test_user.id,
        name="Test Supabase Context",
        type=IntegrationType.SUPABASE,
        encrypted_credentials=encrypt_credentials({"url": "https://test.supabase.co", "service_key": "key"}),
    )
    db_session.add(integration)
    db_session.commit()
    db_session.refresh(integration)

    # Create destination with context_mapping
    destination = ImporterDestination(
        importer_id=new_importer.id,
        integration_id=integration.id,
        table_name="contacts",
        column_mapping={"email": "email_address"},
        context_mapping={"org_id": "org_id", "user_id": "user_id"},
    )
    db_session.add(destination)
    db_session.commit()
    db_session.refresh(destination)

    assert destination.context_mapping == {"org_id": "org_id", "user_id": "user_id"}
    assert destination.column_mapping == {"email": "email_address"}
