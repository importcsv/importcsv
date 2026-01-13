# Split CORS for Public/Admin APIs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable the embedded ImportCSV component to work from any domain by splitting CORS configuration - wildcard for public `/key/*` endpoints, specific origin for admin endpoints.

**Architecture:** Create two FastAPI sub-applications with different CORS policies. Public API (`/api/v1/imports/key/*`) gets `Access-Control-Allow-Origin: *` without credentials. Admin API (everything else) keeps current behavior with specific origins and credentials support.

**Tech Stack:** FastAPI, Starlette CORSMiddleware, pytest

---

## Task 1: Create Public API Sub-Application

**Files:**
- Create: `backend/app/api/public.py`
- Modify: `backend/app/api/v1/imports.py:30-34`

**Step 1: Create the public API module**

Create `backend/app/api/public.py`:

```python
"""
Public API sub-application with permissive CORS.

This sub-app handles endpoints that are called from customer domains
via the embedded ImportCSV component. Uses wildcard CORS to allow
requests from any origin.

Authentication is via importer_key, not cookies/JWT.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.imports import key_router

# Create sub-application for public endpoints
public_app = FastAPI(
    title="ImportCSV Public API",
    description="Public endpoints for embedded ImportCSV component",
    docs_url=None,  # Disable docs on sub-app (available on main app)
    redoc_url=None,
)

# Permissive CORS for public endpoints - allows embedding from any domain
# Note: credentials=False is required when using wildcard origin
public_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Cannot use credentials with wildcard
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Origin"],
    max_age=600,
)

# Mount the key-authenticated routes
public_app.include_router(key_router, prefix="/key", tags=["Public Imports"])
```

**Step 2: Verify file created correctly**

Run: `cat backend/app/api/public.py | head -20`
Expected: See the imports and docstring

---

## Task 2: Update Main Application to Mount Sub-Apps

**Files:**
- Modify: `backend/app/main.py:96-108`
- Modify: `backend/app/api/routes.py:14-17`

**Step 1: Remove key_router from routes.py**

In `backend/app/api/routes.py`, remove lines 16-17:

```python
# Delete these lines:
# Key-authenticated routes (no user authentication required)
api_router.include_router(imports.key_router, prefix="/v1/imports", tags=["Key Imports"])
```

The file should look like:

```python
from fastapi import APIRouter

from app.api.v1 import auth, auth_oauth, importers, imports, usage, onboarding, billing, webhooks

api_router = APIRouter()

# Include all API routes
# Auth routes
api_router.include_router(auth.router, prefix="/v1/auth", tags=["Authentication"])
api_router.include_router(auth_oauth.router, prefix="/v1/auth", tags=["OAuth"])

# Other API routes
api_router.include_router(importers.router, prefix="/v1/importers", tags=["Importers"])
api_router.include_router(imports.router, prefix="/v1/imports", tags=["Imports"])

# Usage tracking routes
api_router.include_router(usage.router, prefix="/v1/usage", tags=["Usage"])

# Onboarding routes (under /v1/users/me)
api_router.include_router(
    onboarding.router,
    prefix="/v1/users/me",
    tags=["Onboarding"]
)

# Billing routes (cloud mode only)
api_router.include_router(billing.router, prefix="/v1/billing", tags=["Billing"])

# Webhook routes
api_router.include_router(webhooks.router, prefix="/v1/webhooks", tags=["Webhooks"])
```

**Step 2: Update main.py to mount public sub-app**

In `backend/app/main.py`, after the CORS middleware block (around line 108), add:

```python
# Mount public API sub-app with its own CORS (before admin routes)
from app.api.public import public_app
app.mount("/api/v1/imports", public_app)
```

The CORS middleware section should now look like:

```python
# Configure CORS for admin routes (specific origins, with credentials)
logging.info(f"Configuring CORS with origins: {settings.CORS_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
    expose_headers=settings.CORS_EXPOSE_HEADERS,
    max_age=settings.CORS_MAX_AGE,
)

# Mount public API sub-app with its own permissive CORS
# This handles /api/v1/imports/key/* endpoints for embedded component
from app.api.public import public_app
app.mount("/api/v1/imports", public_app)
```

**Step 3: Verify the changes compile**

Run: `cd backend && uv run python -c "from app.main import app; print('OK')"`
Expected: `OK`

**Step 4: Commit**

```bash
git add backend/app/api/public.py backend/app/api/routes.py backend/app/main.py
git commit -m "feat(cors): split public/admin APIs with different CORS policies

Public /key/* endpoints now use wildcard CORS to allow embedding
from any customer domain. Admin endpoints retain specific origin
CORS with credentials support."
```

---

## Task 3: Write CORS Integration Tests

**Files:**
- Create: `backend/tests/api/test_cors.py`

**Step 1: Create CORS test file**

