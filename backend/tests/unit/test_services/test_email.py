"""Tests for EmailService Jinja2 template rendering."""
import pytest
from unittest.mock import patch, MagicMock
import importlib


class TestEmailServiceTemplates:
    """Tests for Jinja2 template rendering in EmailService."""

    def test_render_template_returns_html(self):
        """_render should return valid HTML structure from template."""
        # Patch settings before importing the module
        with patch.dict("os.environ", {
            "RESEND_API_KEY": "test_key",
            "RESEND_FROM_EMAIL": "test@example.com",
            "FRONTEND_URL": "https://app.example.com",
            "IMPORTCSV_CLOUD": "true",
        }):
            # Reload the module to pick up patched settings
            import app.services.email as email_module
            importlib.reload(email_module)

            # Create a new instance
            service = email_module.EmailService()
            html = service._render("welcome.html")

            # Verify valid HTML structure
            assert "<!DOCTYPE html>" in html
            assert "</html>" in html

    def test_render_template_includes_app_url(self):
        """_render should include app_url in template context."""
        with patch.dict("os.environ", {
            "RESEND_API_KEY": "test_key",
            "RESEND_FROM_EMAIL": "test@example.com",
            "FRONTEND_URL": "https://app.example.com",
            "IMPORTCSV_CLOUD": "true",
        }):
            import app.services.email as email_module
            importlib.reload(email_module)

            # Patch settings.FRONTEND_URL directly since settings is cached
            with patch.object(email_module.settings, "FRONTEND_URL", "https://app.example.com"):
                service = email_module.EmailService()
                html = service._render("usage_warning.html", current_usage=80, limit=100, percentage=80)

                assert "https://app.example.com" in html

    def test_send_welcome_uses_template(self):
        """send_welcome should send HTML email successfully."""
        with patch.dict("os.environ", {
            "RESEND_API_KEY": "test_key",
            "RESEND_FROM_EMAIL": "test@example.com",
            "FRONTEND_URL": "https://app.example.com",
            "IMPORTCSV_CLOUD": "true",
        }):
            import app.services.email as email_module
            importlib.reload(email_module)

            with patch.object(email_module, "resend") as mock_resend:
                mock_resend.Emails.send.return_value = {"id": "test"}

                # Force enabled to True
                service = email_module.EmailService()
                service.enabled = True
                result = service.send_welcome("user@example.com", "Alice")

                assert result is True
                call_args = mock_resend.Emails.send.call_args
                html = call_args[0][0]["html"]
                # Verify valid HTML structure
                assert "<!DOCTYPE html>" in html
                assert "</html>" in html

    def test_send_usage_warning_uses_template(self):
        """send_usage_warning should interpolate usage numbers into template."""
        with patch.dict("os.environ", {
            "RESEND_API_KEY": "test_key",
            "RESEND_FROM_EMAIL": "test@example.com",
            "FRONTEND_URL": "https://app.example.com",
            "IMPORTCSV_CLOUD": "true",
        }):
            import app.services.email as email_module
            importlib.reload(email_module)

            with patch.object(email_module, "resend") as mock_resend:
                mock_resend.Emails.send.return_value = {"id": "test"}

                service = email_module.EmailService()
                service.enabled = True
                result = service.send_usage_warning("user@example.com", 80, 100)

                assert result is True
                call_args = mock_resend.Emails.send.call_args
                html = call_args[0][0]["html"]
                # Verify numbers are interpolated
                assert "80" in html
                assert "100" in html
                assert "<!DOCTYPE html>" in html

    def test_send_limit_reached_uses_template(self):
        """send_limit_reached should interpolate limit number into template."""
        with patch.dict("os.environ", {
            "RESEND_API_KEY": "test_key",
            "RESEND_FROM_EMAIL": "test@example.com",
            "FRONTEND_URL": "https://app.example.com",
            "IMPORTCSV_CLOUD": "true",
        }):
            import app.services.email as email_module
            importlib.reload(email_module)

            with patch.object(email_module, "resend") as mock_resend:
                mock_resend.Emails.send.return_value = {"id": "test"}

                service = email_module.EmailService()
                service.enabled = True
                result = service.send_limit_reached("user@example.com", 100)

                assert result is True
                call_args = mock_resend.Emails.send.call_args
                html = call_args[0][0]["html"]
                # Verify limit is interpolated
                assert "100" in html
                assert "<!DOCTYPE html>" in html

    def test_send_upgrade_confirmation_uses_template(self):
        """send_upgrade_confirmation should use the upgrade_confirmation.html template."""
        with patch.dict("os.environ", {
            "RESEND_API_KEY": "test_key",
            "RESEND_FROM_EMAIL": "test@example.com",
            "FRONTEND_URL": "https://app.example.com",
            "IMPORTCSV_CLOUD": "true",
        }):
            import app.services.email as email_module
            importlib.reload(email_module)

            with patch.object(email_module, "resend") as mock_resend:
                mock_resend.Emails.send.return_value = {"id": "test"}

                service = email_module.EmailService()
                service.enabled = True
                result = service.send_upgrade_confirmation(
                    "user@example.com",
                    tier_name="Pro",
                    import_limit=500,
                    row_limit=100000
                )

                assert result is True
                call_args = mock_resend.Emails.send.call_args
                html = call_args[0][0]["html"]
                assert "Pro" in html
                assert "500" in html
                assert "<html" in html

    def test_send_grace_period_reminder_uses_template(self):
        """send_grace_period_reminder should use the grace_period_reminder.html template."""
        with patch.dict("os.environ", {
            "RESEND_API_KEY": "test_key",
            "RESEND_FROM_EMAIL": "test@example.com",
            "FRONTEND_URL": "https://app.example.com",
            "IMPORTCSV_CLOUD": "true",
        }):
            import app.services.email as email_module
            importlib.reload(email_module)

            with patch.object(email_module, "resend") as mock_resend:
                mock_resend.Emails.send.return_value = {"id": "test"}

                service = email_module.EmailService()
                service.enabled = True
                result = service.send_grace_period_reminder("user@example.com", 3)

                assert result is True
                call_args = mock_resend.Emails.send.call_args
                html = call_args[0][0]["html"]
                assert "3" in html
                assert "payment" in html.lower()
                assert "<html" in html

    def test_send_subscription_paused_uses_template(self):
        """send_subscription_paused should use the subscription_paused.html template."""
        with patch.dict("os.environ", {
            "RESEND_API_KEY": "test_key",
            "RESEND_FROM_EMAIL": "test@example.com",
            "FRONTEND_URL": "https://app.example.com",
            "IMPORTCSV_CLOUD": "true",
        }):
            import app.services.email as email_module
            importlib.reload(email_module)

            with patch.object(email_module, "resend") as mock_resend:
                mock_resend.Emails.send.return_value = {"id": "test"}

                service = email_module.EmailService()
                service.enabled = True
                result = service.send_subscription_paused("user@example.com")

                assert result is True
                call_args = mock_resend.Emails.send.call_args
                html = call_args[0][0]["html"]
                assert "paused" in html.lower()
                assert "<html" in html
