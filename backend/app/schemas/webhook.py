from pydantic import BaseModel, Field, HttpUrl
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.models.webhook import WebhookEventType

# Base WebhookEvent model
class WebhookEventBase(BaseModel):
    event_type: WebhookEventType
    import_job_id: int
    payload: Dict[str, Any]

# WebhookEvent creation model
class WebhookEventCreate(WebhookEventBase):
    pass

# WebhookEvent in DB
class WebhookEventInDBBase(WebhookEventBase):
    id: int
    user_id: int
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
