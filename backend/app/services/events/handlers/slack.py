"""Slack handler for internal event notifications."""
import logging
import re
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# Valid Slack webhook URL pattern
SLACK_WEBHOOK_PATTERN = re.compile(r"^https://hooks\.slack\.com/services/T[A-Z0-9]+/B[A-Z0-9]+/[a-zA-Z0-9]+$")

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

# Required fields for each event type
REQUIRED_FIELDS: dict[str, list[str]] = {
    "user.signup": ["email"],
    "user.first_import": ["email", "importer_name"],
    "subscription.started": ["email", "plan"],
    "subscription.cancelled": ["email", "plan"],
    "subscription.payment_failed": ["email"],
    "importer.created": ["email", "importer_name"],
    "import.completed": ["email", "row_count"],
    "import.failed": ["email", "error"],
}


class SlackHandler:
    """Send events to Slack via incoming webhook."""

    def __init__(self, webhook_url: str):
        """Initialize with validated Slack webhook URL.

        Args:
            webhook_url: Must be a valid Slack webhook URL.

        Raises:
            ValueError: If webhook_url is not a valid Slack webhook.
        """
        if not SLACK_WEBHOOK_PATTERN.match(webhook_url):
            raise ValueError(
                "Invalid Slack webhook URL. Expected format: "
                "https://hooks.slack.com/services/T.../B.../..."
            )
        self.webhook_url = webhook_url

    def handle(self, event_type: str, payload: dict[str, Any]) -> None:
        """Format and send event to Slack. Never raises exceptions."""
        template = MESSAGE_TEMPLATES.get(event_type)
        if not template:
            return

        # Validate required fields
        required = REQUIRED_FIELDS.get(event_type, [])
        missing = [f for f in required if f not in payload]
        if missing:
            logger.warning(
                f"SlackHandler: missing fields {missing} for {event_type}, skipping"
            )
            return

        try:
            message = template.format(**payload)
            with httpx.Client(timeout=10) as client:
                response = client.post(self.webhook_url, json={"text": message})
                response.raise_for_status()
        except Exception as e:  # noqa: BLE001 - intentionally broad to never block
            logger.error(f"SlackHandler failed for {event_type}: {e}")
