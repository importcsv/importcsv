# Stripe Billing Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Stripe billing with tiered pricing (Free/Pro/Business) to ImportCSV cloud mode, including usage limits, payment flows, and email notifications.

**Architecture:** Server-side billing logic in FastAPI backend, Stripe Checkout for payments, Stripe Customer Portal for management, Resend for transactional emails. All billing features gated behind `IMPORTCSV_CLOUD=true` flag.

**Tech Stack:** Python/FastAPI, Stripe SDK, Resend, PostgreSQL/Alembic, Next.js admin dashboard, Preact embeddable importer.

---

## Progress Tracker

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| 1.1: Add Stripe and Resend Dependencies | ✅ Done | `8db2b24` | Updated to stripe==14.1.0, resend==2.19.0 (plan had outdated versions) |
| 1.2: Add Billing Config Settings | ✅ Done | `a337ea9` | Added all tier limits, Resend settings, grace period |
| 1.3: Update Feature Flags | ✅ Done | `7f05a1b` | Added tier-based limit functions |
| Code Review Fixes (1.3) | ✅ Done | `876fbe4` | Refactored to match statements, added 18 unit tests |
| 1.4: Create Database Migration | ✅ Done | `941015a` | Added billing fields + stripe_customer_id index |
| 1.5: Update User Model | ✅ Done | `09b95e2` | Added billing fields to User model |
| 2.1: Create Billing Service | ✅ Done | `e4a398b` | Stripe integration with checkout, portal, webhooks |
| Code Review Fixes (2.1) | ✅ Done | `e108f6e` | Config validation, restrictive defaults, subscription_id index |
| 2.2: Create Email Service | ✅ Done | `b10e87c` | Resend integration for transactional emails |
| 3.1: Create Billing API Endpoints | ✅ Done | `f47bdcb` | /subscription, /checkout, /portal endpoints |
| 3.2: Create Stripe Webhook Handler | ✅ Done | `d9411a9` | Handles checkout, subscription, payment events |
| Code Review Fixes (2.2-3.2) | ✅ Done | `846f7e2` | URL validation, webhook idempotency, XSS fix, secret check |
| 3.3: Register New Routes | ✅ Done | `51da237` | Added billing and webhooks to API router |
| 4.1: Update Usage Service | ✅ Done | `27227f9` | Added tier-based limit functions |
| 4.2: Update Import Endpoint | ✅ Done | `33ed5f2` | Added rows-per-import limit enforcement |
| 5.1: Add Config Endpoint | ✅ Done | `0123274` | Added /imports/key/config for embedded importer |
| 6.1: Create Billing Settings Page | ✅ Done | `f5a6a2d` | Added billing UI with usage bar and upgrade options |
| 6.2: Update Settings Page Navigation | ✅ Done | `ba52f52` | Added card navigation to billing |
| 7.1: Update Environment Example | ✅ Done | `21f0ea9` | Documented all new env vars |
| 8.1: Create Grace Period Worker | ✅ Done | `00edfc7` | Daily job for grace period processing |
| 8.2: Final Verification | ✅ Done | - | All tests pass, builds succeed |

**Last Updated:** 2024-12-30 (All tasks complete)

---

## Phase 1: Foundation

### Task 1.1: Add Stripe and Resend Dependencies

**Files:**
- Modify: `backend/requirements.txt`

**Step 1: Add the new dependencies**

Add these lines to `backend/requirements.txt`:

```
stripe==11.4.1
resend==2.5.0
```

**Step 2: Install dependencies**

Run:
```bash
cd backend && pip install stripe==11.4.1 resend==2.5.0
```

Expected: Successful installation with no errors.

**Step 3: Commit**

```bash
git add backend/requirements.txt
git commit -m "$(cat <<'EOF'
chore: add stripe and resend dependencies

Add Stripe SDK for payment processing and Resend for transactional emails.
EOF
)"
```

---

### Task 1.2: Add Billing Config Settings

**Files:**
- Modify: `backend/app/core/config.py`

**Step 1: Add new config fields after existing Stripe settings (around line 139)**

Find this section in `config.py`:
```python
    STRIPE_PRICE_ID_PRO: Optional[str] = Field(
        default_factory=lambda: os.getenv("STRIPE_PRICE_ID_PRO")
    )
```

Add these new fields after it:

