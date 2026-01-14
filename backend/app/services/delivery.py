"""Delivery service for sending data to integrations."""
import asyncio
import hashlib
import hmac
import ipaddress
import json
import logging
import re
import socket
import time
from dataclasses import dataclass
from typing import Dict, List, Any, Optional
from uuid import UUID
from urllib.parse import urlparse

import httpx
from sqlalchemy.orm import Session, joinedload

from app.core.encryption import decrypt_credentials
from app.models.importer_destination import ImporterDestination
from app.models.integration import IntegrationType

logger = logging.getLogger(__name__)

SUPABASE_CHUNK_SIZE = 100
MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]

# Valid table name pattern (alphanumeric, underscore, must start with letter/underscore)
TABLE_NAME_PATTERN = re.compile(r'^[a-zA-Z_][a-zA-Z0-9_]*$')

# Private/reserved IP ranges to block for SSRF protection (IPv4 and IPv6)
BLOCKED_IP_RANGES = [
    # IPv4 private ranges
    ipaddress.ip_network('10.0.0.0/8'),
    ipaddress.ip_network('172.16.0.0/12'),
    ipaddress.ip_network('192.168.0.0/16'),
    ipaddress.ip_network('127.0.0.0/8'),
    ipaddress.ip_network('169.254.0.0/16'),  # Link-local / AWS metadata
    ipaddress.ip_network('0.0.0.0/8'),
    # IPv6 private/reserved ranges
    ipaddress.ip_network('::1/128'),  # Loopback
    ipaddress.ip_network('fc00::/7'),  # Unique local addresses
    ipaddress.ip_network('fe80::/10'),  # Link-local
    ipaddress.ip_network('::ffff:0:0/96'),  # IPv4-mapped IPv6
]


@dataclass
class DeliveryResult:
    """Result of a delivery attempt."""
    success: bool
    rows_delivered: int = 0
    error_code: Optional[str] = None
    error_message: Optional[str] = None


class DeliveryError(Exception):
    """Raised when delivery fails after all retries."""
    pass


def is_valid_supabase_url(url: str) -> bool:
    """Validate that URL is a legitimate Supabase project URL."""
    try:
        parsed = urlparse(url)
        if parsed.scheme != 'https':
            return False
        # Must be *.supabase.co or self-hosted with explicit port
        if parsed.netloc.endswith('.supabase.co'):
            return True
        # Allow self-hosted Supabase (requires explicit configuration)
        # For now, only allow official Supabase URLs
        return False
    except Exception:
        return False


def is_valid_table_name(table: str) -> bool:
    """Validate table name to prevent path traversal."""
    if not table or len(table) > 63:
        return False
    return TABLE_NAME_PATTERN.match(table) is not None


def is_safe_webhook_url(url: str) -> bool:
    """
    Validate webhook URL is safe (not targeting internal resources).
    Blocks private IPs, localhost, and cloud metadata endpoints.
    Uses getaddrinfo to check ALL resolved addresses (IPv4 and IPv6).
    """
    try:
        parsed = urlparse(url)
        # Only allow HTTPS for webhooks (block HTTP to prevent credential leakage)
        if parsed.scheme != 'https':
            logger.warning(f"Blocked non-HTTPS webhook URL: {url}")
            return False

        hostname = parsed.hostname
        if not hostname:
            return False

        # Block localhost variations
        if hostname.lower() in ('localhost', '127.0.0.1', '::1', '0.0.0.0'):
            return False

        # Resolve hostname using getaddrinfo to get ALL addresses (IPv4 and IPv6)
        # This prevents bypasses via IPv6 records or multiple A/AAAA records
        try:
            addr_info = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
            for family, _, _, _, sockaddr in addr_info:
                ip_str = sockaddr[0]
                try:
                    ip = ipaddress.ip_address(ip_str)
                    for blocked_range in BLOCKED_IP_RANGES:
                        if ip in blocked_range:
                            logger.warning(f"Blocked webhook to private IP: {hostname} -> {ip_str}")
                            return False
                except ValueError:
                    # Not a valid IP address, skip
                    continue
        except socket.gaierror:
            # DNS resolution failed - reject for safety
            logger.warning(f"DNS resolution failed for webhook URL: {hostname}")
            return False

        return True
    except Exception as e:
        logger.warning(f"Error validating webhook URL: {e}")
        return False


