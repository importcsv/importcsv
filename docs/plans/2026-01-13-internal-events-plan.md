# Internal Events System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add internal event notifications (Slack) for ImportCSV cloud team visibility.

**Architecture:** Worker-based event processing. `EventService.emit()` enqueues events to Redis, event worker processes them and sends to configured handlers (Slack).

**Tech Stack:** FastAPI, Redis Queue (RQ), httpx, Pydantic

---

## Task 1: Event Types Definition

**Files:**
- Create: `backend/app/services/events/types.py`
- Test: `backend/tests/unit/test_services/test_events.py`

**Step 1: Write the failing test**

```python
# backend/tests/unit/test_services/test_events.py
"""Tests for internal events system."""
import pytest


class TestEventTypes:
    """Tests for EventType enum."""

    def test_event_type_values(self):
        """EventType enum should have expected event types."""
        from app.services.events.types import EventType

        assert EventType.USER_SIGNUP.value == "user.signup"
        assert EventType.USER_FIRST_IMPORT.value == "user.first_import"
        assert EventType.SUBSCRIPTION_STARTED.value == "subscription.started"
        assert EventType.SUBSCRIPTION_CANCELLED.value == "subscription.cancelled"
        assert EventType.SUBSCRIPTION_PAYMENT_FAILED.value == "subscription.payment_failed"
        assert EventType.IMPORTER_CREATED.value == "importer.created"
        assert EventType.IMPORT_COMPLETED.value == "import.completed"
        assert EventType.IMPORT_FAILED.value == "import.failed"

    def test_event_type_is_string_enum(self):
        """EventType should be usable as a string."""
        from app.services.events.types import EventType

        assert str(EventType.USER_SIGNUP) == "EventType.USER_SIGNUP"
        assert EventType.USER_SIGNUP.value == "user.signup"
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'app.services.events'"

**Step 3: Create directory structure and types module**

```python
# backend/app/services/events/__init__.py
"""Internal events service for team notifications."""
```

```python
# backend/app/services/events/types.py
"""Event type definitions for internal notifications."""
from enum import Enum


class EventType(str, Enum):
    """Internal event types for team notifications.

    Naming convention: resource.action (e.g., user.signup, import.completed)
    """
    USER_SIGNUP = "user.signup"
    USER_FIRST_IMPORT = "user.first_import"
    SUBSCRIPTION_STARTED = "subscription.started"
    SUBSCRIPTION_CANCELLED = "subscription.cancelled"
    SUBSCRIPTION_PAYMENT_FAILED = "subscription.payment_failed"
    IMPORTER_CREATED = "importer.created"
    IMPORT_COMPLETED = "import.completed"
    IMPORT_FAILED = "import.failed"
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestEventTypes -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/events/ backend/tests/unit/test_services/test_events.py
git commit -m "$(cat <<'EOF'
feat(events): add EventType enum for internal notifications

Define event types for user lifecycle, billing, and product usage events.
EOF
)"
```

---

## Task 2: Slack Handler

**Files:**
- Create: `backend/app/services/events/handlers/__init__.py`
- Create: `backend/app/services/events/handlers/slack.py`
- Modify: `backend/tests/unit/test_services/test_events.py`

**Step 1: Write the failing test**

```python
# Add to backend/tests/unit/test_services/test_events.py
from unittest.mock import patch, MagicMock


