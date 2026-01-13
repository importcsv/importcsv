"""Background worker for trial expiry processing."""

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.services.email import email_service

logger = logging.getLogger(__name__)


def _ensure_tz_aware(dt: datetime | None) -> datetime | None:
    """Ensure datetime is timezone-aware (assume UTC for naive datetimes).

    SQLite doesn't preserve timezone info, so datetimes retrieved from
    the test database may be naive. This helper normalizes them to UTC.
    """
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


def process_expired_trials(db: Session) -> int:
    """Process expired trials and downgrade users to free tier.

    Only processes trials that:
    - Are in 'trialing' status
    - Have trial_ends_at in the past
    - Have trial_ends_at within the last 24 hours (avoid ancient records)
    - Do NOT have a subscription_id (Stripe handles those automatically)

    Returns:
        Number of trials processed

    Note:
        trial_started_at is intentionally preserved to prevent users from
        re-starting trials after cancellation.
    """
    now = datetime.now(UTC)
    cutoff = now - timedelta(hours=24)

    expired_users = (
        db.query(User)
        .filter(
            User.subscription_status == "trialing",
            User.trial_ends_at < now,
            User.trial_ends_at > cutoff,
            User.subscription_id.is_(None),
        )
        .all()
    )

    processed = 0
    for user in expired_users:
        try:
            original_tier = user.subscription_tier

            # Send email first - if this fails, we can retry the whole operation
            # on the next worker run since the DB state hasn't changed
            email_service.send_trial_ended(user.email)

            user.subscription_tier = "free"
            user.subscription_status = "free"
            user.trial_ends_at = None

            db.commit()

            logger.info(f"Expired {original_tier} trial for user {user.id}, downgraded to free")
            processed += 1

        except Exception as e:  # noqa: BLE001 - Intentional broad catch to prevent worker crash
            logger.error(f"Error processing expired trial for user {user.id}: {e}")
            db.rollback()

    return processed


def send_trial_warning_emails(db: Session) -> int:
    """Send warning emails to users whose trials are ending soon.

    Only sends to users who:
    - Are in 'trialing' status
    - Have trial ending within TRIAL_WARNING_DAYS
    - Do NOT have a subscription_id (haven't added CC)
    - Haven't already received warning (trial_warning_sent_at is None)

    Returns:
        Number of emails sent
    """
    now = datetime.now(UTC)
    warning_cutoff = now + timedelta(days=settings.TRIAL_WARNING_DAYS)

    users_to_warn = (
        db.query(User)
        .filter(
            User.subscription_status == "trialing",
            User.subscription_id.is_(None),
            User.trial_ends_at <= warning_cutoff,
            User.trial_ends_at > now,
            User.trial_warning_sent_at.is_(None),
        )
        .all()
    )

    sent = 0
    for user in users_to_warn:
        try:
            trial_ends_at = _ensure_tz_aware(user.trial_ends_at)
            days_remaining = (trial_ends_at - now).days

            # Send email first - if this fails, we can retry on next worker run
            email_service.send_trial_ending_soon(
                to_email=user.email,
                tier_name=user.subscription_tier.title(),
                days_remaining=days_remaining,
            )

            # Only mark as sent after successful email delivery
            user.trial_warning_sent_at = now
            db.commit()

            logger.info(f"Sent trial warning to user {user.id}, {days_remaining} days remaining")
            sent += 1

        except Exception as e:  # noqa: BLE001 - Intentional broad catch to prevent worker crash
            logger.error(f"Error sending trial warning to user {user.id}: {e}")
            db.rollback()

    return sent