```python
    STRIPE_PRICE_ID_BUSINESS: Optional[str] = Field(
        default_factory=lambda: os.getenv("STRIPE_PRICE_ID_BUSINESS")
    )

    # Resend settings
    RESEND_API_KEY: Optional[str] = Field(
        default_factory=lambda: os.getenv("RESEND_API_KEY")
    )
    RESEND_FROM_EMAIL: str = Field(
        default_factory=lambda: os.getenv("RESEND_FROM_EMAIL", "noreply@importcsv.dev")
    )

    # Tier limits
    PRO_TIER_IMPORTS_PER_MONTH: int = Field(
        default_factory=lambda: int(os.getenv("PRO_TIER_IMPORTS_PER_MONTH", "2000"))
    )
    FREE_TIER_MAX_ROWS_PER_IMPORT: int = Field(
        default_factory=lambda: int(os.getenv("FREE_TIER_MAX_ROWS_PER_IMPORT", "10000"))
    )
    PRO_TIER_MAX_ROWS_PER_IMPORT: int = Field(
        default_factory=lambda: int(os.getenv("PRO_TIER_MAX_ROWS_PER_IMPORT", "100000"))
    )
    BUSINESS_TIER_MAX_ROWS_PER_IMPORT: int = Field(
        default_factory=lambda: int(os.getenv("BUSINESS_TIER_MAX_ROWS_PER_IMPORT", "500000"))
    )

    # Grace period for failed payments (days)
    PAYMENT_GRACE_PERIOD_DAYS: int = Field(
        default_factory=lambda: int(os.getenv("PAYMENT_GRACE_PERIOD_DAYS", "7"))
    )
```

**Step 2: Verify the config loads correctly**

Run:
```bash
cd backend && python -c "from app.core.config import settings; print(settings.PRO_TIER_IMPORTS_PER_MONTH)"
```

Expected: `2000`

**Step 3: Commit**

```bash
git add backend/app/core/config.py
git commit -m "$(cat <<'EOF'
feat(config): add billing tier limits and resend settings

Add configuration for Pro/Business tier limits, Resend email settings,
and payment grace period.
EOF
)"
```

---

### Task 1.3: Update Feature Flags

**Files:**
- Modify: `backend/app/core/features.py`

**Step 1: Replace the entire file content**

```python
"""Feature flags for ImportCSV Cloud vs Self-Hosted"""

from typing import Literal
from app.core.config import settings


SubscriptionTier = Literal["free", "pro", "business"]


def is_cloud_mode() -> bool:
    """Check if running in ImportCSV Cloud mode"""
    return settings.IMPORTCSV_CLOUD


def is_billing_enabled() -> bool:
    """Check if billing features are enabled"""
    return is_cloud_mode()


def is_usage_limits_enabled() -> bool:
    """Check if usage limits are enforced"""
    return is_cloud_mode()


def get_tier_import_limit(tier: SubscriptionTier) -> int | None:
    """Get the import limit for a subscription tier. None means unlimited."""
    if tier == "free":
        return settings.FREE_TIER_IMPORTS_PER_MONTH
    elif tier == "pro":
        return settings.PRO_TIER_IMPORTS_PER_MONTH
    elif tier == "business":
        return None  # Unlimited
    return settings.FREE_TIER_IMPORTS_PER_MONTH


def get_tier_max_rows(tier: SubscriptionTier) -> int:
    """Get the max rows per import for a subscription tier."""
    if tier == "free":
        return settings.FREE_TIER_MAX_ROWS_PER_IMPORT
    elif tier == "pro":
        return settings.PRO_TIER_MAX_ROWS_PER_IMPORT
    elif tier == "business":
        return settings.BUSINESS_TIER_MAX_ROWS_PER_IMPORT
    return settings.FREE_TIER_MAX_ROWS_PER_IMPORT


def should_show_branding(tier: SubscriptionTier) -> bool:
    """Check if branding should be shown for a tier."""
    return tier == "free"


def get_feature_flags() -> dict:
    """Get all feature flags for client consumption"""
    return {
        "cloud_mode": is_cloud_mode(),
        "billing_enabled": is_billing_enabled(),
        "usage_limits_enabled": is_usage_limits_enabled(),
        "free_tier_imports": settings.FREE_TIER_IMPORTS_PER_MONTH,
    }
```

**Step 2: Verify imports work**

Run:
```bash
cd backend && python -c "from app.core.features import get_tier_import_limit, get_tier_max_rows; print(get_tier_import_limit('pro'), get_tier_max_rows('business'))"
```

Expected: `2000 500000`

**Step 3: Commit**

```bash
git add backend/app/core/features.py
git commit -m "$(cat <<'EOF'
feat(features): add tier-based limit functions

Add functions to get import limits and max rows per tier.
Support free/pro/business tiers with configurable limits.
EOF
)"
```

---

### Task 1.4: Create Database Migration for User Billing Fields

**Files:**
- Create: `backend/migrations/versions/xxxx_add_billing_fields_to_user.py` (Alembic generates ID)

**Step 1: Generate the migration**

Run:
```bash
cd backend && alembic revision -m "add billing fields to user"
```

Note the generated filename.

**Step 2: Edit the migration file**

Replace the upgrade/downgrade functions with:

