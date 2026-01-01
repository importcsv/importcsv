from unittest.mock import patch, MagicMock


class TestUsageEmailTriggers:
    """Tests for usage-based email triggers."""

    def test_usage_warning_sent_at_80_percent(self):
        """Warning email should be sent when usage hits 80%."""
        with patch("app.services.usage.email_service") as mock_email:
            mock_email.send_usage_warning.return_value = True

            mock_db = MagicMock()
            mock_user = MagicMock()
            mock_user.email = "user@example.com"
            mock_user.id = "user-123"

            mock_record = MagicMock()
            mock_record.import_count = 79  # Will become 80 after increment
            mock_record.warning_email_sent = False
            mock_record.limit_email_sent = False

            # Simulate 80% of 100 limit
            from app.services.usage import check_and_send_usage_emails

            check_and_send_usage_emails(
                db=mock_db,
                user=mock_user,
                record=mock_record,
                new_count=80,
                limit=100
            )

            mock_email.send_usage_warning.assert_called_once_with(
                "user@example.com", 80, 100
            )
            assert mock_record.warning_email_sent is True

    def test_limit_reached_email_sent_at_100_percent(self):
        """Limit reached email should be sent when usage hits 100%."""
        with patch("app.services.usage.email_service") as mock_email:
            mock_email.send_limit_reached.return_value = True

            mock_db = MagicMock()
            mock_user = MagicMock()
            mock_user.email = "user@example.com"

            mock_record = MagicMock()
            mock_record.import_count = 99
            mock_record.warning_email_sent = True  # Already sent warning
            mock_record.limit_email_sent = False

            from app.services.usage import check_and_send_usage_emails

            check_and_send_usage_emails(
                db=mock_db,
                user=mock_user,
                record=mock_record,
                new_count=100,
                limit=100
            )

            mock_email.send_limit_reached.assert_called_once_with(
                "user@example.com", 100
            )
            assert mock_record.limit_email_sent is True

    def test_no_duplicate_warning_email(self):
        """Warning email should not be sent twice."""
        with patch("app.services.usage.email_service") as mock_email:
            mock_db = MagicMock()
            mock_user = MagicMock()
            mock_user.email = "user@example.com"

            mock_record = MagicMock()
            mock_record.warning_email_sent = True  # Already sent
            mock_record.limit_email_sent = False

            from app.services.usage import check_and_send_usage_emails

            check_and_send_usage_emails(
                db=mock_db,
                user=mock_user,
                record=mock_record,
                new_count=85,
                limit=100
            )

            mock_email.send_usage_warning.assert_not_called()

    def test_no_emails_for_unlimited_tier(self):
        """No emails should be sent for unlimited tier (limit=None)."""
        with patch("app.services.usage.email_service") as mock_email:
            mock_db = MagicMock()
            mock_user = MagicMock()
            mock_user.email = "user@example.com"

            mock_record = MagicMock()
            mock_record.warning_email_sent = False
            mock_record.limit_email_sent = False

            from app.services.usage import check_and_send_usage_emails

            check_and_send_usage_emails(
                db=mock_db,
                user=mock_user,
                record=mock_record,
                new_count=1000,
                limit=None  # Unlimited
            )

            mock_email.send_usage_warning.assert_not_called()
            mock_email.send_limit_reached.assert_not_called()

    def test_no_duplicate_limit_email(self):
        """Limit email should not be sent twice."""
        with patch("app.services.usage.email_service") as mock_email:
            mock_db = MagicMock()
            mock_user = MagicMock()
            mock_user.email = "user@example.com"

            mock_record = MagicMock()
            mock_record.warning_email_sent = True
            mock_record.limit_email_sent = True  # Already sent

            from app.services.usage import check_and_send_usage_emails

            check_and_send_usage_emails(
                db=mock_db,
                user=mock_user,
                record=mock_record,
                new_count=100,
                limit=100
            )

            mock_email.send_limit_reached.assert_not_called()
