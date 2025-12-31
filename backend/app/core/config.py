import logging
import os

from dotenv import load_dotenv
from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import model_validator, field_validator, Field
from typing import List, Optional, Literal

# Load environment variables
load_dotenv()

# Get the root directory of the project
ROOT_DIR = Path(__file__).parent.parent.parent.resolve()


class BaseAppSettings(BaseSettings):
    """Base settings shared across all environments"""

    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "ImportCSV"

    CORS_ORIGINS: List[str] = []

    # CORS configuration
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    CORS_ALLOW_HEADERS: List[str] = [
        "Content-Type",
        "Authorization",
        "Accept",
        "X-Requested-With",
        "Origin",
        "importer-key",
    ]
    CORS_EXPOSE_HEADERS: List[str] = ["Content-Length", "Content-Type"]
    CORS_MAX_AGE: int = 600  # Cache preflight requests for 10 minutes

    # JWT settings
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120  # Increased from 30 to 120 minutes (2 hours)

    # LLM settings (deprecated but kept for backward compatibility)
    OPENAI_API_KEY: Optional[str] = Field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY")
    )
    LLM_MODEL: str = Field(default_factory=lambda: os.getenv("LLM_MODEL", "o3-mini"))
    USE_LOCAL_LLM: bool = Field(
        default_factory=lambda: os.getenv("USE_LOCAL_LLM", "false").lower() == "true"
    )
    LOCAL_LLM_URL: Optional[str] = Field(
        default_factory=lambda: os.getenv("LOCAL_LLM_URL")
    )

    # File upload settings
    UPLOAD_DIR: str = Field(
        default_factory=lambda: os.getenv("UPLOAD_DIR", str(ROOT_DIR / "uploads"))
    )
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB

    # Admin credentials (optional, for initial setup)
    ADMIN_EMAIL: Optional[str] = Field(default_factory=lambda: os.getenv("ADMIN_EMAIL"))
    ADMIN_PASSWORD: Optional[str] = Field(
        default_factory=lambda: os.getenv("ADMIN_PASSWORD")
    )
    ADMIN_NAME: Optional[str] = Field(
        default_factory=lambda: os.getenv("ADMIN_NAME", "Admin User")
    )

    # Logging configuration
    LOG_LEVEL: str = Field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))

    # Redis and RQ settings
    REDIS_URL: str = Field(
        default_factory=lambda: os.getenv("REDIS_URL", "redis://localhost:6379")
    )
    RQ_DEFAULT_TIMEOUT: int = Field(
        default_factory=lambda: int(os.getenv("RQ_DEFAULT_TIMEOUT", "3600"))
    )  # 1 hour default
    RQ_IMPORT_QUEUE: str = Field(
        default_factory=lambda: os.getenv("RQ_IMPORT_QUEUE", "imports")
    )

    # These must be set in environment for all environments
    DATABASE_URL: str
    SECRET_KEY: str
    WEBHOOK_SECRET: str

    # NextAuth settings
    NEXTAUTH_SECRET: Optional[str] = Field(
        default_factory=lambda: os.getenv("NEXTAUTH_SECRET")
    )

    # Host settings for TrustedHostMiddleware
    ALLOWED_HOSTS: List[str] = Field(
        default_factory=lambda: os.getenv("ALLOWED_HOSTS", "*").split(",")
    )

    # Frontend URL for OAuth redirects
    FRONTEND_URL: str = Field(
        default_factory=lambda: os.getenv("FRONTEND_URL", "http://localhost:3000")
    )

    # OAuth providers (optional - OAuth disabled if not configured)
    GOOGLE_CLIENT_ID: Optional[str] = Field(
        default_factory=lambda: os.getenv("GOOGLE_CLIENT_ID")
    )
    GOOGLE_CLIENT_SECRET: Optional[str] = Field(
        default_factory=lambda: os.getenv("GOOGLE_CLIENT_SECRET")
    )
    GITHUB_CLIENT_ID: Optional[str] = Field(
        default_factory=lambda: os.getenv("GITHUB_CLIENT_ID")
    )
    GITHUB_CLIENT_SECRET: Optional[str] = Field(
        default_factory=lambda: os.getenv("GITHUB_CLIENT_SECRET")
    )

    # Cookie settings
    COOKIE_SECURE: bool = Field(
        default_factory=lambda: os.getenv("ENVIRONMENT", "development") == "production"
    )
    COOKIE_MAX_AGE: int = 30 * 24 * 60 * 60  # 30 days

    # Cloud Mode settings
    IMPORTCSV_CLOUD: bool = Field(
        default_factory=lambda: os.getenv("IMPORTCSV_CLOUD", "false").lower() == "true"
    )

    # Stripe settings (only required if IMPORTCSV_CLOUD=true)
    STRIPE_SECRET_KEY: Optional[str] = Field(
        default_factory=lambda: os.getenv("STRIPE_SECRET_KEY")
    )
    STRIPE_WEBHOOK_SECRET: Optional[str] = Field(
        default_factory=lambda: os.getenv("STRIPE_WEBHOOK_SECRET")
    )
    STRIPE_PRICE_ID_PRO: Optional[str] = Field(
        default_factory=lambda: os.getenv("STRIPE_PRICE_ID_PRO")
    )
    STRIPE_PRICE_ID_BUSINESS: Optional[str] = Field(
        default_factory=lambda: os.getenv("STRIPE_PRICE_ID_BUSINESS")
    )

    # Resend settings
    RESEND_API_KEY: Optional[str] = Field(
        default_factory=lambda: os.getenv("RESEND_API_KEY")
    )
    RESEND_FROM_EMAIL: str = Field(
        default_factory=lambda: os.getenv("RESEND_FROM_EMAIL", "noreply@importcsv.dev")
    )

    # Usage limits (per month)
    # Note: Business tier has unlimited imports (no BUSINESS_TIER_IMPORTS_PER_MONTH)
    FREE_TIER_IMPORTS_PER_MONTH: int = Field(
        default_factory=lambda: int(os.getenv("FREE_TIER_IMPORTS_PER_MONTH", "100"))
    )
    PRO_TIER_IMPORTS_PER_MONTH: int = Field(
        default_factory=lambda: int(os.getenv("PRO_TIER_IMPORTS_PER_MONTH", "2000"))
    )
    # Max rows per import (all tiers have limits)
    FREE_TIER_MAX_ROWS_PER_IMPORT: int = Field(
        default_factory=lambda: int(os.getenv("FREE_TIER_MAX_ROWS_PER_IMPORT", "10000"))
    )
    PRO_TIER_MAX_ROWS_PER_IMPORT: int = Field(
        default_factory=lambda: int(os.getenv("PRO_TIER_MAX_ROWS_PER_IMPORT", "100000"))
    )
    BUSINESS_TIER_MAX_ROWS_PER_IMPORT: int = Field(
        default_factory=lambda: int(os.getenv("BUSINESS_TIER_MAX_ROWS_PER_IMPORT", "500000"))
    )

    # Grace period for failed payments (days)
    PAYMENT_GRACE_PERIOD_DAYS: int = Field(
        default_factory=lambda: int(os.getenv("PAYMENT_GRACE_PERIOD_DAYS", "7"))
    )

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_secure(cls, v):
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v

    @field_validator("UPLOAD_DIR")
    @classmethod
    def ensure_upload_dir_exists(cls, v):
        upload_path = Path(v)
        if not upload_path.exists():
            upload_path.mkdir(parents=True, exist_ok=True)
        return str(upload_path)

    @model_validator(mode='after')
    def validate_cloud_settings(self):
        """Validate that required settings are present when cloud mode is enabled."""
        if self.IMPORTCSV_CLOUD:
            missing = []
            if not self.STRIPE_SECRET_KEY:
                missing.append("STRIPE_SECRET_KEY")
            if not self.STRIPE_WEBHOOK_SECRET:
                missing.append("STRIPE_WEBHOOK_SECRET")
            if not self.STRIPE_PRICE_ID_PRO:
                missing.append("STRIPE_PRICE_ID_PRO")
            if not self.STRIPE_PRICE_ID_BUSINESS:
                missing.append("STRIPE_PRICE_ID_BUSINESS")
            if missing:
                raise ValueError(
                    f"IMPORTCSV_CLOUD=true requires these settings: {', '.join(missing)}"
                )
        return self

    class Config:
        env_file = ".env"
        case_sensitive = True


