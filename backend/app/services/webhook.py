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
    """Custom JSON encoder that handles UUID objects and NaN values"""
    def default(self, obj):
        if isinstance(obj, uuid.UUID):
            # Convert UUID to string
            return str(obj)
        # Handle float NaN values
        if isinstance(obj, float) and obj != obj:  # NaN check
            return None
        # Let the base class handle other types or raise TypeError
        return json.JSONEncoder.default(self, obj)

class WebhookService:
    def __init__(self):
        self.webhook_secret = settings.SECRET_KEY  # Using app secret key for signing
        
    def _sanitize_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize payload by replacing NaN values with None"""
        if not payload:
            return payload
        
        # Simple recursive sanitization function
        def sanitize(obj):
            if isinstance(obj, dict):
                return {k: sanitize(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [sanitize(item) for item in obj]
            elif isinstance(obj, float) and obj != obj:  # NaN check
                return None
            else:
                return obj
        
        # Sanitize and then verify with JSON encoder
        try:
            sanitized = sanitize(payload)
            # Verify serialization works
            json.dumps(sanitized, cls=UUIDEncoder)
            return sanitized
        except (TypeError, ValueError) as e:
            webhook_logger.error(f"Error serializing payload: {str(e)}")
            # If there's an error, create a minimal valid payload
            if isinstance(payload, dict):
                # Keep only serializable values
                result = {}
                for key, value in payload.items():
                    try:
                        # Test if this value can be serialized
                        json.dumps({"test": value}, cls=UUIDEncoder)
                        result[key] = sanitize(value)
                    except (TypeError, ValueError):
                        # If not serializable, set to None
                        webhook_logger.warning(f"Replacing non-serializable value for key '{key}' with None")
                        result[key] = None
                return result
            return {"error": "Original payload contained invalid data", "timestamp": datetime.now().isoformat()}

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
            
            # Log the payload details for debugging
            event_type = payload.get("event", payload.get("event_type", "unknown"))
            data_count = len(payload.get("data", [])) if isinstance(payload.get("data"), list) else 0
            webhook_logger.info(f"Webhook payload: event={event_type}, data_rows={data_count}, keys={list(payload.keys())}")
            
            # Log sample of first data row if present (for debugging)
            if data_count > 0 and isinstance(payload.get("data"), list):
                first_row = payload["data"][0] if payload["data"] else {}
                webhook_logger.debug(f"First data row keys: {list(first_row.keys()) if isinstance(first_row, dict) else 'N/A'}")

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
                "X-ImportCSV-Event": payload.get("event", payload.get("event_type", ""))
            }

            # Create a client with adequate timeout
            async with httpx.AsyncClient(timeout=60.0) as client:
                # First try with the json parameter (most reliable method)
                try:
                    webhook_logger.info("Sending webhook request with json parameter")
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
                    webhook_logger.info("Retrying with manual serialization")
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
        webhook_logger.info(f"Webhook response ({method_str}): status={response.status_code}")
        
        # Return based on status code
        success = 200 <= response.status_code < 300
        if success:
            webhook_logger.info(f"Webhook to {url} successful{' with fallback' if is_fallback else ''} (status {response.status_code})")
        else:
            webhook_logger.warning(f"Webhook to {url} failed{' with fallback' if is_fallback else ''} (status {response.status_code})")
            
        return success

    async def create_webhook_event(self, db: Session, user_id: uuid.UUID, import_job_id: uuid.UUID, 
                          event_type: WebhookEventType, payload: Dict[str, Any]) -> WebhookEvent:
        """Create a webhook event record"""
        webhook_logger.info(f"Creating webhook event: {event_type.value} for import job {import_job_id}")
        
        # Sanitize the payload to handle NaN values before storing in the database
        sanitized_payload = self._sanitize_payload(payload)
        
        # Add essential information to ensure we have a valid minimal payload
        if isinstance(sanitized_payload, dict):
            sanitized_payload.update({
                "event_type": event_type.value,
                "import_job_id": str(import_job_id),
                "timestamp": datetime.now().isoformat()
            })
        
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

            # Check if webhook is configured via destination
            if (
                not importer.destination
                or importer.destination.destination_type != "webhook"
            ):
                webhook_logger.info(f"Webhook destination not configured for importer {importer.id}")
                return webhook_event

            webhook_url = importer.destination.config.get("webhook_url")
            if not webhook_url:
                webhook_logger.info(f"Webhook URL not set in destination config for importer {importer.id}")
                return webhook_event

            # Log the webhook details
            webhook_logger.info(f"Sending webhook for importer {importer.id} to {webhook_url}")

            # Prepare any additional metadata for the webhook
            payload['webhook_id'] = str(webhook_event.id)
            payload['timestamp'] = datetime.now().isoformat()

            # Send the webhook directly
            success = await self.send_webhook(
                url=webhook_url,
                payload=payload,
                secret=self.webhook_secret
            )

            # Update the webhook event with the delivery result
            webhook_event.delivery_attempts += 1
            webhook_event.last_delivery_attempt = datetime.now()

            if success:
                webhook_event.delivered = True
                webhook_logger.info(f"Webhook {webhook_event.id} sent successfully to {webhook_url}")
            else:
                webhook_logger.warning(f"Webhook {webhook_event.id} delivery failed to {webhook_url}")

            # Save the updated delivery status
            db.add(webhook_event)
            db.commit()

        except Exception as e:
            webhook_logger.error(f"Error sending webhook for event {webhook_event.id}: {str(e)}", exc_info=True)

        return webhook_event

webhook_service = WebhookService()
