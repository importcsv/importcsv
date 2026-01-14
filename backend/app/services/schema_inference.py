"""Service for AI-powered schema inference from CSV data."""

import logging
from typing import Any

from baml_client import types as baml_types
from baml_client.async_client import b

logger = logging.getLogger(__name__)


def extract_sample_columns(
    csv_data: list[dict[str, Any]], max_samples: int = 10
) -> list[dict[str, Any]]:
    """Extract column names and sample values from CSV data."""
    if not csv_data:
        return []

    # Get column names from first row
    columns = list(csv_data[0].keys())

    result = []
    for col_name in columns:
        samples = []
        for row in csv_data[:max_samples]:
            value = row.get(col_name)
            if value is not None:
                samples.append(str(value))

        result.append({"name": col_name, "samples": samples})

    return result


async def infer_schema_from_csv(
    csv_data: list[dict[str, Any]], max_samples: int = 10
) -> list[dict[str, Any]]:
    """Use AI to infer schema from CSV sample data."""
    # Extract sample columns
    sample_columns = extract_sample_columns(csv_data, max_samples)

    if not sample_columns:
        return []

    try:
        baml_columns = [
            baml_types.SampleColumn(name=col["name"], samples=col["samples"])
            for col in sample_columns
        ]

        result = await b.InferSchema(columns=baml_columns)

        # Convert to importer field format
        fields = []
        for col in result.columns:
            field = {
                "name": col.name,
                "display_name": col.display_name,
                "type": col.type.value if hasattr(col.type, "value") else str(col.type),
            }

            # Add options for select type
            if col.suggested_options:
                field["options"] = col.suggested_options

            fields.append(field)

        return fields

    except (ValueError, RuntimeError, KeyError) as e:
        logger.error(f"Schema inference failed: {e}")
        # Fallback: return basic schema with text types
        return [
            {
                "name": col["name"],
                "display_name": col["name"].replace("_", " ").replace("-", " ").title(),
                "type": "text",
            }
            for col in sample_columns
        ]
