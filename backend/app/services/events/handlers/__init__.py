"""Event handlers for internal notifications."""
from typing import Protocol


class EventHandler(Protocol):
    """Protocol for event handlers."""

    def handle(self, event_type: str, payload: dict) -> None:
        """Process an event. Should not raise exceptions."""
        ...