```python
"""add billing fields to user

Revision ID: [generated]
Revises: 27b7808262f1
Create Date: [generated]

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '[generated]'
down_revision: Union[str, None] = '27b7808262f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add billing fields to users table."""
    op.add_column('users', sa.Column('stripe_customer_id', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('subscription_id', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('subscription_tier', sa.String(20), server_default='free', nullable=False))
    op.add_column('users', sa.Column('subscription_status', sa.String(20), server_default='active', nullable=False))
    op.add_column('users', sa.Column('grace_period_ends_at', sa.DateTime(timezone=True), nullable=True))

    # Add index for Stripe customer lookup
    op.create_index('ix_users_stripe_customer_id', 'users', ['stripe_customer_id'], unique=True)


def downgrade() -> None:
    """Remove billing fields from users table."""
    op.drop_index('ix_users_stripe_customer_id', table_name='users')
    op.drop_column('users', 'grace_period_ends_at')
    op.drop_column('users', 'subscription_status')
    op.drop_column('users', 'subscription_tier')
    op.drop_column('users', 'subscription_id')
    op.drop_column('users', 'stripe_customer_id')
```

**Step 3: Run the migration**

Run:
```bash
cd backend && alembic upgrade head
```

Expected: Migration applies successfully.

**Step 4: Commit**

```bash
git add backend/migrations/versions/
git commit -m "$(cat <<'EOF'
feat(db): add billing fields to users table

Add stripe_customer_id, subscription_id, subscription_tier,
subscription_status, and grace_period_ends_at columns.
EOF
)"
```

---

### Task 1.5: Update User Model

**Files:**
- Modify: `backend/app/models/user.py`

**Step 1: Add the new fields to the User model**

Replace the entire file:

```python
import uuid

from sqlalchemy import Column, String, Boolean, DateTime, UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for OAuth users
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Profile
    profile_image = Column(String, nullable=True)

    # Billing fields
    stripe_customer_id = Column(String(255), unique=True, index=True, nullable=True)
    subscription_id = Column(String(255), nullable=True)
    subscription_tier = Column(String(20), default="free", nullable=False)
    subscription_status = Column(String(20), default="active", nullable=False)
    grace_period_ends_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships - using simple string references
    importers = relationship("Importer", back_populates="user")
    import_jobs = relationship("ImportJob", back_populates="user")
    webhook_events = relationship("WebhookEvent", back_populates="user")
    usage_records = relationship("UsageRecord", back_populates="user")
```

**Step 2: Verify model loads**

Run:
```bash
cd backend && python -c "from app.models.user import User; print(User.subscription_tier)"
```

Expected: `User.subscription_tier`

**Step 3: Commit**

```bash
git add backend/app/models/user.py
git commit -m "$(cat <<'EOF'
feat(model): add billing fields to User model

Add stripe_customer_id, subscription_id, subscription_tier,
subscription_status, and grace_period_ends_at fields.
EOF
)"
```

---

## Phase 2: Billing Service

### Task 2.1: Create Billing Service

**Files:**
- Create: `backend/app/services/billing.py`

**Step 1: Create the billing service file**

