from fastapi import APIRouter

from app.api.v1 import auth, users, importers, imports, webhooks, public, llm

api_router = APIRouter()

# Include all API routes
# Auth routes (FastAPI-Users authentication)
api_router.include_router(auth.router, prefix="/v1/auth", tags=["Authentication"])

# Other API routes
api_router.include_router(users.router, prefix="/v1/users", tags=["Users"])
api_router.include_router(importers.router, prefix="/v1/importers", tags=["Importers"])
api_router.include_router(imports.router, prefix="/v1/imports", tags=["Imports"])
api_router.include_router(webhooks.router, prefix="/v1/webhooks", tags=["Webhooks"])
api_router.include_router(public.router, prefix="/v1/public", tags=["Public API"])
api_router.include_router(llm.router, prefix="/v1/public", tags=["AI Services"])
