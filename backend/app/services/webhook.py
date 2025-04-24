import httpx
import json
import hmac
import hashlib
import uuid
import sys
import logging
from typing import Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.webhook import WebhookEvent, WebhookEventType
from app.core.config import settings
import os
import pandas as pd

# Configure a specific webhook logger
webhook_logger = logging.getLogger("app.webhook")
webhook_logger.setLevel(logging.INFO)

# Add file handler to write log messages to a webhook-specific file
import time
webhook_log_file = f"/tmp/webhook_{time.strftime('%Y%m%d')}.log"
file_handler = logging.FileHandler(webhook_log_file)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
webhook_logger.addHandler(file_handler)

# Add console handler for visibility in the console
console_handler = logging.StreamHandler(sys.stderr)
console_handler.setFormatter(logging.Formatter('%(asctime)s - WEBHOOK - %(levelname)s - %(message)s'))
webhook_logger.addHandler(console_handler)

# Custom JSON encoder to handle UUID serialization
class UUIDEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, uuid.UUID):
            # Convert UUID to string
            return str(obj)
        # Let the base class handle other types or raise TypeError
        return json.JSONEncoder.default(self, obj)

class WebhookService:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=10.0)
        # Instead of hardcoded URL, we'll use the importer's webhook_url setting
        self.webhook_secret = settings.SECRET_KEY  # Using app secret key for signing

    def generate_signature(self, payload: Dict[str, Any], secret: str) -> str:
        """Generate HMAC signature for webhook payload"""
        # Use custom encoder to handle UUID objects
        payload_bytes = json.dumps(payload, cls=UUIDEncoder).encode('utf-8')
        signature = hmac.new(
            secret.encode('utf-8'),
            payload_bytes,
            hashlib.sha256
        ).hexdigest()
        return signature

    async def send_webhook(self, url: str, payload: Dict[str, Any], secret: str) -> bool:
        """Send webhook to specified URL with payload and signature"""
        try:
            webhook_logger.info(f"Sending webhook to URL: {url}")

            # Validate URL before sending
            if not url or not url.strip() or not (url.startswith('http://') or url.startswith('https://')):
                webhook_logger.error(f"Invalid webhook URL: '{url}' - must be a valid HTTP/HTTPS URL")
                return False

            # Sanitize URL (remove whitespace)
            clean_url = url.strip()

            # Prepare signature and headers
            signature = self.generate_signature(payload, secret)
            headers = {
                "Content-Type": "application/json",
                "X-ImportCSV-Signature": signature,
                "X-ImportCSV-Event": payload.get("event_type", "")
            }

            # Create a client with adequate timeout
            async with httpx.AsyncClient(timeout=60.0) as client:
                try:
                    # First try with the json parameter (most reliable method)
                    webhook_logger.debug(f"Sending webhook request with json parameter")
                    response = await client.post(
                        clean_url,
                        json=payload,  # Let httpx handle serialization
                        headers=headers
                    )
                    
                    # Log the response
                    webhook_logger.debug(f"Webhook response: status={response.status_code}")
                    
                    # Return based on status code
                    success = response.status_code >= 200 and response.status_code < 300
                    if success:
                        webhook_logger.info(f"Webhook to {clean_url} successful (status {response.status_code})")
                    else:
                        webhook_logger.warning(f"Webhook to {clean_url} failed with status {response.status_code}")
                    
                    return success
                    
                except Exception as json_err:
                    # Log the error
                    webhook_logger.error(f"Error sending webhook with json parameter: {str(json_err)}")
                    
                    # Try again with manual serialization
                    try:
                        webhook_logger.debug("Retrying with manual serialization")
                        
                        # Manually serialize the payload
                        serialized_payload = json.dumps(payload, cls=UUIDEncoder)
                        
                        # Send with content parameter instead
                        response = await client.post(
                            clean_url,
                            content=serialized_payload.encode('utf-8'),
                            headers=headers
                        )
                        
                        # Log the response
                        webhook_logger.debug(f"Fallback webhook response: status={response.status_code}")
                        
                        # Return based on status code
                        success = response.status_code >= 200 and response.status_code < 300
                        if success:
                            webhook_logger.info(f"Webhook to {clean_url} successful with fallback method (status {response.status_code})")
                        else:
                            webhook_logger.warning(f"Webhook to {clean_url} failed with fallback method (status {response.status_code})")
                        
                        return success
                        
                    except Exception as inner_err:
                        webhook_logger.error(f"Error sending webhook with fallback method: {str(inner_err)}")
                        return False

        except Exception as e:
            webhook_logger.error(f"Unexpected error sending webhook: {str(e)}", exc_info=True)
            return False

    async def send_webhook_in_background(self, webhook_event) -> bool:
        """
        Send a webhook in the background using the importer's webhook URL

        Args:
            webhook_event: The webhook event to send, with importer_id and payload
        """
        try:
            from app.db.base import SessionLocal
            from app.models.importer import Importer

            db = SessionLocal()
            try:
                # Get the importer to retrieve the webhook URL
                importer = db.query(Importer).filter(Importer.id == webhook_event.importer_id).first()

                if not importer or not importer.webhook_url or not importer.webhook_enabled:
                    webhook_logger.warning(f"Webhook not sent: Importer not found or webhook not enabled")
                    return False

                webhook_logger.info(f"Sending webhook in background for importer {importer.id} to {importer.webhook_url}")
                
                # Send the webhook
                success = await self.send_webhook(
                    importer.webhook_url,
                    webhook_event.payload,
                    self.webhook_secret
                )

                # Log outcome is handled by send_webhook method
                return success
            finally:
                db.close()
        except Exception as e:
            webhook_logger.error(f"Error sending webhook in background: {e}", exc_info=True)
            return False

    async def create_event(
        self,
        db: Session,
        user_id: uuid.UUID,
        import_job_id: uuid.UUID,
        event_type: WebhookEventType,
        payload: Dict[str, Any]
    ) -> WebhookEvent:
        """Create webhook event in database and send it immediately"""
        # First create the webhook event record
        webhook_event = WebhookEvent(
            user_id=user_id,
            import_job_id=import_job_id,
            event_type=event_type,
            payload=payload,
            delivered=False,
            delivery_attempts=0
        )
        
        db.add(webhook_event)
        db.commit()
        db.refresh(webhook_event)
        
        # Log the event creation
        webhook_logger.info(f"Webhook event {webhook_event.id} created (type: {event_type}, job: {import_job_id})")
        
        # Now find the importer to get the webhook URL and send the webhook
        try:
            # Find the import job
            from app.models.import_job import ImportJob
            import_job = db.query(ImportJob).filter(ImportJob.id == import_job_id).first()
            
            if not import_job:
                webhook_logger.error(f"Import job {import_job_id} not found, cannot send webhook")
                return webhook_event
            
            # Get the importer from the import job
            from app.models.importer import Importer
            importer = db.query(Importer).filter(Importer.id == import_job.importer_id).first()
            
            if not importer:
                webhook_logger.error(f"Importer for job {import_job_id} not found, cannot send webhook")
                return webhook_event
            
            # Check if webhook is configured
            if not importer.webhook_url or not importer.webhook_enabled:
                webhook_logger.info(f"Webhook not enabled or URL not set for importer {importer.id}")
                return webhook_event
            
            # Log the webhook details
            webhook_logger.info(f"Sending webhook for importer {importer.id} to {importer.webhook_url}")
            
            # Prepare any additional metadata for the webhook
            payload['webhook_id'] = str(webhook_event.id)
            payload['timestamp'] = datetime.now().isoformat()
            
            # Send the webhook directly
            success = await self.send_webhook(
                url=importer.webhook_url,
                payload=payload,
                secret=self.webhook_secret
            )
            
            # Update the webhook event with the delivery result
            webhook_event.delivery_attempts += 1
            webhook_event.last_delivery_attempt = datetime.now()
            
            if success:
                webhook_event.delivered = True
                webhook_logger.info(f"Webhook {webhook_event.id} sent successfully to {importer.webhook_url}")
            else:
                webhook_logger.warning(f"Webhook {webhook_event.id} delivery failed to {importer.webhook_url}")
            
            # Save the updated delivery status
            db.add(webhook_event)
            db.commit()
            
        except Exception as e:
            webhook_logger.error(f"Error sending webhook for event {webhook_event.id}: {str(e)}", exc_info=True)
        
        return webhook_event

webhook_service = WebhookService()
