"""Integration tests for trial billing endpoints."""
import uuid
from datetime import datetime, timezone
from unittest.mock import patch

import pytest


@pytest.fixture
def cloud_mode_enabled():
    """Enable cloud mode for tests."""
    with patch('app.api.v1.billing.is_cloud_mode', return_value=True):
        with patch('app.core.features.is_cloud_mode', return_value=True):
            yield


@pytest.fixture
def mock_email_service():
    """Mock email service."""
    with patch('app.services.email.email_service') as mock:
        mock.send_trial_started.return_value = True
        yield mock


@pytest.mark.integration
def test_start_trial_success(client, db_session, test_user, auth_headers, cloud_mode_enabled, mock_email_service):
    """POST /billing/start-trial should start a trial for eligible user."""
    response = client.post(
        "/api/v1/billing/start-trial",
        json={"tier": "pro"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "trialing"
    assert data["tier"] == "pro"
    assert data["is_new_trial"] is True
    assert "trial_ends_at" in data


@pytest.mark.integration
def test_start_trial_not_eligible(client, db_session, test_user, auth_headers, cloud_mode_enabled):
    """POST /billing/start-trial should reject ineligible user."""
    # Mark user as having used trial
    test_user.trial_started_at = datetime.now(timezone.utc)
    db_session.commit()

    response = client.post(
        "/api/v1/billing/start-trial",
        json={"tier": "pro"},
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert "not eligible" in response.json()["detail"].lower()


@pytest.mark.integration
def test_start_trial_requires_cloud_mode(client, test_user, auth_headers):
    """POST /billing/start-trial should 404 when cloud mode disabled."""
    with patch('app.api.v1.billing.is_cloud_mode', return_value=False):
        response = client.post(
            "/api/v1/billing/start-trial",
            json={"tier": "pro"},
            headers=auth_headers,
        )

    assert response.status_code == 404


@pytest.mark.integration
def test_start_trial_invalid_tier(client, test_user, auth_headers, cloud_mode_enabled):
    """POST /billing/start-trial should reject invalid tier."""
    response = client.post(
        "/api/v1/billing/start-trial",
        json={"tier": "free"},
        headers=auth_headers,
    )

    # Pydantic validator returns 422 for validation errors
    assert response.status_code == 422


@pytest.mark.integration
def test_cancel_trial_success(client, db_session, test_user, auth_headers, cloud_mode_enabled):
    """POST /billing/cancel-trial should cancel active trial."""
    from datetime import timedelta

    # Put user on trial
    test_user.subscription_tier = "pro"
    test_user.subscription_status = "trialing"
    test_user.trial_started_at = datetime.now(timezone.utc)
    test_user.trial_ends_at = datetime.now(timezone.utc) + timedelta(days=14)
    db_session.commit()

    response = client.post(
        "/api/v1/billing/cancel-trial",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "free"
    assert data["tier"] == "free"


@pytest.mark.integration
def test_cancel_trial_not_trialing(client, db_session, test_user, auth_headers, cloud_mode_enabled):
    """POST /billing/cancel-trial should fail if not trialing."""
    response = client.post(
        "/api/v1/billing/cancel-trial",
        headers=auth_headers,
    )

    assert response.status_code == 400


@pytest.mark.integration
def test_get_subscription_includes_trial_fields(client, db_session, test_user, auth_headers, cloud_mode_enabled):
    """GET /subscription should include trial-related fields."""
    from datetime import timedelta

    # Put user on trial
    test_user.subscription_tier = "pro"
    test_user.subscription_status = "trialing"
    test_user.trial_started_at = datetime.now(timezone.utc)
    test_user.trial_ends_at = datetime.now(timezone.utc) + timedelta(days=10)
    db_session.commit()

    response = client.get(
        "/api/v1/billing/subscription",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()

    assert data["is_trialing"] is True
    assert "trial_ends_at" in data
    assert "trial_days_remaining" in data
    # Allow for slight timing differences (9 or 10 days)
    assert data["trial_days_remaining"] in (9, 10)
    assert "has_payment_method" in data
    assert "is_eligible_for_trial" in data
