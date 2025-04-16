import httpx
import json
import hmac
import hashlib
from typing import Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.webhook import WebhookEvent, WebhookEventType
from app.core.config import settings

class WebhookService:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=10.0)
    
    def generate_signature(self, payload: Dict[str, Any], secret: str) -> str:
        """Generate HMAC signature for webhook payload"""
        payload_bytes = json.dumps(payload).encode('utf-8')
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
            
            response = await self.client.post(
                url,
                json=payload,
                headers=headers
            )
            
            return response.status_code >= 200 and response.status_code < 300
        except Exception as e:
            print(f"Error sending webhook: {e}")
            return False
    
    async def create_event(
        self, 
        db: Session, 
        user_id: int, 
        import_job_id: int, 
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
            # TODO: Get webhook configuration for user
            # For now, using a placeholder URL and the global webhook secret
            webhook_url = "https://example.com/webhook"
            webhook_secret = settings.WEBHOOK_SECRET
            
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

webhook_service = WebhookService()