async def deliver_to_supabase(
    credentials: Dict[str, Any],
    table: str,
    mapping: Dict[str, str],
    rows: List[Dict[str, Any]],
    context_mapping: Optional[Dict[str, str]] = None,
    context: Optional[Dict[str, Any]] = None,
) -> DeliveryResult:
    """Deliver rows to Supabase with chunking and retries."""
    # Validate Supabase URL to prevent SSRF
    supabase_url = credentials.get('url', '')
    if not is_valid_supabase_url(supabase_url):
        return DeliveryResult(
            success=False,
            error_code="INVALID_URL",
            error_message="Invalid Supabase URL - must be https://*.supabase.co",
        )

    # Validate table name to prevent path traversal
    if not is_valid_table_name(table):
        return DeliveryResult(
            success=False,
            error_code="INVALID_TABLE_NAME",
            error_message="Invalid table name - must be alphanumeric with underscores",
        )

    # Apply column mapping:
    # - If mapping is empty, pass through all columns as-is
    # - If mapping has entries, only include mapped columns with their new names
    if not mapping:
        mapped_rows = [dict(row) for row in rows]  # Copy to avoid mutating originals
    else:
        mapped_rows = [
            {mapping[k]: v for k, v in row.items() if k in mapping}
            for row in rows
        ]

    # Inject context values into each row
    if context_mapping and context:
        for row in mapped_rows:
            for column_name, context_key in context_mapping.items():
                if context_key in context and context[context_key] is not None:
                    row[column_name] = context[context_key]

    # Chunk rows
    chunks = [mapped_rows[i:i + SUPABASE_CHUNK_SIZE]
              for i in range(0, len(mapped_rows), SUPABASE_CHUNK_SIZE)]

    total_delivered = 0

    async with httpx.AsyncClient(timeout=30.0) as client:
        for chunk_idx, chunk in enumerate(chunks):
            for attempt in range(MAX_RETRIES):
                try:
                    response = await client.post(
                        f"{supabase_url}/rest/v1/{table}",
                        headers={
                            "apikey": credentials["service_key"],
                            "Authorization": f"Bearer {credentials['service_key']}",
                            "Content-Type": "application/json",
                            "Prefer": "return=minimal",
                        },
                        json=chunk,
                    )
                    response.raise_for_status()
                    total_delivered += len(chunk)
                    logger.info(f"Delivered chunk {chunk_idx + 1}/{len(chunks)} ({len(chunk)} rows)")
                    break

                except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
                    logger.warning(f"Delivery attempt {attempt + 1} failed: {e}")
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(RETRY_DELAYS[attempt])
                    else:
                        return DeliveryResult(
                            success=False,
                            rows_delivered=total_delivered,
                            error_code="DELIVERY_FAILED",
                            error_message=f"Failed to deliver chunk {chunk_idx + 1}/{len(chunks)} after {MAX_RETRIES} attempts: {str(e)}",
                        )

    return DeliveryResult(success=True, rows_delivered=total_delivered)


