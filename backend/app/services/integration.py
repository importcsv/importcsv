"""Service layer for Integration operations."""
import logging
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.encryption import encrypt_credentials, decrypt_credentials
from app.models.integration import Integration, IntegrationType
from app.schemas.integration import IntegrationCreate, IntegrationUpdate

logger = logging.getLogger(__name__)


def create_integration(
    db: Session,
    user_id: UUID,
    data: IntegrationCreate,
) -> Integration:
    """Create a new integration with encrypted credentials."""
    integration = Integration(
        user_id=user_id,
        name=data.name,
        type=data.type,
        encrypted_credentials=encrypt_credentials(data.credentials),
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)
    logger.info(f"Created integration {integration.id} for user {user_id}")
    return integration


def get_integration(
    db: Session,
    integration_id: UUID,
    user_id: UUID,
    include_credentials: bool = False,
) -> Tuple[Optional[Integration], Optional[dict]]:
    """Get an integration by ID, optionally with decrypted credentials."""
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.user_id == user_id,
    ).first()

    if not integration:
        return None, None

    credentials = None
    if include_credentials:
        credentials = decrypt_credentials(integration.encrypted_credentials)

    return integration, credentials


def get_integrations(
    db: Session,
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
) -> List[Integration]:
    """Get all integrations for a user."""
    return db.query(Integration).filter(
        Integration.user_id == user_id,
    ).offset(skip).limit(limit).all()


def update_integration(
    db: Session,
    integration_id: UUID,
    user_id: UUID,
    data: IntegrationUpdate,
) -> Optional[Integration]:
    """Update an integration."""
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.user_id == user_id,
    ).first()

    if not integration:
        return None

    if data.name is not None:
        integration.name = data.name
    if data.credentials is not None:
        integration.encrypted_credentials = encrypt_credentials(data.credentials)

    db.commit()
    db.refresh(integration)
    logger.info(f"Updated integration {integration_id}")
    return integration


def delete_integration(
    db: Session,
    integration_id: UUID,
    user_id: UUID,
) -> bool:
    """Delete an integration."""
    integration = db.query(Integration).filter(
        Integration.id == integration_id,
        Integration.user_id == user_id,
    ).first()

    if not integration:
        return False

    db.delete(integration)
    db.commit()
    logger.info(f"Deleted integration {integration_id}")
    return True
