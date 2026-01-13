# backend/tests/unit/test_services/test_delivery.py
import uuid
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.delivery import (
    deliver_to_supabase,
    deliver_to_webhook,
    DeliveryResult,
    SUPABASE_CHUNK_SIZE,
)


@pytest.mark.asyncio
async def test_deliver_to_supabase_success():
    """Test successful Supabase delivery."""
    credentials = {"url": "https://test.supabase.co", "service_key": "key"}
    rows = [{"col1": "val1"}, {"col1": "val2"}]

    with patch("app.services.delivery.httpx.AsyncClient") as mock_client:
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_response.raise_for_status = MagicMock()

        mock_instance = AsyncMock()
        mock_instance.post = AsyncMock(return_value=mock_response)
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_instance

        result = await deliver_to_supabase(
            credentials=credentials,
            table="test_table",
            mapping={"col1": "column1"},
            rows=rows,
        )

        assert result.success is True
        assert result.rows_delivered == 2


@pytest.mark.asyncio
async def test_deliver_to_supabase_chunking():
    """Test that large payloads are chunked."""
    credentials = {"url": "https://test.supabase.co", "service_key": "key"}
    rows = [{"col": f"val{i}"} for i in range(SUPABASE_CHUNK_SIZE + 50)]

    with patch("app.services.delivery.httpx.AsyncClient") as mock_client:
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_response.raise_for_status = MagicMock()

        mock_instance = AsyncMock()
        mock_instance.post = AsyncMock(return_value=mock_response)
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_instance

        result = await deliver_to_supabase(
            credentials=credentials,
            table="test_table",
            mapping={"col": "col"},
            rows=rows,
        )

        assert result.success is True
        # Should have made 2 requests (100 + 50)
        assert mock_instance.post.call_count == 2


@pytest.mark.asyncio
async def test_deliver_to_webhook_with_signature():
    """Test webhook delivery includes HMAC signature."""
    credentials = {"url": "https://example.com/hook"}
    webhook_secret = "test-secret"
    rows = [{"data": "value"}]

    with patch("app.services.delivery.httpx.AsyncClient") as mock_client:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.raise_for_status = MagicMock()

        mock_instance = AsyncMock()
        mock_instance.post = AsyncMock(return_value=mock_response)
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_instance

        result = await deliver_to_webhook(
            credentials=credentials,
            webhook_secret=webhook_secret,
            rows=rows,
        )

        assert result.success is True
        # Verify signature header was set
        call_kwargs = mock_instance.post.call_args.kwargs
        assert "X-ImportCSV-Signature" in call_kwargs["headers"]
        assert call_kwargs["headers"]["X-ImportCSV-Signature"].startswith("sha256=")
