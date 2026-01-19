"""Tests for Svix client service."""

import sys
from unittest.mock import MagicMock, patch

from app.services import svix_client
from app.services.svix_client import (
    create_endpoint,
    delete_endpoint,
    get_endpoint_secret,
    get_or_create_app_for_user,
    reset_client,
    send_message,
)


class TestSvixClientInitialization:
    """Test Svix client initialization based on settings."""

    def test_get_svix_client_returns_none_when_not_cloud_mode(self):
        """When IMPORTCSV_CLOUD=False, svix client should be None."""
        # Reset client state before testing
        reset_client()

        with patch("app.services.svix_client.settings") as mock_settings:
            mock_settings.IMPORTCSV_CLOUD = False
            mock_settings.SVIX_API_KEY = "test_key"

            # Re-initialize after patching settings
            result = svix_client.get_svix_client()

            assert result is None

    def test_get_svix_client_returns_none_when_no_api_key(self):
        """When SVIX_API_KEY is not set, svix client should be None."""
        # Reset client state before testing
        reset_client()

        with patch("app.services.svix_client.settings") as mock_settings:
            mock_settings.IMPORTCSV_CLOUD = True
            mock_settings.SVIX_API_KEY = None

            result = svix_client.get_svix_client()

            assert result is None


class TestSvixHelpers:
    """Test Svix helper functions."""

    def test_is_svix_available_false_when_no_client(self):
        """is_svix_available returns False when client not configured."""
        # Reset client state before testing
        reset_client()

        with patch("app.services.svix_client.settings") as mock_settings:
            mock_settings.IMPORTCSV_CLOUD = False
            mock_settings.SVIX_API_KEY = None

            assert svix_client.is_svix_available() is False


class TestSvixApplicationManagement:
    """Test Svix application management functions."""

    def test_get_or_create_app_for_user_returns_existing(self):
        """Should return existing app_id if user already has one."""
        mock_user = MagicMock()
        mock_user.id = "user_123"
        mock_user.svix_app_id = "app_existing"
        mock_db = MagicMock()

        result = get_or_create_app_for_user(mock_db, mock_user)
        assert result == "app_existing"

    def test_get_or_create_app_for_user_returns_none_when_svix_unavailable(self):
        """Should return None if Svix is not available."""
        mock_user = MagicMock()
        mock_user.id = "user_123"
        mock_user.svix_app_id = None
        mock_db = MagicMock()

        with patch("app.services.svix_client.get_svix_client", return_value=None):
            result = get_or_create_app_for_user(mock_db, mock_user)
            assert result is None

    def test_create_endpoint_returns_endpoint_id(self):
        """create_endpoint should return the endpoint ID."""
        # Mock the svix module to avoid actual import
        mock_svix_module = MagicMock()
        sys.modules["svix"] = mock_svix_module

        with patch("app.services.svix_client.get_svix_client") as mock_get:
            mock_svix = MagicMock()
            mock_svix.endpoint.create.return_value.id = "ep_123"
            mock_get.return_value = mock_svix

            result = create_endpoint(
                app_id="app_123", url="https://example.com/hook", description="Test endpoint"
            )

            assert result == "ep_123"

    def test_create_endpoint_returns_none_when_svix_unavailable(self):
        """create_endpoint should return None if Svix is not available."""
        with patch("app.services.svix_client.get_svix_client", return_value=None):
            result = create_endpoint(
                app_id="app_123",
                url="https://example.com/hook",
            )
            assert result is None

    def test_get_endpoint_secret_returns_secret(self):
        """get_endpoint_secret should return the signing secret."""
        with patch("app.services.svix_client.get_svix_client") as mock_get:
            mock_svix = MagicMock()
            mock_svix.endpoint.get_secret.return_value.key = "whsec_test123"
            mock_get.return_value = mock_svix

            result = get_endpoint_secret("app_123", "ep_123")
            assert result == "whsec_test123"

    def test_get_endpoint_secret_returns_none_when_svix_unavailable(self):
        """get_endpoint_secret should return None if Svix is not available."""
        with patch("app.services.svix_client.get_svix_client", return_value=None):
            result = get_endpoint_secret("app_123", "ep_123")
            assert result is None

    def test_delete_endpoint_returns_true_on_success(self):
        """delete_endpoint should return True on successful deletion."""
        with patch("app.services.svix_client.get_svix_client") as mock_get:
            mock_svix = MagicMock()
            mock_get.return_value = mock_svix

            result = delete_endpoint("app_123", "ep_123")
            assert result is True
            mock_svix.endpoint.delete.assert_called_once_with("app_123", "ep_123")

    def test_delete_endpoint_returns_true_when_svix_unavailable(self):
        """delete_endpoint should return True (no-op) if Svix is not available."""
        with patch("app.services.svix_client.get_svix_client", return_value=None):
            result = delete_endpoint("app_123", "ep_123")
            assert result is True  # No-op when Svix unavailable

    def test_send_message_returns_true_on_success(self):
        """send_message should return True on successful send."""
        with patch("app.services.svix_client.get_svix_client") as mock_get:
            mock_svix = MagicMock()
            mock_get.return_value = mock_svix

            result = send_message(
                app_id="app_123", event_type="import.completed", payload={"import_id": "123"}
            )

            assert result is True

    def test_send_message_returns_false_when_svix_unavailable(self):
        """send_message should return False if Svix is not available."""
        with patch("app.services.svix_client.get_svix_client", return_value=None):
            result = send_message(
                app_id="app_123", event_type="import.completed", payload={"import_id": "123"}
            )
            assert result is False
