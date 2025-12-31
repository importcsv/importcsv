"""Feature flags for ImportCSV Cloud vs Self-Hosted"""

from typing import Literal
from app.core.config import settings


SubscriptionTier = Literal["free", "pro", "business"]


def is_cloud_mode() -> bool:
    """Check if running in ImportCSV Cloud mode"""
    return settings.IMPORTCSV_CLOUD


def is_billing_enabled() -> bool:
    """Check if billing features are enabled"""
    return is_cloud_mode()


def is_usage_limits_enabled() -> bool:
    """Check if usage limits are enforced"""
    return is_cloud_mode()


def get_tier_import_limit(tier: SubscriptionTier) -> int | None:
    """Get the import limit for a subscription tier. None means unlimited."""
    match tier:
        case "free":
            return settings.FREE_TIER_IMPORTS_PER_MONTH
        case "pro":
            return settings.PRO_TIER_IMPORTS_PER_MONTH
        case "business":
            return None  # Unlimited


def get_tier_max_rows(tier: SubscriptionTier) -> int:
    """Get the max rows per import for a subscription tier."""
    match tier:
        case "free":
            return settings.FREE_TIER_MAX_ROWS_PER_IMPORT
        case "pro":
            return settings.PRO_TIER_MAX_ROWS_PER_IMPORT
        case "business":
            return settings.BUSINESS_TIER_MAX_ROWS_PER_IMPORT


def should_show_branding(tier: SubscriptionTier) -> bool:
    """Check if ImportCSV branding/watermark should be shown in the importer UI."""
    return tier == "free"


# Keep backwards compatibility
def get_free_tier_limit() -> int:
    """Get the free tier import limit per month"""
    return settings.FREE_TIER_IMPORTS_PER_MONTH


def get_feature_flags() -> dict:
    """Get all feature flags for client consumption"""
    return {
        "cloud_mode": is_cloud_mode(),
        "billing_enabled": is_billing_enabled(),
        "usage_limits_enabled": is_usage_limits_enabled(),
        "free_tier_imports": settings.FREE_TIER_IMPORTS_PER_MONTH,
    }
