"""
Unit tests for the features module.

Tests tier-based limits, feature flags, and branding logic.
"""
import pytest
from unittest.mock import patch, MagicMock

from app.core.features import (
    get_tier_import_limit,
    get_tier_max_rows,
    should_show_branding,
    get_free_tier_limit,
    is_cloud_mode,
    is_billing_enabled,
    is_usage_limits_enabled,
    get_feature_flags,
    SubscriptionTier,
)


# ============================================================================
# Tier Import Limit Tests
# ============================================================================

@pytest.mark.unit
def test_get_tier_import_limit_free():
    """Test free tier returns configured import limit."""
    with patch("app.core.features.settings") as mock_settings:
        mock_settings.FREE_TIER_IMPORTS_PER_MONTH = 100
        result = get_tier_import_limit("free")
        assert result == 100


@pytest.mark.unit
def test_get_tier_import_limit_pro():
    """Test pro tier returns configured import limit."""
    with patch("app.core.features.settings") as mock_settings:
        mock_settings.PRO_TIER_IMPORTS_PER_MONTH = 2000
        result = get_tier_import_limit("pro")
        assert result == 2000


@pytest.mark.unit
def test_get_tier_import_limit_business():
    """Test business tier returns None (unlimited)."""
    result = get_tier_import_limit("business")
    assert result is None


@pytest.mark.unit
def test_get_tier_import_limit_all_tiers():
    """Test all tiers return expected values relative to each other."""
    with patch("app.core.features.settings") as mock_settings:
        mock_settings.FREE_TIER_IMPORTS_PER_MONTH = 100
        mock_settings.PRO_TIER_IMPORTS_PER_MONTH = 2000

        free_limit = get_tier_import_limit("free")
        pro_limit = get_tier_import_limit("pro")
        business_limit = get_tier_import_limit("business")

        # Free < Pro < Business (unlimited)
        assert free_limit == 100
        assert pro_limit == 2000
        assert business_limit is None

        # Free should be less than Pro
        assert free_limit < pro_limit


# ============================================================================
# Tier Max Rows Tests
# ============================================================================

@pytest.mark.unit
def test_get_tier_max_rows_free():
    """Test free tier returns configured max rows."""
    with patch("app.core.features.settings") as mock_settings:
        mock_settings.FREE_TIER_MAX_ROWS_PER_IMPORT = 10000
        result = get_tier_max_rows("free")
        assert result == 10000


@pytest.mark.unit
def test_get_tier_max_rows_pro():
    """Test pro tier returns configured max rows."""
    with patch("app.core.features.settings") as mock_settings:
        mock_settings.PRO_TIER_MAX_ROWS_PER_IMPORT = 100000
        result = get_tier_max_rows("pro")
        assert result == 100000


@pytest.mark.unit
def test_get_tier_max_rows_business():
    """Test business tier returns configured max rows."""
    with patch("app.core.features.settings") as mock_settings:
        mock_settings.BUSINESS_TIER_MAX_ROWS_PER_IMPORT = 500000
        result = get_tier_max_rows("business")
        assert result == 500000


@pytest.mark.unit
def test_get_tier_max_rows_all_tiers():
    """Test all tiers return expected values relative to each other."""
    with patch("app.core.features.settings") as mock_settings:
        mock_settings.FREE_TIER_MAX_ROWS_PER_IMPORT = 10000
        mock_settings.PRO_TIER_MAX_ROWS_PER_IMPORT = 100000
        mock_settings.BUSINESS_TIER_MAX_ROWS_PER_IMPORT = 500000

        free_rows = get_tier_max_rows("free")
        pro_rows = get_tier_max_rows("pro")
        business_rows = get_tier_max_rows("business")

        # Free < Pro < Business
        assert free_rows < pro_rows < business_rows


# ============================================================================
# Branding Tests
# ============================================================================

@pytest.mark.unit
def test_should_show_branding_free():
    """Test free tier shows branding."""
    result = should_show_branding("free")
    assert result is True


@pytest.mark.unit
def test_should_show_branding_pro():
    """Test pro tier does not show branding."""
    result = should_show_branding("pro")
    assert result is False


@pytest.mark.unit
def test_should_show_branding_business():
    """Test business tier does not show branding."""
    result = should_show_branding("business")
    assert result is False


@pytest.mark.unit
def test_should_show_branding_paid_tiers_no_branding():
    """Test that all paid tiers hide branding."""
    paid_tiers: list[SubscriptionTier] = ["pro", "business"]
    for tier in paid_tiers:
        assert should_show_branding(tier) is False, f"Tier {tier} should not show branding"


# ============================================================================
# Cloud Mode and Feature Flag Tests
# ============================================================================

@pytest.mark.unit
def test_is_cloud_mode_true():
    """Test cloud mode returns True when configured."""
    with patch("app.core.features.settings") as mock_settings:
        mock_settings.IMPORTCSV_CLOUD = True
        assert is_cloud_mode() is True


@pytest.mark.unit
def test_is_cloud_mode_false():
    """Test cloud mode returns False when not configured."""
    with patch("app.core.features.settings") as mock_settings:
        mock_settings.IMPORTCSV_CLOUD = False
        assert is_cloud_mode() is False


@pytest.mark.unit
def test_is_billing_enabled_follows_cloud_mode():
    """Test billing enabled follows cloud mode setting."""
    with patch("app.core.features.settings") as mock_settings:
        mock_settings.IMPORTCSV_CLOUD = True
        assert is_billing_enabled() is True

        mock_settings.IMPORTCSV_CLOUD = False
        assert is_billing_enabled() is False


@pytest.mark.unit
def test_is_usage_limits_enabled_follows_cloud_mode():
    """Test usage limits follow cloud mode setting."""
    with patch("app.core.features.settings") as mock_settings:
        mock_settings.IMPORTCSV_CLOUD = True
        assert is_usage_limits_enabled() is True

        mock_settings.IMPORTCSV_CLOUD = False
        assert is_usage_limits_enabled() is False


@pytest.mark.unit
def test_get_feature_flags():
    """Test feature flags dictionary contains expected keys."""
    with patch("app.core.features.settings") as mock_settings:
        mock_settings.IMPORTCSV_CLOUD = True
        mock_settings.FREE_TIER_IMPORTS_PER_MONTH = 100

        flags = get_feature_flags()

        assert "cloud_mode" in flags
        assert "billing_enabled" in flags
        assert "usage_limits_enabled" in flags
        assert "free_tier_imports" in flags
        assert flags["cloud_mode"] is True
        assert flags["free_tier_imports"] == 100


# ============================================================================
# Backwards Compatibility Tests
# ============================================================================

@pytest.mark.unit
def test_get_free_tier_limit_backwards_compatible():
    """Test get_free_tier_limit returns same value as get_tier_import_limit('free')."""
    with patch("app.core.features.settings") as mock_settings:
        mock_settings.FREE_TIER_IMPORTS_PER_MONTH = 100

        legacy_result = get_free_tier_limit()
        new_result = get_tier_import_limit("free")

        assert legacy_result == new_result == 100
