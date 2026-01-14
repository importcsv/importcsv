# Internal Events System Design

## Overview

Real-time internal notifications for ImportCSV cloud team visibility. Events are emitted from the application and processed by a background worker that sends them to configured destinations (Slack initially, extensible to Segment/others).

## Goals

- Internal team visibility into signups, usage, and billing events
- Minimal Slack messages for real-time awareness
- Open source friendly (disabled by default, opt-in via config)
- Extensible to additional destinations (Segment, etc.)

## Architecture

```
User Action → EventService.emit() → Redis Queue → Event Worker → Handlers → Slack
```

**Key properties:**
- Non-blocking: `emit()` enqueues and returns immediately
- Resilient: Worker retries on failure
- Extensible: Add handlers without changing emit points
- Optional: No config = no events (self-hosted default)

## Event Catalog

| Event | Trigger | Payload |
|-------|---------|---------|
| `user.signup` | After user created | `{email}` |
| `user.first_import` | First successful import | `{email, importer_name}` |
| `subscription.started` | Stripe webhook | `{email, plan}` |
| `subscription.cancelled` | Stripe webhook | `{email, plan}` |
| `subscription.payment_failed` | Stripe webhook | `{email}` |
| `importer.created` | After importer created | `{email, importer_name}` |
| `import.completed` | Worker completion | `{email, importer_name, row_count}` |
| `import.failed` | Worker failure | `{email, importer_name, error}` |

## Slack Message Format

Minimal one-liners:

```
user.signup              → "New signup: {email}"
user.first_import        → "First import: {email} via {importer_name}"
subscription.started     → "New subscriber: {email} ({plan})"
subscription.cancelled   → "Churned: {email} ({plan})"
subscription.payment_failed → "Payment failed: {email}"
importer.created         → "New importer: {importer_name} by {email}"
import.completed         → "Import: {row_count} rows by {email}"
import.failed            → "Import failed: {email} - {error}"
```

## File Structure

### New Files

```
backend/app/
├── services/
│   └── events/
│       ├── __init__.py      # EventService class
│       ├── types.py         # EventType enum
│       └── handlers/
│           ├── __init__.py  # Handler registry
│           ├── base.py      # EventHandler protocol
│           └── slack.py     # SlackHandler
├── workers/
│   └── event_worker.py      # Processes queued events
```

### Modified Files

- `backend/app/core/config.py` - Add `SLACK_WEBHOOK_URL`
- `backend/app/api/v1/auth.py` - Emit `user.signup`
- `backend/app/api/v1/importers.py` - Emit `importer.created`
- `backend/app/api/v1/webhooks.py` - Emit billing events
- `backend/app/workers/import_worker.py` - Emit import events

## Implementation Details

### EventService

```python
# backend/app/services/events/__init__.py
from redis import Redis
from rq import Queue
from app.services.events.types import EventType

class EventService:
    def __init__(self, redis_url: str | None = None):
        self._queue = None
        if redis_url:
            self._queue = Queue(connection=Redis.from_url(redis_url))

    def emit(self, event_type: EventType, payload: dict) -> None:
        """Enqueue event for async processing. Non-blocking, fire-and-forget."""
        if not self._queue:
            return  # Events disabled

        try:
            self._queue.enqueue(
                "app.workers.event_worker.process_event",
                event_type.value,
                payload
            )
        except Exception:
            pass  # Never fail the main operation
```

### Event Types

```python
# backend/app/services/events/types.py
from enum import Enum

class EventType(str, Enum):
    USER_SIGNUP = "user.signup"
    USER_FIRST_IMPORT = "user.first_import"
    SUBSCRIPTION_STARTED = "subscription.started"
    SUBSCRIPTION_CANCELLED = "subscription.cancelled"
    SUBSCRIPTION_PAYMENT_FAILED = "subscription.payment_failed"
    IMPORTER_CREATED = "importer.created"
    IMPORT_COMPLETED = "import.completed"
    IMPORT_FAILED = "import.failed"
```

### Handler Protocol

```python
# backend/app/services/events/handlers/base.py
from typing import Protocol

class EventHandler(Protocol):
    def handle(self, event_type: str, payload: dict) -> None:
        """Process an event. May raise exceptions (worker will log)."""
        ...
```

### Slack Handler

