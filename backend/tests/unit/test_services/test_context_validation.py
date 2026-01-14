"""Tests for context validation service."""
import pytest
from app.services.context_validation import (
    get_required_context_keys,
    validate_required_context_keys,
)


@pytest.mark.unit
def test_get_required_context_keys_returns_not_null_columns():
    """Test that only NOT NULL columns without defaults are required."""
    context_mapping = {"org_id": "org_id", "team_id": "team_id"}
    column_schema = [
        {"column_name": "org_id", "is_nullable": False, "column_default": None},
        {"column_name": "team_id", "is_nullable": True, "column_default": None},
    ]

    required = get_required_context_keys(context_mapping, column_schema)
    assert required == ["org_id"]


@pytest.mark.unit
def test_get_required_context_keys_with_default_values():
    """Test that columns with defaults are not required."""
    context_mapping = {"org_id": "org_id", "status": "status"}
    column_schema = [
        {"column_name": "org_id", "is_nullable": False, "column_default": None},
        {"column_name": "status", "is_nullable": False, "column_default": "'active'"},
    ]

    required = get_required_context_keys(context_mapping, column_schema)
    assert required == ["org_id"]


@pytest.mark.unit
def test_get_required_context_keys_empty_mapping():
    """Test with empty context mapping."""
    context_mapping = {}
    column_schema = [
        {"column_name": "org_id", "is_nullable": False, "column_default": None},
    ]

    required = get_required_context_keys(context_mapping, column_schema)
    assert required == []


@pytest.mark.unit
def test_validate_required_context_keys_passes_when_all_present():
    """Test validation passes when all required keys are present."""
    required_keys = ["org_id", "user_id"]
    context = {"org_id": "org-123", "user_id": "user-456"}

    errors = validate_required_context_keys(required_keys, context)
    assert errors == []


@pytest.mark.unit
def test_validate_required_context_keys_fails_when_missing():
    """Test validation fails when required keys are missing."""
    required_keys = ["org_id", "user_id"]
    context = {"org_id": "org-123"}

    errors = validate_required_context_keys(required_keys, context)
    assert "user_id" in errors


@pytest.mark.unit
def test_validate_required_context_keys_fails_when_null():
    """Test validation fails when required key has null value."""
    required_keys = ["org_id"]
    context = {"org_id": None}

    errors = validate_required_context_keys(required_keys, context)
    assert "org_id" in errors


@pytest.mark.unit
def test_validate_required_context_keys_empty_context():
    """Test validation with empty context."""
    required_keys = ["org_id"]
    context = {}

    errors = validate_required_context_keys(required_keys, context)
    assert "org_id" in errors


@pytest.mark.unit
def test_validate_required_context_keys_none_context():
    """Test validation with None context."""
    required_keys = ["org_id"]
    context = None

    errors = validate_required_context_keys(required_keys, context)
    assert "org_id" in errors


@pytest.mark.unit
def test_validate_required_context_keys_no_required_keys():
    """Test validation passes when no keys are required."""
    required_keys = []
    context = {}

    errors = validate_required_context_keys(required_keys, context)
    assert errors == []