```python
"""Billing service for Stripe integration."""

import logging
from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID

import stripe
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.features import SubscriptionTier
from app.models.user import User

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class BillingService:
    """Service for managing Stripe billing operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_or_create_stripe_customer(self, user: User) -> str:
        """Get existing Stripe customer or create a new one."""
        if user.stripe_customer_id:
            return user.stripe_customer_id

        customer = stripe.Customer.create(
            email=user.email,
            name=user.full_name,
            metadata={"user_id": str(user.id)},
        )

        user.stripe_customer_id = customer.id
        self.db.commit()

        logger.info(f"Created Stripe customer {customer.id} for user {user.id}")
        return customer.id

    def create_checkout_session(
        self,
        user: User,
        tier: SubscriptionTier,
        success_url: str,
        cancel_url: str,
    ) -> str:
        """Create a Stripe Checkout session for subscription."""
        customer_id = self.get_or_create_stripe_customer(user)

        price_id = self._get_price_id_for_tier(tier)
        if not price_id:
            raise ValueError(f"No price configured for tier: {tier}")

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": str(user.id), "tier": tier},
        )

        logger.info(f"Created checkout session {session.id} for user {user.id}")
        return session.url

    def create_portal_session(self, user: User, return_url: str) -> str:
        """Create a Stripe Customer Portal session."""
        if not user.stripe_customer_id:
            raise ValueError("User has no Stripe customer ID")

        session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=return_url,
        )

        return session.url

    def get_subscription_status(self, user: User) -> dict:
        """Get the current subscription status for a user."""
        return {
            "tier": user.subscription_tier,
            "status": user.subscription_status,
            "stripe_customer_id": user.stripe_customer_id,
            "subscription_id": user.subscription_id,
            "grace_period_ends_at": user.grace_period_ends_at.isoformat() if user.grace_period_ends_at else None,
            "is_in_grace_period": self._is_in_grace_period(user),
        }

    def update_subscription_from_webhook(
        self,
        stripe_customer_id: str,
        subscription_id: str,
        status: str,
        tier: Optional[SubscriptionTier] = None,
    ) -> Optional[User]:
        """Update user subscription from Stripe webhook."""
        user = self.db.query(User).filter(
            User.stripe_customer_id == stripe_customer_id
        ).first()

        if not user:
            logger.warning(f"No user found for Stripe customer {stripe_customer_id}")
            return None

        user.subscription_id = subscription_id
        user.subscription_status = self._map_stripe_status(status)

        if tier:
            user.subscription_tier = tier

        # Clear grace period if payment succeeded
        if status == "active":
            user.grace_period_ends_at = None

        self.db.commit()
        logger.info(f"Updated subscription for user {user.id}: status={status}, tier={tier}")

        return user

    def start_grace_period(self, stripe_customer_id: str) -> Optional[User]:
        """Start grace period for failed payment."""
        user = self.db.query(User).filter(
            User.stripe_customer_id == stripe_customer_id
        ).first()

        if not user:
            return None

        user.subscription_status = "past_due"
        user.grace_period_ends_at = datetime.now(timezone.utc) + timedelta(
            days=settings.PAYMENT_GRACE_PERIOD_DAYS
        )

        self.db.commit()
        logger.info(f"Started grace period for user {user.id}, ends at {user.grace_period_ends_at}")

        return user

    def end_grace_period(self, user: User) -> None:
        """End grace period and downgrade to free tier."""
        user.subscription_tier = "free"
        user.subscription_status = "canceled"
        user.subscription_id = None
        user.grace_period_ends_at = None

        self.db.commit()
        logger.info(f"Grace period ended for user {user.id}, downgraded to free tier")

    def _is_in_grace_period(self, user: User) -> bool:
        """Check if user is currently in grace period."""
        if not user.grace_period_ends_at:
            return False
        return datetime.now(timezone.utc) < user.grace_period_ends_at

    def _get_price_id_for_tier(self, tier: SubscriptionTier) -> Optional[str]:
        """Get Stripe price ID for a tier."""
        if tier == "pro":
            return settings.STRIPE_PRICE_ID_PRO
        elif tier == "business":
            return settings.STRIPE_PRICE_ID_BUSINESS
        return None

    def _map_stripe_status(self, stripe_status: str) -> str:
        """Map Stripe subscription status to our status."""
        mapping = {
            "active": "active",
            "past_due": "past_due",
            "canceled": "canceled",
            "unpaid": "past_due",
            "incomplete": "past_due",
            "incomplete_expired": "canceled",
            "trialing": "active",
            "paused": "paused",
        }
        return mapping.get(stripe_status, "active")
```

**Step 2: Verify the service imports correctly**

Run:
```bash
cd backend && python -c "from app.services.billing import BillingService; print('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
git add backend/app/services/billing.py
git commit -m "$(cat <<'EOF'
feat(billing): add billing service for Stripe integration

Implements checkout session creation, portal session, subscription
status tracking, and webhook handlers for payment events.
EOF
)"
```

---

### Task 2.2: Create Email Service

**Files:**
- Create: `backend/app/services/email.py`

**Step 1: Create the email service file**

```python
"""Email service for transactional emails using Resend."""

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
        return self._send(
            to=to_email,
            subject="Welcome to ImportCSV!",
            html=f"""
            <h1>Welcome to ImportCSV{f', {name}' if name else ''}!</h1>
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
```

**Step 2: Verify the service imports correctly**

Run:
```bash
cd backend && python -c "from app.services.email import email_service; print('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
git add backend/app/services/email.py
git commit -m "$(cat <<'EOF'
feat(email): add email service using Resend

Implements transactional emails for welcome, usage warnings,
grace period reminders, and subscription confirmations.
EOF
)"
```

---

## Phase 3: Billing API

### Task 3.1: Create Billing API Endpoints

**Files:**
- Create: `backend/app/api/v1/billing.py`

**Step 1: Create the billing API file**

```python
"""Billing API endpoints for subscription management."""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
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


class CheckoutRequest(BaseModel):
    tier: SubscriptionTier
    success_url: str
    cancel_url: str


class PortalRequest(BaseModel):
    return_url: str


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
```

**Step 2: Verify the API file imports correctly**

Run:
```bash
cd backend && python -c "from app.api.v1.billing import router; print('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
git add backend/app/api/v1/billing.py
git commit -m "$(cat <<'EOF'
feat(api): add billing API endpoints

Add /billing/subscription, /billing/checkout, and /billing/portal
endpoints for subscription management. All gated behind cloud mode.
EOF
)"
```

---

### Task 3.2: Create Stripe Webhook Handler

**Files:**
- Create: `backend/app/api/v1/webhooks.py`

**Step 1: Create the webhook handler file**