class DevelopmentSettings(BaseAppSettings):
    """Development-specific settings"""

    ENVIRONMENT: Literal["development"] = "development"

    # Override log level for development
    LOG_LEVEL: str = Field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))

    # Additional development-specific settings
    DEBUG: bool = True
    RELOAD: bool = True

    # Development-specific CORS origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # Next.js
        "http://localhost:5173",  # Vite
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",  # Backend
        "http://localhost:6006",  # Storybook
    ]


class ProductionSettings(BaseAppSettings):
    """Production-specific settings"""

    ENVIRONMENT: Literal["production"] = "production"

    # Production overrides
    DEBUG: bool = False
    RELOAD: bool = False

    # Stricter security settings for production
    @field_validator("CORS_ORIGINS")
    @classmethod
    def validate_cors_origins(cls, v):
        # In production, don't allow localhost origins unless explicitly set
        default_local = [
            "http://localhost:3000",
            "http://localhost:8000",
            "http://localhost:6006",
            "http://localhost:5173",
        ]

        # If CORS_ORIGINS only contains default localhost values, warn and clear
        if all(origin in default_local for origin in v) and len(v) == len(
            default_local
        ):
            logging.warning(
                "Using default localhost CORS origins in production! "
                "This is likely a misconfiguration. Set CORS_ORIGINS env var."
            )
            return []
        return v


# Determine which settings to use based on environment
def get_settings() -> BaseAppSettings:
    env = os.getenv("ENVIRONMENT", "development")
    if env == "production":
        return ProductionSettings()
    return DevelopmentSettings()


settings = get_settings()
