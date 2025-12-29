"""
Onboarding status endpoint for tracking user progress.
"""

from typing import List

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import exists, and_

from app.db.base import get_db
from app.auth.jwt_auth import get_current_user
from app.models.user import User
from app.models.importer import Importer
from app.models.import_job import ImportJob, ImportStatus

router = APIRouter()


class OnboardingStep(BaseModel):
    id: str
    label: str
    completed: bool


class OnboardingStatusResponse(BaseModel):
    steps: List[OnboardingStep]
    completed_count: int
    total_count: int
    all_complete: bool


@router.get("/onboarding", response_model=OnboardingStatusResponse)
def get_onboarding_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OnboardingStatusResponse:
    """
    Get onboarding checklist status for the current user.
    Auto-detects completion of each step.
    """
    user_id = current_user.id

    # Use EXISTS subqueries for efficiency (single round-trip, no data loading)
    has_importer = db.query(
        exists().where(Importer.user_id == user_id)
    ).scalar()

    # Check for importer with non-empty fields array
    # Database-agnostic: load first importer and check in Python
    importer_with_fields = db.query(Importer).filter(
        Importer.user_id == user_id
    ).first()
    has_columns = (
        importer_with_fields is not None
        and importer_with_fields.fields is not None
        and len(importer_with_fields.fields) > 0
    )

    has_completed_import = db.query(
        exists().where(
            and_(
                ImportJob.user_id == user_id,
                ImportJob.status == ImportStatus.COMPLETED
            )
        )
    ).scalar()

    steps = [
        OnboardingStep(
            id="create_account",
            label="Create account",
            completed=True  # Always true if they're authenticated
        ),
        OnboardingStep(
            id="create_importer",
            label="Create your first importer",
            completed=has_importer
        ),
        OnboardingStep(
            id="define_columns",
            label="Define at least one column",
            completed=has_columns
        ),
        OnboardingStep(
            id="first_import",
            label="Complete first import",
            completed=has_completed_import
        )
    ]

    completed_count = sum(1 for step in steps if step.completed)

    return OnboardingStatusResponse(
        steps=steps,
        completed_count=completed_count,
        total_count=len(steps),
        all_complete=completed_count == len(steps)
    )
