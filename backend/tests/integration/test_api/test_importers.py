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

    assert response.status_code == 403  # HTTPBearer returns 403 for missing auth


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

    assert response.status_code == 403


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


@pytest.mark.integration
def test_create_importer_webhook_url_normalization(client: TestClient, auth_headers: dict):
    """Test that webhook URLs are normalized during creation."""
    importer_data = {
        "name": "Test",
        "fields": [{"name": "email", "type": "email", "required": True}],
        "webhook_url": "example.com/hook"  # Missing protocol
    }

    response = client.post("/api/v1/importers/", json=importer_data, headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["webhook_url"] == "https://example.com/hook"


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

    assert response.status_code == 403


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

    assert response.status_code == 403


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

    assert response.status_code == 403


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