async def deliver_to_webhook(
    credentials: Dict[str, Any],
    webhook_secret: Optional[str],
    rows: List[Dict[str, Any]],
    import_id: Optional[str] = None,
) -> DeliveryResult:
    """Deliver rows to webhook with HMAC signature."""
    webhook_url = credentials.get("url", "")

    # Validate webhook URL to prevent SSRF
    if not is_safe_webhook_url(webhook_url):
        return DeliveryResult(
            success=False,
            error_code="INVALID_URL",
            error_message="Invalid webhook URL - cannot target private/internal addresses",
        )

    # Require webhook secret for signed deliveries
    if not webhook_secret:
        return DeliveryResult(
            success=False,
            error_code="MISSING_SECRET",
            error_message="Webhook secret is required for secure delivery",
        )

    payload = {
        "event": "import.completed",
        "timestamp": int(time.time()),
        "import_id": import_id,
        "data": {
            "rows": rows,
            "row_count": len(rows),
        },
    }

    payload_json = json.dumps(payload, separators=(',', ':'), sort_keys=True)

    # Generate HMAC signature
    signature = hmac.new(
        webhook_secret.encode('utf-8'),
        payload_json.encode('utf-8'),
        hashlib.sha256,
    ).hexdigest()

    headers = {
        "Content-Type": "application/json",
        "X-ImportCSV-Signature": f"sha256={signature}",
        "X-ImportCSV-Timestamp": str(payload["timestamp"]),
        **credentials.get("headers", {}),
    }

    # Log only the hostname, not the full URL (may contain tokens)
    parsed_url = urlparse(webhook_url)

    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(MAX_RETRIES):
            try:
                response = await client.post(
                    webhook_url,
                    headers=headers,
                    content=payload_json,
                )
                response.raise_for_status()
                logger.info(f"Webhook delivered successfully to {parsed_url.netloc}")
                return DeliveryResult(success=True, rows_delivered=len(rows))

            except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
                logger.warning(f"Webhook attempt {attempt + 1} failed: {e}")
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_DELAYS[attempt])

        # All retries exhausted
        return DeliveryResult(
            success=False,
            error_code="DELIVERY_FAILED",
            error_message=f"Webhook delivery failed after {MAX_RETRIES} attempts",
        )


def get_importer_destination(db: Session, importer_id: UUID) -> Optional[ImporterDestination]:
    """Get importer destination with integration loaded."""
    return db.query(ImporterDestination).options(
        joinedload(ImporterDestination.integration)
    ).filter(
        ImporterDestination.importer_id == importer_id
    ).first()


async def deliver_to_destination(
    db: Session,
    import_id: UUID,
    importer_id: UUID,
    rows: List[Dict[str, Any]],
    context: Optional[Dict[str, Any]] = None,
) -> DeliveryResult:
    """
    Orchestrate delivery to the configured destination for an importer.

    Looks up the destination, decrypts credentials, and routes to the
    appropriate delivery function (Supabase or webhook).
    """
    # Get destination configuration
    destination = get_importer_destination(db, importer_id)
    if not destination:
        logger.info(f"No destination configured for importer {importer_id}")
        return DeliveryResult(
            success=True,  # Not an error - destination is optional
            rows_delivered=0,
            error_code="NO_DESTINATION",
            error_message="No destination configured for this importer",
        )

    integration = destination.integration
    if not integration:
        logger.error(f"Destination {destination.id} has no integration")
        return DeliveryResult(
            success=False,
            error_code="INTEGRATION_NOT_FOUND",
            error_message="Integration not found for destination",
        )

    # Decrypt credentials
    try:
        credentials = decrypt_credentials(integration.encrypted_credentials)
    except Exception as e:
        logger.error(f"Failed to decrypt credentials for integration {integration.id}: {e}")
        return DeliveryResult(
            success=False,
            error_code="DECRYPTION_ERROR",
            error_message="Failed to decrypt integration credentials",
        )

    # Route to appropriate delivery function
    if integration.type == IntegrationType.SUPABASE:
        if not destination.table_name:
            return DeliveryResult(
                success=False,
                error_code="NO_TABLE_NAME",
                error_message="No table name configured for Supabase destination",
            )

        logger.info(f"Delivering {len(rows)} rows to Supabase table {destination.table_name}")
        result = await deliver_to_supabase(
            credentials=credentials,
            table=destination.table_name,
            mapping=destination.column_mapping or {},
            rows=rows,
            context_mapping=destination.context_mapping or {},
            context=context,
        )

    elif integration.type == IntegrationType.WEBHOOK:
        logger.info(f"Delivering {len(rows)} rows to webhook")
        result = await deliver_to_webhook(
            credentials=credentials,
            webhook_secret=integration.webhook_secret,
            rows=rows,
            import_id=str(import_id),
        )

    else:
        return DeliveryResult(
            success=False,
            error_code="UNSUPPORTED_TYPE",
            error_message=f"Unsupported integration type: {integration.type}",
        )

    # Log result
    if result.success:
        logger.info(f"Successfully delivered {result.rows_delivered} rows to {integration.type.value}")
    else:
        logger.error(f"Delivery failed: {result.error_message}")

    return result
