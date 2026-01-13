# backend/app/services/supabase.py
"""Supabase service for table introspection using OpenAPI schema."""
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# Tables to filter out (system/migration tables)
FILTERED_TABLE_PREFIXES = ("_", "schema_migrations", "alembic_version")

# HTTP status codes
HTTP_UNAUTHORIZED = 401


class SupabaseError(Exception):
    """Base exception for Supabase errors."""



class SupabaseConnectionError(SupabaseError):
    """Raised when connection to Supabase fails."""



class SupabaseAuthError(SupabaseError):
    """Raised when authentication fails."""



async def _get_openapi_schema(credentials: dict[str, Any]) -> dict[str, Any]:
    """
    Fetch the OpenAPI schema from Supabase PostgREST.

    PostgREST exposes an OpenAPI schema at the root endpoint that contains
    all table definitions and their columns.
    """
    url = credentials["url"]
    service_key = credentials["service_key"]

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Accept": "application/openapi+json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{url}/rest/v1/",
                headers=headers,
            )

            if response.status_code == HTTP_UNAUTHORIZED:
                raise SupabaseAuthError("Invalid service key or unauthorized access")

            response.raise_for_status()
            return response.json()

    except httpx.ConnectError as e:
        logger.error(f"Failed to connect to Supabase: {e}")
        raise SupabaseConnectionError(f"Connection failed: {e}") from e
    except httpx.HTTPStatusError as e:
        if e.response.status_code == HTTP_UNAUTHORIZED:
            raise SupabaseAuthError("Invalid service key or unauthorized access") from e
        logger.error(f"HTTP error from Supabase: {e}")
        raise SupabaseError(f"HTTP error: {e}") from e


async def list_tables(credentials: dict[str, Any]) -> list[str]:
    """
    List all user tables in the Supabase database.

    Uses the OpenAPI schema endpoint to discover available tables.

    Args:
        credentials: Dictionary with 'url' and 'service_key'

    Returns:
        List of table names

    Raises:
        SupabaseConnectionError: If connection fails
        SupabaseAuthError: If authentication fails
    """
    schema = await _get_openapi_schema(credentials)

    # Extract table names from the OpenAPI paths
    # Each table is exposed as a path like "/table_name"
    paths = schema.get("paths", {})

    tables = []
    for path in paths:
        # Skip paths that aren't simple table endpoints
        # Table paths are like "/table_name", skip things like "/rpc/function_name"
        if path.startswith("/") and "/" not in path[1:] and not path.startswith("/rpc"):
            table_name = path[1:]  # Remove leading "/"

            # Skip empty table names
            if not table_name:
                continue

            # Filter out system tables
            if not any(table_name.startswith(prefix) for prefix in FILTERED_TABLE_PREFIXES):
                tables.append(table_name)

    logger.info(f"Found {len(tables)} tables in Supabase")
    return sorted(tables)


async def get_table_schema(credentials: dict[str, Any], table_name: str) -> list[dict[str, Any]]:
    """
    Get the schema (columns) for a specific table.

    Uses the OpenAPI schema endpoint to get column definitions.

    Args:
        credentials: Dictionary with 'url' and 'service_key'
        table_name: Name of the table to get schema for

    Returns:
        List of column definitions with:
        - column_name: Name of the column
        - data_type: PostgreSQL data type
        - is_nullable: Boolean indicating if column accepts NULL
        - column_default: Default value expression or None

    Raises:
        SupabaseConnectionError: If connection fails
        SupabaseAuthError: If authentication fails
    """
    schema = await _get_openapi_schema(credentials)

    # Find the table definition in the OpenAPI schema
    # Tables are defined in "definitions" (OpenAPI 2.0) or "components/schemas" (OpenAPI 3.0)
    definitions = schema.get("definitions", {})

    # The table schema is typically named after the table
    table_schema = definitions.get(table_name, {})
    properties = table_schema.get("properties", {})
    required_fields = set(table_schema.get("required", []))

    columns = []
    for col_name, col_def in properties.items():
        # Parse the OpenAPI type to PostgreSQL-like type
        openapi_type = col_def.get("type", "string")
        openapi_format = col_def.get("format", "")
        description = col_def.get("description", "")

        # Map OpenAPI types to PostgreSQL types
        data_type = _map_openapi_to_postgres_type(openapi_type, openapi_format, description)

        # Check if nullable (not in required list)
        is_nullable = col_name not in required_fields

        # Extract default from description if present
        # PostgREST includes defaults in the description like "Note: default value..."
        column_default = _extract_default_from_description(description)

        columns.append({
            "column_name": col_name,
            "data_type": data_type,
            "is_nullable": is_nullable,
            "column_default": column_default,
        })

    logger.info(f"Found {len(columns)} columns in table {table_name}")
    return columns


def _map_openapi_to_postgres_type(openapi_type: str, openapi_format: str, description: str) -> str:
    """Map OpenAPI type/format to PostgreSQL type name."""
    # Check description for explicit type hints (PostgREST often includes them)
    desc_lower = description.lower()
    if "uuid" in desc_lower:
        return "uuid"
    if "timestamp" in desc_lower:
        return "timestamp with time zone"
    if "json" in desc_lower:
        return "jsonb"

    # Map based on OpenAPI type and format
    type_mapping = {
        ("integer", ""): "integer",
        ("integer", "int32"): "integer",
        ("integer", "int64"): "bigint",
        ("number", ""): "numeric",
        ("number", "float"): "real",
        ("number", "double"): "double precision",
        ("boolean", ""): "boolean",
        ("string", ""): "text",
        ("string", "date"): "date",
        ("string", "date-time"): "timestamp with time zone",
        ("string", "time"): "time",
        ("string", "uuid"): "uuid",
        ("array", ""): "array",
        ("object", ""): "jsonb",
    }

    return type_mapping.get((openapi_type, openapi_format), openapi_type)


def _extract_default_from_description(description: str) -> str | None:
    """Extract default value from PostgREST description if present."""
    # PostgREST includes defaults like "Note: This is a Primary Key.<pk/>"
    # or includes the actual default value in certain cases
    if not description:
        return None

    # Look for common default patterns
    if "generated" in description.lower():
        return "generated"

    return None


async def test_connection(credentials: dict[str, Any]) -> dict[str, Any]:
    """
    Test connection to Supabase by listing tables.

    Args:
        credentials: Dictionary with 'url' and 'service_key'

    Returns:
        Dictionary with 'success' boolean and 'message' or 'error'
    """
    try:
        tables = await list_tables(credentials)
        return {
            "success": True,
            "message": f"Connected successfully. Found {len(tables)} tables.",
            "table_count": len(tables),
        }
    except SupabaseAuthError as e:
        return {
            "success": False,
            "error": "authentication_failed",
            "message": str(e),
        }
    except SupabaseConnectionError as e:
        return {
            "success": False,
            "error": "connection_failed",
            "message": str(e),
        }
    except SupabaseError as e:
        return {
            "success": False,
            "error": "unknown_error",
            "message": str(e),
        }
