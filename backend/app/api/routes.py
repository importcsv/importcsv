from fastapi import APIRouter

from app.api.v1 import auth, auth_oauth, importers, imports, usage, onboarding

api_router = APIRouter()

# Include all API routes
# Auth routes
api_router.include_router(auth.router, prefix="/v1/auth", tags=["Authentication"])
api_router.include_router(auth_oauth.router, prefix="/v1/auth", tags=["OAuth"])

# Other API routes
api_router.include_router(importers.router, prefix="/v1/importers", tags=["Importers"])
api_router.include_router(imports.router, prefix="/v1/imports", tags=["Imports"])

# Key-authenticated routes (no user authentication required)
api_router.include_router(imports.key_router, prefix="/v1/imports", tags=["Key Imports"])

# Usage tracking routes
api_router.include_router(usage.router, prefix="/v1/usage", tags=["Usage"])

# Onboarding routes (under /v1/users/me)
api_router.include_router(
    onboarding.router,
    prefix="/v1/users/me",
    tags=["Onboarding"]
)
