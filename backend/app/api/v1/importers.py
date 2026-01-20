import asyncio
import logging
import time
import uuid
from datetime import UTC, datetime
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.auth.jwt_auth import get_current_active_user
from app.db.base import get_db
from app.models.importer import Importer
from app.models.importer_destination import ImporterDestination
from app.models.integration import Integration
from app.models.user import User
from app.models.webhook_delivery import WebhookDelivery, WebhookDeliveryStatus
from app.schemas.destination import WebhookDeliveryResponse
from app.schemas.importer import Importer as ImporterSchema
from app.schemas.importer import ImporterCreate, ImporterUpdate
from app.schemas.integration import DestinationCreate, DestinationResponse
from app.services import importer as importer_service
from app.services import schema_inference, svix_client
from app.services.delivery import is_safe_webhook_url
from app.services.events import events
from app.services.events.types import EventType

logger = logging.getLogger(__name__)
router = APIRouter()

# Constants for schema inference limits
MAX_SAMPLE_ROWS = 50
MAX_COLUMNS = 100
MAX_COLUMN_NAME_LENGTH = 255
MAX_CELL_VALUE_LENGTH = 1000
SCHEMA_INFERENCE_TIMEOUT = 30.0

# HTTP status code constants for webhook testing
HTTP_SUCCESS_MIN = 200
HTTP_SUCCESS_MAX = 300


