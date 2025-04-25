from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
import uuid

from app.db.base import get_db
from app.services.auth import get_current_user
from app.models.user import User
from app.models.webhook import WebhookEvent
from app.models.import_job import ImportJob
from app.models.importer import Importer
from app.schemas.webhook import WebhookEvent as WebhookEventSchema
from app.services.webhook import webhook_service

router = APIRouter()

@router.get("/events", response_model=List[WebhookEventSchema])
async def read_webhook_events(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve webhook events
    """
    events = db.query(WebhookEvent).filter(
        WebhookEvent.user_id == current_user.id
    ).offset(skip).limit(limit).all()

    return events

@router.post("/test", response_model=Dict[str, Any])
async def test_webhook(
    url: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Test sending a webhook to a URL
    """
    import logging
    import os
    logger = logging.getLogger(__name__)

    # Create a file to verify this endpoint is being called
    debug_file_path = "/tmp/webhook_test_debug.txt"
    with open(debug_file_path, "w") as f:
        f.write(f"Webhook test called at {datetime.now().isoformat()}\n")
        f.write(f"URL: {url}\n")
        f.write(f"User: {current_user.email}\n")

    # Prepare a test payload
    payload = {
        "event_type": "webhook.test",
        "timestamp": datetime.now().isoformat(),
        "message": "This is a test webhook from ImportCSV",
        "user_id": str(current_user.id),
        "test_data": {
            "example_row_1": {"field1": "value1", "field2": "value2"},
            "example_row_2": {"field1": "value3", "field2": "value4"}
        }
    }


    # Write payload to file as well
    with open(debug_file_path, "a") as f:
        f.write(f"Payload: {str(payload)}\n")

    # Try to send the webhook
    try:
        # Create a new httpx client for just this request
        import httpx

        # First log details to the file
        with open(debug_file_path, "a") as f:
            f.write("About to send webhook POST request...\n")

        # Serialize payload
        import json
        from app.services.webhook import UUIDEncoder
        serialized_payload = json.dumps(payload, cls=UUIDEncoder)

        # Generate signature
        signature = webhook_service.generate_signature(payload, webhook_service.webhook_secret)

        headers = {
            "Content-Type": "application/json",
            "X-ImportCSV-Signature": signature,
            "X-ImportCSV-Event": payload.get("event_type", "")
        }

        # Create a client with debugging
        async with httpx.AsyncClient(timeout=30.0) as client:
            with open(debug_file_path, "a") as f:
                f.write(f"Sending to URL: {url}\n")
                f.write(f"Headers: {headers}\n")

            response = await client.post(
                url,
                content=serialized_payload.encode('utf-8'),
                headers=headers,
            )

            status_code = response.status_code
            response_text = response.text

            # Log response
            with open(debug_file_path, "a") as f:
                f.write(f"Response status: {status_code}\n")
                f.write(f"Response text: {response_text[:500]}\n")

            success = status_code >= 200 and status_code < 300

            return {
                "success": success,
                "url": url,
                "timestamp": datetime.now().isoformat(),
                "message": "Webhook test completed" + (" successfully" if success else " with failure"),
                "status_code": status_code,
                "response_text": response_text[:500]
            }

    except Exception as e:
        logger.error(f"Error testing webhook: {e}", exc_info=True)

        # Log exception to file
        with open(debug_file_path, "a") as f:
            f.write(f"Exception: {str(e)}\n")
            import traceback
            f.write(f"Traceback: {traceback.format_exc()}\n")

        return {
            "success": False,
            "url": url,
            "timestamp": datetime.now().isoformat(),
            "message": f"Webhook test error: {str(e)}",
            "error": str(e),
            "debug_file": debug_file_path
        }

@router.post("/public-test", response_model=Dict[str, Any])
async def public_test_webhook(
    url: str,
    db: Session = Depends(get_db),
):
    """
    Public test endpoint for webhooks (no auth required)
    """
    import logging
    import os
    logger = logging.getLogger(__name__)

    # Create a file to verify this endpoint is being called
    debug_file_path = "/tmp/public_webhook_test_debug.txt"
    with open(debug_file_path, "w") as f:
        f.write(f"Public webhook test called at {datetime.now().isoformat()}\n")
        f.write(f"URL: {url}\n")

    # Prepare a test payload
    payload = {
        "event_type": "webhook.public_test",
        "timestamp": datetime.now().isoformat(),
        "message": "This is a public test webhook from ImportCSV",
        "test_data": {
            "example_row_1": {"field1": "value1", "field2": "value2"},
            "example_row_2": {"field1": "value3", "field2": "value4"}
        }
    }

    # Try to send the webhook directly using httpx
    try:
        import httpx
        import json

        # Log to file
        with open(debug_file_path, "a") as f:
            f.write("About to send public webhook request...\n")

        # Send request directly
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )

            status_code = response.status_code
            response_text = response.text

            # Log response
            with open(debug_file_path, "a") as f:
                f.write(f"Response status: {status_code}\n")
                f.write(f"Response text: {response_text[:500]}\n")

            success = status_code >= 200 and status_code < 300

            return {
                "success": success,
                "url": url,
                "timestamp": datetime.now().isoformat(),
                "message": "Public webhook test completed" + (" successfully" if success else " with failure"),
                "status_code": status_code,
                "response_text": response_text[:500],
                "debug_file": debug_file_path
            }

    except Exception as e:
        logger.error(f"Error in public webhook test: {e}", exc_info=True)

        # Log exception to file
        with open(debug_file_path, "a") as f:
            f.write(f"Exception: {str(e)}\n")
            import traceback
            f.write(f"Traceback: {traceback.format_exc()}\n")

        return {
            "success": False,
            "url": url,
            "timestamp": datetime.now().isoformat(),
            "message": f"Public webhook test error: {str(e)}",
            "error": str(e),
            "debug_file": debug_file_path
        }

