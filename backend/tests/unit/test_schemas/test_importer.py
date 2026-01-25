# backend/tests/unit/test_schemas/test_importer.py
import pytest
from app.schemas.importer import ImporterCreate, ImporterUpdate, Importer


@pytest.mark.unit
def test_importer_create_accepts_dynamic_fields():
    """ImporterCreate should accept dynamic_fields."""
    data = ImporterCreate(
        name="Test",
        fields=[{"name": "field1", "type": "text"}],
        dynamic_fields=[{"name": "custom1", "type": "text"}],
    )
    assert len(data.dynamic_fields) == 1
    assert data.dynamic_fields[0].name == "custom1"


@pytest.mark.unit
def test_importer_create_dynamic_fields_defaults_empty():
    """dynamic_fields should default to empty list."""
    data = ImporterCreate(
        name="Test",
        fields=[{"name": "field1", "type": "text"}],
    )
    assert data.dynamic_fields == []


@pytest.mark.unit
def test_importer_response_includes_dynamic_fields():
    """Importer response schema includes dynamic_fields."""
    # This tests the schema definition
    assert hasattr(Importer, 'model_fields')
    assert 'dynamic_fields' in Importer.model_fields


@pytest.mark.unit
def test_importer_update_accepts_dynamic_fields():
    """ImporterUpdate should accept optional dynamic_fields."""
    data = ImporterUpdate(
        dynamic_fields=[{"name": "custom1", "type": "text"}],
    )
    assert len(data.dynamic_fields) == 1
    assert data.dynamic_fields[0].name == "custom1"


@pytest.mark.unit
def test_importer_update_dynamic_fields_can_be_none():
    """ImporterUpdate dynamic_fields should default to None (not empty list)."""
    data = ImporterUpdate(name="Updated")
    assert data.dynamic_fields is None
