"""
Unit tests for the importer service module.

Tests CRUD operations, validation, and business logic for importers.
"""
import uuid
import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.services.importer import (
    get_importers,
    create_importer,
    get_importer,
    update_importer,
    delete_importer,
    batch_delete_importers,
    get_importer_by_key,
    _process_fields,
)
from app.schemas.importer import ImporterCreate, ImporterUpdate
from app.models.importer import Importer
from app.models.user import User


# ============================================================================
# Helper Function Tests
# ============================================================================


@pytest.mark.unit
def test_process_fields_with_dicts():
    """Test field processing with dictionary inputs."""
    fields = [
        {"name": "email", "type": "email", "required": True},
        {"name": "name", "type": "text", "required": False},
    ]
    result = _process_fields(fields)
    assert result == fields
    assert len(result) == 2


@pytest.mark.unit
def test_process_fields_with_pydantic_models():
    """Test field processing with Pydantic model inputs."""
    from pydantic import BaseModel

    class Field(BaseModel):
        name: str
        type: str
        required: bool

    fields = [
        Field(name="email", type="email", required=True),
        Field(name="name", type="text", required=False),
    ]

    result = _process_fields(fields)
    assert len(result) == 2
    assert isinstance(result[0], dict)
    assert result[0]["name"] == "email"


# ============================================================================
# CRUD Operation Tests
# ============================================================================

@pytest.mark.unit
def test_get_importers_empty(db_session: Session, test_user: User):
    """Test retrieving importers when none exist."""
    importers = get_importers(db_session, str(test_user.id))
    assert importers == []


@pytest.mark.unit
def test_get_importers_with_data(db_session: Session, test_user: User, sample_importer: Importer):
    """Test retrieving importers when data exists."""
    importers = get_importers(db_session, str(test_user.id))
    assert len(importers) == 1
    assert importers[0].id == sample_importer.id


@pytest.mark.unit
def test_get_importers_pagination(db_session: Session, test_user: User):
    """Test importer pagination with skip and limit."""
    # Create multiple importers
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

    # Test pagination
    importers = get_importers(db_session, str(test_user.id), skip=0, limit=3)
    assert len(importers) == 3

    importers = get_importers(db_session, str(test_user.id), skip=3, limit=3)
    assert len(importers) == 2


@pytest.mark.unit
def test_get_importers_user_isolation(db_session: Session, test_user: User, test_superuser: User):
    """Test that users only see their own importers."""
    # Create importer for test_user
    importer1 = Importer(
        id=uuid.uuid4(),
        key=uuid.uuid4(),
        name="User Importer",
        user_id=test_user.id,
        fields=[{"name": "test", "type": "text", "required": False}],
    )
    db_session.add(importer1)

    # Create importer for test_superuser
    importer2 = Importer(
        id=uuid.uuid4(),
        key=uuid.uuid4(),
        name="Superuser Importer",
        user_id=test_superuser.id,
        fields=[{"name": "test", "type": "text", "required": False}],
    )
    db_session.add(importer2)
    db_session.commit()

    # Verify user isolation
    user_importers = get_importers(db_session, str(test_user.id))
    assert len(user_importers) == 1
    assert user_importers[0].name == "User Importer"

    superuser_importers = get_importers(db_session, str(test_superuser.id))
    assert len(superuser_importers) == 1
    assert superuser_importers[0].name == "Superuser Importer"


@pytest.mark.unit
def test_create_importer_success(db_session: Session, test_user: User, sample_importer_data: dict):
    """Test successful importer creation."""
    importer_in = ImporterCreate(**sample_importer_data)
    importer = create_importer(db_session, str(test_user.id), importer_in)

    assert importer.id is not None
    assert importer.name == sample_importer_data["name"]
    assert importer.user_id == test_user.id
    assert len(importer.fields) == 3


@pytest.mark.unit
def test_get_importer_success(db_session: Session, test_user: User, sample_importer: Importer):
    """Test retrieving a single importer by ID."""
    importer = get_importer(db_session, str(test_user.id), sample_importer.id)
    assert importer is not None
    assert importer.id == sample_importer.id


@pytest.mark.unit
def test_get_importer_not_found(db_session: Session, test_user: User):
    """Test retrieving a non-existent importer."""
    fake_id = uuid.uuid4()
    importer = get_importer(db_session, str(test_user.id), fake_id)
    assert importer is None


@pytest.mark.unit
def test_get_importer_wrong_user(db_session: Session, test_user: User, test_superuser: User, sample_importer: Importer):
    """Test that users cannot access other users' importers."""
    importer = get_importer(db_session, str(test_superuser.id), sample_importer.id)
    assert importer is None


