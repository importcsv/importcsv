import logging
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.jwt_auth import get_current_active_user
from app.db.base import get_db
from app.models.importer_destination import ImporterDestination
from app.models.integration import Integration
from app.models.user import User
from app.schemas.importer import Importer as ImporterSchema
from app.schemas.importer import ImporterCreate, ImporterUpdate
from app.schemas.integration import DestinationCreate, DestinationResponse
from app.services import importer as importer_service
from app.services import schema_inference

logger = logging.getLogger(__name__)
router = APIRouter()


class InferSchemaRequest(BaseModel):
    """Request body for schema inference."""

    data: list[dict[str, Any]]


class InferSchemaResponse(BaseModel):
    """Response for schema inference."""

    columns: list[dict[str, Any]]


@router.post("/infer-schema", response_model=InferSchemaResponse)
async def infer_schema(
    request: InferSchemaRequest,
    _current_user: User = Depends(get_current_active_user),
):
    """Infer column schema from CSV sample data using AI."""
    columns = await schema_inference.infer_schema_from_csv(request.data)
    return InferSchemaResponse(columns=columns)


@router.get("/", response_model=list[ImporterSchema])
async def read_importers(
    request: Request,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve importers
    """
    logger.info(
        f"GET /importers/ request received from "
        f"{request.client.host if request.client else 'unknown'} "
        f"for user {current_user.id}"
    )
    logger.info(f"Authorization header: {request.headers.get('Authorization', 'None')[:20]}...")

    try:
        importers = importer_service.get_importers(db, str(current_user.id), skip, limit)
        logger.info(f"Retrieved {len(importers)} importers for user {current_user.id}")
        return importers
    except Exception as e:
        logger.error(f"Error retrieving importers: {e!s}")
        raise


@router.post("/", response_model=ImporterSchema)
async def create_importer(
    importer_in: ImporterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create new importer
    """
    return importer_service.create_importer(db, str(current_user.id), importer_in)


@router.get("/{importer_id}", response_model=ImporterSchema)
async def read_importer(
    importer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get importer by ID
    """
    importer = importer_service.get_importer(db, str(current_user.id), importer_id)
    if not importer:
        raise HTTPException(status_code=404, detail="Importer not found")
    return importer


@router.put("/{importer_id}", response_model=ImporterSchema)
async def update_importer(
    importer_id: uuid.UUID,
    importer_in: ImporterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Update an importer
    """
    importer = importer_service.update_importer(db, str(current_user.id), importer_id, importer_in)
    if not importer:
        raise HTTPException(status_code=404, detail="Importer not found")
    return importer


@router.delete("/{importer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_importer(
    importer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete an importer
    """
    importer = importer_service.delete_importer(db, str(current_user.id), importer_id)
    if not importer:
        raise HTTPException(status_code=404, detail="Importer not found")


# Destination endpoints


@router.get("/{importer_id}/destination", response_model=DestinationResponse | None)
async def get_destination(
    importer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get the destination configuration for an importer
    """
    # First verify user owns the importer
    importer = importer_service.get_importer(db, str(current_user.id), importer_id)
    if not importer:
        raise HTTPException(status_code=404, detail="Importer not found")

    destination = (
        db.query(ImporterDestination).filter(ImporterDestination.importer_id == importer_id).first()
    )

    if not destination:
        return None

    # Get integration details
    integration = db.query(Integration).filter(Integration.id == destination.integration_id).first()

    return DestinationResponse(
        id=destination.id,
        importer_id=destination.importer_id,
        integration_id=destination.integration_id,
        table_name=destination.table_name,
        column_mapping=destination.column_mapping or {},
        created_at=destination.created_at,
        updated_at=destination.updated_at,
        integration_name=integration.name if integration else None,
        integration_type=integration.type if integration else None,
    )


@router.put("/{importer_id}/destination", response_model=DestinationResponse)
async def set_destination(
    importer_id: uuid.UUID,
    destination_in: DestinationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Set or update the destination configuration for an importer
    """
    # Verify user owns the importer
    importer = importer_service.get_importer(db, str(current_user.id), importer_id)
    if not importer:
        raise HTTPException(status_code=404, detail="Importer not found")

    # Verify user owns the integration
    integration = (
        db.query(Integration)
        .filter(
            Integration.id == destination_in.integration_id,
            Integration.user_id == current_user.id,
        )
        .first()
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    # Check if destination already exists
    destination = (
        db.query(ImporterDestination).filter(ImporterDestination.importer_id == importer_id).first()
    )

    if destination:
        # Update existing
        destination.integration_id = destination_in.integration_id
        destination.table_name = destination_in.table_name
        destination.column_mapping = destination_in.column_mapping
    else:
        # Create new
        destination = ImporterDestination(
            importer_id=importer_id,
            integration_id=destination_in.integration_id,
            table_name=destination_in.table_name,
            column_mapping=destination_in.column_mapping,
        )
        db.add(destination)

    db.commit()
    db.refresh(destination)

    return DestinationResponse(
        id=destination.id,
        importer_id=destination.importer_id,
        integration_id=destination.integration_id,
        table_name=destination.table_name,
        column_mapping=destination.column_mapping or {},
        created_at=destination.created_at,
        updated_at=destination.updated_at,
        integration_name=integration.name,
        integration_type=integration.type,
    )


@router.delete("/{importer_id}/destination", status_code=status.HTTP_204_NO_CONTENT)
async def delete_destination(
    importer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Remove the destination configuration for an importer
    """
    # Verify user owns the importer
    importer = importer_service.get_importer(db, str(current_user.id), importer_id)
    if not importer:
        raise HTTPException(status_code=404, detail="Importer not found")

    destination = (
        db.query(ImporterDestination).filter(ImporterDestination.importer_id == importer_id).first()
    )

    if destination:
        db.delete(destination)
        db.commit()
