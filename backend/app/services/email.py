"""Email service for transactional emails using Resend."""

import html
import logging
from typing import Optional

import resend

from app.core.config import settings
from app.core.features import is_cloud_mode

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = settings.RESEND_API_KEY


class EmailService:
    """Service for sending transactional emails."""

    def __init__(self):
        self.from_email = settings.RESEND_FROM_EMAIL
        self.enabled = is_cloud_mode() and bool(settings.RESEND_API_KEY)

    def send_welcome(self, to_email: str, name: Optional[str] = None) -> bool:
        """Send welcome email to new user."""
        # Escape user-provided name to prevent XSS
        escaped_name = html.escape(name) if name else None
        return self._send(
            to=to_email,
            subject="Welcome to ImportCSV!",
            html=f"""
            <h1>Welcome to ImportCSV{f', {escaped_name}' if escaped_name else ''}!</h1>
            <p>Thanks for signing up. You're ready to start importing CSV data.</p>
            <p>Get started:</p>
            <ul>
                <li>Create your first importer</li>
                <li>Configure your data schema</li>
                <li>Embed in your app or use the API</li>
            </ul>
            <p>Questions? Reply to this email.</p>
            """,
        )

    def send_usage_warning(
        self,
        to_email: str,
        current_usage: int,
        limit: int,
        percentage: int,
    ) -> bool:
        """Send usage warning email when approaching limit."""
        return self._send(
            to=to_email,
            subject=f"ImportCSV: You've used {percentage}% of your imports",
            html=f"""
            <h1>Approaching your import limit</h1>
            <p>You've used <strong>{current_usage}</strong> of your <strong>{limit}</strong> monthly imports ({percentage}%).</p>
            <p><a href="{settings.FRONTEND_URL}/settings/billing">Upgrade your plan</a> to get more imports.</p>
            """,
        )

    def send_limit_reached(self, to_email: str, limit: int) -> bool:
        """Send email when user hits their import limit."""
        return self._send(
            to=to_email,
            subject="ImportCSV: Monthly import limit reached",
            html=f"""
            <h1>You've reached your import limit</h1>
            <p>You've used all <strong>{limit}</strong> imports for this month.</p>
            <p><a href="{settings.FRONTEND_URL}/settings/billing">Upgrade to Pro</a> to continue importing.</p>
            """,
        )

    def send_grace_period_reminder(
        self,
        to_email: str,
        days_left: int,
        update_payment_url: str,
    ) -> bool:
        """Send grace period reminder email."""
        subject = "Urgent: Update your payment method" if days_left <= 1 else f"ImportCSV: {days_left} days to update payment"

        return self._send(
            to=to_email,
            subject=subject,
            html=f"""
            <h1>Payment failed - action required</h1>
            <p>We couldn't process your payment. You have <strong>{days_left} day{'s' if days_left != 1 else ''}</strong> to update your payment method.</p>
            <p>After that, your account will be downgraded to the free tier.</p>
            <p><a href="{update_payment_url}">Update payment method</a></p>
            """,
        )

    def send_subscription_paused(self, to_email: str) -> bool:
        """Send email when subscription is paused due to non-payment."""
        return self._send(
            to=to_email,
            subject="ImportCSV: Your subscription has been paused",
            html=f"""
            <h1>Subscription paused</h1>
            <p>Your subscription has been paused due to payment issues.</p>
            <p>You've been moved to the free tier with limited imports.</p>
            <p><a href="{settings.FRONTEND_URL}/settings/billing">Update payment and resubscribe</a></p>
            """,
        )

    def send_upgrade_confirmation(self, to_email: str, tier: str) -> bool:
        """Send confirmation email after upgrade."""
        return self._send(
            to=to_email,
            subject=f"Welcome to ImportCSV {tier.title()}!",
            html=f"""
            <h1>You're now on {tier.title()}!</h1>
            <p>Thanks for upgrading. Here's what you now have access to:</p>
            <ul>
                <li>{'2,000' if tier == 'pro' else 'Unlimited'} imports per month</li>
                <li>{'100,000' if tier == 'pro' else '500,000'} rows per import</li>
                <li>Remove ImportCSV branding</li>
                <li>Custom CSS styling</li>
            </ul>
            """,
        )

    def _send(self, to: str, subject: str, html: str) -> bool:
        """Send an email via Resend."""
        if not self.enabled:
            logger.debug(f"Email disabled, would send to {to}: {subject}")
            return True

        try:
            resend.Emails.send({
                "from": self.from_email,
                "to": to,
                "subject": subject,
                "html": html,
            })
            logger.info(f"Sent email to {to}: {subject}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {e}")
            return False


# Singleton instance
email_service = EmailService()