Create `backend/tests/api/test_cors.py`:

```python
"""
CORS integration tests.

Verifies that:
1. Public /key/* endpoints allow requests from any origin (wildcard CORS)
2. Admin endpoints only allow requests from configured origins
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestPublicEndpointsCORS:
    """Test CORS for public /key/* endpoints."""

    def test_schema_endpoint_allows_any_origin(self, client):
        """Public endpoints should return Access-Control-Allow-Origin: *"""
        response = client.options(
            "/api/v1/imports/key/schema",
            headers={
                "Origin": "https://random-customer-domain.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "*"

    def test_process_endpoint_allows_any_origin(self, client):
        """POST endpoints should also allow any origin."""
        response = client.options(
            "/api/v1/imports/key/process",
            headers={
                "Origin": "https://some-lovable-app.com",
                "Access-Control-Request-Method": "POST",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "*"

    def test_public_endpoints_no_credentials(self, client):
        """Public endpoints should NOT include credentials header."""
        response = client.options(
            "/api/v1/imports/key/schema",
            headers={
                "Origin": "https://example.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        # Should not have allow-credentials header (or it should be absent/false)
        credentials_header = response.headers.get("access-control-allow-credentials")
        assert credentials_header is None or credentials_header.lower() == "false"


class TestAdminEndpointsCORS:
    """Test CORS for admin endpoints (non-/key/ routes)."""

    def test_importers_endpoint_specific_origin(self, client):
        """Admin endpoints should only allow configured origins."""
        response = client.options(
            "/api/v1/importers/",
            headers={
                "Origin": "https://random-attacker-site.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        # Should either return 400 or not include the random origin
        allow_origin = response.headers.get("access-control-allow-origin")
        assert allow_origin != "https://random-attacker-site.com"
        assert allow_origin != "*"

    def test_admin_allows_configured_origin(self, client):
        """Admin endpoints should allow localhost in dev mode."""
        response = client.options(
            "/api/v1/importers/",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"

    def test_admin_supports_credentials(self, client):
        """Admin endpoints should support credentials for cookie auth."""
        response = client.options(
            "/api/v1/importers/",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.headers.get("access-control-allow-credentials") == "true"
```

**Step 2: Run the CORS tests**

Run: `cd backend && uv run pytest tests/api/test_cors.py -v`
Expected: All tests pass

**Step 3: Commit**

```bash
git add backend/tests/api/test_cors.py
git commit -m "test(cors): add integration tests for split CORS configuration"
```

---

## Task 4: Verify Existing Functionality Still Works

**Files:**
- Test: `backend/tests/api/test_imports.py` (existing)

**Step 1: Run existing import tests**

Run: `cd backend && uv run pytest tests/api/test_imports.py -v`
Expected: All existing tests pass

**Step 2: Run full test suite**

Run: `cd backend && uv run pytest -v`
Expected: All tests pass

**Step 3: Manual verification - test public endpoint from different origin**

Run: `cd backend && uv run uvicorn app.main:app --reload &`

Then test with curl:

```bash
curl -i -X OPTIONS http://localhost:8000/api/v1/imports/key/schema \
  -H "Origin: https://vibe-coder-app.lovable.app" \
  -H "Access-Control-Request-Method: GET"
```

Expected: Response includes `Access-Control-Allow-Origin: *`

**Step 4: Manual verification - test admin endpoint rejects random origin**

```bash
curl -i -X OPTIONS http://localhost:8000/api/v1/importers/ \
  -H "Origin: https://attacker-site.com" \
  -H "Access-Control-Request-Method: GET"
```

Expected: Response does NOT include `Access-Control-Allow-Origin: https://attacker-site.com`

---

## Task 5: Update Documentation

**Files:**
- Modify: `backend/README.md` (if exists) or `docs/`

**Step 1: Add CORS section to documentation**

If there's no existing docs, create a note in the codebase. Add a comment block at the top of `backend/app/api/public.py` explaining the architecture (already done in Task 1).

**Step 2: Commit any doc changes**

```bash
git add -A
git commit -m "docs: document split CORS architecture"
```

---

## Summary

After completing all tasks:

1. **Public endpoints** (`/api/v1/imports/key/*`) will accept requests from ANY origin
   - Vibe coders on Lovable, Webflow, etc. can embed without CORS errors
   - Auth via `importer_key` (already public in client code)

2. **Admin endpoints** (everything else) retain strict CORS
   - Only configured origins (your admin dashboard)
   - Cookie-based auth still works

3. **No breaking changes** for existing integrations

---

## Rollback Plan

If issues arise, revert with:

```bash
git revert HEAD~3..HEAD  # Revert last 3 commits
```

Or manually:
1. Delete `backend/app/api/public.py`
2. Restore `backend/app/api/routes.py` to include `key_router`
3. Remove the `app.mount()` line from `backend/app/main.py`
