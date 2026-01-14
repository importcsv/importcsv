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
