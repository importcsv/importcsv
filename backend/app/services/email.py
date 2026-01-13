"""Email service for transactional emails using Resend."""

import logging
from typing import Optional

import resend
from jinja2 import Environment, PackageLoader, select_autoescape

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

        # Initialize Jinja2 environment for email templates
        self.jinja_env = Environment(
            loader=PackageLoader("app", "templates/emails"),
            autoescape=select_autoescape(["html", "xml"])
        )

    def _render(self, template_name: str, **context) -> str:
        """Render an email template with the given context."""
        template = self.jinja_env.get_template(template_name)
        # Add common context variables
        context.setdefault("app_url", settings.FRONTEND_URL)
        return template.render(**context)

    def send_welcome(self, to_email: str, name: Optional[str] = None) -> bool:
        """Send welcome email to new user."""
        html_content = self._render("welcome.html", name=name)
        return self._send(
            to=to_email,
            subject="Welcome to ImportCSV!",
            html=html_content,
        )

    def send_usage_warning(self, to_email: str, current_usage: int, limit: int) -> bool:
        """Send usage warning email when approaching limit."""
        percentage = (current_usage / limit) * 100 if limit > 0 else 0
        html_content = self._render(
            "usage_warning.html",
            current_usage=current_usage,
            limit=limit,
            percentage=percentage
        )
        return self._send(
            to=to_email,
            subject="You're approaching your import limit",
            html=html_content,
        )

    def send_limit_reached(self, to_email: str, limit: int) -> bool:
        """Send email when user hits their import limit."""
        html_content = self._render("limit_reached.html", limit=limit)
        return self._send(
            to=to_email,
            subject="You've reached your import limit",
            html=html_content,
        )

    def send_grace_period_reminder(self, to_email: str, days_remaining: int) -> bool:
        """Send grace period reminder when payment fails."""
        html_content = self._render("grace_period_reminder.html", days_remaining=days_remaining)
        return self._send(
            to=to_email,
            subject="Action required: Update your payment method",
            html=html_content,
        )

    def send_subscription_paused(self, to_email: str) -> bool:
        """Send subscription paused email when grace period expires."""
        html_content = self._render("subscription_paused.html")
        return self._send(
            to=to_email,
            subject="Your subscription has been paused",
            html=html_content,
        )

    def send_upgrade_confirmation(
        self,
        to_email: str,
        tier_name: str,
        import_limit: Optional[int] = None,
        row_limit: Optional[int] = None
    ) -> bool:
        """Send upgrade confirmation email."""
        html_content = self._render(
            "upgrade_confirmation.html",
            tier_name=tier_name,
            import_limit=import_limit,
            row_limit=row_limit
        )
        return self._send(
            to=to_email,
            subject=f"Welcome to {tier_name}!",
            html=html_content,
        )

    def send_trial_started(
        self,
        to_email: str,
        tier_name: str,
        trial_days: int,
    ) -> bool:
        """Send trial started welcome email."""
        html_content = self._render(
            "trial_started.html",
            tier_name=tier_name,
            trial_days=trial_days,
        )
        return self._send(
            to=to_email,
            subject=f"Welcome to your {tier_name} trial!",
            html=html_content,
        )

    def send_trial_ending_soon(
        self,
        to_email: str,
        tier_name: str,
        days_remaining: int,
    ) -> bool:
        """Send trial ending soon warning email."""
        html_content = self._render(
            "trial_ending_soon.html",
            tier_name=tier_name,
            days_remaining=days_remaining,
        )
        return self._send(
            to=to_email,
            subject=f"Your {tier_name} trial ends in {days_remaining} days",
            html=html_content,
        )

    def send_trial_ended(self, to_email: str) -> bool:
        """Send trial ended email."""
        html_content = self._render("trial_ended.html")
        return self._send(
            to=to_email,
            subject="Your trial has ended",
            html=html_content,
        )

    def send_subscription_started(
        self,
        to_email: str,
        tier_name: str,
        amount: str,
    ) -> bool:
        """Send subscription started email (trial converted)."""
        html_content = self._render(
            "subscription_started.html",
            tier_name=tier_name,
            amount=amount,
        )
        return self._send(
            to=to_email,
            subject=f"Welcome to {tier_name}!",
            html=html_content,
        )

    def _send(self, to: str, subject: str, html: str) -> bool:
        """Send an email via Resend."""
        if not self.enabled:
            # Log to console for local development testing
            # Extract text content from HTML for cleaner preview
            import re
            # Remove style tags and their content
            text = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)
            # Remove HTML tags
            text = re.sub(r'<[^>]+>', ' ', text)
            # Clean up whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            # Limit preview length
            preview = text[:400] + "..." if len(text) > 400 else text

            logger.info("")
            logger.info("=" * 60)
            logger.info(f"[EMAIL] To: {to}")
            logger.info(f"[EMAIL] Subject: {subject}")
            logger.info("-" * 60)
            logger.info(f"[EMAIL] {preview}")
            logger.info("=" * 60)
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
