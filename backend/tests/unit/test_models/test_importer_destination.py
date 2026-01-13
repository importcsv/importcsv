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