@router.post("/send-processed-data", response_model=Dict[str, Any])
async def send_processed_data(
    importer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Manually send processed data from the most recent import job for an importer
    """
    import logging
    import os
    import sys
    import time
    import pandas as pd
    logger = logging.getLogger(__name__)

    # Create a debug file for this webhook send
    debug_file = f"/tmp/webhook_admin_send_{int(time.time())}.txt"
    with open(debug_file, "w") as f:
        f.write(f"Admin webhook send started at {datetime.now().isoformat()}\n")
        f.write(f"Importer ID: {importer_id}\n")
        f.write(f"User: {current_user.email}\n")

    # First, get the importer
    importer = db.query(Importer).filter(
        Importer.id == importer_id,
        Importer.user_id == current_user.id
    ).first()

    if not importer:
        with open(debug_file, "a") as f:
            f.write(f"ERROR: Importer {importer_id} not found\n")
        return {
            "success": False,
            "message": f"Importer {importer_id} not found",
            "debug_file": debug_file
        }

    # Log importer details
    with open(debug_file, "a") as f:
        f.write(f"Found importer: {importer.name} (ID: {importer.id})\n")
        f.write(f"Webhook URL: {importer.webhook_url}\n")
        f.write(f"Webhook enabled: {importer.webhook_enabled}\n")

    # Check if webhook is configured
    if not importer.webhook_url or not importer.webhook_enabled:
        with open(debug_file, "a") as f:
            f.write(f"ERROR: Webhook not configured or disabled for importer {importer_id}\n")
        return {
            "success": False,
            "message": "Webhook not configured or disabled for this importer",
            "webhook_url": importer.webhook_url,
            "webhook_enabled": importer.webhook_enabled,
            "debug_file": debug_file
        }

    # Get the most recent import job for this importer
    import_job = db.query(ImportJob).filter(
        ImportJob.importer_id == importer_id
    ).order_by(ImportJob.created_at.desc()).first()

    if not import_job:
        with open(debug_file, "a") as f:
            f.write(f"ERROR: No import jobs found for importer {importer_id}\n")
        return {
            "success": False,
            "message": "No import jobs found for this importer",
            "debug_file": debug_file
        }

    # Log import job details
    with open(debug_file, "a") as f:
        f.write(f"Found most recent import job: {import_job.id}\n")
        f.write(f"File: {import_job.file_name} ({import_job.file_path})\n")
        f.write(f"Status: {import_job.status}\n")

    # Try to read the CSV file if it exists
    file_path = import_job.file_path
    sample_data = []

    if file_path and os.path.exists(file_path):
        try:
            # Read the CSV file
            with open(debug_file, "a") as f:
                f.write(f"Reading CSV file: {file_path}\n")

            df = pd.read_csv(file_path)

            with open(debug_file, "a") as f:
                f.write(f"CSV read successfully. Found {len(df)} rows.\n")
                f.write(f"Columns: {df.columns.tolist()}\n")

            # Apply column mapping if available
            if import_job.column_mapping:
                with open(debug_file, "a") as f:
                    f.write(f"Applying column mapping: {import_job.column_mapping}\n")

                # Convert the mapping to a format acceptable by pandas
                mapping = import_job.column_mapping
                df.rename(columns=mapping, inplace=True, errors='ignore')

            # Get a sample of the data
            sample_data = df.head(5).to_dict(orient='records')

            with open(debug_file, "a") as f:
                f.write(f"Created sample data with {len(sample_data)} rows\n")

        except Exception as e:
            with open(debug_file, "a") as f:
                f.write(f"ERROR reading CSV: {str(e)}\n")
                import traceback
                f.write(f"Traceback: {traceback.format_exc()}\n")

            # Continue with empty sample data
            sample_data = []
    else:
        with open(debug_file, "a") as f:
            f.write(f"WARNING: File {file_path} not found or not specified\n")

    # Prepare the payload
    payload = {
        "event_type": "admin.manual_webhook",
        "timestamp": datetime.now().isoformat(),
        "job_id": str(import_job.id),
        "importer_id": str(importer.id),
        "file_name": import_job.file_name,
        "row_count": import_job.row_count or 0,
        "processed_rows": import_job.processed_rows or 0,
        "error_count": import_job.error_count or 0,
        "status": str(import_job.status),
        "message": f"Admin-triggered webhook for importer {importer.name}",
        "admin_user": current_user.email,
        "data_sample": sample_data,
        "debug_file": debug_file
    }

    with open(debug_file, "a") as f:
        f.write(f"Prepared webhook payload\n")
        f.write(f"Payload summary: Event={payload['event_type']}, JobID={payload['job_id']}, Rows={payload['row_count']}\n")

    # Send the webhook
    try:
        with open(debug_file, "a") as f:
            f.write(f"Sending webhook to {importer.webhook_url}...\n")

        success = await webhook_service.send_webhook(
            url=importer.webhook_url,
            payload=payload,
            secret=webhook_service.webhook_secret
        )

        with open(debug_file, "a") as f:
            f.write(f"Webhook send result: {'SUCCESS' if success else 'FAILED'}\n")

        return {
            "success": success,
            "message": "Webhook sent successfully" if success else "Failed to send webhook",
            "webhook_url": importer.webhook_url,
            "job_id": str(import_job.id),
            "importer_id": str(importer.id),
            "file_name": import_job.file_name,
            "row_count": import_job.row_count or 0,
            "sample_count": len(sample_data),
            "debug_file": debug_file
        }

    except Exception as e:
        with open(debug_file, "a") as f:
            f.write(f"ERROR sending webhook: {str(e)}\n")
            import traceback
            f.write(f"Traceback: {traceback.format_exc()}\n")

        return {
            "success": False,
            "message": f"Error sending webhook: {str(e)}",
            "webhook_url": importer.webhook_url,
            "error": str(e),
            "debug_file": debug_file
        }

@router.post("/retry/{event_id}", response_model=Dict[str, Any])
async def retry_webhook_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retry sending a webhook event
    """
    event = db.query(WebhookEvent).filter(
        WebhookEvent.id == event_id,
        WebhookEvent.user_id == current_user.id
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Webhook event not found")

    # TODO: Get webhook configuration for user
    # For now, using a placeholder URL and the global webhook secret
    webhook_url = "https://example.com/webhook"
    webhook_secret = "your-webhook-secret"

    success = await webhook_service.send_webhook(
        webhook_url,
        event.payload,
        webhook_secret
    )

    # Update event status
    event.delivery_attempts += 1
    event.last_delivery_attempt = datetime.now()

    if success:
        event.delivered = True

    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "success": success,
        "event_id": event.id,
        "delivery_attempts": event.delivery_attempts,
        "delivered": event.delivered
    }