class InferSchemaRequest(BaseModel):
    """Request body for schema inference."""

    data: list[dict[str, Any]] = Field(
        ...,
        min_length=1,
        max_length=MAX_SAMPLE_ROWS,
        description=f"Sample CSV data (1-{MAX_SAMPLE_ROWS} rows)",
    )

    @field_validator("data")
    @classmethod
    def validate_data(cls, v: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Validate data to prevent abuse."""
        if not v:
            raise ValueError("At least one data row is required")

        # Check first row for column count
        if v[0] and len(v[0]) > MAX_COLUMNS:
            raise ValueError(f"Maximum {MAX_COLUMNS} columns allowed")

        # Validate column names and cell values
        for row in v:
            for key, value in row.items():
                if len(str(key)) > MAX_COLUMN_NAME_LENGTH:
                    raise ValueError(
                        f"Column names must be under {MAX_COLUMN_NAME_LENGTH} characters"
                    )
                if value is not None and len(str(value)) > MAX_CELL_VALUE_LENGTH:
                    raise ValueError(
                        f"Cell values must be under {MAX_CELL_VALUE_LENGTH} characters"
                    )

        return v


class InferSchemaResponse(BaseModel):
    """Response for schema inference."""

    columns: list[dict[str, Any]]


@router.post("/infer-schema", response_model=InferSchemaResponse)
async def infer_schema(
    request: InferSchemaRequest,
    _current_user: User = Depends(get_current_active_user),
):
    """Infer column schema from CSV sample data using AI."""
    try:
        columns = await asyncio.wait_for(
            schema_inference.infer_schema_from_csv(request.data),
            timeout=SCHEMA_INFERENCE_TIMEOUT,
        )
        return InferSchemaResponse(columns=columns)
    except TimeoutError:
        logger.warning("Schema inference timed out")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Schema inference timed out. Please try with fewer columns or rows.",
        ) from None
    except (ValueError, RuntimeError) as e:
        logger.error(f"Schema inference failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to infer schema. Please try again or define columns manually.",
        ) from None


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
    importer = importer_service.create_importer(db, str(current_user.id), importer_in)

    # Emit event for internal notifications
    events.emit(
        EventType.IMPORTER_CREATED,
        {
            "email": current_user.email,
            "importer_name": importer.name,
        },
    )

    return importer


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

    # Get integration details for supabase type
    integration = None
    if destination.integration_id:
        integration = (
            db.query(Integration).filter(Integration.id == destination.integration_id).first()
        )

    # For webhook destinations, get webhook_url from config and signing_secret from Svix
    webhook_url = None
    signing_secret = None
    if destination.destination_type == "webhook":
        config = destination.config or {}
        webhook_url = config.get("webhook_url")
        svix_endpoint_id = config.get("svix_endpoint_id")
        if svix_endpoint_id and current_user.svix_app_id:
            signing_secret = svix_client.get_endpoint_secret(
                current_user.svix_app_id, svix_endpoint_id
            )

    return DestinationResponse(
        id=destination.id,
        importer_id=destination.importer_id,
        destination_type=destination.destination_type or "supabase",
        integration_id=destination.integration_id,
        table_name=destination.table_name,
        column_mapping=destination.column_mapping or {},
        context_mapping=destination.context_mapping or {},
        webhook_url=webhook_url,
        signing_secret=signing_secret,
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
    Set or update the destination configuration for an importer.

    Supports two destination types:
    - supabase: Requires integration_id and table_name
    - webhook: Requires webhook_url (HTTPS only)
    """
    # Verify user owns the importer
    importer = importer_service.get_importer(db, str(current_user.id), importer_id)
    if not importer:
        raise HTTPException(status_code=404, detail="Importer not found")

    integration = None
    config: dict = {}
    signing_secret = None
    webhook_url = None

    if destination_in.destination_type == "supabase":
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

    elif destination_in.destination_type == "webhook":
        webhook_url = destination_in.webhook_url
        svix_endpoint_id = None

        # Create Svix endpoint if in cloud mode
        if svix_client.is_svix_available():
            svix_app_id = svix_client.get_or_create_app_for_user(db, current_user)
            if svix_app_id:
                svix_endpoint_id = svix_client.create_endpoint(
                    app_id=svix_app_id,
                    url=webhook_url,
                    description=f"Importer {importer_id}",
                )
                # Get signing secret to return to user
                if svix_endpoint_id:
                    signing_secret = svix_client.get_endpoint_secret(svix_app_id, svix_endpoint_id)

        config = {
            "webhook_url": webhook_url,
            "svix_endpoint_id": svix_endpoint_id,
        }

    # Check if destination already exists
    destination = (
        db.query(ImporterDestination).filter(ImporterDestination.importer_id == importer_id).first()
    )

    if destination:
        # Update existing
        destination.destination_type = destination_in.destination_type
        destination.integration_id = destination_in.integration_id
        destination.table_name = destination_in.table_name
        destination.column_mapping = destination_in.column_mapping
        destination.context_mapping = destination_in.context_mapping
        destination.config = config
    else:
        # Create new
        destination = ImporterDestination(
            importer_id=importer_id,
            destination_type=destination_in.destination_type,
            integration_id=destination_in.integration_id,
            table_name=destination_in.table_name,
            column_mapping=destination_in.column_mapping,
            context_mapping=destination_in.context_mapping,
            config=config,
        )
        db.add(destination)

    db.commit()
    db.refresh(destination)

    return DestinationResponse(
        id=destination.id,
        importer_id=destination.importer_id,
        destination_type=destination.destination_type or "supabase",
        integration_id=destination.integration_id,
        table_name=destination.table_name,
        column_mapping=destination.column_mapping or {},
        context_mapping=destination.context_mapping or {},
        webhook_url=webhook_url,
        signing_secret=signing_secret,
        created_at=destination.created_at,
        updated_at=destination.updated_at,
        integration_name=integration.name if integration else None,
        integration_type=integration.type if integration else None,
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
        # Clean up Svix endpoint if this was a webhook destination
        if destination.destination_type == "webhook" and destination.config:
            svix_endpoint_id = destination.config.get("svix_endpoint_id")
            if svix_endpoint_id and current_user.svix_app_id:
                svix_client.delete_endpoint(current_user.svix_app_id, svix_endpoint_id)

        db.delete(destination)
        db.commit()


@router.post("/{importer_id}/destination/test")
async def send_test_webhook(
    importer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Send a test webhook with sample data matching the importer schema."""
    # Get importer with destination
    importer = (
        db.query(Importer)
        .filter(
            Importer.id == importer_id,
            Importer.user_id == current_user.id,
        )
        .first()
    )
    if not importer:
        raise HTTPException(status_code=404, detail="Importer not found")

    destination = (
        db.query(ImporterDestination).filter(ImporterDestination.importer_id == importer_id).first()
    )
    if not destination or destination.destination_type != "webhook":
        raise HTTPException(status_code=400, detail="Importer has no webhook destination")

    webhook_url = destination.config.get("webhook_url")
    if not webhook_url:
        raise HTTPException(status_code=400, detail="Webhook URL not configured")

    if not is_safe_webhook_url(webhook_url):
        raise HTTPException(
            status_code=400,
            detail="Webhook URL is not allowed (must be HTTPS and not target internal resources)",
        )

    # Build sample payload based on importer schema
    sample_row = {}
    for field in importer.fields or []:
        field_name = field.get("name", "field")
        field_type = field.get("type", "text")
        if field_type == "number":
            sample_row[field_name] = 123.45
        elif field_type == "boolean":
            sample_row[field_name] = True
        elif field_type == "date":
            sample_row[field_name] = datetime.now(UTC).strftime("%Y-%m-%d")
        else:
            sample_row[field_name] = f"Sample {field_name}"

    payload = {
        "event": "test",
        "importer_id": str(importer_id),
        "importer_name": importer.name,
        "data": [sample_row],
        "row_count": 1,
    }

    # Send test request
    start_time = time.time()
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(webhook_url, json=payload)
        duration_ms = int((time.time() - start_time) * 1000)

        is_success = HTTP_SUCCESS_MIN <= response.status_code < HTTP_SUCCESS_MAX

        # Log delivery
        delivery = WebhookDelivery(
            destination_id=destination.id,
            request_url=webhook_url,
            request_payload_preview=str(payload)[:1024],
            status_code=response.status_code,
            response_body_preview=response.text[:1024] if response.text else None,
            duration_ms=duration_ms,
            success=WebhookDeliveryStatus.SUCCESS if is_success else WebhookDeliveryStatus.FAILED,
            error_message=None if is_success else f"HTTP {response.status_code}",
        )
        db.add(delivery)
        db.commit()

        return {
            "success": is_success,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
            "response_preview": response.text[:500] if response.text else None,
        }
    except httpx.RequestError as e:
        duration_ms = int((time.time() - start_time) * 1000)
        # Sanitize error message to avoid leaking internal network details
        error_type = type(e).__name__
        sanitized_error = f"Connection failed: {error_type}"

        delivery = WebhookDelivery(
            destination_id=destination.id,
            request_url=webhook_url,
            request_payload_preview=str(payload)[:1024],
            status_code=None,
            duration_ms=duration_ms,
            success=WebhookDeliveryStatus.FAILED,
            error_message=str(e),  # Keep full error in internal logs
        )
        db.add(delivery)
        db.commit()

        return {
            "success": False,
            "status_code": None,
            "duration_ms": duration_ms,
            "error": sanitized_error,  # Return sanitized error to client
        }


@router.get("/{importer_id}/destination/deliveries")
async def get_destination_deliveries(
    importer_id: uuid.UUID,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Get recent webhook delivery logs for this importer's destination."""
    # Verify importer exists and belongs to user
    importer = (
        db.query(Importer)
        .filter(
            Importer.id == importer_id,
            Importer.user_id == current_user.id,
        )
        .first()
    )
    if not importer:
        raise HTTPException(status_code=404, detail="Importer not found")

    destination = (
        db.query(ImporterDestination)
        .filter(ImporterDestination.importer_id == importer_id)
        .first()
    )
    if not destination:
        return {"deliveries": []}

    deliveries = (
        db.query(WebhookDelivery)
        .filter(WebhookDelivery.destination_id == destination.id)
        .order_by(WebhookDelivery.created_at.desc())
        .limit(min(limit, 50))
        .all()
    )

    return {
        "deliveries": [
            WebhookDeliveryResponse.model_validate(d) for d in deliveries
        ]
    }
