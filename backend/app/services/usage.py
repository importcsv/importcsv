from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models.usage import UsageRecord
from app.models.user import User
from app.core.features import (
    get_free_tier_limit,
    is_usage_limits_enabled,
    get_tier_import_limit,
    get_tier_max_rows,
)
from app.services.email import email_service


def get_current_period() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def get_or_create_usage_record(db: Session, user_id: UUID, period: Optional[str] = None) -> UsageRecord:
    """Get or create a usage record using upsert to avoid race conditions."""
    if period is None:
        period = get_current_period()

    # Use PostgreSQL upsert to atomically create if not exists
    stmt = insert(UsageRecord).values(
        user_id=user_id,
        period=period,
        import_count=0,
        row_count=0
    ).on_conflict_do_nothing(
        index_elements=['user_id', 'period']
    )
    db.execute(stmt)
    db.commit()

    return db.query(UsageRecord).filter(
        UsageRecord.user_id == user_id,
        UsageRecord.period == period
    ).first()


def get_usage_for_period(db: Session, user_id: UUID, period: Optional[str] = None) -> dict:
    """Get usage statistics for a billing period."""
    record = get_or_create_usage_record(db, user_id, period)
    limit = get_free_tier_limit()

    return {
        "period": record.period,
        "import_count": record.import_count,
        "row_count": record.row_count,
        "import_limit": limit if is_usage_limits_enabled() else None,
        "imports_remaining": max(0, limit - record.import_count) if is_usage_limits_enabled() else None,
        "limit_reached": record.import_count >= limit if is_usage_limits_enabled() else False,
    }


def increment_usage(db: Session, user_id: UUID, rows: int = 0) -> UsageRecord:
    """Atomically increment usage counters."""
    period = get_current_period()

    # Ensure record exists first
    get_or_create_usage_record(db, user_id, period)

    # Use atomic UPDATE to avoid race conditions
    stmt = (
        update(UsageRecord)
        .where(UsageRecord.user_id == user_id, UsageRecord.period == period)
        .values(
            import_count=UsageRecord.import_count + 1,
            row_count=UsageRecord.row_count + rows
        )
    )
    db.execute(stmt)
    db.commit()

    return db.query(UsageRecord).filter(
        UsageRecord.user_id == user_id,
        UsageRecord.period == period
    ).first()


def check_usage_limit(db: Session, user_id: UUID) -> tuple[bool, int, int]:
    """Check if user has reached their usage limit.

    Returns: (limit_reached, current_count, limit)
    """
    if not is_usage_limits_enabled():
        return False, 0, 0

    record = get_or_create_usage_record(db, user_id)
    limit = get_free_tier_limit()
    return record.import_count >= limit, record.import_count, limit


def check_and_increment_usage(db: Session, user_id: UUID, rows: int = 0) -> tuple[bool, int, int]:
    """Atomically check limit and increment if allowed.

    This function locks the row, checks the limit, and increments in a single transaction
    to prevent race conditions where concurrent requests could bypass limits.

    Returns: (limit_exceeded, new_count, limit)
        - limit_exceeded: True if the limit was already reached BEFORE this request
        - new_count: The count after incrementing (if allowed)
        - limit: The user's limit (0 if limits disabled)
    """
    period = get_current_period()

    # Ensure record exists
    get_or_create_usage_record(db, user_id, period)

    if not is_usage_limits_enabled():
        # Still track usage even when limits disabled
        record = increment_usage(db, user_id, rows)
        return False, record.import_count, 0

    limit = get_free_tier_limit()

    # Lock the row to prevent concurrent modifications
    record = db.query(UsageRecord).filter(
        UsageRecord.user_id == user_id,
        UsageRecord.period == period
    ).with_for_update().first()

    # Check if limit already exceeded
    if record.import_count >= limit:
        db.commit()  # Release lock
        return True, record.import_count, limit

    # Increment within the same transaction (row is locked)
    record.import_count += 1
    record.row_count += rows
    db.commit()

    return False, record.import_count, limit


