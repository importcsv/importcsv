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
