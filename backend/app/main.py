from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn
import os
import logging
from typing import Callable, List
from dotenv import load_dotenv

from app.api.routes import api_router
from app.core.config import settings


# Split CORS middleware - different policies for public vs admin routes
class SplitCORSMiddleware(BaseHTTPMiddleware):
    """
    Custom CORS middleware that applies different policies based on path.

    - /api/v1/imports/key/* : Wildcard CORS (allow any origin, no credentials)
    - All other paths: Configured CORS (specific origins, with credentials)
    """

    PUBLIC_PATH_PREFIX = "/api/v1/imports/key"

    def __init__(
        self,
        app,
        admin_origins: List[str],
        admin_allow_credentials: bool = True,
        allow_methods: List[str] = None,
        allow_headers: List[str] = None,
        expose_headers: List[str] = None,
        max_age: int = 600,
    ):
        super().__init__(app)
        self.admin_origins = set(admin_origins)
        self.admin_allow_credentials = admin_allow_credentials
        self.allow_methods = allow_methods or ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
        self.allow_headers = allow_headers or ["*"]
        self.expose_headers = expose_headers or []
        self.max_age = max_age

    def is_public_path(self, path: str) -> bool:
        return path.startswith(self.PUBLIC_PATH_PREFIX)

    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        is_public = self.is_public_path(request.url.path)

        # Handle preflight OPTIONS requests
        if request.method == "OPTIONS":
            return self._handle_preflight(request, origin, is_public)

        # Process actual request
        response = await call_next(request)

        # Add CORS headers to response only for allowed origins
        if origin:
            if is_public:
                # Public endpoints: allow any origin, no credentials
                response.headers["Access-Control-Allow-Origin"] = "*"
                if self.expose_headers:
                    response.headers["Access-Control-Expose-Headers"] = ", ".join(self.expose_headers)
            elif origin in self.admin_origins:
                # Admin endpoints: specific origins with credentials
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Credentials"] = "true"
                if self.expose_headers:
                    response.headers["Access-Control-Expose-Headers"] = ", ".join(self.expose_headers)
            # If origin not allowed, don't add any CORS headers - browser will block

        return response

    def _handle_preflight(self, request: Request, origin: str, is_public: bool):
        """Handle CORS preflight (OPTIONS) requests."""
        if is_public:
            # Public endpoints: wildcard CORS, no credentials
            return PlainTextResponse("", status_code=200, headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": ", ".join(self.allow_methods),
                "Access-Control-Allow-Headers": ", ".join(self.allow_headers),
                "Access-Control-Max-Age": str(self.max_age),
            })
        elif origin and origin in self.admin_origins:
            # Admin endpoints: specific origin with credentials
            return PlainTextResponse("", status_code=200, headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": ", ".join(self.allow_methods),
                "Access-Control-Allow-Headers": ", ".join(self.allow_headers),
                "Access-Control-Max-Age": str(self.max_age),
            })
        else:
            # Disallowed origin: return 200 with no CORS headers
            # Browser will enforce the block - we don't leak policy info
            return PlainTextResponse("", status_code=200)


# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
        )
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=()"
        )
        return response


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),  # Log to console
    ],
)

# Disable all SQLAlchemy logging at the root level
logging.getLogger("sqlalchemy").setLevel(logging.CRITICAL)
logging.getLogger("sqlalchemy.engine").setLevel(logging.CRITICAL)


# Create a filter to block SQLAlchemy log messages
class SQLAlchemyFilter(logging.Filter):
    def filter(self, record):
        return not record.name.startswith("sqlalchemy")


# Apply the filter to the root logger
root_logger = logging.getLogger()
root_logger.addFilter(SQLAlchemyFilter())

# Also set a higher level for the root logger to avoid INFO logs
logging.getLogger().setLevel(logging.WARNING)

# But enable INFO logging for our app modules
logging.getLogger("app").setLevel(logging.INFO)
logging.getLogger("__main__").setLevel(logging.INFO)

# We've disabled SQL logging by setting echo=False in the engine configuration
# in app/db/base.py, which is the proper way to disable SQLAlchemy logging

# Load environment variables
load_dotenv()

# Initialize rate limiter with Redis storage backend
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.REDIS_URL
)

app = FastAPI(
    title="ImportCSV API",
    description="API for ImportCSV - An intelligent CSV import tool",
    version="0.1.0",
)

# Add rate limit exceeded handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure split CORS - public endpoints get wildcard, admin gets specific origins
logging.info(f"Configuring split CORS. Admin origins: {settings.CORS_ORIGINS}")

# Add split CORS middleware - different policies for public vs admin routes
app.add_middleware(
    SplitCORSMiddleware,
    admin_origins=settings.CORS_ORIGINS,
    admin_allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
    expose_headers=settings.CORS_EXPOSE_HEADERS,
    max_age=settings.CORS_MAX_AGE,
)

# Add security headers
app.add_middleware(SecurityHeadersMiddleware)

# Add GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add session middleware for cookie-based auth
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    https_only=settings.ENVIRONMENT == "production",
)

# Trust proxy headers (X-Forwarded-Proto, X-Forwarded-For) from load balancer
# This must be added last so it runs first (middleware order is LIFO)
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])

# Mount public API sub-app with permissive CORS for embedded component
# This handles /api/v1/imports/key/* endpoints that need wildcard CORS
from app.api.public import public_app
app.mount("/api/v1/imports/key", public_app)

# Include API routes (admin endpoints with specific CORS)
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "ImportCSV API is running"}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
