# backend/tests/unit/test_models/test_delivery_log.py
import uuid
import pytest
from sqlalchemy.orm import Session
from app.models.delivery_log import DeliveryLog, DeliveryStatus
from app.models.user import User


@pytest.mark.unit
def test_create_delivery_log(db_session: Session, test_user: User):
    """Test creating a delivery log."""
    from app.models.integration import Integration, IntegrationType
    from app.core.encryption import encrypt_credentials

    integration = Integration(
        user_id=test_user.id,
        name="Test",
        type=IntegrationType.WEBHOOK,
        encrypted_credentials=encrypt_credentials({"url": "https://example.com"}),
    )
    db_session.add(integration)
    db_session.commit()

    log = DeliveryLog(
        import_job_id=uuid.uuid4(),  # Mock import job ID
        integration_id=integration.id,
        status=DeliveryStatus.PENDING,
    )
    db_session.add(log)
    db_session.commit()
    db_session.refresh(log)

    assert log.id is not None
    assert log.status == DeliveryStatus.PENDING
    assert log.attempts == 0
    assert log.rows_delivered == 0
