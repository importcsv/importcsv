# backend/tests/unit/test_models/test_integration.py
import uuid
import pytest
from sqlalchemy.orm import Session
from app.models.integration import Integration, IntegrationType
from app.models.user import User


@pytest.mark.unit
def test_create_integration(db_session: Session, test_user: User):
    """Test creating an integration."""
    from app.core.encryption import encrypt_credentials

    integration = Integration(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="My Supabase",
        type=IntegrationType.SUPABASE,
        encrypted_credentials=encrypt_credentials({
            "url": "https://test.supabase.co",
            "service_key": "test-key"
        }),
    )
    db_session.add(integration)
    db_session.commit()
    db_session.refresh(integration)

    assert integration.id is not None
    assert integration.name == "My Supabase"
    assert integration.type == IntegrationType.SUPABASE
    assert integration.webhook_secret is not None  # Auto-generated


@pytest.mark.unit
def test_integration_webhook_secret_auto_generated(db_session: Session, test_user: User):
    """Test that webhook_secret is auto-generated for webhook integrations."""
    from app.core.encryption import encrypt_credentials

    integration = Integration(
        user_id=test_user.id,
        name="My Webhook",
        type=IntegrationType.WEBHOOK,
        encrypted_credentials=encrypt_credentials({"url": "https://example.com/hook"}),
    )
    db_session.add(integration)
    db_session.commit()

    assert integration.webhook_secret is not None
    assert len(integration.webhook_secret) == 64  # 32 bytes hex
