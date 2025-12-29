"""
Column mapping service using BAML.
"""

import logging
import os
from typing import List, Dict

from baml_client.async_client import b
from baml_client import types as baml_types

logger = logging.getLogger(__name__)

# Constants
MIN_CONFIDENCE_THRESHOLD = 0.8


async def enhance_column_mappings(
    upload_columns: List[Dict], template_columns: List[Dict]
) -> List[Dict]:
    """
    Get column mapping suggestions using BAML.

    Args:
        upload_columns: List of dicts with 'name' and optional 'sample_data'
        template_columns: List of dicts with 'key'/'id', 'name'/'label', and 'required'/'validators'

    Returns:
        List of mapping suggestions with uploadIndex, templateKey, and confidence
    """
    if not upload_columns or not template_columns:
        return []

    # Check if LLM is configured
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your-openai-api-key-here":
        logger.debug("OpenAI API key not configured, skipping LLM enhancement")
        return []

    try:
        # Convert to BAML types
        baml_upload = [
            baml_types.UploadColumn(
                index=i,
                name=col.get("name", ""),
                sample=_get_first_sample(col.get("sample_data"))
            )
            for i, col in enumerate(upload_columns)
        ]

        baml_template = [
            baml_types.TemplateColumn(
                key=col.get("key", col.get("id", "")),
                name=col.get("name", col.get("label", "")),
                required=_is_required(col)
            )
            for col in template_columns
        ]

        # Call BAML function
        result = await b.MapColumns(
            upload_columns=baml_upload,
            template_columns=baml_template
        )

        # Convert to API response format
        mappings = [
            {
                "uploadIndex": m.upload_index,
                "templateKey": m.template_key,
                "confidence": m.confidence
            }
            for m in result.mappings
            if m.confidence >= MIN_CONFIDENCE_THRESHOLD
        ]

        logger.info(f"Generated {len(mappings)} mapping suggestions via BAML")
        return mappings

    except Exception as e:
        logger.error(f"BAML mapping failed: {e}")
        return []


def _get_first_sample(sample_data: List) -> str | None:
    """Extract first non-empty sample value."""
    if sample_data and len(sample_data) > 0 and sample_data[0]:
        return str(sample_data[0])
    return None


def _is_required(col: Dict) -> bool:
    """Check if column is required (supports both formats)."""
    if col.get("required"):
        return True
    validators = col.get("validators", [])
    return any(v.get("type") == "required" for v in validators)
