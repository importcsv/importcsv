"""Delivery service for sending data to integrations."""
import asyncio
import hashlib
import hmac
import json
import logging
import time
from dataclasses import dataclass
from typing import Dict, List, Any, Optional

import httpx

logger = logging.getLogger(__name__)

SUPABASE_CHUNK_SIZE = 100
MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]


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


async def deliver_to_supabase(
    credentials: Dict[str, Any],
    table: str,
    mapping: Dict[str, str],
    rows: List[Dict[str, Any]],
) -> DeliveryResult:
    """Deliver rows to Supabase with chunking and retries."""
    # Apply column mapping
    mapped_rows = [
        {mapping.get(k, k): v for k, v in row.items() if k in mapping}
        for row in rows
    ]

    # Chunk rows
    chunks = [mapped_rows[i:i + SUPABASE_CHUNK_SIZE]
              for i in range(0, len(mapped_rows), SUPABASE_CHUNK_SIZE)]

    total_delivered = 0

    async with httpx.AsyncClient(timeout=30.0) as client:
        for chunk_idx, chunk in enumerate(chunks):
            for attempt in range(MAX_RETRIES):
                try:
                    response = await client.post(
                        f"{credentials['url']}/rest/v1/{table}",
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
    webhook_secret: str,
    rows: List[Dict[str, Any]],
    import_id: Optional[str] = None,
) -> DeliveryResult:
    """Deliver rows to webhook with HMAC signature."""
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

    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(MAX_RETRIES):
            try:
                response = await client.post(
                    credentials["url"],
                    headers=headers,
                    content=payload_json,
                )
                response.raise_for_status()
                logger.info(f"Webhook delivered successfully to {credentials['url']}")
                return DeliveryResult(success=True, rows_delivered=len(rows))

            except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
                logger.warning(f"Webhook attempt {attempt + 1} failed: {e}")
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(RETRY_DELAYS[attempt])
                else:
                    return DeliveryResult(
                        success=False,
                        error_code="DELIVERY_FAILED",
                        error_message=f"Webhook delivery failed after {MAX_RETRIES} attempts: {str(e)}",
                    )

    return DeliveryResult(success=False, error_code="UNKNOWN", error_message="Unexpected error")
