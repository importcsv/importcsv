"""API endpoints for integrations."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.jwt_auth import get_current_active_user
from app.db.base import get_db
from app.models.user import User
from app.models.integration import IntegrationType
from app.schemas.integration import (
    IntegrationCreate,
    IntegrationUpdate,
    IntegrationResponse,
    IntegrationWithSecretResponse,
)
from app.services import integration as integration_service

router = APIRouter()


@router.get("/", response_model=List[IntegrationResponse])
async def list_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 100,
):
    """List all integrations for the current user."""
    return integration_service.get_integrations(db, current_user.id, skip, limit)


@router.post("/", response_model=IntegrationResponse, status_code=status.HTTP_201_CREATED)
async def create_integration(
    data: IntegrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new integration."""
    return integration_service.create_integration(db, current_user.id, data)


@router.get("/{integration_id}", response_model=IntegrationResponse)
async def get_integration(
    integration_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific integration."""
    integration, _ = integration_service.get_integration(db, integration_id, current_user.id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    return integration


@router.patch("/{integration_id}", response_model=IntegrationResponse)
async def update_integration(
    integration_id: UUID,
    data: IntegrationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update an integration."""
    integration = integration_service.update_integration(db, integration_id, current_user.id, data)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    return integration


@router.delete("/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_integration(
    integration_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete an integration."""
    deleted = integration_service.delete_integration(db, integration_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Integration not found")


@router.get("/{integration_id}/secret", response_model=IntegrationWithSecretResponse)
async def get_integration_secret(
    integration_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get integration with webhook secret. Only valid for webhook integrations."""
    integration, _ = integration_service.get_integration(db, integration_id, current_user.id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    if integration.type != IntegrationType.WEBHOOK:
        raise HTTPException(status_code=400, detail="Webhook secret only available for webhook integrations")
    return integration
