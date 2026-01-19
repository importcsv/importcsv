"""
Integration tests for importer API endpoints.

Tests the complete flow from HTTP request to database operations.
"""
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.importer import Importer
from app.models.integration import Integration, IntegrationType


# ============================================================================
# GET /api/v1/importers/ - List Importers
# ============================================================================

@pytest.mark.integration
def test_list_importers_authenticated(client: TestClient, auth_headers: dict, test_user: User):
    """Test listing importers with authentication."""
    response = client.get("/api/v1/importers/", headers=auth_headers)

    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.integration
def test_list_importers_unauthenticated(client: TestClient):
    """Test listing importers without authentication fails."""
    response = client.get("/api/v1/importers/")

    assert response.status_code == 401  # Unauthenticated


@pytest.mark.integration
def test_list_importers_with_data(
    client: TestClient,
    auth_headers: dict,
    test_user: User,
    sample_importer: Importer
):
    """Test listing importers returns correct data."""
    response = client.get("/api/v1/importers/", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == str(sample_importer.id)
    assert data[0]["name"] == sample_importer.name


@pytest.mark.integration
def test_list_importers_pagination(
    client: TestClient,
    auth_headers: dict,
    db_session: Session,
    test_user: User
):
    """Test importer list pagination."""
    # Create 5 importers
    for i in range(5):
        importer = Importer(
            id=uuid.uuid4(),
            key=uuid.uuid4(),
            name=f"Importer {i}",
            user_id=test_user.id,
            fields=[{"name": "test", "type": "text", "required": False}],
        )
        db_session.add(importer)
    db_session.commit()

    # Test with limit
    response = client.get("/api/v1/importers/?limit=3", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 3

    # Test with skip
    response = client.get("/api/v1/importers/?skip=3&limit=3", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.integration
def test_list_importers_user_isolation(
    client: TestClient,
    auth_headers: dict,
    superuser_auth_headers: dict,
    db_session: Session,
    test_user: User,
    test_superuser: User
):
    """Test that users only see their own importers."""
    # Create importer for test_user
    user_importer = Importer(
        id=uuid.uuid4(),
        key=uuid.uuid4(),
        name="User Importer",
        user_id=test_user.id,
        fields=[{"name": "test", "type": "text", "required": False}],
    )
    db_session.add(user_importer)

    # Create importer for superuser
    superuser_importer = Importer(
        id=uuid.uuid4(),
        key=uuid.uuid4(),
        name="Superuser Importer",
        user_id=test_superuser.id,
        fields=[{"name": "test", "type": "text", "required": False}],
    )
    db_session.add(superuser_importer)
    db_session.commit()

    # Test user sees only their importer
    response = client.get("/api/v1/importers/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "User Importer"

    # Test superuser sees only their importer
    response = client.get("/api/v1/importers/", headers=superuser_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Superuser Importer"


# ============================================================================
# POST /api/v1/importers/ - Create Importer
# ============================================================================

@pytest.mark.integration
def test_create_importer_success(
    client: TestClient,
    auth_headers: dict,
    sample_importer_data: dict
):
    """Test successful importer creation."""
    response = client.post(
        "/api/v1/importers/",
        json=sample_importer_data,
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == sample_importer_data["name"]
    assert data["description"] == sample_importer_data["description"]
    assert len(data["fields"]) == 3
    assert "id" in data
    assert "key" in data


@pytest.mark.integration
def test_create_importer_unauthenticated(client: TestClient, sample_importer_data: dict):
    """Test creating importer without authentication fails."""
    response = client.post("/api/v1/importers/", json=sample_importer_data)

    assert response.status_code == 401  # Unauthenticated


@pytest.mark.integration
def test_create_importer_minimal_data(client: TestClient, auth_headers: dict):
    """Test creating importer with minimal required data."""
    minimal_data = {
        "name": "Minimal Importer",
        "fields": [
            {"name": "email", "type": "email", "required": True}
        ]
    }

    response = client.post("/api/v1/importers/", json=minimal_data, headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Minimal Importer"
    assert len(data["fields"]) == 1


@pytest.mark.integration
def test_create_importer_invalid_data(client: TestClient, auth_headers: dict):
    """Test creating importer with invalid data fails validation."""
    invalid_data = {
        "name": "",  # Empty name
        "fields": []  # Empty fields
    }

    response = client.post("/api/v1/importers/", json=invalid_data, headers=auth_headers)

    assert response.status_code == 422  # Validation error


# ============================================================================
# GET /api/v1/importers/{importer_id} - Get Importer
# ============================================================================

@pytest.mark.integration
def test_get_importer_success(
    client: TestClient,
    auth_headers: dict,
    sample_importer: Importer
):
    """Test retrieving a single importer by ID."""
    response = client.get(
        f"/api/v1/importers/{sample_importer.id}",
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(sample_importer.id)
    assert data["name"] == sample_importer.name


@pytest.mark.integration
def test_get_importer_not_found(client: TestClient, auth_headers: dict):
    """Test retrieving non-existent importer returns 404."""
    fake_id = uuid.uuid4()
    response = client.get(f"/api/v1/importers/{fake_id}", headers=auth_headers)

    assert response.status_code == 404


@pytest.mark.integration
def test_get_importer_wrong_user(
    client: TestClient,
    superuser_auth_headers: dict,
    sample_importer: Importer
):
    """Test retrieving another user's importer returns 404."""
    response = client.get(
        f"/api/v1/importers/{sample_importer.id}",
        headers=superuser_auth_headers
    )

    assert response.status_code == 404


@pytest.mark.integration
def test_get_importer_unauthenticated(client: TestClient, sample_importer: Importer):
    """Test retrieving importer without authentication fails."""
    response = client.get(f"/api/v1/importers/{sample_importer.id}")

    assert response.status_code == 401  # Unauthenticated


# ============================================================================
# PUT /api/v1/importers/{importer_id} - Update Importer
# ============================================================================

@pytest.mark.integration
def test_update_importer_success(
    client: TestClient,
    auth_headers: dict,
    sample_importer: Importer
):
    """Test successful importer update."""
    update_data = {
        "name": "Updated Name",
        "description": "Updated description"
    }

    response = client.put(
        f"/api/v1/importers/{sample_importer.id}",
        json=update_data,
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["description"] == "Updated description"


@pytest.mark.integration
def test_update_importer_fields(
    client: TestClient,
    auth_headers: dict,
    sample_importer: Importer
):
    """Test updating importer fields."""
    update_data = {
        "fields": [
            {"name": "phone", "type": "text", "required": True}
        ]
    }

    response = client.put(
        f"/api/v1/importers/{sample_importer.id}",
        json=update_data,
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["fields"]) == 1
    assert data["fields"][0]["name"] == "phone"


@pytest.mark.integration
def test_update_importer_not_found(client: TestClient, auth_headers: dict):
    """Test updating non-existent importer returns 404."""
    fake_id = uuid.uuid4()
    update_data = {"name": "New Name"}

    response = client.put(
        f"/api/v1/importers/{fake_id}",
        json=update_data,
        headers=auth_headers
    )

    assert response.status_code == 404


@pytest.mark.integration
def test_update_importer_wrong_user(
    client: TestClient,
    superuser_auth_headers: dict,
    sample_importer: Importer
):
    """Test updating another user's importer returns 404."""
    update_data = {"name": "Hacked Name"}

    response = client.put(
        f"/api/v1/importers/{sample_importer.id}",
        json=update_data,
        headers=superuser_auth_headers
    )

    assert response.status_code == 404


@pytest.mark.integration
def test_update_importer_unauthenticated(client: TestClient, sample_importer: Importer):
    """Test updating importer without authentication fails."""
    update_data = {"name": "New Name"}

    response = client.put(
        f"/api/v1/importers/{sample_importer.id}",
        json=update_data
    )

    assert response.status_code == 401  # Unauthenticated


# ============================================================================
# DELETE /api/v1/importers/{importer_id} - Delete Importer
# ============================================================================

@pytest.mark.integration
def test_delete_importer_success(
    client: TestClient,
    auth_headers: dict,
    sample_importer: Importer
):
    """Test successful importer deletion."""
    response = client.delete(
        f"/api/v1/importers/{sample_importer.id}",
        headers=auth_headers
    )

    assert response.status_code == 204

    # Verify deletion
    get_response = client.get(
        f"/api/v1/importers/{sample_importer.id}",
        headers=auth_headers
    )
    assert get_response.status_code == 404


@pytest.mark.integration
def test_delete_importer_not_found(client: TestClient, auth_headers: dict):
    """Test deleting non-existent importer returns 404."""
    fake_id = uuid.uuid4()
    response = client.delete(f"/api/v1/importers/{fake_id}", headers=auth_headers)

    assert response.status_code == 404


@pytest.mark.integration
def test_delete_importer_wrong_user(
    client: TestClient,
    superuser_auth_headers: dict,
    sample_importer: Importer
):
    """Test deleting another user's importer returns 404."""
    response = client.delete(
        f"/api/v1/importers/{sample_importer.id}",
        headers=superuser_auth_headers
    )

    assert response.status_code == 404


@pytest.mark.integration
def test_delete_importer_unauthenticated(client: TestClient, sample_importer: Importer):
    """Test deleting importer without authentication fails."""
    response = client.delete(f"/api/v1/importers/{sample_importer.id}")

    assert response.status_code == 401  # Unauthenticated


# ============================================================================
# Error Handling Tests
# ============================================================================

@pytest.mark.integration
def test_invalid_uuid_format(client: TestClient, auth_headers: dict):
    """Test that invalid UUID format returns 422."""
    response = client.get("/api/v1/importers/not-a-uuid", headers=auth_headers)

    assert response.status_code == 422


@pytest.mark.integration
def test_malformed_json(client: TestClient, auth_headers: dict):
    """Test that malformed JSON returns 422."""
    response = client.post(
        "/api/v1/importers/",
        data="not valid json",
        headers={**auth_headers, "Content-Type": "application/json"}
    )

    assert response.status_code == 422


@pytest.mark.integration
def test_expired_token(client: TestClient, test_user: User):
    """Test that expired token returns 401."""
    import jwt
    from datetime import datetime, timedelta
    from app.core.config import settings

    # Create an expired token
    payload = {
        "email": test_user.email,
        "sub": str(test_user.id),
        "iat": datetime.utcnow() - timedelta(hours=2),
        "exp": datetime.utcnow() - timedelta(hours=1),
    }
    token = jwt.encode(
        payload,
        settings.NEXTAUTH_SECRET or settings.SECRET_KEY,
        algorithm="HS256"
    )

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/importers/", headers=headers)

    assert response.status_code == 401


# ============================================================================
# Destination Endpoint Tests
# ============================================================================

@pytest.fixture
def sample_integration(db_session: Session, test_user: User) -> Integration:
    """Create a sample Supabase integration in the database."""
    integration = Integration(
        id=uuid.uuid4(),
        user_id=test_user.id,
        name="Test Supabase",
        type=IntegrationType.SUPABASE,
        encrypted_credentials='{"url": "https://test.supabase.co", "service_key": "test-key"}',
    )
    db_session.add(integration)
    db_session.commit()
    db_session.refresh(integration)
    return integration


@pytest.mark.integration
def test_set_destination_with_context_mapping(
    client: TestClient,
    auth_headers: dict,
    sample_importer: Importer,
    sample_integration: Integration,
):
    """Test that context_mapping is persisted when setting a destination."""
    response = client.put(
        f"/api/v1/importers/{sample_importer.id}/destination",
        json={
            "integration_id": str(sample_integration.id),
            "table_name": "contacts",
            "column_mapping": {"email": "email_address"},
            "context_mapping": {"user_id": "user_id", "org_id": "organization_id"},
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["context_mapping"] == {"user_id": "user_id", "org_id": "organization_id"}
    assert data["column_mapping"] == {"email": "email_address"}
    assert data["table_name"] == "contacts"


@pytest.mark.integration
def test_get_destination_returns_context_mapping(
    client: TestClient,
    auth_headers: dict,
    sample_importer: Importer,
    sample_integration: Integration,
):
    """Test that GET returns persisted context_mapping."""
    # First create a destination with context_mapping
    client.put(
        f"/api/v1/importers/{sample_importer.id}/destination",
        json={
            "integration_id": str(sample_integration.id),
            "table_name": "users",
            "column_mapping": {},
            "context_mapping": {"tenant_id": "tenant_id"},
        },
        headers=auth_headers,
    )

    # Now GET and verify
    response = client.get(
        f"/api/v1/importers/{sample_importer.id}/destination",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["context_mapping"] == {"tenant_id": "tenant_id"}


@pytest.mark.integration
def test_update_destination_context_mapping(
    client: TestClient,
    auth_headers: dict,
    sample_importer: Importer,
    sample_integration: Integration,
):
    """Test that context_mapping can be updated on an existing destination."""
    # Create initial destination
    client.put(
        f"/api/v1/importers/{sample_importer.id}/destination",
        json={
            "integration_id": str(sample_integration.id),
            "table_name": "contacts",
            "column_mapping": {},
            "context_mapping": {"user_id": "user_id"},
        },
        headers=auth_headers,
    )

    # Update with new context_mapping
    response = client.put(
        f"/api/v1/importers/{sample_importer.id}/destination",
        json={
            "integration_id": str(sample_integration.id),
            "table_name": "contacts",
            "column_mapping": {},
            "context_mapping": {"user_id": "uid", "org_id": "org"},
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["context_mapping"] == {"user_id": "uid", "org_id": "org"}


@pytest.mark.integration
def test_destination_context_mapping_defaults_to_empty(
    client: TestClient,
    auth_headers: dict,
    sample_importer: Importer,
    sample_integration: Integration,
):
    """Test that context_mapping defaults to empty dict if not provided."""
    response = client.put(
        f"/api/v1/importers/{sample_importer.id}/destination",
        json={
            "integration_id": str(sample_integration.id),
            "table_name": "contacts",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["context_mapping"] == {}


@pytest.mark.integration
def test_get_destination_not_found(
    client: TestClient,
    auth_headers: dict,
    sample_importer: Importer,
):
    """Test that GET returns null when no destination is configured."""
    response = client.get(
        f"/api/v1/importers/{sample_importer.id}/destination",
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json() is None


@pytest.mark.integration
def test_delete_destination(
    client: TestClient,
    auth_headers: dict,
    sample_importer: Importer,
    sample_integration: Integration,
):
    """Test destination deletion."""
    # Create destination
    client.put(
        f"/api/v1/importers/{sample_importer.id}/destination",
        json={
            "integration_id": str(sample_integration.id),
            "table_name": "contacts",
            "context_mapping": {"user_id": "user_id"},
        },
        headers=auth_headers,
    )

    # Delete it
    response = client.delete(
        f"/api/v1/importers/{sample_importer.id}/destination",
        headers=auth_headers,
    )
    assert response.status_code == 204

    # Verify deletion
    get_response = client.get(
        f"/api/v1/importers/{sample_importer.id}/destination",
        headers=auth_headers,
    )
    assert get_response.status_code == 200
    assert get_response.json() is None


# ============================================================================
# Webhook Destination Tests
# ============================================================================


@pytest.mark.integration
def test_set_webhook_destination(
    client: TestClient,
    auth_headers: dict,
    sample_importer: Importer,
):
    """Test setting a webhook destination."""
    response = client.put(
        f"/api/v1/importers/{sample_importer.id}/destination",
        json={
            "destination_type": "webhook",
            "webhook_url": "https://example.com/webhook",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["destination_type"] == "webhook"
    assert data["webhook_url"] == "https://example.com/webhook"
    assert data["integration_id"] is None
    # signing_secret will be None in tests since Svix is not configured


@pytest.mark.integration
def test_get_webhook_destination(
    client: TestClient,
    auth_headers: dict,
    sample_importer: Importer,
):
    """Test retrieving a webhook destination."""
    # First create webhook destination
    client.put(
        f"/api/v1/importers/{sample_importer.id}/destination",
        json={
            "destination_type": "webhook",
            "webhook_url": "https://example.com/webhook",
        },
        headers=auth_headers,
    )

    # Now retrieve it
    response = client.get(
        f"/api/v1/importers/{sample_importer.id}/destination",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["destination_type"] == "webhook"
    assert data["webhook_url"] == "https://example.com/webhook"


@pytest.mark.integration
def test_webhook_destination_requires_https(
    client: TestClient,
    auth_headers: dict,
    sample_importer: Importer,
):
    """Test that webhook URL must use HTTPS."""
    response = client.put(
        f"/api/v1/importers/{sample_importer.id}/destination",
        json={
            "destination_type": "webhook",
            "webhook_url": "http://example.com/webhook",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422
    assert "Webhook URL must use HTTPS" in response.text


@pytest.mark.integration
def test_webhook_destination_requires_url(
    client: TestClient,
    auth_headers: dict,
    sample_importer: Importer,
):
    """Test that webhook destination requires webhook_url."""
    response = client.put(
        f"/api/v1/importers/{sample_importer.id}/destination",
        json={
            "destination_type": "webhook",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422
    assert "Webhook destination requires webhook_url" in response.text


@pytest.mark.integration
def test_switch_supabase_to_webhook_destination(
    client: TestClient,
    auth_headers: dict,
    sample_importer: Importer,
    sample_integration: Integration,
):
    """Test switching from Supabase to webhook destination."""
    # First set Supabase destination
    response = client.put(
        f"/api/v1/importers/{sample_importer.id}/destination",
        json={
            "integration_id": str(sample_integration.id),
            "table_name": "contacts",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["destination_type"] == "supabase"

    # Switch to webhook
    response = client.put(
        f"/api/v1/importers/{sample_importer.id}/destination",
        json={
            "destination_type": "webhook",
            "webhook_url": "https://example.com/webhook",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["destination_type"] == "webhook"
    assert data["webhook_url"] == "https://example.com/webhook"
    assert data["integration_id"] is None