class TestSlackHandler:
    """Tests for SlackHandler."""

    def test_handle_formats_message_correctly(self):
        """SlackHandler should format message using template."""
        from app.services.events.handlers.slack import SlackHandler
        from app.services.events.types import EventType

        with patch("httpx.Client") as mock_client:
            mock_instance = MagicMock()
            mock_client.return_value.__enter__.return_value = mock_instance

            handler = SlackHandler("https://hooks.slack.com/test")
            handler.handle(EventType.USER_SIGNUP.value, {"email": "alice@example.com"})

            mock_instance.post.assert_called_once()
            call_args = mock_instance.post.call_args
            assert call_args[0][0] == "https://hooks.slack.com/test"
            assert call_args[1]["json"]["text"] == "New signup: alice@example.com"

    def test_handle_import_completed_formats_row_count(self):
        """SlackHandler should format row count with comma separator."""
        from app.services.events.handlers.slack import SlackHandler
        from app.services.events.types import EventType

        with patch("httpx.Client") as mock_client:
            mock_instance = MagicMock()
            mock_client.return_value.__enter__.return_value = mock_instance

            handler = SlackHandler("https://hooks.slack.com/test")
            handler.handle(
                EventType.IMPORT_COMPLETED.value,
                {"email": "alice@example.com", "importer_name": "Users", "row_count": 1250}
            )

            call_args = mock_instance.post.call_args
            assert "1,250 rows" in call_args[1]["json"]["text"]

    def test_handle_unknown_event_does_nothing(self):
        """SlackHandler should silently skip unknown event types."""
        from app.services.events.handlers.slack import SlackHandler

        with patch("httpx.Client") as mock_client:
            handler = SlackHandler("https://hooks.slack.com/test")
            handler.handle("unknown.event", {"data": "test"})

            mock_client.return_value.__enter__.return_value.post.assert_not_called()

    def test_handle_logs_error_on_failure(self):
        """SlackHandler should log errors but not raise."""
        from app.services.events.handlers.slack import SlackHandler
        from app.services.events.types import EventType

        with patch("httpx.Client") as mock_client:
            mock_instance = MagicMock()
            mock_instance.post.side_effect = Exception("Connection error")
            mock_client.return_value.__enter__.return_value = mock_instance

            handler = SlackHandler("https://hooks.slack.com/test")
            # Should not raise
            handler.handle(EventType.USER_SIGNUP.value, {"email": "alice@example.com"})
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestSlackHandler -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'app.services.events.handlers'"

**Step 3: Write the implementation**

```python
# backend/app/services/events/handlers/__init__.py
"""Event handlers for internal notifications."""
from typing import Protocol


class EventHandler(Protocol):
    """Protocol for event handlers."""

    def handle(self, event_type: str, payload: dict) -> None:
        """Process an event. Should not raise exceptions."""
        ...
```

```python
# backend/app/services/events/handlers/slack.py
"""Slack handler for internal event notifications."""
import logging

import httpx

logger = logging.getLogger(__name__)

MESSAGE_TEMPLATES: dict[str, str] = {
    "user.signup": "New signup: {email}",
    "user.first_import": "First import: {email} via {importer_name}",
    "subscription.started": "New subscriber: {email} ({plan})",
    "subscription.cancelled": "Churned: {email} ({plan})",
    "subscription.payment_failed": "Payment failed: {email}",
    "importer.created": "New importer: {importer_name} by {email}",
    "import.completed": "Import: {row_count:,} rows by {email}",
    "import.failed": "Import failed: {email} - {error}",
}


class SlackHandler:
    """Send events to Slack via incoming webhook."""

    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url

    def handle(self, event_type: str, payload: dict) -> None:
        """Format and send event to Slack. Never raises exceptions."""
        template = MESSAGE_TEMPLATES.get(event_type)
        if not template:
            return

        try:
            message = template.format(**payload)
            with httpx.Client(timeout=10) as client:
                client.post(self.webhook_url, json={"text": message})
        except Exception as e:
            logger.error(f"SlackHandler failed for {event_type}: {e}")
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestSlackHandler -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/events/handlers/
git commit -m "$(cat <<'EOF'
feat(events): add SlackHandler for webhook notifications

Formats events using templates and posts to Slack webhook.
Silently handles errors to never block main operations.
EOF
)"
```

---

## Task 3: Event Worker

**Files:**
- Create: `backend/app/workers/event_worker.py`
- Modify: `backend/tests/unit/test_services/test_events.py`

**Step 1: Write the failing test**

