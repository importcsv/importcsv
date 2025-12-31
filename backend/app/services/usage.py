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
    db.commit()

    return False, record.import_count, limit
