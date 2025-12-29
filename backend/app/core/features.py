"""Feature flags for ImportCSV Cloud vs Self-Hosted"""

from app.core.config import settings


def is_cloud_mode() -> bool:
    """Check if running in ImportCSV Cloud mode"""
    return settings.IMPORTCSV_CLOUD


def is_billing_enabled() -> bool:
    """Check if billing features are enabled"""
    return is_cloud_mode()


def is_usage_limits_enabled() -> bool:
    """Check if usage limits are enforced"""
    return is_cloud_mode()


def get_free_tier_limit() -> int:
    """Get the free tier import limit per month"""
    return settings.FREE_TIER_IMPORTS_PER_MONTH


def get_feature_flags() -> dict:
    """Get all feature flags for client consumption"""
    return {
        "cloud_mode": is_cloud_mode(),
        "billing_enabled": is_billing_enabled(),
        "usage_limits_enabled": is_usage_limits_enabled(),
        "free_tier_imports": get_free_tier_limit(),
    }
