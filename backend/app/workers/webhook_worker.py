"""
Webhook worker module for processing webhook deliveries from the Redis Queue.

This module contains worker functions that are executed by Redis Queue workers
to send webhooks asynchronously and reliably.
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional

from app.db.base import SessionLocal
from app.models.import_job import ImportJob
from app.models.importer import Importer
from app.models.webhook import WebhookEventType
from app.services.webhook import webhook_service

logger = logging.getLogger(__name__)


def send_webhook(
    import_job_id: str,
    event_type: str,
    payload_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Send a webhook for an import job event.
    
    This worker function is called by RQ to send webhooks asynchronously.
    It loads the import job and importer from the database and sends the webhook.
    
    Args:
        import_job_id: The ID of the import job
        event_type: The webhook event type (e.g., "import.started", "import.completed")
        payload_data: Optional additional data to include in the webhook payload
    
    Returns:
        Dict with status and message indicating success or failure
    """
    logger.info("Webhook Worker: Sending %s webhook for job %s", event_type, import_job_id)
    
    # Create a new database session for this worker
    db = SessionLocal()
    
    try:
        # Load the import job and importer
        import_job = db.query(ImportJob).filter(ImportJob.id == import_job_id).first()
        if not import_job:
            logger.error("Import job %s not found", import_job_id)
            return {"status": "error", "message": f"Import job {import_job_id} not found"}
        
        importer = db.query(Importer).filter(Importer.id == import_job.importer_id).first()
        if not importer:
            logger.error("Importer for job %s not found", import_job_id)
            return {"status": "error", "message": f"Importer not found for job {import_job_id}"}
        
        # Check if webhook is enabled via destination
        if (
            not importer.destination
            or importer.destination.destination_type != "webhook"
        ):
            logger.info("Webhook destination not configured for importer %s", importer.id)
            return {"status": "skipped", "message": "Webhook destination not configured"}

        webhook_url = importer.destination.config.get("webhook_url")
        if not webhook_url:
            logger.info("Webhook URL not set for importer %s", importer.id)
            return {"status": "skipped", "message": "Webhook URL not set"}
        
        # Build the webhook payload
        payload = {
            "event": event_type,
            "import_id": str(import_job.id),
            "status": import_job.status.value,
            "timestamp": datetime.now().isoformat(),
            "row_count": import_job.row_count,
            "processed_rows": import_job.processed_rows,
            "error_count": import_job.error_count,
        }
        
        # Add any additional payload data
        if payload_data:
            payload.update(payload_data)
        
        # Convert event type string to enum
        try:
            event_type_enum = WebhookEventType(event_type)
        except ValueError:
            logger.error("Invalid event type: %s", event_type)
            return {"status": "error", "message": f"Invalid event type: {event_type}"}
        
        # Send the webhook using the webhook service
        # We need to run the async function in a new event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            webhook_event = loop.run_until_complete(
                webhook_service.create_webhook_event(
                    db=db,
                    user_id=import_job.user_id,
                    import_job_id=import_job.id,
                    event_type=event_type_enum,
                    payload=payload
                )
            )
            
            if webhook_event and webhook_event.delivered:
                logger.info("Webhook %s successfully sent for job %s", event_type, import_job_id)
                return {"status": "success", "message": f"Webhook {event_type} sent successfully"}
            else:
                logger.warning("Webhook %s delivery failed for job %s", event_type, import_job_id)
                return {"status": "failed", "message": f"Webhook {event_type} delivery failed"}
                
        finally:
            loop.close()
            
    except Exception as e:
        logger.error("Error sending webhook for job %s: %s", import_job_id, str(e), exc_info=True)
        return {"status": "error", "message": str(e)}
    
    finally:
        # Close the database session
        db.close()