@pytest.mark.unit
def test_update_importer_success(db_session: Session, test_user: User, sample_importer: Importer):
    """Test successful importer update."""
    update_data = ImporterUpdate(
        name="Updated Name",
        description="Updated description",
    )
    updated = update_importer(db_session, str(test_user.id), sample_importer.id, update_data)

    assert updated is not None
    assert updated.name == "Updated Name"
    assert updated.description == "Updated description"


@pytest.mark.unit
def test_update_importer_fields(db_session: Session, test_user: User, sample_importer: Importer):
    """Test updating importer fields."""
    new_fields = [
        {"name": "phone", "type": "text", "required": True},
    ]
    update_data = ImporterUpdate(fields=new_fields)
    updated = update_importer(db_session, str(test_user.id), sample_importer.id, update_data)

    assert updated is not None
    assert len(updated.fields) == 1
    assert updated.fields[0]["name"] == "phone"


@pytest.mark.unit
def test_update_importer_not_found(db_session: Session, test_user: User):
    """Test updating a non-existent importer."""
    fake_id = uuid.uuid4()
    update_data = ImporterUpdate(name="New Name")
    updated = update_importer(db_session, str(test_user.id), fake_id, update_data)
    assert updated is None


@pytest.mark.unit
def test_delete_importer_success(db_session: Session, test_user: User, sample_importer: Importer):
    """Test successful importer deletion."""
    deleted = delete_importer(db_session, str(test_user.id), sample_importer.id)
    assert deleted is not None

    # Verify it's deleted
    importer = get_importer(db_session, str(test_user.id), sample_importer.id)
    assert importer is None


@pytest.mark.unit
def test_delete_importer_not_found(db_session: Session, test_user: User):
    """Test deleting a non-existent importer."""
    fake_id = uuid.uuid4()
    deleted = delete_importer(db_session, str(test_user.id), fake_id)
    assert deleted is None


@pytest.mark.unit
def test_batch_delete_importers(db_session: Session, test_user: User):
    """Test batch deletion of importers."""
    # Create multiple importers
    importer_ids = []
    for i in range(3):
        importer = Importer(
            id=uuid.uuid4(),
            key=uuid.uuid4(),
            name=f"Importer {i}",
            user_id=test_user.id,
            fields=[{"name": "test", "type": "text", "required": False}],
        )
        db_session.add(importer)
        importer_ids.append(str(importer.id))
    db_session.commit()

    # Batch delete
    count = batch_delete_importers(db_session, str(test_user.id), importer_ids)
    assert count == 3

    # Verify deletion
    remaining = get_importers(db_session, str(test_user.id))
    assert len(remaining) == 0


@pytest.mark.unit
def test_batch_delete_importers_user_isolation(db_session: Session, test_user: User, test_superuser: User):
    """Test that batch delete respects user isolation."""
    # Create importer for test_user
    importer1 = Importer(
        id=uuid.uuid4(),
        key=uuid.uuid4(),
        name="User Importer",
        user_id=test_user.id,
        fields=[{"name": "test", "type": "text", "required": False}],
    )
    db_session.add(importer1)

    # Create importer for test_superuser
    importer2 = Importer(
        id=uuid.uuid4(),
        key=uuid.uuid4(),
        name="Superuser Importer",
        user_id=test_superuser.id,
        fields=[{"name": "test", "type": "text", "required": False}],
    )
    db_session.add(importer2)
    db_session.commit()

    # Try to delete superuser's importer as test_user
    count = batch_delete_importers(db_session, str(test_user.id), [str(importer2.id)])
    assert count == 0

    # Verify superuser's importer still exists
    importer = get_importer(db_session, str(test_superuser.id), importer2.id)
    assert importer is not None


@pytest.mark.unit
def test_get_importer_by_key_success(db_session: Session, sample_importer: Importer):
    """Test retrieving importer by key."""
    importer = get_importer_by_key(db_session, sample_importer.key)
    assert importer is not None
    assert importer.id == sample_importer.id


@pytest.mark.unit
def test_get_importer_by_key_not_found(db_session: Session):
    """Test retrieving importer by non-existent key raises HTTPException."""
    fake_key = uuid.uuid4()
    with pytest.raises(HTTPException) as exc_info:
        get_importer_by_key(db_session, fake_key)

    assert exc_info.value.status_code == 404
    assert "not found" in str(exc_info.value.detail).lower()
