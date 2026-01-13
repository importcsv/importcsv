"""Tests for trial email sending."""
from unittest.mock import patch, MagicMock

import pytest


@pytest.fixture
def mock_resend():
    """Mock Resend API."""
    with patch('app.services.email.resend') as mock:
        mock.Emails.send.return_value = {"id": "test-email-id"}
        yield mock


def test_send_trial_started_email(mock_resend):
    """send_trial_started should send welcome trial email."""
    # Re-import to get fresh instance with mocked resend
    with patch('app.services.email.is_cloud_mode', return_value=True):
        with patch('app.services.email.settings') as mock_settings:
            mock_settings.RESEND_API_KEY = "test-key"
            mock_settings.RESEND_FROM_EMAIL = "test@example.com"
            mock_settings.FRONTEND_URL = "https://example.com"

            from app.services.email import EmailService
            service = EmailService()
            service.enabled = True

            result = service.send_trial_started(
                to_email="user@example.com",
                tier_name="Pro",
                trial_days=14,
            )

            assert result is True
            mock_resend.Emails.send.assert_called_once()


def test_send_trial_ending_soon_email(mock_resend):
    """send_trial_ending_soon should send warning email."""
    with patch('app.services.email.is_cloud_mode', return_value=True):
        with patch('app.services.email.settings') as mock_settings:
            mock_settings.RESEND_API_KEY = "test-key"
            mock_settings.RESEND_FROM_EMAIL = "test@example.com"
            mock_settings.FRONTEND_URL = "https://example.com"

            from app.services.email import EmailService
            service = EmailService()
            service.enabled = True

            result = service.send_trial_ending_soon(
                to_email="user@example.com",
                tier_name="Pro",
                days_remaining=3,
            )

            assert result is True


def test_send_trial_ended_email(mock_resend):
    """send_trial_ended should send expiration email."""
    with patch('app.services.email.is_cloud_mode', return_value=True):
        with patch('app.services.email.settings') as mock_settings:
            mock_settings.RESEND_API_KEY = "test-key"
            mock_settings.RESEND_FROM_EMAIL = "test@example.com"
            mock_settings.FRONTEND_URL = "https://example.com"

            from app.services.email import EmailService
            service = EmailService()
            service.enabled = True

            result = service.send_trial_ended(to_email="user@example.com")

            assert result is True