```python
# Add to backend/tests/unit/test_services/test_events.py

class TestEventWorker:
    """Tests for event worker."""

    def test_process_event_calls_slack_handler(self):
        """Worker should call SlackHandler when SLACK_WEBHOOK_URL is set."""
        with patch.dict("os.environ", {"SLACK_WEBHOOK_URL": "https://hooks.slack.com/test"}):
            # Need to reload to pick up env var
            import importlib
            import app.workers.event_worker as worker_module
            importlib.reload(worker_module)

            with patch.object(worker_module, "SlackHandler") as mock_handler_class:
                mock_handler = MagicMock()
                mock_handler_class.return_value = mock_handler

                worker_module.process_event("user.signup", {"email": "alice@example.com"})

                mock_handler.handle.assert_called_once_with(
                    "user.signup",
                    {"email": "alice@example.com"}
                )

    def test_process_event_no_handlers_when_no_config(self):
        """Worker should do nothing when no handlers configured."""
        with patch.dict("os.environ", {}, clear=True):
            # Remove SLACK_WEBHOOK_URL if present
            import os
            os.environ.pop("SLACK_WEBHOOK_URL", None)

            import importlib
            import app.workers.event_worker as worker_module
            importlib.reload(worker_module)

            # Should not raise
            worker_module.process_event("user.signup", {"email": "alice@example.com"})

    def test_process_event_continues_on_handler_error(self):
        """Worker should continue processing even if a handler fails."""
        with patch.dict("os.environ", {"SLACK_WEBHOOK_URL": "https://hooks.slack.com/test"}):
            import importlib
            import app.workers.event_worker as worker_module
            importlib.reload(worker_module)

            with patch.object(worker_module, "SlackHandler") as mock_handler_class:
                mock_handler = MagicMock()
                mock_handler.handle.side_effect = Exception("Handler error")
                mock_handler_class.return_value = mock_handler

                # Should not raise
                worker_module.process_event("user.signup", {"email": "alice@example.com"})
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestEventWorker -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'app.workers.event_worker'"

**Step 3: Write the implementation**

```python
# backend/app/workers/event_worker.py
"""Event worker for processing internal notifications.

This worker processes events from the Redis queue and sends them
to configured handlers (Slack, etc.).
"""
import logging
import os

from app.services.events.handlers.slack import SlackHandler

logger = logging.getLogger(__name__)


def _get_handlers() -> list:
    """Build list of enabled handlers based on config."""
    handlers = []

    slack_url = os.environ.get("SLACK_WEBHOOK_URL")
    if slack_url:
        handlers.append(SlackHandler(slack_url))

    return handlers


def process_event(event_type: str, payload: dict) -> None:
    """Process an event by sending to all configured handlers.

    This function is called by RQ workers. It never raises exceptions
    to avoid blocking the queue.

    Args:
        event_type: The event type string (e.g., "user.signup")
        payload: Event data dictionary
    """
    handlers = _get_handlers()

    if not handlers:
        logger.debug(f"No event handlers configured, skipping {event_type}")
        return

    for handler in handlers:
        try:
            handler.handle(event_type, payload)
        except Exception as e:
            logger.error(f"Event handler {handler.__class__.__name__} failed: {e}")
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestEventWorker -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/workers/event_worker.py
git commit -m "$(cat <<'EOF'
feat(events): add event worker for background processing

Processes events from Redis queue and sends to configured handlers.
Errors are logged but never block the queue.
EOF
)"
```

---

## Task 4: EventService

**Files:**
- Modify: `backend/app/services/events/__init__.py`
- Modify: `backend/tests/unit/test_services/test_events.py`

**Step 1: Write the failing test**

```python
# Add to backend/tests/unit/test_services/test_events.py

