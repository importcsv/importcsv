"""
Natural language data transformation service using BAML.
"""

import logging
import os

from baml_client import types as baml_types
from baml_client.async_client import b

logger = logging.getLogger(__name__)

# Constants
MIN_CONFIDENCE_THRESHOLD = 0.7

# Validation rule definitions to help LLM understand what makes data valid
# Regex patterns match the frontend validation logic for consistency
VALIDATION_RULES = {
    "email must be a valid email address": {
        "type": "email",
        "rule": "Email must contain @ symbol, domain, and TLD (.com, .org, etc.)",
        "pattern": "username@domain.tld",
        "regex": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",  # Same as frontend validation
        "regex_description": "Format: <non-whitespace>@<non-whitespace>.<non-whitespace>",
        "examples": {
            "valid": ["user@example.com", "john.doe@company.org", "info@website.co.uk"],
            "invalid": ["user[at]example.com", "user@example", "userexample.com",
                        "@.com", "user@sample"]
        },
        "common_fixes": {
            "[at]": "Replace [at] with @",
            "missing .com after @example": "Add .com to complete the domain",
            "missing @ symbol": "Add @ between username and domain",
            "@.com pattern": "Add domain name before .com",
            "@sample": "Replace with valid domain like @example.com"
        }
    },
    "must be a number": {
        "type": "number",
        "rule": "Value must be a valid number (integer or decimal)",
        "pattern": "numeric",
        "regex": "^-?\\d+(\\.\\d+)?$",  # Matches integers and decimals
        "regex_description": (
            "Format: optional minus sign, digits, optional decimal point and digits"
        ),
        "examples": {
            "valid": ["123", "45.67", "-100", "0.5"],
            "invalid": ["abc", "12.34.56", "1,234", "five"]
        },
        "common_fixes": {
            "letters": "Remove non-numeric characters",
            "multiple decimals": "Keep only one decimal point",
            "commas": "Remove comma separators"
        }
    },
    "must be a valid date": {
        "type": "date",
        "rule": "Date must be in a recognized format like YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY",
        "pattern": "YYYY-MM-DD or MM/DD/YYYY or DD/MM/YYYY",
        "regex": None,  # Date validation is complex, handled by Date() constructor
        "regex_description": (
            "Valid date formats: ISO (YYYY-MM-DD), US (MM/DD/YYYY), EU (DD/MM/YYYY), "
            "or parseable date strings"
        ),
        "examples": {
            "valid": ["2024-01-15", "01/15/2024", "15/01/2024", "Jan 15, 2024"],
            "invalid": ["1234", "2024", "invalid-date", "32/13/2024"]
        },
        "common_fixes": {
            "year only": "Add month and day (e.g., 2024 → 2024-01-01)",
            "invalid format": "Reformat to YYYY-MM-DD or MM/DD/YYYY"
        }
    }
}


# Helper functions for BAML type conversion
def _to_validation_errors(errors: list[dict]) -> list[baml_types.ValidationError]:
    """Convert validation error dicts to BAML ValidationError objects."""
    return [
        baml_types.ValidationError(
            row_index=e.get("rowIndex", 0),
            column_key=e.get("columnKey", ""),
            value=str(e.get("value", "")),
            error_message=e.get("message", "")
        )
        for e in errors
    ]


def _to_row_data(data_for_llm: list[dict]) -> list[baml_types.RowData]:
    """Convert row data to BAML RowData objects."""
    return [
        baml_types.RowData(
            row_index=item["row_index"],
            data=item["data"]
        )
        for item in data_for_llm
    ]


def _get_relevant_validation_rules(errors: list[dict]) -> list[baml_types.ValidationRule]:
    """Get validation rules relevant to the errors."""
    rules = []
    seen_rules = set()
    
    for error in errors:
        message = error.get("message", "").lower()
        for rule_key, rule_data in VALIDATION_RULES.items():
            if rule_key in message and rule_key not in seen_rules:
                seen_rules.add(rule_key)
                rules.append(baml_types.ValidationRule(
                    error_type=rule_key,  # Add the error type as a field
                    type=rule_data["type"],
                    rule=rule_data["rule"],
                    pattern=rule_data.get("pattern"),
                    regex=rule_data.get("regex"),
                    regex_description=rule_data.get("regex_description"),
                    valid_examples=rule_data["examples"]["valid"],
                    invalid_examples=rule_data["examples"]["invalid"],
                    common_fixes=rule_data["common_fixes"]
                ))
    return rules


def _from_transformation_result(
    result: baml_types.TransformationResult, col_indices: dict
) -> list[dict]:
    """Convert BAML TransformationResult to changes format."""
    changes = []
    skipped_columns = set()
    
    for trans in result.transformations:
        if trans.confidence >= MIN_CONFIDENCE_THRESHOLD:
            column_index = col_indices.get(trans.column)
            
            if column_index is not None:
                changes.append({
                    "rowIndex": trans.row_index,
                    "columnKey": trans.column,
                    "columnIndex": column_index,
                    "oldValue": trans.old_value,
                    "newValue": trans.new_value,
                    "confidence": trans.confidence,
                    "selected": True,
                })
            else:
                # Track columns that couldn't be mapped (for logging)
                skipped_columns.add(trans.column)
    
    if skipped_columns:
        logger.warning(f"Skipped transformations for unmapped columns: {list(skipped_columns)}")
    
    return changes


class TransformationResult:
    """Result of a transformation operation"""

    def __init__(self):
        self.changes: list[dict] = []
        self.summary: str = ""
        self.error: str | None = None
        self.tokens_used: int = 0

    def to_dict(self):
        return {
            "changes": self.changes,
            "summary": self.summary,
            "error": self.error,
            "tokens_used": self.tokens_used,
        }


