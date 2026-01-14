"""Tests for schema inference service."""
from types import SimpleNamespace
from unittest.mock import patch

import pytest


@pytest.mark.unit
@pytest.mark.asyncio
async def test_infer_schema_from_csv():
    """infer_schema_from_csv should return inferred columns."""
    from app.services.schema_inference import infer_schema_from_csv

    csv_data = [
        {"email": "alice@example.com", "name": "Alice", "status": "active"},
        {"email": "bob@example.com", "name": "Bob", "status": "pending"},
        {"email": "carol@example.com", "name": "Carol", "status": "active"},
    ]

    # Mock BAML response with SimpleNamespace for proper attribute access
    mock_result = SimpleNamespace(
        columns=[
            SimpleNamespace(
                name="email",
                display_name="Email",
                type="email",
                confidence=0.95,
                suggested_options=None,
                reasoning="Contains @ symbol and domain"
            ),
            SimpleNamespace(
                name="name",
                display_name="Name",
                type="text",
                confidence=0.90,
                suggested_options=None,
                reasoning="Free-form text values"
            ),
            SimpleNamespace(
                name="status",
                display_name="Status",
                type="select",
                confidence=0.92,
                suggested_options=["active", "pending"],
                reasoning="Low cardinality with repeated values"
            ),
        ]
    )

    async def mock_infer_schema(*args, **kwargs):
        return mock_result

    with patch("app.services.schema_inference.b.InferSchema", side_effect=mock_infer_schema):
        result = await infer_schema_from_csv(csv_data)

        assert len(result) == 3
        assert result[0]["name"] == "email"
        assert result[0]["type"] == "email"
        assert result[2]["type"] == "select"
        assert result[2]["options"] == ["active", "pending"]


@pytest.mark.unit
def test_extract_sample_columns():
    """extract_sample_columns should extract headers and samples."""
    from app.services.schema_inference import extract_sample_columns

    csv_data = [
        {"email": "a@b.com", "count": "10"},
        {"email": "c@d.com", "count": "20"},
        {"email": "e@f.com", "count": "30"},
    ]

    columns = extract_sample_columns(csv_data, max_samples=2)

    assert len(columns) == 2
    assert columns[0]["name"] == "email"
    assert len(columns[0]["samples"]) == 2
    assert columns[0]["samples"][0] == "a@b.com"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_infer_schema_empty_data():
    """infer_schema_from_csv should return empty list for empty input."""
    from app.services.schema_inference import infer_schema_from_csv

    result = await infer_schema_from_csv([])
    assert result == []


@pytest.mark.unit
def test_extract_sample_columns_empty():
    """extract_sample_columns should handle empty input."""
    from app.services.schema_inference import extract_sample_columns

    assert extract_sample_columns([]) == []


@pytest.mark.unit
@pytest.mark.asyncio
async def test_infer_schema_baml_failure_fallback():
    """Should return text fallback when BAML fails."""
    from app.services.schema_inference import infer_schema_from_csv

    csv_data = [{"email": "test@example.com", "name": "Test"}]

    with patch(
        "app.services.schema_inference.b.InferSchema", side_effect=RuntimeError("API Error")
    ):
        result = await infer_schema_from_csv(csv_data)

    assert len(result) == 2
    assert all(col["type"] == "text" for col in result)
    # Verify display_name is generated from column name
    assert result[0]["display_name"] == "Email"
    assert result[1]["display_name"] == "Name"


@pytest.mark.unit
def test_extract_sample_columns_with_none_values():
    """extract_sample_columns should handle None values in rows."""
    from app.services.schema_inference import extract_sample_columns

    csv_data = [
        {"email": "a@b.com", "name": None},
        {"email": None, "name": "Test"},
    ]

    columns = extract_sample_columns(csv_data, max_samples=10)

    assert len(columns) == 2
    # None values should be skipped
    assert columns[0]["samples"] == ["a@b.com"]
    assert columns[1]["samples"] == ["Test"]
