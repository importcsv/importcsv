"""
CORS integration tests.

Verifies that:
1. Public /key/* endpoints allow requests from any origin (wildcard CORS)
2. Admin endpoints only allow requests from configured origins
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestPublicEndpointsCORS:
    """Test CORS for public /key/* endpoints."""

    def test_schema_endpoint_allows_any_origin(self, client):
        """Public endpoints should return Access-Control-Allow-Origin: *"""
        response = client.options(
            "/api/v1/imports/key/schema",
            headers={
                "Origin": "https://random-customer-domain.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "*"

    def test_process_endpoint_allows_any_origin(self, client):
        """POST endpoints should also allow any origin."""
        response = client.options(
            "/api/v1/imports/key/process",
            headers={
                "Origin": "https://some-lovable-app.com",
                "Access-Control-Request-Method": "POST",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "*"

    def test_public_endpoints_no_credentials(self, client):
        """Public endpoints should NOT include credentials header."""
        response = client.options(
            "/api/v1/imports/key/schema",
            headers={
                "Origin": "https://example.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        # Should not have allow-credentials header (or it should be absent/false)
        credentials_header = response.headers.get("access-control-allow-credentials")
        assert credentials_header is None or credentials_header.lower() == "false"


class TestAdminEndpointsCORS:
    """Test CORS for admin endpoints (non-/key/ routes)."""

    def test_importers_endpoint_rejects_unknown_origin(self, client):
        """Admin endpoints should not include CORS headers for unknown origins."""
        response = client.options(
            "/api/v1/importers/",
            headers={
                "Origin": "https://random-attacker-site.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        # Returns 200 but with no CORS headers - browser will enforce the block
        assert response.status_code == 200
        allow_origin = response.headers.get("access-control-allow-origin")
        assert allow_origin is None  # No CORS header = browser blocks

    def test_admin_allows_configured_origin(self, client):
        """Admin endpoints should allow localhost in dev mode."""
        response = client.options(
            "/api/v1/importers/",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"

    def test_admin_supports_credentials(self, client):
        """Admin endpoints should support credentials for cookie auth."""
        response = client.options(
            "/api/v1/importers/",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.headers.get("access-control-allow-credentials") == "true"


class TestActualRequestsCORS:
    """Test CORS headers on actual requests (not just preflight OPTIONS)."""

    def test_public_post_request_has_cors_header(self, client):
        """Actual POST requests to public endpoints should have CORS headers."""
        # Send invalid request body to trigger validation error (422)
        # This tests CORS without hitting the database
        response = client.post(
            "/api/v1/imports/key/process",
            json={},  # Empty body triggers validation error
            headers={"Origin": "https://any-customer-domain.com"},
        )
        # Even if request fails (422), CORS headers should be present
        assert response.status_code == 422  # Validation error expected
        assert response.headers.get("access-control-allow-origin") == "*"
        # Should NOT have credentials for public endpoints
        assert response.headers.get("access-control-allow-credentials") is None

    def test_admin_get_request_has_cors_header_for_allowed_origin(self, client):
        """Actual GET requests to admin endpoints should have CORS headers for allowed origins."""
        response = client.get(
            "/api/v1/importers/",
            headers={"Origin": "http://localhost:3000"},
        )
        # Even if request fails (401), CORS headers should be present for allowed origin
        assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
        assert response.headers.get("access-control-allow-credentials") == "true"

    def test_admin_get_request_no_cors_header_for_disallowed_origin(self, client):
        """Actual GET requests from disallowed origins should not have CORS headers."""
        response = client.get(
            "/api/v1/importers/",
            headers={"Origin": "https://attacker-site.com"},
        )
        # No CORS header for disallowed origin
        assert response.headers.get("access-control-allow-origin") is None