async def generate_transformations(
    prompt: str,
    data: list[dict],
    column_mapping: dict[str, str],
    target_columns: list[str] | None = None,
    validation_errors: list[dict] | None = None,
    max_rows: int = 1000,
) -> TransformationResult:
    """
    Generate data transformations based on natural language prompt.

    Simplified version that:
    1. Identifies relevant columns
    2. Extracts data for those columns
    3. If validation errors exist, focuses on fixing those specific rows
    4. Returns transformations
    """
    result = TransformationResult()

    # Check if OpenAI is configured
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your-openai-api-key-here":
        result.error = "OpenAI API key not configured"
        return result

    try:
        # Step 1: Identify relevant columns if not provided
        if not target_columns:
            # For validation error fixing, extract columns from the errors
            if validation_errors:
                # Get unique column keys from validation errors
                error_columns = list(set(e.get("columnKey", "") for e in validation_errors if e.get("columnKey")))
                if error_columns:
                    target_columns = error_columns
                else:
                    target_columns = await _identify_relevant_columns(prompt, column_mapping)
            else:
                target_columns = await _identify_relevant_columns(prompt, column_mapping)

        # Step 2: Determine which rows to process
        if validation_errors:
            # Extract row indices from validation errors
            rows_to_process = list({
                e.get("rowIndex", -1) for e in validation_errors
                if e.get("rowIndex", -1) >= 0
            })
            rows_to_process.sort()
            logger.info(f"Processing {len(rows_to_process)} rows with validation errors")
        else:
            # Process all rows (up to max_rows)
            rows_to_process = list(range(min(len(data), max_rows)))
            logger.info(f"Processing all {len(rows_to_process)} rows")

        # Step 3: Extract data for target columns and specific rows
        data_for_llm = []
        col_indices = _get_column_indices(target_columns, column_mapping)
        
        if not col_indices:
            logger.warning("No valid column indices found for target columns")
            result.error = "Could not map columns for transformation"
            return result

        for row_idx in rows_to_process:
            if row_idx < len(data):
                row = data[row_idx]
                row_data = {}

                # Extract values for each target column
                for col_name, col_idx in col_indices.items():
                    if isinstance(row, dict) and "values" in row:
                        values = row["values"]
                        if col_idx < len(values):
                            row_data[col_name] = values[col_idx]
                    elif hasattr(row, "values"):
                        values = row.values if not callable(row.values) else list(row.values())
                        if col_idx < len(values):
                            row_data[col_name] = values[col_idx]

                if row_data:
                    data_for_llm.append({"row_index": row_idx, "data": row_data})

        # Step 4: Convert data to BAML types and call appropriate function
        baml_row_data = _to_row_data(data_for_llm)

        if validation_errors:
            # Fix validation errors
            baml_errors = _to_validation_errors(validation_errors)
            baml_rules = _get_relevant_validation_rules(validation_errors)

            baml_result = await b.FixValidationErrors(
                user_prompt=prompt,
                validation_errors=baml_errors,
                row_data=baml_row_data,
                validation_rules=baml_rules
            )
        else:
            # General transformation
            baml_result = await b.TransformDataGeneral(
                user_prompt=prompt,
                row_data=baml_row_data
            )

        # Step 5: Convert BAML result to changes format
        result.changes = _from_transformation_result(baml_result, col_indices)
        result.summary = _generate_summary(result.changes)

        logger.info(f"Generated {len(result.changes)} transformations")

    except Exception as e:
        logger.error(f"Transformation failed: {e}")
        result.error = str(e)

    return result


async def _identify_relevant_columns(
    prompt: str, column_mapping: dict[str, str]
) -> list[str]:
    """Identify which columns are relevant for the transformation using BAML."""
    # Extract column names
    available_columns = []
    for col_val in list(column_mapping.values()):
        if isinstance(col_val, dict):
            col_name = col_val.get("key") or col_val.get("name")
        else:
            col_name = col_val
        if col_name:
            available_columns.append(col_name)

    try:
        # Use BAML to identify relevant columns
        selected_columns = await b.IdentifyRelevantColumns(
            prompt=prompt,
            available_columns=available_columns
        )

        # Ensure selected columns are actually in available columns
        return [col for col in selected_columns if col in available_columns]
    except Exception as e:
        logger.error(f"Column identification failed: {e}")
        # Fallback: return all columns
        return available_columns


def _get_column_indices(
    target_columns: list[str], column_mapping: dict[str, str]
) -> dict[str, int]:
    """Get column indices for target columns."""
    col_indices = {}
    for idx, col_info in column_mapping.items():
        col_name = None
        if isinstance(col_info, dict):
            col_name = col_info.get("key") or col_info.get("name")
        elif isinstance(col_info, str):
            col_name = col_info

        if col_name and col_name in target_columns:
            col_indices[col_name] = int(idx)
    
    return col_indices








def _generate_summary(changes: list[dict]) -> str:
    """Generate summary of changes."""
    if not changes:
        return "No transformations needed"

    # Group by column
    columns_affected = {}
    for change in changes:
        col = change.get("columnKey", "unknown")
        if col not in columns_affected:
            columns_affected[col] = 0
        columns_affected[col] += 1

    # Build summary
    if len(columns_affected) == 1:
        col = next(iter(columns_affected.keys()))
        count = columns_affected[col]
        return f"{count} {col} value{'s' if count > 1 else ''} will be transformed"

    total = len(changes)
    return f"{total} values across {len(columns_affected)} columns will be transformed"
