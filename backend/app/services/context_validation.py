"""Context validation service for destination delivery."""

from typing import Any


def get_required_context_keys(
    context_mapping: dict[str, str],
    column_schema: list[dict[str, Any]],
) -> list[str]:
    """
    Determine which context keys are required based on column nullability.

    Args:
        context_mapping: Maps table columns to context keys
        column_schema: List of column definitions with is_nullable and column_default

    Returns:
        List of context keys that are required (NOT NULL without default)
    """
    if not context_mapping:
        return []

    required_keys = []

    # Build lookup from column name to schema
    column_lookup = {col["column_name"]: col for col in column_schema}

    for column_name, context_key in context_mapping.items():
        col_def = column_lookup.get(column_name)
        if col_def:
            # Required if NOT NULL and no default value
            is_nullable = col_def.get("is_nullable", True)
            has_default = col_def.get("column_default") is not None
            if not is_nullable and not has_default:
                required_keys.append(context_key)

    return required_keys


def validate_required_context_keys(
    required_keys: list[str],
    context: dict[str, Any] | None,
) -> list[str]:
    """
    Validate that all required context keys are present and non-null.

    Args:
        required_keys: List of context keys that must be present
        context: The context object provided at import time

    Returns:
        List of missing or null required keys (empty if all valid)
    """
    if not required_keys:
        return []

    context = context or {}
    missing = []

    for key in required_keys:
        if key not in context or context[key] is None:
            missing.append(key)

    return missing