def get_user_limits(db: Session, user_id: UUID) -> dict:
    """Get the current limits for a user based on their tier."""
    user = db.query(User).filter(User.id == user_id).first()
    tier = user.subscription_tier if user else "free"

    return {
        "tier": tier,
        "import_limit": get_tier_import_limit(tier),
        "max_rows_per_import": get_tier_max_rows(tier),
    }


def check_usage_limit_for_user(db: Session, user: User) -> tuple[bool, int, int | None]:
    """Check if user has reached their usage limit based on their tier.

    Returns: (limit_reached, current_count, limit)
    """
    if not is_usage_limits_enabled():
        return False, 0, None

    record = get_or_create_usage_record(db, user.id)
    limit = get_tier_import_limit(user.subscription_tier)

    if limit is None:  # Unlimited (business tier)
        return False, record.import_count, None

    return record.import_count >= limit, record.import_count, limit


def check_rows_limit(db: Session, user: User, rows: int) -> tuple[bool, int]:
    """Check if import exceeds max rows per import for user's tier.

    Returns: (limit_exceeded, max_allowed)
    """
    max_rows = get_tier_max_rows(user.subscription_tier)
    return rows > max_rows, max_rows


def check_and_increment_usage_for_user(
    db: Session,
    user: User,
    rows: int = 0,
) -> tuple[bool, int, int | None]:
    """Atomically check limit and increment if allowed, using tier-based limits.

    Also sends usage warning/limit emails at appropriate thresholds.

    Returns: (limit_exceeded, new_count, limit)
    """
    period = get_current_period()

    # Ensure record exists
    get_or_create_usage_record(db, user.id, period)

    if not is_usage_limits_enabled():
        # Still track usage even when limits disabled
        record = increment_usage(db, user.id, rows)
        return False, record.import_count, None

    tier = user.subscription_tier
    limit = get_tier_import_limit(tier)

    if limit is None:  # Unlimited tier
        record = increment_usage(db, user.id, rows)
        return False, record.import_count, None

    # Lock the row to prevent concurrent modifications
    record = db.query(UsageRecord).filter(
        UsageRecord.user_id == user.id,
        UsageRecord.period == period
    ).with_for_update().first()

    # Check if limit already exceeded
    if record.import_count >= limit:
        db.commit()  # Release lock
        return True, record.import_count, limit

    # Increment within the same transaction (row is locked)
    record.import_count += 1
    record.row_count += rows

    # Determine which emails to send and update flags atomically (while locked)
    new_count = record.import_count
    percentage = (new_count / limit) * 100

    should_send_warning = percentage >= 80 and not record.warning_email_sent
    should_send_limit = new_count >= limit and not record.limit_email_sent

    if should_send_warning:
        record.warning_email_sent = True
    if should_send_limit:
        record.limit_email_sent = True

    # Commit all changes atomically (releases lock)
    db.commit()

    # Send emails after commit (outside transaction, non-blocking for DB)
    if should_send_warning:
        email_service.send_usage_warning(user.email, new_count, limit)
    if should_send_limit:
        email_service.send_limit_reached(user.email, limit)

    return False, new_count, limit


def check_and_send_usage_emails(
    db: Session,
    user: User,
    record: UsageRecord,
    new_count: int,
    limit: int | None
) -> None:
    """Check usage thresholds and send appropriate emails.

    DEPRECATED: This function has a race condition and should not be called
    directly. Email logic is now inlined in check_and_increment_usage_for_user()
    to ensure flag updates happen atomically within the row lock.

    Args:
        db: Database session
        user: User who performed the import
        record: The usage record for current period
        new_count: Updated usage count after increment
        limit: User's import limit (None for unlimited)
    """
    if limit is None:
        return  # No limit, no emails needed

    percentage = (new_count / limit) * 100

    # Send warning at 80% (once per period)
    if percentage >= 80 and not record.warning_email_sent:
        email_service.send_usage_warning(user.email, new_count, limit)
        record.warning_email_sent = True
        db.commit()

    # Send limit reached at 100% (once per period)
    if new_count >= limit and not record.limit_email_sent:
        email_service.send_limit_reached(user.email, limit)
        record.limit_email_sent = True
        db.commit()
