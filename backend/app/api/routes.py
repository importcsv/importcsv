from fastapi import APIRouter

from app.api.v1 import auth, auth_oauth, importers, imports, usage, onboarding, billing, webhooks, integrations

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

# Integration routes
api_router.include_router(integrations.router, prefix="/v1/integrations", tags=["Integrations"])
