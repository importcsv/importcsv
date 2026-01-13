# backend/tests/unit/test_api/test_integrations_supabase.py
"""Tests for Supabase introspection API endpoints."""
import uuid
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


@pytest.mark.asyncio
async def test_get_supabase_tables_success():
    """Test listing Supabase tables via API."""
    from app.api.v1.integrations import get_supabase_tables
    from app.models.integration import Integration, IntegrationType

    # Mock dependencies
    mock_db = MagicMock()
    mock_user = MagicMock()
    mock_user.id = uuid.uuid4()

    mock_integration = MagicMock(spec=Integration)
    mock_integration.id = uuid.uuid4()
    mock_integration.type = IntegrationType.SUPABASE

    mock_credentials = {"url": "https://test.supabase.co", "service_key": "key"}

    with patch("app.api.v1.integrations.integration_service") as mock_int_service, \
         patch("app.api.v1.integrations.supabase_service") as mock_supabase:
        mock_int_service.get_integration.return_value = (mock_integration, mock_credentials)
        mock_supabase.list_tables = AsyncMock(return_value=["users", "orders", "products"])

        result = await get_supabase_tables(
            integration_id=mock_integration.id,
            db=mock_db,
            current_user=mock_user,
        )

        assert result.tables == ["users", "orders", "products"]
        mock_supabase.list_tables.assert_called_once_with(mock_credentials)


@pytest.mark.asyncio
async def test_get_supabase_tables_not_found():
    """Test 404 when integration doesn't exist."""
    from app.api.v1.integrations import get_supabase_tables
    from fastapi import HTTPException

    mock_db = MagicMock()
    mock_user = MagicMock()
    mock_user.id = uuid.uuid4()

    with patch("app.api.v1.integrations.integration_service") as mock_int_service:
        mock_int_service.get_integration.return_value = (None, None)

        with pytest.raises(HTTPException) as exc_info:
            await get_supabase_tables(
                integration_id=uuid.uuid4(),
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_supabase_tables_wrong_type():
    """Test 400 when integration is not Supabase type."""
    from app.api.v1.integrations import get_supabase_tables
    from app.models.integration import Integration, IntegrationType
    from fastapi import HTTPException

    mock_db = MagicMock()
    mock_user = MagicMock()
    mock_user.id = uuid.uuid4()

    mock_integration = MagicMock(spec=Integration)
    mock_integration.type = IntegrationType.WEBHOOK

    with patch("app.api.v1.integrations.integration_service") as mock_int_service:
        mock_int_service.get_integration.return_value = (mock_integration, {})

        with pytest.raises(HTTPException) as exc_info:
            await get_supabase_tables(
                integration_id=uuid.uuid4(),
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == 400
        assert "Supabase" in exc_info.value.detail


@pytest.mark.asyncio
async def test_get_supabase_table_schema_success():
    """Test getting table schema via API."""
    from app.api.v1.integrations import get_supabase_table_schema
    from app.models.integration import Integration, IntegrationType

    mock_db = MagicMock()
    mock_user = MagicMock()
    mock_user.id = uuid.uuid4()

    mock_integration = MagicMock(spec=Integration)
    mock_integration.type = IntegrationType.SUPABASE

    mock_credentials = {"url": "https://test.supabase.co", "service_key": "key"}
    mock_columns = [
        {"column_name": "id", "data_type": "uuid", "is_nullable": False, "column_default": None},
        {"column_name": "email", "data_type": "text", "is_nullable": False, "column_default": None},
    ]

    with patch("app.api.v1.integrations.integration_service") as mock_int_service, \
         patch("app.api.v1.integrations.supabase_service") as mock_supabase:
        mock_int_service.get_integration.return_value = (mock_integration, mock_credentials)
        mock_supabase.get_table_schema = AsyncMock(return_value=mock_columns)

        result = await get_supabase_table_schema(
            integration_id=uuid.uuid4(),
            table_name="users",
            db=mock_db,
            current_user=mock_user,
        )

        assert result.table_name == "users"
        assert len(result.columns) == 2
        assert result.columns[0].column_name == "id"
        assert result.columns[1].column_name == "email"


@pytest.mark.asyncio
async def test_get_supabase_tables_auth_error():
    """Test 401 when Supabase auth fails."""
    from app.api.v1.integrations import get_supabase_tables
    from app.models.integration import Integration, IntegrationType
    from app.services.supabase import SupabaseAuthError
    from fastapi import HTTPException

    mock_db = MagicMock()
    mock_user = MagicMock()
    mock_user.id = uuid.uuid4()

    mock_integration = MagicMock(spec=Integration)
    mock_integration.type = IntegrationType.SUPABASE

    with patch("app.api.v1.integrations.integration_service") as mock_int_service, \
         patch("app.api.v1.integrations.supabase_service") as mock_supabase:
        mock_int_service.get_integration.return_value = (mock_integration, {})
        mock_supabase.list_tables = AsyncMock(side_effect=SupabaseAuthError("Invalid key"))
        mock_supabase.SupabaseAuthError = SupabaseAuthError

        with pytest.raises(HTTPException) as exc_info:
            await get_supabase_tables(
                integration_id=uuid.uuid4(),
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == 401