```python
"""Webhook handlers for external services."""

import logging
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session

import stripe

from app.db.base import get_db
from app.core.config import settings
from app.core.features import is_cloud_mode
from app.services.billing import BillingService
from app.services.email import email_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events."""
    if not is_cloud_mode():
        raise HTTPException(status_code=404, detail="Not available")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing signature")

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            settings.STRIPE_WEBHOOK_SECRET,
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    billing = BillingService(db)

    # Handle the event
    event_type = event["type"]
    data = event["data"]["object"]

    logger.info(f"Received Stripe webhook: {event_type}")

    if event_type == "checkout.session.completed":
        await handle_checkout_completed(billing, data)

    elif event_type == "customer.subscription.updated":
        await handle_subscription_updated(billing, data)

    elif event_type == "customer.subscription.deleted":
        await handle_subscription_deleted(billing, data)

    elif event_type == "invoice.payment_failed":
        await handle_payment_failed(billing, data)

    elif event_type == "invoice.payment_succeeded":
        await handle_payment_succeeded(billing, data)

    return {"status": "ok"}


async def handle_checkout_completed(billing: BillingService, session: dict):
    """Handle successful checkout session."""
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    tier = session.get("metadata", {}).get("tier", "pro")

    if not customer_id or not subscription_id:
        logger.warning("Checkout completed but missing customer or subscription")
        return

    user = billing.update_subscription_from_webhook(
        stripe_customer_id=customer_id,
        subscription_id=subscription_id,
        status="active",
        tier=tier,
    )

    if user:
        email_service.send_upgrade_confirmation(user.email, tier)


async def handle_subscription_updated(billing: BillingService, subscription: dict):
    """Handle subscription update."""
    customer_id = subscription.get("customer")
    subscription_id = subscription.get("id")
    status = subscription.get("status")

    # Determine tier from price
    tier = None
    items = subscription.get("items", {}).get("data", [])
    if items:
        price_id = items[0].get("price", {}).get("id")
        if price_id == settings.STRIPE_PRICE_ID_PRO:
            tier = "pro"
        elif price_id == settings.STRIPE_PRICE_ID_BUSINESS:
            tier = "business"

    billing.update_subscription_from_webhook(
        stripe_customer_id=customer_id,
        subscription_id=subscription_id,
        status=status,
        tier=tier,
    )


async def handle_subscription_deleted(billing: BillingService, subscription: dict):
    """Handle subscription cancellation."""
    customer_id = subscription.get("customer")
    subscription_id = subscription.get("id")

    user = billing.update_subscription_from_webhook(
        stripe_customer_id=customer_id,
        subscription_id=subscription_id,
        status="canceled",
        tier="free",
    )

    if user:
        email_service.send_subscription_paused(user.email)


async def handle_payment_failed(billing: BillingService, invoice: dict):
    """Handle failed payment - start grace period."""
    customer_id = invoice.get("customer")

    user = billing.start_grace_period(customer_id)

    if user and user.grace_period_ends_at:
        from datetime import datetime, timezone
        days_left = (user.grace_period_ends_at - datetime.now(timezone.utc)).days
        email_service.send_grace_period_reminder(
            user.email,
            days_left,
            f"{settings.FRONTEND_URL}/settings/billing",
        )


async def handle_payment_succeeded(billing: BillingService, invoice: dict):
    """Handle successful payment - clear grace period."""
    customer_id = invoice.get("customer")
    subscription_id = invoice.get("subscription")

    if subscription_id:
        billing.update_subscription_from_webhook(
            stripe_customer_id=customer_id,
            subscription_id=subscription_id,
            status="active",
        )
```

**Step 2: Verify the webhook file imports correctly**

Run:
```bash
cd backend && python -c "from app.api.v1.webhooks import router; print('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
git add backend/app/api/v1/webhooks.py
git commit -m "$(cat <<'EOF'
feat(api): add Stripe webhook handler

Handle checkout.session.completed, subscription updated/deleted,
and payment succeeded/failed events. Triggers email notifications.
EOF
)"
```

---

### Task 3.3: Register New Routes

**Files:**
- Modify: `backend/app/api/v1/routes.py`

**Step 1: Find the routes file and check its current structure**

Read the file first to understand its structure.

**Step 2: Add the new routers**

Add imports and router includes for billing and webhooks:

```python
from app.api.v1 import billing, webhooks

# Add these lines where other routers are included:
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
```

**Step 3: Verify routes are registered**

Run:
```bash
cd backend && python -c "from app.api.v1.routes import api_router; print([r.path for r in api_router.routes])"
```

Expected: Should include `/billing` and `/webhooks` prefixed routes.

**Step 4: Commit**

```bash
git add backend/app/api/v1/routes.py
git commit -m "$(cat <<'EOF'
feat(api): register billing and webhook routes

Add /api/v1/billing and /api/v1/webhooks endpoints.
EOF
)"
```

---

## Phase 4: Update Usage Enforcement

### Task 4.1: Update Usage Service for Tier-Based Limits

**Files:**
- Modify: `backend/app/services/usage.py`

**Step 1: Update the imports and functions**

Add these new functions to the existing file:

```python
from app.core.features import (
    is_usage_limits_enabled,
    get_tier_import_limit,
    get_tier_max_rows,
)
from app.models.user import User


def get_user_limits(db: Session, user_id: UUID) -> dict:
    """Get the current limits for a user based on their tier."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        # Default to free tier limits
        tier = "free"
    else:
        tier = user.subscription_tier

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
```

