# backend/tests/integration/test_api/test_integrations.py
import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient


@pytest.mark.integration
def test_create_integration(client: TestClient, auth_headers):
    """Test creating a Supabase integration via API."""
    # Mock the supabase connection test to avoid real HTTP calls
    with patch("app.api.v1.integrations.supabase_service.test_connection", new_callable=AsyncMock) as mock_test:
        mock_test.return_value = {"success": True, "message": "Connected", "table_count": 5}

        response = client.post(
            "/api/v1/integrations/",
            json={
                "name": "Test Supabase",
                "type": "supabase",
                "credentials": {
                    "url": "https://test.supabase.co",
                    "service_key": "test-key",
                },
            },
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Supabase"
        assert data["type"] == "supabase"
        assert "credentials" not in data  # Should not expose credentials
        assert "encrypted_credentials" not in data


@pytest.mark.integration
def test_list_integrations(client: TestClient, auth_headers):
    """Test listing integrations."""
    # Create one first
    client.post(
        "/api/v1/integrations/",
        json={
            "name": "Test",
            "type": "webhook",
            "credentials": {"url": "https://example.com/hook"},
        },
        headers=auth_headers,
    )

    response = client.get("/api/v1/integrations/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.integration
def test_delete_integration(client: TestClient, auth_headers):
    """Test deleting an integration."""
    # Create first
    create_response = client.post(
        "/api/v1/integrations/",
        json={
            "name": "To Delete",
            "type": "webhook",
            "credentials": {"url": "https://example.com/hook"},
        },
        headers=auth_headers,
    )
    integration_id = create_response.json()["id"]

    # Delete
    response = client.delete(f"/api/v1/integrations/{integration_id}", headers=auth_headers)
    assert response.status_code == 204
