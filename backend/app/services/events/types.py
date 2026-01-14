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