```python
# backend/app/services/events/handlers/slack.py
import httpx
from app.services.events.handlers.base import EventHandler

MESSAGE_TEMPLATES = {
    "user.signup": "New signup: {email}",
    "user.first_import": "First import: {email} via {importer_name}",
    "subscription.started": "New subscriber: {email} ({plan})",
    "subscription.cancelled": "Churned: {email} ({plan})",
    "subscription.payment_failed": "Payment failed: {email}",
    "importer.created": "New importer: {importer_name} by {email}",
    "import.completed": "Import: {row_count:,} rows by {email}",
    "import.failed": "Import failed: {email} - {error}",
}

class SlackHandler(EventHandler):
    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url

    def handle(self, event_type: str, payload: dict) -> None:
        template = MESSAGE_TEMPLATES.get(event_type)
        if not template:
            return

        message = template.format(**payload)

        with httpx.Client(timeout=10) as client:
            client.post(self.webhook_url, json={"text": message})
```

### Event Worker

```python
# backend/app/workers/event_worker.py
import logging
from app.core.config import settings
from app.services.events.handlers.slack import SlackHandler

logger = logging.getLogger(__name__)

def _get_handlers():
    """Build list of enabled handlers based on config."""
    handlers = []
    if settings.SLACK_WEBHOOK_URL:
        handlers.append(SlackHandler(settings.SLACK_WEBHOOK_URL))
    return handlers

def process_event(event_type: str, payload: dict) -> None:
    """Worker function: send event to all enabled handlers."""
    handlers = _get_handlers()

    for handler in handlers:
        try:
            handler.handle(event_type, payload)
        except Exception as e:
            logger.error(f"Event handler {handler.__class__.__name__} failed: {e}")
```

### Configuration

```python
# In backend/app/core/config.py
class Settings(BaseSettings):
    # ... existing ...

    # Internal events (optional, disabled by default)
    SLACK_WEBHOOK_URL: str | None = None
```

## Integration Points

### User Signup

```python
# backend/app/api/v1/auth.py
from app.services.events import events
from app.services.events.types import EventType

@router.post("/signup")
async def signup(...):
    user = await create_user(...)

    events.emit(EventType.USER_SIGNUP, {"email": user.email})

    return user
```

### Importer Created

```python
# backend/app/api/v1/importers.py
@router.post("/")
async def create_importer(...):
    importer = await crud.importer.create(...)

    events.emit(EventType.IMPORTER_CREATED, {
        "email": current_user.email,
        "importer_name": importer.name
    })

    return importer
```

### Import Completed/Failed

```python
# backend/app/workers/import_worker.py
def process_import(import_job_id: str):
    try:
        # ... process import ...

        # Check if first import
        import_count = db.query(ImportJob).filter_by(user_id=job.user_id).count()
        if import_count == 1:
            events.emit(EventType.USER_FIRST_IMPORT, {
                "email": job.user.email,
                "importer_name": job.importer.name
            })

        events.emit(EventType.IMPORT_COMPLETED, {
            "email": job.user.email,
            "importer_name": job.importer.name,
            "row_count": job.processed_rows
        })

    except Exception as e:
        events.emit(EventType.IMPORT_FAILED, {
            "email": job.user.email,
            "importer_name": job.importer.name,
            "error": str(e)[:100]
        })
        raise
```

### Billing Events

```python
# backend/app/api/v1/webhooks.py
@router.post("/stripe")
async def stripe_webhook(...):
    if event.type == "customer.subscription.created":
        events.emit(EventType.SUBSCRIPTION_STARTED, {
            "email": user.email,
            "plan": subscription.plan.nickname or "Pro"
        })

    elif event.type == "customer.subscription.deleted":
        events.emit(EventType.SUBSCRIPTION_CANCELLED, {
            "email": user.email,
            "plan": subscription.plan.nickname or "Pro"
        })

    elif event.type == "invoice.payment_failed":
        events.emit(EventType.SUBSCRIPTION_PAYMENT_FAILED, {
            "email": user.email
        })
```

## Setup Instructions

1. Create Slack incoming webhook:
   - Go to Slack App settings → Incoming Webhooks
   - Create webhook for target channel (e.g., #importcsv-events)
   - Copy webhook URL

2. Configure environment:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T.../B.../xxx
   ```

3. Events will flow automatically once configured

## Future Extensions

**Adding Segment:**

```python
# backend/app/services/events/handlers/segment.py
class SegmentHandler(EventHandler):
    def __init__(self, write_key: str):
        self.analytics = Analytics(write_key)

    def handle(self, event_type: str, payload: dict) -> None:
        self.analytics.track(
            user_id=payload.get("email"),
            event=event_type,
            properties=payload
        )

# In event_worker.py
if settings.SEGMENT_WRITE_KEY:
    handlers.append(SegmentHandler(settings.SEGMENT_WRITE_KEY))
```

**Adding new events:**

1. Add to `EventType` enum
2. Add message template to `MESSAGE_TEMPLATES`
3. Call `events.emit()` at trigger point
