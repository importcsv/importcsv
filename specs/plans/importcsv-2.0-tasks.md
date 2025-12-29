# ImportCSV 2.0 Implementation Tasks

## PHASE 0: Authentication Migration

### Task 1: Add Backend Auth Dependencies
Add authlib, itsdangerous, httpx to backend/requirements.txt and install.
labels: phase-0, auth, backend
priority: 1

### Task 2: Add Auth Configuration Settings
Add FRONTEND_URL, OAuth provider settings, and cookie settings to backend config.
labels: phase-0, auth, backend, config
priority: 1

### Task 3: Update JWT Verification for Cookie + Header Auth
Update jwt_auth.py to support both Authorization header and cookie authentication.
labels: phase-0, auth, backend
priority: 1

### Task 4: Add Cookie Helper to Auth Endpoints
Add set_auth_cookie and clear_auth_cookie helpers, update login endpoint, add logout endpoint.
labels: phase-0, auth, backend
priority: 1

### Task 5: Create OAuth Endpoints
Create auth_oauth.py with Google and GitHub OAuth using Authlib.
labels: phase-0, auth, backend, oauth
priority: 1

### Task 6: Register OAuth Routes
Register OAuth router in routes.py and verify endpoints work.
labels: phase-0, auth, backend
priority: 1

### Task 7: Verify Backend Auth Phase Complete
Run tests, manual cookie auth verification.
labels: phase-0, auth, backend, testing
priority: 1

### Task 8: Create Frontend Auth Helper
Create admin/src/lib/auth.ts with signIn, signOut, getProviders for backend-driven auth.
labels: phase-0, auth, frontend
priority: 1

### Task 9: Create useUser Hook
Create admin/src/hooks/useUser.ts with SWR for user state management.
labels: phase-0, auth, frontend
priority: 1

### Task 10: Update API Client for Cookie Auth
Simplify apiClient to use withCredentials for cookie auth, add 401 redirect.
labels: phase-0, auth, frontend
priority: 1

### Task 11: Update Frontend Middleware
Update middleware.ts for cookie-based auth checking.
labels: phase-0, auth, frontend
priority: 1

### Task 12: Update Sign In Page
Replace NextAuth signin page with backend-driven auth version.
labels: phase-0, auth, frontend
priority: 1

### Task 13: Update Layout - Remove NextAuth Provider
Remove NextAuthProvider and ApiProvider from layout.tsx.
labels: phase-0, auth, frontend
priority: 1

### Task 14: Update Importers Page - Replace useSession
Replace useSession with useUser hook in importers page.
labels: phase-0, auth, frontend
priority: 1

### Task 15: Remove NextAuth Dependencies
Delete NextAuth files and uninstall next-auth package.
labels: phase-0, auth, frontend, cleanup
priority: 1

### Task 16: Auth Migration Testing Gate
Run all tests, typecheck, manual E2E verification of auth flows.
labels: phase-0, auth, testing
priority: 1

## PHASE 1: Cloud Features

### Task 17: Cloud Mode Configuration
Add IMPORTCSV_CLOUD and Stripe settings to backend, create frontend feature flags.
labels: phase-1, cloud, config
priority: 2

### Task 18: Backend Feature Gating Utility
Create backend/app/core/features.py for feature flag checking.
labels: phase-1, cloud, backend
priority: 2

### Task 19: API Key Database Model
Create APIKey model and migration.
labels: phase-1, api-keys, backend, database
priority: 2

### Task 20: API Key Service & Endpoints
Create api_keys.py endpoints for CRUD operations on API keys.
labels: phase-1, api-keys, backend
priority: 2

### Task 21: Usage Tracking Model & Service
Create Usage model and UsageService for tracking imports.
labels: phase-1, usage, backend, database
priority: 2

### Task 22: Usage Endpoints
Create usage.py endpoints for usage stats and checking limits.
labels: phase-1, usage, backend
priority: 2

### Task 23: Extend Admin API Client
Add apiKeysApi and usageApi to frontend apiClient.
labels: phase-1, frontend, api
priority: 2

### Task 24: Dashboard Home Page
Create dashboard home with usage stats, API keys preview, recent imports.
labels: phase-1, dashboard, frontend
priority: 2

### Task 25: API Keys Page
Create API keys management page with create, revoke, copy functionality.
labels: phase-1, api-keys, frontend
priority: 2

### Task 26: Import History Page
Create import history page with filters, search, and date range.
labels: phase-1, imports, frontend
priority: 2

### Task 27: Sidebar Navigation
Create collapsible sidebar navigation component.
labels: phase-1, dashboard, frontend
priority: 2

### Task 28: Dashboard Layout with Sidebar
Create dashboard layout with sidebar and content area.
labels: phase-1, dashboard, frontend
priority: 2

### Task 29: Final Testing Gate
Full test suite, typecheck, manual testing of all features.
labels: phase-1, testing
priority: 2
