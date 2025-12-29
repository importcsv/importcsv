from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.auth.jwt_auth import get_current_user
from app.models.user import User
from app.models.usage import UsageRecord
from app.services import usage as usage_service
from app.core.features import get_feature_flags

router = APIRouter()


@router.get("/current")
async def get_current_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get usage for the current billing period"""
    return usage_service.get_usage_for_period(db, current_user.id)


@router.get("/history")
async def get_usage_history(
    months: int = 6,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get usage history"""
    records = db.query(UsageRecord).filter(
        UsageRecord.user_id == current_user.id
    ).order_by(UsageRecord.period.desc()).limit(months).all()

    return {
        "history": [
            {"period": r.period, "import_count": r.import_count, "row_count": r.row_count}
            for r in records
        ]
    }


@router.get("/features")
async def get_features():
    """Get feature flags"""
    return get_feature_flags()
