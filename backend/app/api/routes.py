from fastapi import APIRouter

from app.api.v1 import auth, users, schemas, imports, webhooks, frontend_integration

api_router = APIRouter()

# Include all API routes
api_router.include_router(auth.router, prefix="/v1/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/v1/users", tags=["Users"])
api_router.include_router(schemas.router, prefix="/v1/schemas", tags=["Schemas"])
api_router.include_router(imports.router, prefix="/v1/imports", tags=["Imports"])
api_router.include_router(webhooks.router, prefix="/v1/webhooks", tags=["Webhooks"])
api_router.include_router(frontend_integration.router, prefix="/v1/frontend", tags=["Frontend Integration"])