class TestEventService:
    """Tests for EventService."""

    def test_emit_enqueues_event(self):
        """EventService.emit should enqueue event to Redis."""
        with patch("app.services.events.Queue") as mock_queue_class:
            mock_queue = MagicMock()
            mock_queue_class.return_value = mock_queue

            with patch("app.services.events.Redis"):
                from app.services.events import EventService
                from app.services.events.types import EventType

                service = EventService(redis_url="redis://localhost:6379")
                service.emit(EventType.USER_SIGNUP, {"email": "alice@example.com"})

                mock_queue.enqueue.assert_called_once_with(
                    "app.workers.event_worker.process_event",
                    "user.signup",
                    {"email": "alice@example.com"},
                )

    def test_emit_does_nothing_when_disabled(self):
        """EventService.emit should do nothing when no redis_url."""
        from app.services.events import EventService
        from app.services.events.types import EventType

        service = EventService(redis_url=None)
        # Should not raise
        service.emit(EventType.USER_SIGNUP, {"email": "alice@example.com"})

    def test_emit_never_raises(self):
        """EventService.emit should never raise exceptions."""
        with patch("app.services.events.Queue") as mock_queue_class:
            mock_queue = MagicMock()
            mock_queue.enqueue.side_effect = Exception("Redis error")
            mock_queue_class.return_value = mock_queue

            with patch("app.services.events.Redis"):
                from app.services.events import EventService
                from app.services.events.types import EventType

                service = EventService(redis_url="redis://localhost:6379")
                # Should not raise
                service.emit(EventType.USER_SIGNUP, {"email": "alice@example.com"})
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestEventService -v`
Expected: FAIL with "cannot import name 'EventService' from 'app.services.events'"

**Step 3: Write the implementation**

```python
# backend/app/services/events/__init__.py
"""Internal events service for team notifications.

Usage:
    from app.services.events import events
    from app.services.events.types import EventType

    events.emit(EventType.USER_SIGNUP, {"email": user.email})
"""
import logging
import os

from redis import Redis
from rq import Queue

from app.services.events.types import EventType

logger = logging.getLogger(__name__)

__all__ = ["EventService", "EventType", "events"]


class EventService:
    """Service for emitting internal events to background workers.

    Events are enqueued to Redis and processed asynchronously.
    This ensures event processing never blocks the main application.
    """

    def __init__(self, redis_url: str | None = None):
        """Initialize event service.

        Args:
            redis_url: Redis connection URL. If None, events are disabled.
        """
        self._queue: Queue | None = None
        if redis_url:
            try:
                self._queue = Queue(
                    name="events",
                    connection=Redis.from_url(redis_url),
                )
            except Exception as e:
                logger.warning(f"Failed to connect to Redis for events: {e}")

    def emit(self, event_type: EventType, payload: dict) -> None:
        """Emit an event for async processing.

        This method is fire-and-forget. It never raises exceptions
        and never blocks the calling code.

        Args:
            event_type: The type of event
            payload: Event data dictionary
        """
        if not self._queue:
            return

        try:
            self._queue.enqueue(
                "app.workers.event_worker.process_event",
                event_type.value,
                payload,
            )
        except Exception as e:
            logger.error(f"Failed to enqueue event {event_type.value}: {e}")


# Global instance - initialized lazily on first use
_events: EventService | None = None


def _get_events() -> EventService:
    """Get or create the global EventService instance."""
    global _events
    if _events is None:
        redis_url = os.environ.get("REDIS_URL")
        _events = EventService(redis_url=redis_url)
    return _events


class _EventsProxy:
    """Proxy that lazily initializes EventService on first use."""

    def emit(self, event_type: EventType, payload: dict) -> None:
        _get_events().emit(event_type, payload)


events = _EventsProxy()
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestEventService -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/events/__init__.py
git commit -m "$(cat <<'EOF'
feat(events): add EventService for enqueueing events

Events are enqueued to Redis for async processing.
Fire-and-forget design ensures events never block the app.
EOF
)"
```

---

## Task 5: Configuration

**Files:**
- Modify: `backend/app/core/config.py`
- Modify: `backend/tests/unit/test_services/test_events.py`

**Step 1: Write the failing test**

```python
# Add to backend/tests/unit/test_services/test_events.py

