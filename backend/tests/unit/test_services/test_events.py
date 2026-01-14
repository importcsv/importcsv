"""Tests for internal events system."""
import importlib
import os
from unittest.mock import MagicMock, patch

import pytest

# Valid Slack webhook URL for testing
VALID_SLACK_URL = "https://hooks.slack.com/services/T12345678/B12345678/abcdefghijklmnop"


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


class TestSlackHandler:
    """Tests for SlackHandler."""

    def test_init_rejects_invalid_url(self):
        """SlackHandler should reject non-Slack webhook URLs."""
        from app.services.events.handlers.slack import SlackHandler

        with pytest.raises(ValueError, match="Invalid Slack webhook URL"):
            SlackHandler("https://example.com/webhook")

    def test_init_rejects_malformed_slack_url(self):
        """SlackHandler should reject malformed Slack URLs."""
        from app.services.events.handlers.slack import SlackHandler

        with pytest.raises(ValueError, match="Invalid Slack webhook URL"):
            SlackHandler("https://hooks.slack.com/test")

    def test_init_accepts_valid_url(self):
        """SlackHandler should accept valid Slack webhook URLs."""
        from app.services.events.handlers.slack import SlackHandler

        handler = SlackHandler(VALID_SLACK_URL)
        assert handler.webhook_url == VALID_SLACK_URL

    def test_handle_formats_message_correctly(self):
        """SlackHandler should format message using template."""
        from app.services.events.handlers.slack import SlackHandler
        from app.services.events.types import EventType

        with patch("httpx.Client") as mock_client:
            mock_instance = MagicMock()
            mock_response = MagicMock()
            mock_instance.post.return_value = mock_response
            mock_client.return_value.__enter__.return_value = mock_instance

            handler = SlackHandler(VALID_SLACK_URL)
            handler.handle(EventType.USER_SIGNUP.value, {"email": "alice@example.com"})

            mock_instance.post.assert_called_once()
            call_args = mock_instance.post.call_args
            assert call_args[0][0] == VALID_SLACK_URL
            assert call_args[1]["json"]["text"] == "New signup: alice@example.com"
            mock_response.raise_for_status.assert_called_once()

    def test_handle_import_completed_formats_row_count(self):
        """SlackHandler should format row count with comma separator."""
        from app.services.events.handlers.slack import SlackHandler
        from app.services.events.types import EventType

        with patch("httpx.Client") as mock_client:
            mock_instance = MagicMock()
            mock_response = MagicMock()
            mock_instance.post.return_value = mock_response
            mock_client.return_value.__enter__.return_value = mock_instance

            handler = SlackHandler(VALID_SLACK_URL)
            handler.handle(
                EventType.IMPORT_COMPLETED.value,
                {"email": "alice@example.com", "importer_name": "Users", "row_count": 1250},
            )

            call_args = mock_instance.post.call_args
            assert "1,250 rows" in call_args[1]["json"]["text"]

    def test_handle_unknown_event_does_nothing(self):
        """SlackHandler should silently skip unknown event types."""
        from app.services.events.handlers.slack import SlackHandler

        with patch("httpx.Client") as mock_client:
            handler = SlackHandler(VALID_SLACK_URL)
            handler.handle("unknown.event", {"data": "test"})

            mock_client.return_value.__enter__.return_value.post.assert_not_called()

    def test_handle_missing_payload_fields_skips(self):
        """SlackHandler should skip events with missing required fields."""
        from app.services.events.handlers.slack import SlackHandler
        from app.services.events.types import EventType

        with patch("httpx.Client") as mock_client:
            handler = SlackHandler(VALID_SLACK_URL)
            # Missing 'email' field
            handler.handle(EventType.USER_SIGNUP.value, {})

            mock_client.return_value.__enter__.return_value.post.assert_not_called()

    def test_handle_logs_error_on_failure(self):
        """SlackHandler should log errors but not raise."""
        from app.services.events.handlers.slack import SlackHandler
        from app.services.events.types import EventType

        with patch("httpx.Client") as mock_client:
            mock_instance = MagicMock()
            mock_instance.post.side_effect = Exception("Connection error")
            mock_client.return_value.__enter__.return_value = mock_instance

            handler = SlackHandler(VALID_SLACK_URL)
            # Should not raise
            handler.handle(EventType.USER_SIGNUP.value, {"email": "alice@example.com"})


