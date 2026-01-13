"""
Public API sub-application for key-authenticated endpoints.

This sub-app handles endpoints that are called from customer domains
via the embedded ImportCSV component. Authentication is via importer_key,
not cookies/JWT.

CORS is handled by SplitCORSMiddleware in main.py which applies wildcard
CORS to paths starting with /api/v1/imports/key.
"""
from fastapi import FastAPI

from app.api.v1.imports import key_router

# Create sub-application for public endpoints
public_app = FastAPI(
    title="ImportCSV Public API",
    description="Public endpoints for embedded ImportCSV component",
    docs_url=None,  # Disable docs on sub-app (available on main app)
    redoc_url=None,
)

# Mount the key-authenticated routes (no prefix - mounted at /api/v1/imports/key)
public_app.include_router(key_router, tags=["Public Imports"])