class TestEventConfig:
    """Tests for event configuration."""

    def test_slack_webhook_url_default_none(self):
        """SLACK_WEBHOOK_URL should default to None."""
        with patch.dict("os.environ", {}, clear=True):
            # Remove if present
            import os
            os.environ.pop("SLACK_WEBHOOK_URL", None)

            import importlib
            import app.core.config as config_module
            importlib.reload(config_module)

            # Access settings
            settings = config_module.get_settings()
            assert settings.SLACK_WEBHOOK_URL is None

    def test_slack_webhook_url_from_env(self):
        """SLACK_WEBHOOK_URL should be read from environment."""
        with patch.dict("os.environ", {"SLACK_WEBHOOK_URL": "https://hooks.slack.com/test"}):
            import importlib
            import app.core.config as config_module
            importlib.reload(config_module)

            settings = config_module.get_settings()
            assert settings.SLACK_WEBHOOK_URL == "https://hooks.slack.com/test"
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestEventConfig -v`
Expected: FAIL with "AttributeError: 'DevelopmentSettings' object has no attribute 'SLACK_WEBHOOK_URL'"

**Step 3: Write the implementation**

Add to `backend/app/core/config.py` in the `BaseAppSettings` class, after the trial settings (around line 187):

```python
    # Internal events (optional, disabled by default)
    SLACK_WEBHOOK_URL: Optional[str] = Field(
        default_factory=lambda: os.getenv("SLACK_WEBHOOK_URL")
    )
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestEventConfig -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/core/config.py
git commit -m "$(cat <<'EOF'
feat(events): add SLACK_WEBHOOK_URL config setting

Optional setting, disabled by default for open source users.
EOF
)"
```

---

## Task 6: Emit user.signup Event

**Files:**
- Modify: `backend/app/api/v1/auth.py`
- Add integration test: `backend/tests/unit/test_services/test_events.py`

**Step 1: Write the failing test**

```python
# Add to backend/tests/unit/test_services/test_events.py

class TestUserSignupEvent:
    """Tests for user.signup event emission."""

    def test_register_emits_signup_event(self):
        """Registration should emit user.signup event."""
        with patch("app.api.v1.auth.events") as mock_events:
            with patch("app.api.v1.auth.email_service"):
                from app.api.v1.auth import register
                from app.schemas.user import UserCreate

                # Create mock db
                mock_db = MagicMock()
                mock_db.query.return_value.filter.return_value.first.return_value = None

                import asyncio
                user_in = UserCreate(
                    email="test@example.com",
                    password="password123",
                    full_name="Test User",
                )

                asyncio.run(register(db=mock_db, user_in=user_in))

                # Verify event was emitted
                from app.services.events.types import EventType
                mock_events.emit.assert_called_once()
                call_args = mock_events.emit.call_args
                assert call_args[0][0] == EventType.USER_SIGNUP
                assert call_args[0][1]["email"] == "test@example.com"

    def test_oauth_sync_emits_signup_event_for_new_user(self):
        """OAuth sync should emit user.signup event for new users only."""
        with patch("app.api.v1.auth.events") as mock_events:
            with patch("app.api.v1.auth.email_service"):
                from app.api.v1.auth import sync_oauth_user

                # Create mock db - user doesn't exist
                mock_db = MagicMock()
                mock_db.query.return_value.filter.return_value.first.return_value = None

                import asyncio
                asyncio.run(sync_oauth_user(
                    db=mock_db,
                    email="new@example.com",
                    name="New User"
                ))

                # Verify event was emitted
                from app.services.events.types import EventType
                mock_events.emit.assert_called_once()
                call_args = mock_events.emit.call_args
                assert call_args[0][0] == EventType.USER_SIGNUP
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestUserSignupEvent -v`
Expected: FAIL (mock_events.emit not called)

**Step 3: Write the implementation**

Modify `backend/app/api/v1/auth.py`:

Add import at top:
```python
from app.services.events import events
from app.services.events.types import EventType
```

In `register` function, after `db.refresh(db_user)` (around line 160), add:
```python
    # Emit signup event for internal notifications
    events.emit(EventType.USER_SIGNUP, {"email": db_user.email})
```

In `sync_oauth_user` function, after the `if is_new_user:` block that sends welcome email (around line 207), add inside that block:
```python
        # Emit signup event for internal notifications
        events.emit(EventType.USER_SIGNUP, {"email": user.email})
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestUserSignupEvent -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/v1/auth.py
git commit -m "$(cat <<'EOF'
feat(events): emit user.signup on registration