class TestEventWorker:
    """Tests for event worker."""

    def test_process_event_calls_slack_handler(self):
        """Worker should call SlackHandler when SLACK_WEBHOOK_URL is set."""
        with patch.dict("os.environ", {"SLACK_WEBHOOK_URL": VALID_SLACK_URL}):
            import app.workers.event_worker as worker_module

            importlib.reload(worker_module)

            with patch.object(worker_module, "SlackHandler") as mock_handler_class:
                mock_handler = MagicMock()
                mock_handler_class.return_value = mock_handler

                worker_module.process_event("user.signup", {"email": "alice@example.com"})

                mock_handler.handle.assert_called_once_with(
                    "user.signup", {"email": "alice@example.com"}
                )

    def test_process_event_no_handlers_when_no_config(self):
        """Worker should do nothing when no handlers configured."""
        with patch.dict("os.environ", {}, clear=True):
            os.environ.pop("SLACK_WEBHOOK_URL", None)

            import app.workers.event_worker as worker_module

            importlib.reload(worker_module)

            # Should not raise
            worker_module.process_event("user.signup", {"email": "alice@example.com"})

    def test_process_event_continues_on_handler_error(self):
        """Worker should continue processing even if a handler fails."""
        with patch.dict("os.environ", {"SLACK_WEBHOOK_URL": VALID_SLACK_URL}):
            import app.workers.event_worker as worker_module

            importlib.reload(worker_module)

            with patch.object(worker_module, "SlackHandler") as mock_handler_class:
                mock_handler = MagicMock()
                mock_handler.handle.side_effect = Exception("Handler error")
                mock_handler_class.return_value = mock_handler

                # Should not raise
                worker_module.process_event("user.signup", {"email": "alice@example.com"})

    def test_process_event_skips_invalid_webhook_url(self):
        """Worker should skip handler if webhook URL is invalid."""
        with patch.dict("os.environ", {"SLACK_WEBHOOK_URL": "invalid-url"}):
            import app.workers.event_worker as worker_module

            importlib.reload(worker_module)

            # Should not raise - invalid URL means no handlers
            worker_module.process_event("user.signup", {"email": "alice@example.com"})


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


class TestEventConfig:
    """Tests for event configuration."""

    def test_slack_webhook_url_exists_in_settings(self):
        """SLACK_WEBHOOK_URL should be a valid setting in BaseAppSettings."""
        from app.core.config import BaseAppSettings

        # Check that SLACK_WEBHOOK_URL is defined in the model fields
        assert "SLACK_WEBHOOK_URL" in BaseAppSettings.model_fields

    def test_slack_webhook_url_is_optional(self):
        """SLACK_WEBHOOK_URL should be optional (defaults to None)."""
        from app.core.config import BaseAppSettings

        field = BaseAppSettings.model_fields["SLACK_WEBHOOK_URL"]
        # Check that the field allows None (is Optional)
        assert field.is_required() is False


class TestUserSignupEvent:
    """Tests for user.signup event emission."""

    def test_auth_module_imports_events(self):
        """Auth module should import events for emitting signup events."""
        import app.api.v1.auth as auth_module

        assert hasattr(auth_module, "events"), "auth.py should import events"
        assert hasattr(auth_module, "EventType"), "auth.py should import EventType"

    def test_register_calls_events_emit(self):
        """Registration should call events.emit with USER_SIGNUP."""
        # Verify the register function contains the event emission call
        import inspect

        from app.api.v1.auth import register

        source = inspect.getsource(register)
        assert "events.emit" in source, "register() should call events.emit"
        assert "EventType.USER_SIGNUP" in source, "register() should emit USER_SIGNUP"

    def test_sync_oauth_user_calls_events_emit_for_new_users(self):
        """OAuth sync should call events.emit for new users."""
        import inspect

        from app.api.v1.auth import sync_oauth_user

        source = inspect.getsource(sync_oauth_user)
        assert "events.emit" in source, "sync_oauth_user() should call events.emit"
        assert (
            "EventType.USER_SIGNUP" in source
        ), "sync_oauth_user() should emit USER_SIGNUP"