**Step 2: Update `check_and_increment_usage` to use tier-based limits**

Find the existing `check_and_increment_usage` function and update it:

```python
def check_and_increment_usage(
    db: Session,
    user_id: UUID,
    rows: int = 0,
    user: Optional[User] = None,
) -> tuple[bool, int, int | None]:
    """Atomically check limit and increment if allowed.

    Returns: (limit_exceeded, new_count, limit)
    """
    period = get_current_period()

    # Ensure record exists
    get_or_create_usage_record(db, user_id, period)

    if not is_usage_limits_enabled():
        # Still track usage even when limits disabled
        record = increment_usage(db, user_id, rows)
        return False, record.import_count, None

    # Get user for tier-based limits
    if user is None:
        user = db.query(User).filter(User.id == user_id).first()

    tier = user.subscription_tier if user else "free"
    limit = get_tier_import_limit(tier)

    if limit is None:  # Unlimited tier
        record = increment_usage(db, user_id, rows)
        return False, record.import_count, None

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
```

**Step 3: Verify changes**

Run:
```bash
cd backend && python -c "from app.services.usage import get_user_limits, check_rows_limit; print('OK')"
```

Expected: `OK`

**Step 4: Commit**

```bash
git add backend/app/services/usage.py
git commit -m "$(cat <<'EOF'
feat(usage): add tier-based limit checking

Add get_user_limits and check_rows_limit functions.
Update check_and_increment_usage to use tier-based limits.
EOF
)"
```

---

### Task 4.2: Update Import Endpoint to Check Rows Limit

**Files:**
- Modify: `backend/app/api/v1/imports.py`

**Step 1: Add rows limit check to the import endpoints**

Find the `create_import_job` function and add rows limit check after parsing column_mapping:

```python
from app.services.usage import check_and_increment_usage, check_rows_limit
from app.core.features import is_cloud_mode

# In create_import_job, after calculating total_rows:
        # Check rows per import limit (cloud mode only)
        if is_cloud_mode():
            rows_exceeded, max_rows = check_rows_limit(db, current_user, total_rows)
            if rows_exceeded:
                raise HTTPException(
                    status_code=400,
                    detail=f"Import exceeds maximum rows per import ({total_rows:,} rows, limit is {max_rows:,}). Upgrade your plan for higher limits."
                )
```

**Step 2: Add same check to `process_import_by_key`**

Find the key-based import endpoint and add the same check.

**Step 3: Commit**

```bash
git add backend/app/api/v1/imports.py
git commit -m "$(cat <<'EOF'
feat(imports): add rows-per-import limit enforcement

Check max rows per import based on user's subscription tier.
Block imports that exceed the tier limit.
EOF
)"
```

---

## Phase 5: Importer Config Endpoint

### Task 5.1: Add Config Endpoint for Embeddable Importer

**Files:**
- Modify: `backend/app/api/v1/imports.py`

**Step 1: Add a new endpoint after the existing `/key/schema` endpoint**

```python
@key_router.get("/config")
async def get_importer_config(
    importer_key: uuid.UUID,
    db: Session = Depends(get_db),
):
    """
    Get configuration for an importer including billing/limit info.

    This endpoint returns the importer config along with:
    - Whether to show branding
    - Current usage limits
    - Tier information

    Used by the embedded importer to configure itself.
    """
    from app.core.features import (
        is_cloud_mode,
        get_tier_import_limit,
        get_tier_max_rows,
        should_show_branding,
    )
    from app.services.usage import get_usage_for_period

    # Find the importer by key
    importer = get_importer_by_key(db, importer_key)
    user = db.query(User).filter(User.id == importer.user_id).first()

    # Default config for non-cloud mode
    if not is_cloud_mode():
        return {
            "importer_id": str(importer.id),
            "show_branding": False,
            "tier": None,
            "limits": None,
        }

    tier = user.subscription_tier if user else "free"
    usage = get_usage_for_period(db, user.id) if user else {}
    import_limit = get_tier_import_limit(tier)

    return {
        "importer_id": str(importer.id),
        "show_branding": should_show_branding(tier),
        "tier": tier,
        "limits": {
            "imports_used": usage.get("import_count", 0),
            "imports_limit": import_limit,
            "imports_remaining": max(0, import_limit - usage.get("import_count", 0)) if import_limit else None,
            "max_rows_per_import": get_tier_max_rows(tier),
            "limit_reached": usage.get("limit_reached", False),
        },
    }
```

**Step 2: Verify the endpoint**

Run:
```bash
cd backend && python -c "from app.api.v1.imports import key_router; print([r.path for r in key_router.routes])"
```

Expected: Should include `/config`

**Step 3: Commit**

```bash
git add backend/app/api/v1/imports.py
git commit -m "$(cat <<'EOF'
feat(api): add importer config endpoint

Add GET /imports/key/config endpoint returning branding settings,
tier info, and usage limits for the embedded importer.
EOF
)"
```

