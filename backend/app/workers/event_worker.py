"""Event worker for processing internal notifications.

This worker processes events from the Redis queue and sends them
to configured handlers (Slack, etc.).
"""
import logging
import os
from typing import Any

from app.services.events.handlers.slack import SlackHandler

logger = logging.getLogger(__name__)


def _get_handlers() -> list:
    """Build list of enabled handlers based on config."""
    handlers = []

    slack_url = os.environ.get("SLACK_WEBHOOK_URL")
    if slack_url:
        try:
            handlers.append(SlackHandler(slack_url))
        except ValueError as e:
            logger.error(f"Invalid SLACK_WEBHOOK_URL configuration: {e}")

    return handlers


def process_event(event_type: str, payload: dict[str, Any]) -> None:
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
        except Exception as e:  # noqa: BLE001 - intentionally broad to never block
            logger.error(f"Event handler {handler.__class__.__name__} failed: {e}")
