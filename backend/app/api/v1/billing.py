"""Billing API endpoints for subscription management."""

import logging
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.auth.jwt_auth import get_current_user
from app.models.user import User
from app.services.billing import BillingService
from app.services.usage import get_usage_for_period
from app.core.features import (
    is_cloud_mode,
    get_tier_import_limit,
    get_tier_max_rows,
    SubscriptionTier,
)
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


def _validate_redirect_url(url: str) -> str:
    """Validate that a redirect URL is on the allowed frontend domain."""
    parsed = urlparse(url)
    frontend_parsed = urlparse(settings.FRONTEND_URL)

    # Explicitly whitelist http/https schemes only
    if parsed.scheme not in ("http", "https"):
        raise ValueError("URL must use http or https scheme")

    if not parsed.netloc:
        raise ValueError("Invalid URL format")

    if parsed.netloc != frontend_parsed.netloc:
        raise ValueError(f"URL must be on {frontend_parsed.netloc}")

    return url


class CheckoutRequest(BaseModel):
    tier: SubscriptionTier
    success_url: str
    cancel_url: str

    @field_validator("success_url", "cancel_url")
    @classmethod
    def validate_redirect_urls(cls, v: str) -> str:
        return _validate_redirect_url(v)


class PortalRequest(BaseModel):
    return_url: str

    @field_validator("return_url")
    @classmethod
    def validate_return_url(cls, v: str) -> str:
        return _validate_redirect_url(v)


class StartTrialRequest(BaseModel):
    tier: SubscriptionTier

    @field_validator("tier")
    @classmethod
    def validate_tier(cls, v: str) -> str:
        if v == "free":
            raise ValueError("Cannot trial free tier")
        return v


def require_cloud_mode():
    """Dependency that requires cloud mode to be enabled."""
    if not is_cloud_mode():
        raise HTTPException(status_code=404, detail="Not available")


@router.get("/subscription")
async def get_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_cloud_mode),
):
    """Get current subscription status and usage."""
    billing = BillingService(db)
    subscription = billing.get_subscription_status(current_user)
    usage = get_usage_for_period(db, current_user.id)

    tier = current_user.subscription_tier
    import_limit = get_tier_import_limit(tier)

    return {
        **subscription,
        "usage": {
            "imports": usage["import_count"],
            "rows": usage["row_count"],
            "import_limit": import_limit,
            "imports_remaining": max(0, import_limit - usage["import_count"]) if import_limit else None,
        },
        "limits": {
            "imports_per_month": import_limit,
            "max_rows_per_import": get_tier_max_rows(tier),
        },
    }


@router.post("/checkout")
async def create_checkout(
    request: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_cloud_mode),
):
    """Create a Stripe Checkout session for subscription upgrade."""
    if request.tier == "free":
        raise HTTPException(status_code=400, detail="Cannot checkout for free tier")

    billing = BillingService(db)

    try:
        checkout_url = billing.create_checkout_session(
            user=current_user,
            tier=request.tier,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
        )
        return {"checkout_url": checkout_url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Checkout creation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@router.post("/portal")
async def create_portal(
    request: PortalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_cloud_mode),
):
    """Create a Stripe Customer Portal session."""
    if not current_user.stripe_customer_id:
        raise HTTPException(
            status_code=400,
            detail="No billing account. Subscribe to a plan first.",
        )

    billing = BillingService(db)

    try:
        portal_url = billing.create_portal_session(
            user=current_user,
            return_url=request.return_url,
        )
        return {"portal_url": portal_url}
    except Exception as e:
        logger.error(f"Portal creation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create portal session")


@router.post("/start-trial")
async def start_trial(
    request: StartTrialRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_cloud_mode),
):
    """Start a free trial or upgrade tier during trial."""
    billing = BillingService(db)

    try:
        result = billing.start_trial(user=current_user, tier=request.tier)

        # Send welcome email for new trials
        if result.get("is_new_trial"):
            try:
                from app.services.email import email_service
                email_service.send_trial_started(
                    to_email=current_user.email,
                    tier_name=request.tier.title(),
                    trial_days=settings.TRIAL_DURATION_DAYS,
                )
            except Exception as email_error:
                # Log but don't fail the request if email fails
                logger.warning(f"Failed to send trial started email: {email_error}")

        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cancel-trial")
async def cancel_trial(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_cloud_mode),
):
    """Cancel an active trial."""
    billing = BillingService(db)

    try:
        return billing.cancel_trial(current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