---

## Phase 6: Admin Dashboard Billing UI

### Task 6.1: Create Billing Settings Page

**Files:**
- Create: `admin/src/app/(dashboard)/settings/billing/page.tsx`

**Step 1: Create the billing page**

```tsx
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, ExternalLink, AlertTriangle, Check } from "lucide-react";
import useSWR from "swr";
import { api } from "@/lib/api";

interface SubscriptionData {
  tier: "free" | "pro" | "business";
  status: string;
  is_in_grace_period: boolean;
  grace_period_ends_at: string | null;
  usage: {
    imports: number;
    import_limit: number | null;
    imports_remaining: number | null;
  };
  limits: {
    imports_per_month: number | null;
    max_rows_per_import: number;
  };
}

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function BillingPage() {
  const { data, error, isLoading } = useSWR<SubscriptionData>(
    "/billing/subscription",
    fetcher
  );
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async (tier: "pro" | "business") => {
    setUpgrading(true);
    try {
      const response = await api.post("/billing/checkout", {
        tier,
        success_url: `${window.location.origin}/settings/billing?success=true`,
        cancel_url: `${window.location.origin}/settings/billing?canceled=true`,
      });
      window.location.href = response.data.checkout_url;
    } catch (err) {
      console.error("Checkout failed:", err);
      setUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await api.post("/billing/portal", {
        return_url: `${window.location.origin}/settings/billing`,
      });
      window.location.href = response.data.portal_url;
    } catch (err) {
      console.error("Portal failed:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading billing information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load billing information. Billing may not be enabled.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const subscription = data!;
  const usagePercent = subscription.usage.import_limit
    ? Math.round((subscription.usage.imports / subscription.usage.import_limit) * 100)
    : 0;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscription and usage</p>
      </div>

      {/* Grace Period Warning */}
      {subscription.is_in_grace_period && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Payment failed.</strong> Update your payment method by{" "}
            {new Date(subscription.grace_period_ends_at!).toLocaleDateString()} to
            avoid service interruption.
            <Button
              variant="link"
              className="text-orange-800 underline p-0 h-auto ml-2"
              onClick={handleManageBilling}
            >
              Update payment method
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Current Plan</h2>
            <p className="text-2xl font-bold capitalize mt-1">
              {subscription.tier}
              {subscription.tier !== "free" && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ${subscription.tier === "pro" ? "49" : "149"}/month
                </span>
              )}
            </p>
          </div>
          {subscription.tier !== "free" && (
            <Button variant="outline" onClick={handleManageBilling}>
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Billing
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          )}
        </div>

        {/* Usage Bar */}
        {subscription.usage.import_limit && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Monthly imports</span>
              <span>
                {subscription.usage.imports.toLocaleString()} /{" "}
                {subscription.usage.import_limit.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  usagePercent >= 90
                    ? "bg-red-500"
                    : usagePercent >= 70
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          Max {subscription.limits.max_rows_per_import.toLocaleString()} rows per import
        </div>
      </Card>

      {/* Upgrade Options */}
      {subscription.tier === "free" && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-6 border-blue-200">
            <h3 className="text-lg font-semibold">Pro</h3>
            <p className="text-3xl font-bold mt-2">
              $49<span className="text-sm font-normal text-gray-500">/mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                2,000 imports/month
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                100,000 rows per import
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Remove branding
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Custom CSS
              </li>
            </ul>
            <Button
              className="w-full mt-6"
              onClick={() => handleUpgrade("pro")}
              disabled={upgrading}
            >
              {upgrading ? "Redirecting..." : "Upgrade to Pro"}
            </Button>
          </Card>

          <Card className="p-6 border-purple-200">
            <h3 className="text-lg font-semibold">Business</h3>
            <p className="text-3xl font-bold mt-2">
              $149<span className="text-sm font-normal text-gray-500">/mo</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Unlimited imports
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                500,000 rows per import
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Remove branding
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Custom CSS
              </li>
            </ul>
            <Button
              className="w-full mt-6"
              variant="outline"
              onClick={() => handleUpgrade("business")}
              disabled={upgrading}
            >
              {upgrading ? "Redirecting..." : "Upgrade to Business"}
            </Button>
          </Card>
        </div>
      )}

      {subscription.tier === "pro" && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold">Need more?</h3>
          <p className="text-gray-500 mt-1">
            Upgrade to Business for unlimited imports and higher row limits.
          </p>
          <Button
            className="mt-4"
            onClick={() => handleUpgrade("business")}
            disabled={upgrading}
          >
            {upgrading ? "Redirecting..." : "Upgrade to Business - $149/mo"}
          </Button>
        </Card>
      )}
    </div>
  );
}
```

**Step 2: Verify the page compiles**

Run:
```bash
cd admin && npm run build
```

Expected: Build succeeds.

**Step 3: Commit**

