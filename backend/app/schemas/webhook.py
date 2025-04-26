from pydantic import BaseModel, Field, HttpUrl
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
from app.models.webhook import WebhookEventType


# Base WebhookEvent model
class WebhookEventBase(BaseModel):
    event_type: str
    payload: Dict[str, Any]


# WebhookEvent creation model
class WebhookEventCreate(WebhookEventBase):
    importer_id: Optional[uuid.UUID] = None
    import_job_id: Optional[uuid.UUID] = None


# WebhookEvent in DB
class WebhookEventInDBBase(WebhookEventBase):
    id: uuid.UUID
    user_id: uuid.UUID
    import_job_id: uuid.UUID
    delivered: bool
    delivery_attempts: int
    last_delivery_attempt: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# WebhookEvent to return via API
class WebhookEvent(WebhookEventInDBBase):
    pass


# Webhook configuration
class WebhookConfig(BaseModel):
    url: HttpUrl
    secret: str
    events: List[WebhookEventType]
    description: Optional[str] = None
    active: bool = True


# Webhook configuration create
class WebhookConfigCreate(WebhookConfig):
    pass


# Webhook configuration update
class WebhookConfigUpdate(BaseModel):
    url: Optional[HttpUrl] = None
    secret: Optional[str] = None
    events: Optional[List[WebhookEventType]] = None
    description: Optional[str] = None
    active: Optional[bool] = None
