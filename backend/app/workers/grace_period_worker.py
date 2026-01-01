"""Background worker to check and process expired grace periods."""

import logging
from datetime import datetime, timezone

from app.db.base import SessionLocal
from app.models.user import User
from app.services.billing import BillingService
from app.services.email import email_service
from app.core.config import settings

logger = logging.getLogger(__name__)


def check_grace_periods():
    """Check for expired grace periods and send reminder emails.

    This job should be run daily via cron or scheduler.
    """
    db = SessionLocal()

    try:
        now = datetime.now(timezone.utc)

        # Find users in grace period
        users_in_grace = db.query(User).filter(
            User.grace_period_ends_at.isnot(None),
            User.subscription_status == "past_due",
        ).all()

        billing = BillingService(db)

        for user in users_in_grace:
            days_left = (user.grace_period_ends_at - now).days

            if days_left <= 0:
                # Grace period expired - downgrade
                logger.info(f"Grace period expired for user {user.id}, downgrading")
                billing.end_grace_period(user)
                email_service.send_subscription_paused(user.email)

            elif days_left in [7, 4, 1]:
                # Send reminder emails on specific days
                logger.info(f"Sending day {days_left} grace period reminder to {user.email}")
                email_service.send_grace_period_reminder(user.email, days_left)

        logger.info(f"Processed {len(users_in_grace)} users in grace period")

    finally:
        db.close()


if __name__ == "__main__":
    check_grace_periods()
