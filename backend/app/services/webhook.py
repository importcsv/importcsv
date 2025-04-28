# Standard library imports
import hashlib
import hmac
import json
import logging
import sys
import time
import uuid
from datetime import datetime
from typing import Dict, Any

# Third-party imports
import httpx
from sqlalchemy.orm import Session

# Application imports
from app.core.config import settings
from app.models.import_job import ImportJob
from app.models.importer import Importer
from app.models.webhook import WebhookEvent, WebhookEventType

# Configure a specific webhook logger
webhook_logger = logging.getLogger("app.webhook")
webhook_logger.setLevel(logging.INFO)

# Setup log formatters
file_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_formatter = logging.Formatter('%(asctime)s - WEBHOOK - %(levelname)s - %(message)s')

# Add file handler
webhook_log_file = f"/tmp/webhook_{time.strftime('%Y%m%d')}.log"
file_handler = logging.FileHandler(webhook_log_file)
file_handler.setFormatter(file_formatter)
webhook_logger.addHandler(file_handler)

# Add console handler
console_handler = logging.StreamHandler(sys.stderr)
console_handler.setFormatter(console_formatter)
webhook_logger.addHandler(console_handler)

# Custom JSON encoder to handle UUID serialization and special values
class UUIDEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, uuid.UUID):
            # Convert UUID to string
            return str(obj)
        # Let the base class handle other types or raise TypeError
        return json.JSONEncoder.default(self, obj)

class WebhookService:
    def __init__(self):
        self.webhook_secret = settings.SECRET_KEY  # Using app secret key for signing
        
    def _sanitize_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize payload by replacing NaN values with None"""
        if not payload:
            return payload
            
        # Convert to JSON and back using our custom encoder
        # This will handle all NaN values and UUIDs in one step
        try:
            # First convert to JSON string
            json_str = json.dumps(payload)
            # Then parse it back to a Python object
            return json.loads(json_str)
        except (TypeError, ValueError):
            # If there's any error in JSON conversion, try manual sanitization
            if isinstance(payload, dict):
                result = {}
                for key, value in payload.items():
                    if isinstance(value, float) and (value != value):  # NaN check
                        result[key] = None
                    elif isinstance(value, (dict, list)):
                        result[key] = self._sanitize_payload(value)
                    else:
                        result[key] = value
                return result
            elif isinstance(payload, list):
                return [self._sanitize_payload(item) if isinstance(item, (dict, list)) else 
                        None if isinstance(item, float) and (item != item) else item 
                        for item in payload]
            return payload

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
                # First try with the json parameter (most reliable method)
                try:
                    webhook_logger.debug("Sending webhook request with json parameter")
                    response = await client.post(
                        clean_url,
                        json=payload,  # Let httpx handle serialization
                        headers=headers
                    )
                    success = self._handle_response(response, clean_url)
                    return success
                except Exception as json_err:
                    webhook_logger.error(f"Error sending webhook with json parameter: {str(json_err)}")
                    
                    # Try fallback with manual serialization
                    webhook_logger.debug("Retrying with manual serialization")
                    try:
                        serialized_payload = json.dumps(payload, cls=UUIDEncoder)
                        response = await client.post(
                            clean_url,
                            content=serialized_payload.encode('utf-8'),
                            headers=headers
                        )
                        success = self._handle_response(response, clean_url, is_fallback=True)
                        return success
                    except Exception as inner_err:
                        webhook_logger.error(f"Error sending webhook with fallback method: {str(inner_err)}")
                        return False

        except Exception as e:
            webhook_logger.error(f"Unexpected error sending webhook: {str(e)}", exc_info=True)
            return False
            
    def _handle_response(self, response, url, is_fallback=False):
        """Handle webhook response and return success status"""
        # Log the response
        method_str = "fallback method" if is_fallback else "json parameter"
        webhook_logger.debug(f"Webhook response ({method_str}): status={response.status_code}")
        
        # Return based on status code
        success = 200 <= response.status_code < 300
        if success:
            webhook_logger.info(f"Webhook to {url} successful{' with fallback' if is_fallback else ''} (status {response.status_code})")
        else:
            webhook_logger.warning(f"Webhook to {url} failed{' with fallback' if is_fallback else ''} (status {response.status_code})")
            
        return success

    async def create_event(
        self,
        db: Session,
        user_id: uuid.UUID,
        import_job_id: uuid.UUID,
        event_type: WebhookEventType,
        payload: Dict[str, Any]
    ) -> WebhookEvent:
        """Create webhook event in database and send it immediately"""
        # Sanitize the payload to handle NaN values before storing in the database
        sanitized_payload = self._sanitize_payload(payload)
        
        # First create the webhook event record
        webhook_event = WebhookEvent(
            user_id=user_id,
            import_job_id=import_job_id,
            event_type=event_type,
            payload=sanitized_payload,
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
            import_job = db.query(ImportJob).filter(ImportJob.id == import_job_id).first()

            if not import_job:
                webhook_logger.error(f"Import job {import_job_id} not found, cannot send webhook")
                return webhook_event

            # Get the importer from the import job
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
