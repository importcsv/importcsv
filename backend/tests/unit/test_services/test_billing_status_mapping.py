"""Tests for billing service status mapping."""
import pytest
from unittest.mock import Mock, patch


def test_map_stripe_status_preserves_trialing():
    """_map_stripe_status should map 'trialing' to 'trialing', not 'active'."""
    from app.services.billing import BillingService

    mock_db = Mock()
    service = BillingService(mock_db)

    result = service._map_stripe_status("trialing")

    assert result == "trialing", "trialing status should be preserved, not mapped to active"


def test_map_stripe_status_active_unchanged():
    """_map_stripe_status should map 'active' to 'active'."""
    from app.services.billing import BillingService

    mock_db = Mock()
    service = BillingService(mock_db)

    result = service._map_stripe_status("active")

    assert result == "active"
