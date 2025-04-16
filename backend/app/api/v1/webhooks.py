from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime

from app.db.base import get_db
from app.services.auth import get_current_user
from app.models.user import User
from app.models.webhook import WebhookEvent
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
