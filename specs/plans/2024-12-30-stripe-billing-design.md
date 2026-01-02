# Stripe Billing Integration Design

> **Design Document** — Created via brainstorming session

## Overview

Add Stripe billing to the cloud version of ImportCSV. Self-hosted version remains free and unlimited. Cloud mode is controlled by the `IMPORTCSV_CLOUD` environment flag.

## Pricing Tiers

| Tier | Price | Imports/mo | Rows/import | Branding | Custom CSS |
|------|-------|------------|-------------|----------|------------|
| **Free** | $0 | 100 | 10,000 | ImportCSV badge | ❌ |
| **Pro** | $49/mo | 2,000 | 100,000 | Removable | ✅ |
| **Business** | $149/mo | Unlimited | 500,000 | Removable | ✅ |

## Key Decisions

### Billing Model
- **Per-user billing** (no organizations/teams)
- **Monthly only** (annual can be added later)
- **Soft block on limit** — upgrade prompt, no auto-charges

### Payment Flow
- **Stripe Checkout (hosted)** — users redirected to Stripe for payment
- **Stripe Customer Portal** — for managing payment methods, cancellation
- **Hybrid dashboard** — show status/usage in app, link to Portal for changes

### Failed Payments
- **7-day grace period** — service continues, warning banners shown
- **Email reminders** — day 1, 4, 7
- **After grace expires** — downgrade to free tier, block until payment updated

### Branding
- **Free tier (cloud)** — "Powered by ImportCSV" badge in importer footer
- **Paid tiers** — badge removable
- **Frontend-only mode** — no badge (open source, no cloud connection)

### Admin Capabilities
- **View only** — subscription status, usage stats
- **Management via Stripe dashboard** — refunds, tier overrides

## Database Schema

**User table additions:**

```python
stripe_customer_id: str | None      # Stripe customer ID (cus_xxx)
subscription_id: str | None         # Stripe subscription ID (sub_xxx)
subscription_tier: str = "free"     # "free" | "pro" | "business"
subscription_status: str = "active" # "active" | "past_due" | "canceled" | "paused"
grace_period_ends_at: datetime | None  # When grace period expires
```

**UsageRecord table additions:**

```python
max_rows_in_single_import: int = 0  # Track largest import this period
```

## API Endpoints

### New Billing Endpoints

```
GET  /api/v1/billing/subscription   → Current subscription status, tier, usage
POST /api/v1/billing/checkout       → Create Stripe Checkout session, return URL
POST /api/v1/billing/portal         → Create Stripe Portal session, return URL
POST /api/v1/webhooks/stripe        → Handle Stripe events (signature verified)
```

### Updated Endpoints

```
GET  /api/v1/importers/{key}/config → Add: showBranding, tier, limits
POST /api/v1/imports/               → Add: check tier limits before processing
```

### Stripe Webhook Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create/update subscription, set tier |
| `customer.subscription.updated` | Update tier, status |
| `customer.subscription.deleted` | Set tier to free |
| `invoice.payment_failed` | Set status to past_due, set grace_period_ends_at |
| `invoice.payment_succeeded` | Clear grace period, set status to active |

## Email System

**Provider:** Resend

**Emails we send:**

| Email | Trigger |
|-------|---------|
| Welcome | User signs up |
| Usage warning (80%) | Usage check |
| Limit reached | Usage check |
| Grace period (day 1, 4, 7) | Stripe webhook / scheduled job |
| Subscription paused | Grace period expires |
| Upgrade confirmation | Stripe webhook |

**Stripe sends:** Receipts, invoice PDFs, renewal confirmations

## Cloud Mode Gating

All billing features gated behind `IMPORTCSV_CLOUD=true`:

| Feature | Cloud OFF | Cloud ON |
|---------|-----------|----------|
| Usage tracking | Disabled | Enforced |
| Import limits | Unlimited | Per tier |
| Branding badge | Never | Free tier |
| Billing endpoints | 404 | Active |
| Stripe webhooks | 404 | Active |

## UI Changes

### Admin Dashboard

- New `/settings/billing` page
- Current plan card with usage bar
- Upgrade button → Stripe Checkout
- Manage Billing button → Stripe Portal
- Warning banners for grace period / limit reached

### Embeddable Importer

- Fetch config on init (when importerKey present)
- Show limit-reached message when blocked
- "Powered by ImportCSV" badge (conditional on tier)

## Implementation Phases

1. **Foundation** — Stripe/Resend SDKs, database migration, services
2. **Billing API** — subscription, checkout, portal, webhooks
3. **Limit Enforcement** — usage checks, tier validation
4. **Admin Dashboard** — billing UI, banners
5. **Embeddable Importer** — config fetch, branding badge
6. **Email & Polish** — templates, scheduled jobs, testing
