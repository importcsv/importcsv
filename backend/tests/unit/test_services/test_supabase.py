# backend/tests/unit/test_services/test_supabase.py
"""Tests for Supabase service - table introspection via OpenAPI schema."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.supabase import list_tables, get_table_schema


def _make_openapi_response(tables: list[str], definitions: dict | None = None):
    """Helper to create mock OpenAPI schema response."""
    paths = {f"/{table}": {} for table in tables}
    return {
        "paths": paths,
        "definitions": definitions or {},
    }


@pytest.mark.asyncio
async def test_list_tables_success():
    """Test listing tables from Supabase via OpenAPI schema."""
    credentials = {"url": "https://test.supabase.co", "service_key": "test-key"}

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = _make_openapi_response(["users", "orders", "products"])
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.supabase.httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_instance.get = AsyncMock(return_value=mock_response)
        mock_client.return_value.__aenter__.return_value = mock_instance

        tables = await list_tables(credentials)

        assert len(tables) == 3
        assert "users" in tables
        assert "orders" in tables
        assert "products" in tables


@pytest.mark.asyncio
async def test_list_tables_filters_system_tables():
    """Test that system tables are filtered out."""
    credentials = {"url": "https://test.supabase.co", "service_key": "test-key"}

    mock_response = MagicMock()
    mock_response.status_code = 200
    # Include system tables that should be filtered
    mock_response.json.return_value = _make_openapi_response([
        "users", "schema_migrations", "_prisma_migrations"
    ])
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.supabase.httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_instance.get = AsyncMock(return_value=mock_response)
        mock_client.return_value.__aenter__.return_value = mock_instance

        tables = await list_tables(credentials)

        # Should only include users, filtering out migration tables
        assert "users" in tables
        assert "schema_migrations" not in tables
        assert "_prisma_migrations" not in tables


@pytest.mark.asyncio
async def test_get_table_schema_success():
    """Test getting table schema from Supabase via OpenAPI definitions."""
    credentials = {"url": "https://test.supabase.co", "service_key": "test-key"}

    # OpenAPI schema format for table definitions
    definitions = {
        "users": {
            "properties": {
                "id": {
                    "type": "string",
                    "format": "uuid",
                    "description": "Note: This is a Primary Key.<pk/> uuid",
                },
                "email": {
                    "type": "string",
                    "format": "",
                    "description": "character varying",
                },
                "created_at": {
                    "type": "string",
                    "format": "date-time",
                    "description": "timestamp with time zone",
                },
            },
            "required": ["id", "email"],  # created_at is nullable
        }
    }

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = _make_openapi_response(["users"], definitions)
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.supabase.httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_instance.get = AsyncMock(return_value=mock_response)
        mock_client.return_value.__aenter__.return_value = mock_instance

        columns = await get_table_schema(credentials, "users")

        assert len(columns) == 3
        # Find columns by name (order may vary)
        col_by_name = {c["column_name"]: c for c in columns}

        assert col_by_name["id"]["data_type"] == "uuid"
        assert col_by_name["id"]["is_nullable"] is False
        assert col_by_name["email"]["is_nullable"] is False
        assert col_by_name["created_at"]["is_nullable"] is True


@pytest.mark.asyncio
async def test_list_tables_connection_error():
    """Test handling of connection errors."""
    credentials = {"url": "https://test.supabase.co", "service_key": "test-key"}

    import httpx

    with patch("app.services.supabase.httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_instance.get = AsyncMock(side_effect=httpx.ConnectError("Connection failed"))
        mock_client.return_value.__aenter__.return_value = mock_instance

        from app.services.supabase import SupabaseConnectionError

        with pytest.raises(SupabaseConnectionError) as exc_info:
            await list_tables(credentials)

        assert "Connection failed" in str(exc_info.value)


@pytest.mark.asyncio
async def test_list_tables_auth_error():
    """Test handling of authentication errors."""
    credentials = {"url": "https://test.supabase.co", "service_key": "bad-key"}

    import httpx

    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.raise_for_status = MagicMock(
        side_effect=httpx.HTTPStatusError("401 Unauthorized", request=MagicMock(), response=mock_response)
    )

    with patch("app.services.supabase.httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_instance.get = AsyncMock(return_value=mock_response)
        mock_client.return_value.__aenter__.return_value = mock_instance

        from app.services.supabase import SupabaseAuthError

        with pytest.raises(SupabaseAuthError):
            await list_tables(credentials)
