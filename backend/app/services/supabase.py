# backend/app/services/supabase.py
"""Supabase service for table introspection."""
import logging
from typing import Any, Dict, List

import httpx

logger = logging.getLogger(__name__)

# Tables to filter out (system/migration tables)
FILTERED_TABLE_PREFIXES = ("_", "schema_migrations", "alembic_version")


class SupabaseError(Exception):
    """Base exception for Supabase errors."""

    pass


class SupabaseConnectionError(SupabaseError):
    """Raised when connection to Supabase fails."""

    pass


class SupabaseAuthError(SupabaseError):
    """Raised when authentication fails."""

    pass


async def list_tables(credentials: Dict[str, Any]) -> List[str]:
    """
    List all user tables in the Supabase database.

    Uses the information_schema to query table names in the public schema.

    Args:
        credentials: Dictionary with 'url' and 'service_key'

    Returns:
        List of table names

    Raises:
        SupabaseConnectionError: If connection fails
        SupabaseAuthError: If authentication fails
    """
    url = credentials["url"]
    service_key = credentials["service_key"]

    # Query information_schema.tables via PostgREST
    query_url = f"{url}/rest/v1/rpc/get_tables"

    # If RPC doesn't exist, fall back to direct query via information_schema
    # Supabase exposes information_schema via PostgREST if configured
    # We'll use a simpler approach - query via the pg_catalog
    query_url = f"{url}/rest/v1/"

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Use PostgREST's introspection endpoint
            # Supabase provides schema introspection via /rest/v1/ with Accept: application/openapi+json
            # But simpler: query information_schema.tables directly via RPC or use pg_meta
            # Supabase has a pg_meta API at /rest/v1/rpc/... but we need to check if it's exposed

            # Simplest approach: use Supabase Management API or PostgREST with information_schema
            # PostgREST exposes tables from information_schema if they're in public schema

            # Let's use the tables endpoint directly - listing available tables
            # Supabase typically exposes information_schema.tables
            response = await client.get(
                f"{url}/rest/v1/information_schema.tables",
                headers=headers,
                params={
                    "select": "table_name,table_schema",
                    "table_schema": "eq.public",
                    "table_type": "eq.BASE TABLE",
                },
            )

            if response.status_code == 401:
                raise SupabaseAuthError("Invalid service key or unauthorized access")

            response.raise_for_status()

            tables_data = response.json()

            # Filter out system tables
            tables = []
            for table in tables_data:
                table_name = table.get("table_name", "")
                if not any(table_name.startswith(prefix) for prefix in FILTERED_TABLE_PREFIXES):
                    tables.append(table_name)

            logger.info(f"Found {len(tables)} tables in Supabase")
            return tables

    except httpx.ConnectError as e:
        logger.error(f"Failed to connect to Supabase: {e}")
        raise SupabaseConnectionError(f"Connection failed: {e}") from e
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise SupabaseAuthError("Invalid service key or unauthorized access") from e
        logger.error(f"HTTP error from Supabase: {e}")
        raise SupabaseError(f"HTTP error: {e}") from e


async def get_table_schema(credentials: Dict[str, Any], table_name: str) -> List[Dict[str, Any]]:
    """
    Get the schema (columns) for a specific table.

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
    url = credentials["url"]
    service_key = credentials["service_key"]

    headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{url}/rest/v1/information_schema.columns",
                headers=headers,
                params={
                    "select": "column_name,data_type,is_nullable,column_default",
                    "table_schema": "eq.public",
                    "table_name": f"eq.{table_name}",
                    "order": "ordinal_position",
                },
            )

            if response.status_code == 401:
                raise SupabaseAuthError("Invalid service key or unauthorized access")

            response.raise_for_status()

            columns_data = response.json()

            # Transform the response
            columns = []
            for col in columns_data:
                columns.append(
                    {
                        "column_name": col.get("column_name"),
                        "data_type": col.get("data_type"),
                        "is_nullable": col.get("is_nullable") == "YES",
                        "column_default": col.get("column_default"),
                    }
                )

            logger.info(f"Found {len(columns)} columns in table {table_name}")
            return columns

    except httpx.ConnectError as e:
        logger.error(f"Failed to connect to Supabase: {e}")
        raise SupabaseConnectionError(f"Connection failed: {e}") from e
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise SupabaseAuthError("Invalid service key or unauthorized access") from e
        logger.error(f"HTTP error from Supabase: {e}")
        raise SupabaseError(f"HTTP error: {e}") from e


async def test_connection(credentials: Dict[str, Any]) -> Dict[str, Any]:
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