class TestImporterCreatedEvent:
    """Tests for importer.created event emission."""

    def test_importers_module_imports_events(self):
        """Importers module should import events for emitting events."""
        import app.api.v1.importers as importers_module

        assert hasattr(importers_module, "events"), "importers.py should import events"
        assert hasattr(
            importers_module, "EventType"
        ), "importers.py should import EventType"

    def test_create_importer_calls_events_emit(self):
        """Creating importer should call events.emit with IMPORTER_CREATED."""
        import inspect

        from app.api.v1.importers import create_importer

        source = inspect.getsource(create_importer)
        assert "events.emit" in source, "create_importer() should call events.emit"
        assert (
            "EventType.IMPORTER_CREATED" in source
        ), "create_importer() should emit IMPORTER_CREATED"


class TestImportEvents:
    """Tests for import.completed/failed event emission."""

    def test_import_service_imports_events(self):
        """Import service should import events for emitting events."""
        import app.services.import_service as import_service_module

        assert hasattr(
            import_service_module, "events"
        ), "import_service.py should import events"
        assert hasattr(
            import_service_module, "EventType"
        ), "import_service.py should import EventType"

    def test_process_import_data_emits_completed_event(self):
        """Processing import should emit IMPORT_COMPLETED event."""
        import inspect

        from app.services.import_service import ImportService

        source = inspect.getsource(ImportService.process_import_data)
        assert "events.emit" in source, "process_import_data() should call events.emit"
        assert (
            "EventType.IMPORT_COMPLETED" in source
        ), "process_import_data() should emit IMPORT_COMPLETED"

    def test_process_import_data_emits_failed_event(self):
        """Processing import should emit IMPORT_FAILED event on error."""
        import inspect

        from app.services.import_service import ImportService

        source = inspect.getsource(ImportService.process_import_data)
        assert (
            "EventType.IMPORT_FAILED" in source
        ), "process_import_data() should emit IMPORT_FAILED"

    def test_process_import_data_emits_first_import_event(self):
        """Processing import should emit USER_FIRST_IMPORT for first import."""
        import inspect

        from app.services.import_service import ImportService

        source = inspect.getsource(ImportService.process_import_data)
        assert (
            "EventType.USER_FIRST_IMPORT" in source
        ), "process_import_data() should emit USER_FIRST_IMPORT"


class TestBillingEvents:
    """Tests for billing-related events."""

    def test_webhooks_module_imports_events(self):
        """Webhooks module should import events for emitting events."""
        import app.api.v1.webhooks as webhooks_module

        assert hasattr(webhooks_module, "events"), "webhooks.py should import events"
        assert hasattr(
            webhooks_module, "EventType"
        ), "webhooks.py should import EventType"

    def test_checkout_completed_emits_subscription_started(self):
        """Checkout completed should emit SUBSCRIPTION_STARTED event."""
        import inspect

        from app.api.v1.webhooks import handle_checkout_completed

        source = inspect.getsource(handle_checkout_completed)
        assert (
            "events.emit" in source
        ), "handle_checkout_completed() should call events.emit"
        assert (
            "EventType.SUBSCRIPTION_STARTED" in source
        ), "handle_checkout_completed() should emit SUBSCRIPTION_STARTED"

    def test_subscription_deleted_emits_subscription_cancelled(self):
        """Subscription deleted should emit SUBSCRIPTION_CANCELLED event."""
        import inspect

        from app.api.v1.webhooks import handle_subscription_deleted

        source = inspect.getsource(handle_subscription_deleted)
        assert (
            "events.emit" in source
        ), "handle_subscription_deleted() should call events.emit"
        assert (
            "EventType.SUBSCRIPTION_CANCELLED" in source
        ), "handle_subscription_deleted() should emit SUBSCRIPTION_CANCELLED"

    def test_payment_failed_emits_payment_failed(self):
        """Payment failed should emit SUBSCRIPTION_PAYMENT_FAILED event."""
        import inspect

        from app.api.v1.webhooks import handle_payment_failed

        source = inspect.getsource(handle_payment_failed)
        assert (
            "events.emit" in source
        ), "handle_payment_failed() should call events.emit"
        assert (
            "EventType.SUBSCRIPTION_PAYMENT_FAILED" in source
        ), "handle_payment_failed() should emit SUBSCRIPTION_PAYMENT_FAILED"
