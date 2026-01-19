"""Svix client for webhook delivery in cloud mode.

Svix provides reliable webhook delivery with:
- Automatic retries with exponential backoff
- Payload signing for verification
- Delivery logs and debugging
- Rate limiting

This module initializes the client based on settings and provides
helper functions for webhook operations.
"""

import logging
from typing import TYPE_CHECKING

from app.core.config import settings

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

    from app.models.user import User

logger = logging.getLogger(__name__)


class _SvixClientHolder:
    """Holder class to manage Svix client state without module-level globals."""

    def __init__(self) -> None:
        self.client: object | None = None
        self.initialized: bool = False

    def initialize(self) -> None:
        """Initialize Svix client if settings allow."""
        if self.initialized:
            return

        self.initialized = True

        if not settings.IMPORTCSV_CLOUD:
            logger.debug("Svix disabled - not in cloud mode")
            return

        if not settings.SVIX_API_KEY:
            logger.warning("Svix disabled - SVIX_API_KEY not set")
            return

        try:
            from svix import Svix  # noqa: PLC0415

            self.client = Svix(settings.SVIX_API_KEY)
            logger.info("Svix client initialized successfully")
        except ImportError:
            logger.warning("Svix package not installed - webhook signing disabled")
        except (ValueError, TypeError, RuntimeError) as e:
            logger.error(f"Failed to initialize Svix client: {e}")

    def reset(self) -> None:
        """Reset client state. Used for testing."""
        self.client = None
        self.initialized = False


# Singleton holder instance
_holder = _SvixClientHolder()


def get_svix_client() -> object | None:
    """Get the Svix client instance.

    Returns:
        Svix client if available and configured, None otherwise.
    """
    _holder.initialize()
    return _holder.client


def is_svix_available() -> bool:
    """Check if Svix is available for webhook delivery.

    Returns:
        True if Svix client is configured and ready.
    """
    return get_svix_client() is not None


def reset_client() -> None:
    """Reset client state. Used for testing."""
    _holder.reset()


def get_or_create_app_for_user(db: "Session", user: "User") -> str | None:
    """Get or create a Svix application for a user.

    Each user (account) gets one Svix application. All their webhook
    destinations become endpoints within this application.

    Args:
        db: Database session
        user: User to get/create app for

    Returns:
        Svix app ID, or None if Svix not available
    """
    # Return existing if present
    if user.svix_app_id:
        return user.svix_app_id

    svix = get_svix_client()
    if svix is None:
        return None

    try:
        from svix import ApplicationIn  # noqa: PLC0415

        # Create new application
        app = svix.application.create(
            ApplicationIn(
                name=f"ImportCSV User {user.id}",
                uid=str(user.id),  # Use user ID as unique identifier
            )
        )

        # Save to user
        user.svix_app_id = app.id
        db.commit()

        logger.info(f"Created Svix app {app.id} for user {user.id}")
        return app.id

    except Exception as e:  # noqa: BLE001
        logger.error(f"Failed to create Svix app for user {user.id}: {e}")
        return None


def create_endpoint(
    app_id: str,
    url: str,
    description: str = "",
) -> str | None:
    """Create a Svix endpoint for webhook delivery.

    Args:
        app_id: Svix application ID
        url: Webhook URL
        description: Optional description

    Returns:
        Endpoint ID, or None if Svix not available
    """
    svix = get_svix_client()
    if svix is None:
        return None

    try:
        from svix import EndpointIn  # noqa: PLC0415

        endpoint = svix.endpoint.create(
            app_id,
            EndpointIn(
                url=url,
                description=description,
            ),
        )

        logger.info(f"Created Svix endpoint {endpoint.id} for app {app_id}")
        return endpoint.id

    except Exception as e:  # noqa: BLE001
        logger.error(f"Failed to create Svix endpoint: {e}")
        return None


def get_endpoint_secret(app_id: str, endpoint_id: str) -> str | None:
    """Get the signing secret for an endpoint.

    Args:
        app_id: Svix application ID
        endpoint_id: Svix endpoint ID

    Returns:
        Signing secret, or None if not available
    """
    svix = get_svix_client()
    if svix is None:
        return None

    try:
        secret = svix.endpoint.get_secret(app_id, endpoint_id)
        return secret.key
    except Exception as e:  # noqa: BLE001
        logger.error(f"Failed to get endpoint secret: {e}")
        return None


def delete_endpoint(app_id: str, endpoint_id: str) -> bool:
    """Delete a Svix endpoint.

    Args:
        app_id: Svix application ID
        endpoint_id: Svix endpoint ID

    Returns:
        True if deleted, False otherwise
    """
    svix = get_svix_client()
    if svix is None:
        return True  # No-op if Svix not available

    try:
        svix.endpoint.delete(app_id, endpoint_id)
        logger.info(f"Deleted Svix endpoint {endpoint_id}")
        return True
    except Exception as e:  # noqa: BLE001
        logger.error(f"Failed to delete Svix endpoint: {e}")
        return False


def send_message(
    app_id: str,
    event_type: str,
    payload: dict,
) -> bool:
    """Send a message (webhook) via Svix.

    Args:
        app_id: Svix application ID
        event_type: Event type (e.g., "import.completed")
        payload: Message payload

    Returns:
        True if sent, False otherwise
    """
    svix = get_svix_client()
    if svix is None:
        return False

    try:
        from svix import MessageIn  # noqa: PLC0415

        svix.message.create(
            app_id,
            MessageIn(
                event_type=event_type,
                payload=payload,
            ),
        )

        logger.info(f"Sent Svix message for event {event_type}")
        return True

    except Exception as e:  # noqa: BLE001
        logger.error(f"Failed to send Svix message: {e}")
        return False