Notifies team when new users sign up via email or OAuth.
EOF
)"
```

---

## Task 7: Emit importer.created Event

**Files:**
- Modify: `backend/app/api/v1/importers.py`
- Modify: `backend/tests/unit/test_services/test_events.py`

**Step 1: Write the failing test**

```python
# Add to backend/tests/unit/test_services/test_events.py

class TestImporterCreatedEvent:
    """Tests for importer.created event emission."""

    def test_create_importer_emits_event(self):
        """Creating importer should emit importer.created event."""
        with patch("app.api.v1.importers.events") as mock_events:
            with patch("app.api.v1.importers.importer_service") as mock_service:
                # Setup mock
                mock_importer = MagicMock()
                mock_importer.name = "Test Importer"
                mock_service.create_importer.return_value = mock_importer

                mock_user = MagicMock()
                mock_user.email = "user@example.com"

                from app.api.v1.importers import create_importer
                from app.schemas.importer import ImporterCreate

                import asyncio
                importer_in = ImporterCreate(
                    name="Test Importer",
                    fields=[{"name": "email", "label": "Email", "type": "email", "required": True}]
                )

                asyncio.run(create_importer(
                    importer_in=importer_in,
                    db=MagicMock(),
                    current_user=mock_user
                ))

                # Verify event was emitted
                from app.services.events.types import EventType
                mock_events.emit.assert_called_once()
                call_args = mock_events.emit.call_args
                assert call_args[0][0] == EventType.IMPORTER_CREATED
                assert call_args[0][1]["email"] == "user@example.com"
                assert call_args[0][1]["importer_name"] == "Test Importer"
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestImporterCreatedEvent -v`
Expected: FAIL (mock_events.emit not called)

**Step 3: Write the implementation**

Modify `backend/app/api/v1/importers.py`:

Add import at top:
```python
from app.services.events import events
from app.services.events.types import EventType
```

In `create_importer` function, change the return to:
```python
async def create_importer(
    importer_in: ImporterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create new importer
    """
    importer = importer_service.create_importer(db, str(current_user.id), importer_in)

    # Emit event for internal notifications
    events.emit(EventType.IMPORTER_CREATED, {
        "email": current_user.email,
        "importer_name": importer.name,
    })

    return importer
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestImporterCreatedEvent -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/v1/importers.py
git commit -m "$(cat <<'EOF'
feat(events): emit importer.created on new importer

Notifies team when users create new importers.
EOF
)"
```

---

## Task 8: Emit Import Events

**Files:**
- Modify: `backend/app/services/import_service.py`
- Modify: `backend/tests/unit/test_services/test_events.py`

**Step 1: Write the failing test**

```python
# Add to backend/tests/unit/test_services/test_events.py

class TestImportEvents:
    """Tests for import.completed and import.failed events."""

    @pytest.mark.asyncio
    async def test_import_completed_emits_event(self):
        """Completed import should emit import.completed event."""
        with patch("app.services.import_service.events") as mock_events:
            with patch("app.services.import_service.deliver_to_destination"):
                from app.services.import_service import ImportService

                service = ImportService()

                # Create mocks
                mock_db = MagicMock()
                mock_import_job = MagicMock()
                mock_import_job.id = "test-job-id"
                mock_import_job.user_id = "test-user-id"
                mock_import_job.processed_rows = 100
                mock_import_job.status.value = "completed"
                mock_import_job.user = MagicMock()
                mock_import_job.user.email = "user@example.com"
                mock_import_job.importer = MagicMock()
                mock_import_job.importer.name = "Test Importer"
                mock_import_job.importer.webhook_enabled = False

                mock_db.query.return_value.options.return_value.filter.return_value.first.return_value = mock_import_job

                await service.process_import_data(
                    db=mock_db,
                    import_job_id="test-job-id",
                    valid_data=[{"data": {"email": "test@example.com"}}],
                    invalid_data=[],
                )

                # Verify import.completed event was emitted
                from app.services.events.types import EventType
                calls = mock_events.emit.call_args_list
                completed_calls = [c for c in calls if c[0][0] == EventType.IMPORT_COMPLETED]
                assert len(completed_calls) == 1
                assert completed_calls[0][0][1]["email"] == "user@example.com"
                assert completed_calls[0][0][1]["row_count"] == 100
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestImportEvents -v`
Expected: FAIL (mock_events.emit not called)

**Step 3: Write the implementation**

Modify `backend/app/services/import_service.py`:

Add import at top:
```python
from app.services.events import events
from app.services.events.types import EventType
```

In `process_import_data` method, after `import_job.status = ImportStatus.COMPLETED` and `db.commit()` (around line 258), add:

```python
                # Emit internal event
                # Check if this is user's first import
                import_count = db.query(ImportJob).filter(
                    ImportJob.user_id == import_job.user_id,
                    ImportJob.status == ImportStatus.COMPLETED,
                ).count()

                if import_count == 1:
                    events.emit(EventType.USER_FIRST_IMPORT, {
                        "email": import_job.user.email,
                        "importer_name": importer.name,
                    })

                events.emit(EventType.IMPORT_COMPLETED, {
                    "email": import_job.user.email,
                    "importer_name": importer.name,
                    "row_count": import_job.processed_rows,
                })
```

In the inner exception handler (around line 266), after setting `import_job.status = ImportStatus.FAILED`, add:

```python
                events.emit(EventType.IMPORT_FAILED, {
                    "email": import_job.user.email,
                    "importer_name": importer.name,
                    "error": str(process_exc)[:100],
                })
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestImportEvents -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/import_service.py
git commit -m "$(cat <<'EOF'
feat(events): emit import.completed/failed events

Also emits user.first_import on first successful import.
EOF
)"
```

---

## Task 9: Emit Billing Events

**Files:**
- Modify: `backend/app/api/v1/webhooks.py`
- Modify: `backend/tests/unit/test_services/test_events.py`

**Step 1: Write the failing test**

```python
# Add to backend/tests/unit/test_services/test_events.py

class TestBillingEvents:
    """Tests for billing-related events."""

    def test_subscription_started_emits_event(self):
        """Successful checkout should emit subscription.started event."""
        with patch("app.api.v1.webhooks.events") as mock_events:
            with patch("app.api.v1.webhooks.email_service"):
                from app.api.v1.webhooks import handle_checkout_completed
                from app.services.billing import BillingService

                mock_billing = MagicMock(spec=BillingService)
                mock_user = MagicMock()
                mock_user.email = "user@example.com"
                mock_user.subscription_status = None
                mock_billing.db.query.return_value.filter.return_value.first.return_value = mock_user
                mock_billing.update_subscription_from_webhook.return_value = mock_user

                session = {
                    "customer": "cus_123",
                    "subscription": "sub_123",
                    "metadata": {"tier": "pro"},
                }

                handle_checkout_completed(mock_billing, session)

                # Verify event was emitted
                from app.services.events.types import EventType
                mock_events.emit.assert_called_once()
                call_args = mock_events.emit.call_args
                assert call_args[0][0] == EventType.SUBSCRIPTION_STARTED
                assert call_args[0][1]["email"] == "user@example.com"
                assert call_args[0][1]["plan"] == "pro"

    def test_subscription_cancelled_emits_event(self):
        """Subscription deletion should emit subscription.cancelled event."""
        with patch("app.api.v1.webhooks.events") as mock_events:
            with patch("app.api.v1.webhooks.email_service"):
                from app.api.v1.webhooks import handle_subscription_deleted
                from app.services.billing import BillingService

                mock_billing = MagicMock(spec=BillingService)
                mock_user = MagicMock()
                mock_user.email = "user@example.com"
                mock_user.subscription_tier = "pro"
                mock_billing.update_subscription_from_webhook.return_value = mock_user

                subscription = {
                    "customer": "cus_123",
                    "id": "sub_123",
                }

                handle_subscription_deleted(mock_billing, subscription)

                # Verify event was emitted
                from app.services.events.types import EventType
                mock_events.emit.assert_called_once()
                call_args = mock_events.emit.call_args
                assert call_args[0][0] == EventType.SUBSCRIPTION_CANCELLED
                assert call_args[0][1]["email"] == "user@example.com"

    def test_payment_failed_emits_event(self):
        """Failed payment should emit subscription.payment_failed event."""
        with patch("app.api.v1.webhooks.events") as mock_events:
            with patch("app.api.v1.webhooks.email_service"):
                from app.api.v1.webhooks import handle_payment_failed
                from app.services.billing import BillingService

                mock_billing = MagicMock(spec=BillingService)
                mock_user = MagicMock()
                mock_user.email = "user@example.com"
                mock_user.grace_period_ends_at = None
                mock_billing.start_grace_period.return_value = mock_user

                invoice = {"customer": "cus_123"}

                handle_payment_failed(mock_billing, invoice)

                # Verify event was emitted
                from app.services.events.types import EventType
                mock_events.emit.assert_called_once()
                call_args = mock_events.emit.call_args
                assert call_args[0][0] == EventType.SUBSCRIPTION_PAYMENT_FAILED
                assert call_args[0][1]["email"] == "user@example.com"
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestBillingEvents -v`
Expected: FAIL (mock_events.emit not called)

**Step 3: Write the implementation**

Modify `backend/app/api/v1/webhooks.py`:

Add import at top:
```python
from app.services.events import events
from app.services.events.types import EventType
```

In `handle_checkout_completed`, after `email_service.send_upgrade_confirmation(...)` (around line 141), add:
```python
        # Emit internal event
        events.emit(EventType.SUBSCRIPTION_STARTED, {
            "email": user.email,
            "plan": tier,
        })
```

In `handle_subscription_deleted`, after `email_service.send_subscription_paused(user.email)` (around line 181), add:
```python
        # Emit internal event
        events.emit(EventType.SUBSCRIPTION_CANCELLED, {
            "email": user.email,
            "plan": user.subscription_tier or "unknown",
        })
```

In `handle_payment_failed`, after `email_service.send_grace_period_reminder(...)` (around line 192), add:
```python
    # Emit internal event (even if user not found, for monitoring)
    if user:
        events.emit(EventType.SUBSCRIPTION_PAYMENT_FAILED, {
            "email": user.email,
        })
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py::TestBillingEvents -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/v1/webhooks.py
git commit -m "$(cat <<'EOF'
feat(events): emit billing events from Stripe webhooks

subscription.started, subscription.cancelled, subscription.payment_failed
EOF
)"
```

---

## Task 10: Run Full Test Suite and Verify

**Step 1: Run all event tests**

Run: `cd backend && uv run pytest tests/unit/test_services/test_events.py -v`
Expected: All tests PASS

**Step 2: Run lint checks**

Run: `cd backend && uv run ruff check app/services/events/ app/workers/event_worker.py && uv run ruff format --check app/services/events/ app/workers/event_worker.py`
Expected: No errors

**Step 3: Run full backend test suite**

Run: `cd backend && uv run pytest`
Expected: All tests PASS

**Step 4: Final commit for any lint fixes**

If any lint fixes needed:
```bash
cd backend && uv run ruff format app/services/events/ app/workers/event_worker.py
git add -u
git commit -m "style: format events code"
```

---

## Summary

**Files created:**
- `backend/app/services/events/__init__.py` - EventService
- `backend/app/services/events/types.py` - EventType enum
- `backend/app/services/events/handlers/__init__.py` - EventHandler protocol
- `backend/app/services/events/handlers/slack.py` - SlackHandler
- `backend/app/workers/event_worker.py` - Event worker
- `backend/tests/unit/test_services/test_events.py` - Tests

**Files modified:**
- `backend/app/core/config.py` - SLACK_WEBHOOK_URL setting
- `backend/app/api/v1/auth.py` - user.signup event
- `backend/app/api/v1/importers.py` - importer.created event
- `backend/app/api/v1/webhooks.py` - billing events
- `backend/app/services/import_service.py` - import events

**To enable:**
1. Set `SLACK_WEBHOOK_URL` environment variable
2. Events will flow to configured Slack channel
