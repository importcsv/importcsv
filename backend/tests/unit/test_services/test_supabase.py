# backend/tests/unit/test_services/test_supabase.py
"""Tests for Supabase service - table introspection."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.supabase import list_tables, get_table_schema


@pytest.mark.asyncio
async def test_list_tables_success():
    """Test listing tables from Supabase."""
    credentials = {"url": "https://test.supabase.co", "service_key": "test-key"}

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [
        {"table_name": "users", "table_schema": "public"},
        {"table_name": "orders", "table_schema": "public"},
        {"table_name": "products", "table_schema": "public"},
    ]
    mock_response.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient") as mock_client:
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
    mock_response.json.return_value = [
        {"table_name": "users", "table_schema": "public"},
        {"table_name": "schema_migrations", "table_schema": "public"},
        {"table_name": "_prisma_migrations", "table_schema": "public"},
    ]
    mock_response.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient") as mock_client:
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
    """Test getting table schema from Supabase."""
    credentials = {"url": "https://test.supabase.co", "service_key": "test-key"}

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [
        {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "gen_random_uuid()",
        },
        {
            "column_name": "email",
            "data_type": "character varying",
            "is_nullable": "NO",
            "column_default": None,
        },
        {
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": "now()",
        },
    ]
    mock_response.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_instance.get = AsyncMock(return_value=mock_response)
        mock_client.return_value.__aenter__.return_value = mock_instance

        columns = await get_table_schema(credentials, "users")

        assert len(columns) == 3
        assert columns[0]["column_name"] == "id"
        assert columns[0]["data_type"] == "uuid"
        assert columns[0]["is_nullable"] is False
        assert columns[1]["column_name"] == "email"
        assert columns[1]["data_type"] == "character varying"
        assert columns[2]["column_name"] == "created_at"
        assert columns[2]["is_nullable"] is True


@pytest.mark.asyncio
async def test_list_tables_connection_error():
    """Test handling of connection errors."""
    credentials = {"url": "https://test.supabase.co", "service_key": "test-key"}

    import httpx

    with patch("httpx.AsyncClient") as mock_client:
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

    with patch("httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_instance.get = AsyncMock(return_value=mock_response)
        mock_client.return_value.__aenter__.return_value = mock_instance

        from app.services.supabase import SupabaseAuthError

        with pytest.raises(SupabaseAuthError):
            await list_tables(credentials)
