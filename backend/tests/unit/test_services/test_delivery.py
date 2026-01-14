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


@pytest.mark.asyncio
async def test_deliver_to_supabase_injects_context():
    """Test that context values are injected into rows."""
    credentials = {"url": "https://test.supabase.co", "service_key": "test-key"}
    rows = [
        {"email": "alice@example.com"},
        {"email": "bob@example.com"},
    ]

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
            table="contacts",
            mapping={"email": "email_address"},
            rows=rows,
            context_mapping={"org_id": "org_id", "user_id": "user_id"},
            context={"org_id": "org-123", "user_id": "user-456"},
        )

        assert result.success is True

        # Verify the posted data includes context values
        call_kwargs = mock_instance.post.call_args.kwargs
        posted_data = call_kwargs["json"]

        assert posted_data[0] == {
            "email_address": "alice@example.com",
            "org_id": "org-123",
            "user_id": "user-456",
        }
        assert posted_data[1] == {
            "email_address": "bob@example.com",
            "org_id": "org-123",
            "user_id": "user-456",
        }


@pytest.mark.asyncio
async def test_deliver_to_supabase_skips_missing_optional_context():
    """Test that missing optional context keys are skipped."""
    credentials = {"url": "https://test.supabase.co", "service_key": "test-key"}
    rows = [{"email": "alice@example.com"}]

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
            table="contacts",
            mapping={"email": "email_address"},
            rows=rows,
            context_mapping={"org_id": "org_id", "team_id": "team_id"},
            context={"org_id": "org-123"},  # team_id missing
        )

        assert result.success is True

        call_kwargs = mock_instance.post.call_args.kwargs
        posted_data = call_kwargs["json"]

        # Only org_id should be present, team_id skipped
        assert posted_data[0] == {
            "email_address": "alice@example.com",
            "org_id": "org-123",
        }


@pytest.mark.asyncio
async def test_deliver_to_supabase_without_context_mapping():
    """Test that delivery works without context_mapping (backward compatibility)."""
    credentials = {"url": "https://test.supabase.co", "service_key": "test-key"}
    rows = [{"email": "alice@example.com"}]

    with patch("app.services.delivery.httpx.AsyncClient") as mock_client:
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_response.raise_for_status = MagicMock()

        mock_instance = AsyncMock()
        mock_instance.post = AsyncMock(return_value=mock_response)
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=None)
        mock_client.return_value = mock_instance

        # No context_mapping or context params - should work as before
        result = await deliver_to_supabase(
            credentials=credentials,
            table="contacts",
            mapping={"email": "email_address"},
            rows=rows,
        )

        assert result.success is True

        call_kwargs = mock_instance.post.call_args.kwargs
        posted_data = call_kwargs["json"]

        assert posted_data[0] == {"email_address": "alice@example.com"}
