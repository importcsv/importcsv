import httpx
import json
import hmac
import hashlib
import uuid
from typing import Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.webhook import WebhookEvent, WebhookEventType
from app.core.config import settings
import os
import pandas as pd

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
        # Use hardcoded webhook URL
        self.webhook_url = "https://webhook.site/3f7ab4f8-6a1c-43d5-acbf-c8afb92be098"
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
            signature = self.generate_signature(payload, secret)
            headers = {
                "Content-Type": "application/json",
                "X-ImportCSV-Signature": signature,
                "X-ImportCSV-Event": payload.get("event_type", "")
            }
            
            # Serialize payload with custom encoder
            serialized_payload = json.dumps(payload, cls=UUIDEncoder)
            
            response = await self.client.post(
                url,
                content=serialized_payload.encode('utf-8'),
                headers=headers
            )
            
            return response.status_code >= 200 and response.status_code < 300
        except Exception as e:
            print(f"Error sending webhook: {e}")
            return False
    
    async def create_event(
        self, 
        db: Session, 
        user_id: uuid.UUID, 
        import_job_id: uuid.UUID, 
        event_type: WebhookEventType, 
        payload: Dict[str, Any]
    ) -> WebhookEvent:
        """Create webhook event in database"""
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
        
        return webhook_event
    
    async def process_pending_webhooks(self, db: Session) -> int:
        """Process pending webhook events"""
        # Get all pending webhook events
        pending_events = db.query(WebhookEvent).filter(
            WebhookEvent.delivered == False,
            WebhookEvent.delivery_attempts < 3  # Max 3 attempts
        ).all()
        
        success_count = 0
        
        for event in pending_events:
            # Use the webhook URL from environment variable
            webhook_url = self.webhook_url
            webhook_secret = self.webhook_secret
            
            success = await self.send_webhook(
                webhook_url,
                event.payload,
                webhook_secret
            )
            
            # Update event status
            event.delivery_attempts += 1
            event.last_delivery_attempt = datetime.now()
            
            if success:
                event.delivered = True
                success_count += 1
            
            db.add(event)
        
        db.commit()
        return success_count

    async def send_csv_data(self, file_path: str, metadata: Dict[str, Any]) -> bool:
        """Send CSV data to webhook endpoint"""
        try:
            # Read CSV file
            df = pd.read_csv(file_path)
            
            # Prepare payload with CSV data and metadata
            payload = {
                "event_type": "csv.data",
                "timestamp": datetime.now().isoformat(),
                "metadata": metadata,
                "data": df.to_dict(orient="records")  # Convert DataFrame to list of records
            }
            
            # Send to webhook
            success = await self.send_webhook(
                self.webhook_url,
                payload,
                self.webhook_secret
            )
            
            if success:
                print(f"Successfully sent CSV data to webhook: {self.webhook_url}")
            else:
                print(f"Failed to send CSV data to webhook: {self.webhook_url}")
                
            return success
        except Exception as e:
            print(f"Error sending CSV data to webhook: {e}")
            return False

webhook_service = WebhookService()
