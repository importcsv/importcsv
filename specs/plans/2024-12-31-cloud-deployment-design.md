# ImportCSV Cloud Deployment Design

**Date:** 2024-12-31
**Status:** Approved
**Author:** Brainstorming session

---

## Overview

Deploy ImportCSV Cloud to production with:
- Supabase (Postgres)
- Redis container in Porter
- Stripe billing integration
- Automated NPM publishing

---

## Infrastructure

### Supabase (Postgres)
- Create new Supabase project
- Get connection string from Settings → Database → Connection string (URI)
- Use "Transaction" pooler mode for serverless compatibility

### Redis (in Porter)
- Add Redis as a container service in Porter dashboard
- Internal URL: `redis://redis:6379`
- No external vendor needed

### Domains (already configured)
- `api.importcsv.com` → Backend
- `app.importcsv.com` → Admin dashboard

---

## Clerk Cleanup

### Files to DELETE (backend)
- `backend/app/services/clerk_user.py`
- `backend/app/api/v1/clerk.py`
- `backend/app/auth/clerk.py`

### Files to DELETE (frontend)
- `admin/src/app/sign-in/[[...sign-in]]/page.tsx`
- `admin/src/app/sign-up/[[...sign-up]]/page.tsx`
- `admin/src/components/auth/UserButton.tsx`
- `admin/src/components/auth/UserProfile.tsx`
- `admin/src/components/auth/SignIn.tsx`
- `admin/src/components/auth/SignUp.tsx`
- `admin/src/context/AuthContext.tsx` (if replaced by new auth)
- `admin/src/components/ApiProvider.tsx` (if replaced)

### Files to MODIFY
- `admin/Dockerfile` - Remove Clerk env vars
- `admin/package.json` - Remove `@clerk/*` dependencies
- `backend/.env.example` - Remove Clerk vars
- `backend/app/core/config.py` - Remove Clerk settings
- `backend/app/api/routes.py` - Remove Clerk router
- Docs files with Clerk references

### Keep but verify
- `admin/src/middleware.ts` - Should use cookie-based auth now
- `admin/src/app/layout.tsx` - Should not have ClerkProvider

---

## Stripe Production Setup

### 1. Stripe Dashboard Setup
- Create products: "ImportCSV Pro" and "ImportCSV Business"
- Create prices: $49/mo (Pro) and $149/mo (Business) - recurring
- Copy the Price IDs (`price_xxx`)

### 2. Webhook Setup
- Go to Developers → Webhooks → Add endpoint
- URL: `https://api.importcsv.com/api/v1/webhooks/stripe`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
  - `invoice.payment_succeeded`
- Copy the Webhook Secret (`whsec_xxx`)

### 3. API Keys
- Get your **live** Secret Key (`sk_live_xxx`) from Developers → API Keys

### 4. Resend Setup (for emails)
- Create Resend account at resend.com
- Verify your domain (importcsv.com)
- Get API key (`re_xxx`)

---

## Porter Environment Variables

### Remove (Clerk - dead code)
```
CLERK_WEBHOOK_SECRET
CLERK_JWT_PUBLIC_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
```

### Backend Environment Variables
```
DATABASE_URL=postgresql://xxx@xxx.supabase.co:5432/postgres
REDIS_URL=redis://redis:6379
SECRET_KEY=<generate-secure-32-char-string>
FRONTEND_URL=https://app.importcsv.com
ENVIRONMENT=production
IMPORTCSV_CLOUD=true

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID_PRO=price_xxx
STRIPE_PRICE_ID_BUSINESS=price_xxx

# Resend
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@importcsv.com

# OAuth (if using Google/GitHub login)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

### Admin Environment Variables
```
NEXT_PUBLIC_BACKEND_URL=https://api.importcsv.com
```

---

## NPM Publishing Automation

### GitHub Action (`.github/workflows/npm-publish.yml`)

```yaml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Build packages
        run: cd frontend && npm run build:react && npm run build:preact

      - name: Publish React package
        run: cd frontend && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Setup
1. Get NPM access token from npmjs.com → Access Tokens → Generate (Automation type)
2. Add `NPM_TOKEN` to GitHub repo secrets

### Usage
```bash
cd frontend
npm version patch  # or minor/major
git push && git push --tags
```

---

## Deployment Steps

### Pre-deploy (one-time setup)

1. **Supabase:**
   - Create project → copy connection string
   - Note: Use "Transaction" pooler for connection string

2. **Porter:**
   - Add Redis container service (if not exists)
   - Update all environment variables
   - Verify pre-deploy job is set to `bash ./scripts/deploy.sh`

3. **Stripe:**
   - Create products/prices → copy price IDs
   - Add webhook endpoint → copy secret

4. **Resend:**
   - Verify domain → get API key

5. **GitHub:**
   - Add `NPM_TOKEN` secret for npm publishing

### Deploy sequence

1. Clean up Clerk code → commit
2. Update Dockerfile to remove Clerk env vars → commit
3. Push to main
4. Porter auto-deploys:
   - Pre-deploy job runs migrations on fresh Supabase DB
   - Backend, Worker, Admin containers start
5. Verify:
   - `https://api.importcsv.com/docs` loads
   - `https://app.importcsv.com` loads
   - Sign up / sign in works
   - Create importer works

---

## Database Migration Note

Since the production database is being reset with a fresh Supabase instance, all Alembic migrations will apply cleanly on first deploy via the pre-deploy job (`./scripts/deploy.sh` runs `alembic upgrade head`).

---

## Related Specs

- Auth migration: `/specs/2025-12-17-backend-driven-auth-migration.md`
- Billing implementation: `/specs/plans/2024-12-30-stripe-billing-implementation.md`
