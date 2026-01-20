# backend/tests/unit/test_services/test_delivery.py
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.services.delivery import (
    SUPABASE_CHUNK_SIZE,
    build_webhook_payload,
    deliver_to_supabase,
    deliver_to_webhook,
    deliver_to_webhook_destination,
    is_safe_webhook_url,
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


class TestBuildWebhookPayload:
    """Test webhook payload building."""

    def test_builds_complete_payload(self):
        """Should build payload with all required fields."""
        rows = [{"email": "test@example.com", "name": "Test"}]
        context = {"user_id": "user_123", "org_id": "org_456"}
        import_id = uuid.uuid4()
        importer_id = uuid.uuid4()

        payload = build_webhook_payload(
            rows=rows,
            context=context,
            import_id=import_id,
            importer_id=importer_id,
        )

        assert payload["rows"] == rows
        assert payload["context"] == context
        assert payload["import_id"] == str(import_id)
        assert payload["importer_id"] == str(importer_id)
        assert payload["row_count"] == 1
        assert "timestamp" in payload

    def test_builds_payload_with_empty_context(self):
        """Should build payload with empty context when None is passed."""
        rows = [{"email": "test@example.com"}]
        import_id = uuid.uuid4()
        importer_id = uuid.uuid4()

        payload = build_webhook_payload(
            rows=rows,
            context=None,
            import_id=import_id,
            importer_id=importer_id,
        )

        assert payload["context"] == {}
        assert payload["row_count"] == 1


class TestDeliverToWebhookDestination:
    """Test webhook destination delivery."""

    @pytest.mark.asyncio
    async def test_uses_svix_when_available(self):
        """Should use Svix when svix_endpoint_id is set."""
        with patch("app.services.delivery.svix_client") as mock_svix:
            mock_svix.is_svix_available.return_value = True
            mock_svix.send_message.return_value = True

            result = await deliver_to_webhook_destination(
                webhook_url="https://example.com/hook",
                svix_app_id="app_123",
                svix_endpoint_id="ep_123",
                rows=[{"email": "test@example.com"}],
                context={},
                import_id=uuid.uuid4(),
                importer_id=uuid.uuid4(),
            )

            assert result.success is True
            mock_svix.send_message.assert_called_once()

    @pytest.mark.asyncio
    async def test_falls_back_to_direct_post(self):
        """Should use direct POST when Svix not available."""
        with patch("app.services.delivery.svix_client") as mock_svix:
            mock_svix.is_svix_available.return_value = False

            with patch("app.services.delivery.httpx.AsyncClient") as mock_client:
                mock_response = MagicMock()
                mock_response.raise_for_status = MagicMock()

                mock_instance = AsyncMock()
                mock_instance.post = AsyncMock(return_value=mock_response)
                mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
                mock_instance.__aexit__ = AsyncMock(return_value=None)
                mock_client.return_value = mock_instance

                result = await deliver_to_webhook_destination(
                    webhook_url="https://example.com/hook",
                    svix_app_id=None,
                    svix_endpoint_id=None,
                    rows=[{"email": "test@example.com"}],
                    context={},
                    import_id=uuid.uuid4(),
                    importer_id=uuid.uuid4(),
                )

                assert result.success is True

    @pytest.mark.asyncio
    async def test_falls_back_to_direct_post_when_svix_fails(self):
        """Should fall back to direct POST when Svix delivery fails."""
        with patch("app.services.delivery.svix_client") as mock_svix:
            mock_svix.is_svix_available.return_value = True
            mock_svix.send_message.return_value = False  # Svix fails

            with patch("app.services.delivery.httpx.AsyncClient") as mock_client:
                mock_response = MagicMock()
                mock_response.raise_for_status = MagicMock()

                mock_instance = AsyncMock()
                mock_instance.post = AsyncMock(return_value=mock_response)
                mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
                mock_instance.__aexit__ = AsyncMock(return_value=None)
                mock_client.return_value = mock_instance

                result = await deliver_to_webhook_destination(
                    webhook_url="https://example.com/hook",
                    svix_app_id="app_123",
                    svix_endpoint_id="ep_123",
                    rows=[{"email": "test@example.com"}],
                    context={},
                    import_id=uuid.uuid4(),
                    importer_id=uuid.uuid4(),
                )

                assert result.success is True
                # Verify both Svix and direct POST were called
                mock_svix.send_message.assert_called_once()
                mock_instance.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_rejects_invalid_webhook_url(self):
        """Should reject invalid webhook URLs."""
        result = await deliver_to_webhook_destination(
            webhook_url="http://localhost/hook",  # Invalid: not HTTPS
            svix_app_id=None,
            svix_endpoint_id=None,
            rows=[{"email": "test@example.com"}],
            context={},
            import_id=uuid.uuid4(),
            importer_id=uuid.uuid4(),
        )

        assert result.success is False
        assert result.error_code == "INVALID_URL"

    @pytest.mark.asyncio
    async def test_returns_failure_after_retries_exhausted(self):
        """Should return failure after all retries are exhausted."""
        with patch("app.services.delivery.svix_client") as mock_svix:
            mock_svix.is_svix_available.return_value = False

            with patch("app.services.delivery.httpx.AsyncClient") as mock_client:
                mock_instance = AsyncMock()
                mock_instance.post = AsyncMock(side_effect=httpx.TimeoutException("timeout"))
                mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
                mock_instance.__aexit__ = AsyncMock(return_value=None)
                mock_client.return_value = mock_instance

                with patch("app.services.delivery.asyncio.sleep", new_callable=AsyncMock):
                    result = await deliver_to_webhook_destination(
                        webhook_url="https://example.com/hook",
                        svix_app_id=None,
                        svix_endpoint_id=None,
                        rows=[{"email": "test@example.com"}],
                        context={},
                        import_id=uuid.uuid4(),
                        importer_id=uuid.uuid4(),
                    )

                    assert result.success is False
                    assert result.error_code == "DELIVERY_FAILED"


class TestIsSafeWebhookUrl:
    """Test SSRF protection for webhook URLs."""

    def test_accepts_valid_https_url(self):
        """Should accept valid HTTPS URLs."""
        with patch("app.services.delivery.socket.getaddrinfo") as mock_dns:
            # Return a public IP
            mock_dns.return_value = [(2, 1, 6, "", ("93.184.216.34", 0))]
            assert is_safe_webhook_url("https://example.com/webhook") is True

    def test_rejects_http_url(self):
        """Should reject non-HTTPS URLs."""
        assert is_safe_webhook_url("http://example.com/webhook") is False

    def test_rejects_localhost(self):
        """Should reject localhost variations."""
        assert is_safe_webhook_url("https://localhost/webhook") is False
        assert is_safe_webhook_url("https://127.0.0.1/webhook") is False
        assert is_safe_webhook_url("https://0.0.0.0/webhook") is False

    def test_rejects_ipv6_loopback(self):
        """Should reject IPv6 loopback."""
        assert is_safe_webhook_url("https://[::1]/webhook") is False

    def test_rejects_private_ipv4_ranges(self):
        """Should reject private IPv4 ranges (10.x, 172.16-31.x, 192.168.x)."""
        with patch("app.services.delivery.socket.getaddrinfo") as mock_dns:
            # 10.0.0.0/8
            mock_dns.return_value = [(2, 1, 6, "", ("10.0.0.1", 0))]
            assert is_safe_webhook_url("https://internal.example.com/webhook") is False

            # 172.16.0.0/12
            mock_dns.return_value = [(2, 1, 6, "", ("172.16.0.1", 0))]
            assert is_safe_webhook_url("https://internal.example.com/webhook") is False

            # 192.168.0.0/16
            mock_dns.return_value = [(2, 1, 6, "", ("192.168.1.1", 0))]
            assert is_safe_webhook_url("https://internal.example.com/webhook") is False

    def test_rejects_link_local_and_metadata(self):
        """Should reject link-local addresses (AWS metadata endpoint)."""
        with patch("app.services.delivery.socket.getaddrinfo") as mock_dns:
            # AWS metadata endpoint 169.254.169.254
            mock_dns.return_value = [(2, 1, 6, "", ("169.254.169.254", 0))]
            assert is_safe_webhook_url("https://metadata.example.com/webhook") is False

            # Other link-local
            mock_dns.return_value = [(2, 1, 6, "", ("169.254.1.1", 0))]
            assert is_safe_webhook_url("https://link-local.example.com/webhook") is False

    def test_rejects_ipv6_private_ranges(self):
        """Should reject IPv6 private/reserved ranges."""
        with patch("app.services.delivery.socket.getaddrinfo") as mock_dns:
            # fc00::/7 (unique local addresses)
            mock_dns.return_value = [(10, 1, 6, "", ("fc00::1", 0, 0, 0))]
            assert is_safe_webhook_url("https://ipv6-private.example.com/webhook") is False

            # fe80::/10 (link-local)
            mock_dns.return_value = [(10, 1, 6, "", ("fe80::1", 0, 0, 0))]
            assert is_safe_webhook_url("https://ipv6-linklocal.example.com/webhook") is False

    def test_rejects_ipv4_mapped_ipv6(self):
        """Should reject IPv4-mapped IPv6 addresses (bypass attempt)."""
        with patch("app.services.delivery.socket.getaddrinfo") as mock_dns:
            # ::ffff:127.0.0.1 (IPv4-mapped loopback)
            mock_dns.return_value = [(10, 1, 6, "", ("::ffff:127.0.0.1", 0, 0, 0))]
            assert is_safe_webhook_url("https://mapped.example.com/webhook") is False

            # ::ffff:10.0.0.1 (IPv4-mapped private)
            mock_dns.return_value = [(10, 1, 6, "", ("::ffff:10.0.0.1", 0, 0, 0))]
            assert is_safe_webhook_url("https://mapped-private.example.com/webhook") is False

    def test_rejects_when_any_resolved_ip_is_private(self):
        """Should reject if ANY resolved IP is private (multi-record bypass)."""
        with patch("app.services.delivery.socket.getaddrinfo") as mock_dns:
            # Multiple A records - one public, one private
            mock_dns.return_value = [
                (2, 1, 6, "", ("93.184.216.34", 0)),  # Public
                (2, 1, 6, "", ("10.0.0.1", 0)),       # Private - should block
            ]
            assert is_safe_webhook_url("https://multi-record.example.com/webhook") is False

    def test_rejects_dns_resolution_failure(self):
        """Should reject when DNS resolution fails."""
        with patch("app.services.delivery.socket.getaddrinfo") as mock_dns:
            import socket
            mock_dns.side_effect = socket.gaierror("DNS lookup failed")
            assert is_safe_webhook_url("https://nonexistent.example.com/webhook") is False

    def test_rejects_empty_or_malformed_urls(self):
        """Should reject empty or malformed URLs."""
        assert is_safe_webhook_url("") is False
        assert is_safe_webhook_url("not-a-url") is False
        assert is_safe_webhook_url("ftp://example.com/webhook") is False

    def test_rejects_url_with_credentials(self):
        """Should handle URLs with embedded credentials safely."""
        with patch("app.services.delivery.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(2, 1, 6, "", ("93.184.216.34", 0))]
            # URL with credentials - should still work (urlparse handles it)
            result = is_safe_webhook_url("https://user:pass@example.com/webhook")
            # The function should parse hostname correctly
            assert result is True

    def test_accepts_public_ipv4(self):
        """Should accept public IPv4 addresses."""
        with patch("app.services.delivery.socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(2, 1, 6, "", ("8.8.8.8", 0))]
            assert is_safe_webhook_url("https://dns.google/webhook") is True

    def test_accepts_public_ipv6(self):
        """Should accept public IPv6 addresses."""
        with patch("app.services.delivery.socket.getaddrinfo") as mock_dns:
            # Google's public IPv6
            mock_dns.return_value = [(10, 1, 6, "", ("2607:f8b0:4004:800::200e", 0, 0, 0))]
            assert is_safe_webhook_url("https://ipv6.google.com/webhook") is True