```bash
git add admin/src/app/\(dashboard\)/settings/billing/page.tsx
git commit -m "$(cat <<'EOF'
feat(admin): add billing settings page

Show current plan, usage bar, and upgrade options.
Integrate with Stripe Checkout and Customer Portal.
EOF
)"
```

---

### Task 6.2: Update Settings Page with Navigation

**Files:**
- Modify: `admin/src/app/(dashboard)/settings/page.tsx`

**Step 1: Update the settings page to link to billing**

```tsx
"use client";

import { Card } from "@/components/ui/card";
import { Settings, CreditCard, User, Bell } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
        <Link href="/settings/billing">
          <Card className="p-6 hover:border-blue-300 transition-colors cursor-pointer">
            <CreditCard className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="text-lg font-medium">Billing</h3>
            <p className="text-gray-500 text-sm mt-1">
              Manage subscription and payment
            </p>
          </Card>
        </Link>

        <Card className="p-6 opacity-50">
          <User className="w-8 h-8 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium">Profile</h3>
          <p className="text-gray-500 text-sm mt-1">Coming soon</p>
        </Card>

        <Card className="p-6 opacity-50">
          <Bell className="w-8 h-8 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium">Notifications</h3>
          <p className="text-gray-500 text-sm mt-1">Coming soon</p>
        </Card>

        <Card className="p-6 opacity-50">
          <Settings className="w-8 h-8 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium">Preferences</h3>
          <p className="text-gray-500 text-sm mt-1">Coming soon</p>
        </Card>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add admin/src/app/\(dashboard\)/settings/page.tsx
git commit -m "$(cat <<'EOF'
feat(admin): update settings page with billing link

Add card-based navigation to billing and placeholder sections.
EOF
)"
```

---

## Phase 7: Environment Setup

### Task 7.1: Update Environment Example

**Files:**
- Modify: `backend/.env.example`

**Step 1: Add the new environment variables**

Add these lines to the `.env.example` file:

```bash
# Cloud Mode (set to true for hosted version)
IMPORTCSV_CLOUD=false

# Stripe (required if IMPORTCSV_CLOUD=true)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_BUSINESS=price_...

# Resend (required if IMPORTCSV_CLOUD=true)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Usage Limits
FREE_TIER_IMPORTS_PER_MONTH=100
PRO_TIER_IMPORTS_PER_MONTH=2000
FREE_TIER_MAX_ROWS_PER_IMPORT=10000
PRO_TIER_MAX_ROWS_PER_IMPORT=100000
BUSINESS_TIER_MAX_ROWS_PER_IMPORT=500000
PAYMENT_GRACE_PERIOD_DAYS=7
```

**Step 2: Commit**

```bash
git add backend/.env.example
git commit -m "$(cat <<'EOF'
docs: add billing environment variables to .env.example

Document Stripe, Resend, and tier limit configuration options.
EOF
)"
```

---

## Phase 8: Final Integration

### Task 8.1: Create Grace Period Checker Job

**Files:**
- Create: `backend/app/workers/grace_period_worker.py`

**Step 1: Create the worker file**

```python
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
                email_service.send_grace_period_reminder(
                    user.email,
                    days_left,
                    f"{settings.FRONTEND_URL}/settings/billing",
                )

        logger.info(f"Processed {len(users_in_grace)} users in grace period")

    finally:
        db.close()


if __name__ == "__main__":
    check_grace_periods()
```

**Step 2: Commit**

```bash
git add backend/app/workers/grace_period_worker.py
git commit -m "$(cat <<'EOF'
feat(worker): add grace period checker job

Daily job to process expired grace periods and send reminder emails.
Run via: python -m app.workers.grace_period_worker
EOF
)"
```

---

### Task 8.2: Final Verification

**Step 1: Run the test suite**

Run:
```bash
cd backend && pytest
```

Expected: All existing tests pass.

**Step 2: Verify API starts correctly**

Run:
```bash
cd backend && uvicorn app.main:app --reload
```

Expected: Server starts without errors.

**Step 3: Verify admin builds**

Run:
```bash
cd admin && npm run build
```

Expected: Build succeeds.

**Step 4: Final commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat: complete Stripe billing integration

Add complete billing system with:
- Stripe integration for payments
- Tiered pricing (Free/Pro/Business)
- Usage tracking and limits
- Email notifications via Resend
- Admin billing UI
- Grace period handling
EOF
)"
```

---

## Summary

This plan implements:

1. **Backend Infrastructure**
   - Stripe SDK integration
   - Resend email service
   - Database schema for billing fields
   - Feature flags for tier-based limits

2. **Billing API**
   - Subscription status endpoint
   - Checkout session creation
   - Customer portal integration
   - Stripe webhook handler

3. **Usage Enforcement**
   - Tier-based import limits
   - Rows-per-import limits
   - Importer config endpoint for branding

4. **Admin UI**
   - Billing settings page
   - Usage visualization
   - Upgrade flow

5. **Email System**
   - Welcome emails
   - Usage warnings
   - Grace period reminders

6. **Background Jobs**
   - Grace period checker
