# Context Column Injection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow admins to configure destination columns that are automatically filled from context values (user_id, org_id, etc.) without exposing them to end users.

**Architecture:** Add `context_mapping` field to ImporterDestination model. At delivery time, inject context values into each row before batch insert. Validate required context keys at import start. Admin UI shows separate sections for mapped vs context columns.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, PostgreSQL, React, TypeScript

**Design Doc:** `docs/plans/2026-01-14-context-column-injection-design.md`

---

## Task 1: Database Migration

**Files:**
- Create: `backend/alembic/versions/xxxx_add_context_mapping_to_destinations.py`

**Step 1: Generate migration file**

Run:
```bash
cd backend && uv run alembic revision -m "add_context_mapping_to_destinations"
```

**Step 2: Write migration**

Edit the generated file:

```python
"""add_context_mapping_to_destinations

Revision ID: [generated]
Revises: [previous]
Create Date: [generated]
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "[generated]"
down_revision = "[previous]"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "importer_destinations",
        sa.Column("context_mapping", sa.JSON(), nullable=False, server_default="{}")
    )


def downgrade() -> None:
    op.drop_column("importer_destinations", "context_mapping")
```

**Step 3: Run migration**

Run:
```bash
cd backend && uv run alembic upgrade head
```

Expected: Migration applies successfully, no errors.

**Step 4: Verify migration**

Run:
```bash
cd backend && uv run alembic current
```

Expected: Shows the new revision as current.

**Step 5: Commit**

```bash
git add backend/alembic/versions/*context_mapping*.py
git commit -m "chore: add context_mapping column migration"
```

---

## Task 2: Update ImporterDestination Model

**Files:**
- Modify: `backend/app/models/importer_destination.py:14-21`
- Test: `backend/tests/unit/test_models/test_importer_destination.py`

**Step 1: Write failing test**

Add to `backend/tests/unit/test_models/test_importer_destination.py`:

```python
@pytest.mark.asyncio
async def test_importer_destination_with_context_mapping(db_session):
    """Test that context_mapping field works correctly."""
    # Create user
    user = User(email="test@example.com", hashed_password="hash")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Create importer
    importer = Importer(
        name="Test Importer",
        user_id=user.id,
        fields=[{"name": "email", "type": "email"}],
    )
    db_session.add(importer)
    await db_session.commit()
    await db_session.refresh(importer)

    # Create integration
    integration = Integration(
        user_id=user.id,
        name="Test Supabase",
        type=IntegrationType.SUPABASE,
        encrypted_credentials={"url": "https://test.supabase.co", "key": "test"},
    )
    db_session.add(integration)
    await db_session.commit()
    await db_session.refresh(integration)

    # Create destination with context_mapping
    destination = ImporterDestination(
        importer_id=importer.id,
        integration_id=integration.id,
        table_name="contacts",
        column_mapping={"email": "email_address"},
        context_mapping={"org_id": "org_id", "user_id": "user_id"},
    )
    db_session.add(destination)
    await db_session.commit()
    await db_session.refresh(destination)

    assert destination.context_mapping == {"org_id": "org_id", "user_id": "user_id"}
    assert destination.column_mapping == {"email": "email_address"}
```

**Step 2: Run test to verify it fails**

Run:
```bash
cd backend && uv run pytest tests/unit/test_models/test_importer_destination.py::test_importer_destination_with_context_mapping -v
```

Expected: FAIL - `context_mapping` is not a valid field.

**Step 3: Update model**

Edit `backend/app/models/importer_destination.py`, add after line 18 (after `column_mapping`):

```python
    context_mapping = Column(JSON, nullable=False, default=dict)
```

**Step 4: Run test to verify it passes**

Run:
```bash
cd backend && uv run pytest tests/unit/test_models/test_importer_destination.py::test_importer_destination_with_context_mapping -v
```

Expected: PASS

**Step 5: Run all model tests**

Run:
```bash
cd backend && uv run pytest tests/unit/test_models/test_importer_destination.py -v
```

Expected: All tests pass.

**Step 6: Commit**

```bash
git add backend/app/models/importer_destination.py backend/tests/unit/test_models/test_importer_destination.py
git commit -m "feat: add context_mapping field to ImporterDestination model"
```

---

## Task 3: Update Pydantic Schemas

**Files:**
- Modify: `backend/app/schemas/integration.py:93-114`
- Test: `backend/tests/unit/test_schemas/test_integration_schemas.py` (create if needed)

**Step 1: Write failing test**

Create `backend/tests/unit/test_schemas/test_integration_schemas.py`:

```python
import pytest
from uuid import uuid4
from datetime import datetime
from app.schemas.integration import DestinationCreate, DestinationResponse


def test_destination_create_with_context_mapping():
    """Test DestinationCreate accepts context_mapping."""
    dest = DestinationCreate(
        integration_id=uuid4(),
        table_name="contacts",
        column_mapping={"email": "email_address"},
        context_mapping={"org_id": "org_id"},
    )
    assert dest.context_mapping == {"org_id": "org_id"}


def test_destination_create_context_mapping_defaults_to_empty():
    """Test context_mapping defaults to empty dict."""
    dest = DestinationCreate(
        integration_id=uuid4(),
        table_name="contacts",
    )
    assert dest.context_mapping == {}


def test_destination_response_includes_context_mapping():
    """Test DestinationResponse includes context_mapping."""
    resp = DestinationResponse(
        id=uuid4(),
        importer_id=uuid4(),
        integration_id=uuid4(),
        table_name="contacts",
        column_mapping={"email": "email_address"},
        context_mapping={"org_id": "org_id"},
        created_at=datetime.now(),
    )
    assert resp.context_mapping == {"org_id": "org_id"}
```

**Step 2: Run test to verify it fails**

Run:
```bash
cd backend && uv run pytest tests/unit/test_schemas/test_integration_schemas.py -v
```

Expected: FAIL - `context_mapping` is not a valid field.

**Step 3: Update DestinationCreate schema**

Edit `backend/app/schemas/integration.py`, update `DestinationCreate` class (around line 93):

```python
class DestinationCreate(BaseModel):
    """Schema for creating/updating an importer destination."""
    integration_id: UUID
    table_name: str | None = None  # Required for Supabase
    column_mapping: dict[str, str] = Field(default_factory=dict)
    context_mapping: dict[str, str] = Field(default_factory=dict)
```

**Step 4: Update DestinationResponse schema**

Edit `backend/app/schemas/integration.py`, update `DestinationResponse` class (around line 100):

```python
class DestinationResponse(BaseModel):
    """Schema for destination response."""
    id: UUID
    importer_id: UUID
    integration_id: UUID
    table_name: str | None = None
    column_mapping: dict[str, str]
    context_mapping: dict[str, str] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime | None = None

    # Include integration details for convenience
    integration_name: str | None = None
    integration_type: IntegrationType | None = None
```

**Step 5: Run test to verify it passes**

Run:
```bash
cd backend && uv run pytest tests/unit/test_schemas/test_integration_schemas.py -v
```

Expected: PASS

**Step 6: Commit**

```bash
git add backend/app/schemas/integration.py backend/tests/unit/test_schemas/test_integration_schemas.py
git commit -m "feat: add context_mapping to destination schemas"
```

---

## Task 4: Add Context Injection to Delivery Service

**Files:**
- Modify: `backend/app/services/delivery.py:133-205`
- Test: `backend/tests/unit/test_services/test_delivery.py`

**Step 1: Write failing test for context injection**

Add to `backend/tests/unit/test_services/test_delivery.py`:

```python
@pytest.mark.asyncio
async def test_deliver_to_supabase_injects_context():
    """Test that context values are injected into rows."""
    credentials = {"url": "https://test.supabase.co", "key": "test-key"}
    table = "contacts"
    mapping = {"email": "email_address"}
    context_mapping = {"org_id": "org_id", "user_id": "user_id"}
    context = {"org_id": "org-123", "user_id": "user-456"}
    rows = [
        {"email": "alice@example.com"},
        {"email": "bob@example.com"},
    ]

    with patch("app.services.delivery.httpx.AsyncClient") as mock_client:
        mock_response = AsyncMock()
        mock_response.status_code = 201
        mock_response.raise_for_status = MagicMock()
        mock_client.return_value.__aenter__.return_value.post.return_value = mock_response

        result = await deliver_to_supabase(
            credentials=credentials,
            table=table,
            mapping=mapping,
            rows=rows,
            context_mapping=context_mapping,
            context=context,
        )

        assert result.success is True

        # Verify the posted data includes context values
        call_args = mock_client.return_value.__aenter__.return_value.post.call_args
        posted_data = call_args.kwargs["json"]

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
    credentials = {"url": "https://test.supabase.co", "key": "test-key"}
    table = "contacts"
    mapping = {"email": "email_address"}
    context_mapping = {"org_id": "org_id", "team_id": "team_id"}
    context = {"org_id": "org-123"}  # team_id missing
    rows = [{"email": "alice@example.com"}]

    with patch("app.services.delivery.httpx.AsyncClient") as mock_client:
        mock_response = AsyncMock()
        mock_response.status_code = 201
        mock_response.raise_for_status = MagicMock()
        mock_client.return_value.__aenter__.return_value.post.return_value = mock_response

        result = await deliver_to_supabase(
            credentials=credentials,
            table=table,
            mapping=mapping,
            rows=rows,
            context_mapping=context_mapping,
            context=context,
        )

        assert result.success is True

        call_args = mock_client.return_value.__aenter__.return_value.post.call_args
        posted_data = call_args.kwargs["json"]

        # Only org_id should be present, team_id skipped
        assert posted_data[0] == {
            "email_address": "alice@example.com",
            "org_id": "org-123",
        }
```

**Step 2: Run test to verify it fails**

Run:
```bash
cd backend && uv run pytest tests/unit/test_services/test_delivery.py::test_deliver_to_supabase_injects_context -v
```

Expected: FAIL - `deliver_to_supabase()` doesn't accept `context_mapping` or `context` parameters.

**Step 3: Update deliver_to_supabase function signature**

Edit `backend/app/services/delivery.py`, update function signature at line 133:

```python
async def deliver_to_supabase(
    credentials: dict[str, str],
    table: str,
    mapping: dict[str, str],
    rows: list[dict[str, Any]],
    context_mapping: dict[str, str] | None = None,
    context: dict[str, Any] | None = None,
) -> DeliveryResult:
```

**Step 4: Add context injection logic**

Edit `backend/app/services/delivery.py`, replace the column mapping section (around lines 157-166) with:

```python
    # Apply column mapping:
    # - If mapping is empty, pass through all columns as-is
    # - If mapping has entries, only include mapped columns with their new names
    if not mapping:
        mapped_rows = rows
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
```

**Step 5: Run test to verify it passes**

Run:
```bash
cd backend && uv run pytest tests/unit/test_services/test_delivery.py::test_deliver_to_supabase_injects_context -v
```

Expected: PASS

**Step 6: Run second test**

Run:
```bash
cd backend && uv run pytest tests/unit/test_services/test_delivery.py::test_deliver_to_supabase_skips_missing_optional_context -v
```

Expected: PASS

**Step 7: Run all delivery tests**

Run:
```bash
cd backend && uv run pytest tests/unit/test_services/test_delivery.py -v
```

Expected: All tests pass.

**Step 8: Commit**

```bash
git add backend/app/services/delivery.py backend/tests/unit/test_services/test_delivery.py
git commit -m "feat: add context injection to Supabase delivery"
```

---

## Task 5: Update deliver_to_destination to Pass Context

**Files:**
- Modify: `backend/app/services/delivery.py:296-378`
- Modify: `backend/app/services/import_service.py` (caller)

**Step 1: Write failing test**

Add to `backend/tests/unit/test_services/test_delivery.py`:

```python
@pytest.mark.asyncio
async def test_deliver_to_destination_passes_context_to_supabase(db_session):
    """Test that deliver_to_destination passes context to Supabase delivery."""
    # Setup mocks
    with patch("app.services.delivery.deliver_to_supabase") as mock_deliver:
        mock_deliver.return_value = DeliveryResult(success=True)

        # Create test data with context
        rows = [{"email": "test@example.com"}]
        context = {"org_id": "org-123"}

        # This will fail because deliver_to_destination doesn't accept context yet
        result = await deliver_to_destination(
            db=db_session,
            importer_id=uuid4(),
            rows=rows,
            context=context,
        )
```

**Step 2: Run test to verify it fails**

Run:
```bash
cd backend && uv run pytest tests/unit/test_services/test_delivery.py::test_deliver_to_destination_passes_context_to_supabase -v
```

Expected: FAIL - `deliver_to_destination()` doesn't accept `context` parameter.

**Step 3: Update deliver_to_destination signature**

Edit `backend/app/services/delivery.py`, find `deliver_to_destination` function (around line 296) and update signature:

```python
async def deliver_to_destination(
    db: AsyncSession,
    importer_id: UUID,
    rows: list[dict[str, Any]],
    context: dict[str, Any] | None = None,
) -> DeliveryResult:
```

**Step 4: Update deliver_to_destination to pass context**

In the same function, find where `deliver_to_supabase` is called (around line 340-350) and update:

```python
        result = await deliver_to_supabase(
            credentials=credentials,
            table=destination.table_name,
            mapping=destination.column_mapping,
            rows=rows,
            context_mapping=destination.context_mapping,
            context=context,
        )
```

**Step 5: Update import_service.py to pass context**

Edit `backend/app/services/import_service.py`, find where `deliver_to_destination` is called and update to pass context from `import_job.file_metadata`:

```python
        # Extract context from file_metadata
        context = import_job.file_metadata.get("context", {}) if import_job.file_metadata else {}

        delivery_result = await deliver_to_destination(
            db=db,
            importer_id=import_job.importer_id,
            rows=valid_rows,
            context=context,
        )
```

**Step 6: Run all delivery tests**

Run:
```bash
cd backend && uv run pytest tests/unit/test_services/test_delivery.py -v
```

Expected: All tests pass.

**Step 7: Commit**

```bash
git add backend/app/services/delivery.py backend/app/services/import_service.py
git commit -m "feat: pass context through delivery pipeline"
```

---

## Task 6: Add Required Context Key Validation

**Files:**
- Modify: `backend/app/api/v1/imports.py`
- Create: `backend/app/services/context_validation.py`
- Test: `backend/tests/unit/test_services/test_context_validation.py`

**Step 1: Write failing test for validation service**

Create `backend/tests/unit/test_services/test_context_validation.py`:

```python
import pytest
from uuid import uuid4
from app.services.context_validation import validate_required_context_keys, get_required_context_keys


def test_get_required_context_keys_returns_not_null_columns():
    """Test that only NOT NULL columns without defaults are required."""
    context_mapping = {"org_id": "org_id", "team_id": "team_id"}
    column_schema = [
        {"column_name": "org_id", "is_nullable": False, "column_default": None},
        {"column_name": "team_id", "is_nullable": True, "column_default": None},
    ]

    required = get_required_context_keys(context_mapping, column_schema)
    assert required == ["org_id"]


def test_validate_required_context_keys_passes_when_all_present():
    """Test validation passes when all required keys are present."""
    required_keys = ["org_id", "user_id"]
    context = {"org_id": "org-123", "user_id": "user-456"}

    errors = validate_required_context_keys(required_keys, context)
    assert errors == []


def test_validate_required_context_keys_fails_when_missing():
    """Test validation fails when required keys are missing."""
    required_keys = ["org_id", "user_id"]
    context = {"org_id": "org-123"}

    errors = validate_required_context_keys(required_keys, context)
    assert "user_id" in errors


def test_validate_required_context_keys_fails_when_null():
    """Test validation fails when required key has null value."""
    required_keys = ["org_id"]
    context = {"org_id": None}

    errors = validate_required_context_keys(required_keys, context)
    assert "org_id" in errors
```

**Step 2: Run test to verify it fails**

Run:
```bash
cd backend && uv run pytest tests/unit/test_services/test_context_validation.py -v
```

Expected: FAIL - module `app.services.context_validation` does not exist.

**Step 3: Create context validation service**

Create `backend/app/services/context_validation.py`:

```python
"""Context validation service for destination delivery."""

from typing import Any


def get_required_context_keys(
    context_mapping: dict[str, str],
    column_schema: list[dict[str, Any]],
) -> list[str]:
    """
    Determine which context keys are required based on column nullability.

    Args:
        context_mapping: Maps table columns to context keys
        column_schema: List of column definitions with is_nullable and column_default

    Returns:
        List of context keys that are required (NOT NULL without default)
    """
    required_keys = []

    # Build lookup from column name to schema
    column_lookup = {col["column_name"]: col for col in column_schema}

    for column_name, context_key in context_mapping.items():
        col_def = column_lookup.get(column_name)
        if col_def:
            # Required if NOT NULL and no default value
            is_required = not col_def.get("is_nullable", True) and col_def.get("column_default") is None
            if is_required:
                required_keys.append(context_key)

    return required_keys


def validate_required_context_keys(
    required_keys: list[str],
    context: dict[str, Any] | None,
) -> list[str]:
    """
    Validate that all required context keys are present and non-null.

    Args:
        required_keys: List of context keys that must be present
        context: The context object provided at import time

    Returns:
        List of missing or null required keys (empty if all valid)
    """
    if not required_keys:
        return []

    context = context or {}
    missing = []

    for key in required_keys:
        if key not in context or context[key] is None:
            missing.append(key)

    return missing
```

**Step 4: Run test to verify it passes**

Run:
```bash
cd backend && uv run pytest tests/unit/test_services/test_context_validation.py -v
```

Expected: All tests pass.

**Step 5: Commit**

```bash
git add backend/app/services/context_validation.py backend/tests/unit/test_services/test_context_validation.py
git commit -m "feat: add context validation service"
```

---

## Task 7: Integrate Context Validation into Import API

**Files:**
- Modify: `backend/app/api/v1/imports.py`
- Test: `backend/tests/integration/test_api/test_imports.py`

**Step 1: Write failing integration test**

Add to `backend/tests/integration/test_api/test_imports.py` (or create if doesn't exist):

```python
@pytest.mark.asyncio
async def test_import_fails_when_required_context_missing(
    client: TestClient,
    auth_headers: dict,
    db_session: AsyncSession,
):
    """Test that import fails when required context keys are missing."""
    # Setup: Create importer with destination that has required context columns
    # ... (setup code depends on existing test fixtures)

    response = client.post(
        "/api/v1/imports/process",
        headers=auth_headers,
        json={
            "importerKey": "test-key",
            "validData": [{"email": "test@example.com"}],
            "context": {},  # Missing required org_id
        },
    )

    assert response.status_code == 400
    assert "org_id" in response.json()["detail"]
```

**Step 2: Add validation to imports.py**

Edit `backend/app/api/v1/imports.py`, in the `/process` endpoint (around line 212), add validation after getting the importer:

```python
from app.services.context_validation import validate_required_context_keys, get_required_context_keys
from app.services.supabase import get_table_schema

# ... existing code to get importer and destination ...

# Validate required context keys if destination has context_mapping
if destination and destination.context_mapping:
    # Get column schema to determine which keys are required
    if destination.integration.type == IntegrationType.SUPABASE:
        credentials = decrypt_credentials(destination.integration.encrypted_credentials)
        column_schema = await get_table_schema(
            url=credentials["url"],
            api_key=credentials["key"],
            table_name=destination.table_name,
        )

        required_keys = get_required_context_keys(
            destination.context_mapping,
            column_schema,
        )

        missing_keys = validate_required_context_keys(required_keys, context)

        if missing_keys:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required context keys: {', '.join(missing_keys)}. "
                       f"This destination requires: {', '.join(required_keys)}",
            )
```

**Step 3: Run integration tests**

Run:
```bash
cd backend && uv run pytest tests/integration/test_api/test_imports.py -v
```

Expected: All tests pass.

**Step 4: Commit**

```bash
git add backend/app/api/v1/imports.py
git commit -m "feat: validate required context keys at import time"
```

---

## Task 8: Add Foreign Key Detection to Supabase Service

**Files:**
- Modify: `backend/app/services/supabase.py`
- Test: `backend/tests/unit/test_services/test_supabase.py`

**Step 1: Write failing test**

Add to `backend/tests/unit/test_services/test_supabase.py`:

```python
@pytest.mark.asyncio
async def test_categorize_columns_detects_fk_by_naming():
    """Test column categorization based on naming conventions."""
    from app.services.supabase import categorize_columns

    columns = [
        {"column_name": "id", "data_type": "uuid", "is_nullable": False},
        {"column_name": "email", "data_type": "text", "is_nullable": False},
        {"column_name": "name", "data_type": "text", "is_nullable": True},
        {"column_name": "org_id", "data_type": "uuid", "is_nullable": False},
        {"column_name": "user_id", "data_type": "uuid", "is_nullable": False},
        {"column_name": "created_at", "data_type": "timestamp", "is_nullable": False},
    ]

    result = categorize_columns(columns)

    hidden_names = [c["column_name"] for c in result["hidden"]]
    context_names = [c["column_name"] for c in result["context"]]
    mapped_names = [c["column_name"] for c in result["mapped"]]

    assert "id" in hidden_names
    assert "created_at" in hidden_names
    assert "org_id" in context_names
    assert "user_id" in context_names
    assert "email" in mapped_names
    assert "name" in mapped_names
```

**Step 2: Run test to verify it fails**

Run:
```bash
cd backend && uv run pytest tests/unit/test_services/test_supabase.py::test_categorize_columns_detects_fk_by_naming -v
```

Expected: FAIL - `categorize_columns` function does not exist.

**Step 3: Add categorize_columns function**

Add to `backend/app/services/supabase.py`:

```python
# Constants for column categorization
AUTO_GENERATED_COLUMNS = {"id", "created_at", "updated_at", "deleted_at"}
CONTEXT_PATTERNS = {
    "user_id", "org_id", "tenant_id", "owner_id", "account_id",
    "workspace_id", "team_id", "project_id", "created_by", "updated_by",
}


def categorize_columns(
    columns: list[dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    """
    Categorize table columns into hidden, context, and mapped.

    Args:
        columns: List of column schema dicts with column_name, data_type, is_nullable

    Returns:
        Dict with keys 'hidden', 'context', 'mapped', each containing list of columns
    """
    result = {"hidden": [], "context": [], "mapped": []}

    for col in columns:
        col_name = col["column_name"].lower()
        col_type = col.get("data_type", "").lower()

        if col_name in AUTO_GENERATED_COLUMNS:
            result["hidden"].append(col)
        elif col_name in CONTEXT_PATTERNS:
            result["context"].append(col)
        elif col_name.endswith("_id") and col_type == "uuid" and col_name != "id":
            result["context"].append(col)
        else:
            result["mapped"].append(col)

    return result
```

**Step 4: Run test to verify it passes**

Run:
```bash
cd backend && uv run pytest tests/unit/test_services/test_supabase.py::test_categorize_columns_detects_fk_by_naming -v
```

Expected: PASS

**Step 5: Run all supabase tests**

Run:
```bash
cd backend && uv run pytest tests/unit/test_services/test_supabase.py -v
```

Expected: All tests pass.

**Step 6: Commit**

```bash
git add backend/app/services/supabase.py backend/tests/unit/test_services/test_supabase.py
git commit -m "feat: add column categorization for context detection"
```

---

## Task 9: Add Categorization API Endpoint

**Files:**
- Modify: `backend/app/api/v1/integrations.py`
- Test: `backend/tests/integration/test_api/test_integrations.py`

**Step 1: Write failing test**

Add to `backend/tests/integration/test_api/test_integrations.py`:

```python
@pytest.mark.asyncio
async def test_get_categorized_columns(client: TestClient, auth_headers: dict):
    """Test getting categorized columns for a Supabase table."""
    # This test assumes a Supabase integration exists
    # Adjust based on existing test fixtures

    response = client.get(
        f"/api/v1/integrations/{integration_id}/tables/{table_name}/categorized-columns",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert "hidden" in data
    assert "context" in data
    assert "mapped" in data
```

**Step 2: Add endpoint**

Add to `backend/app/api/v1/integrations.py`:

```python
from app.services.supabase import get_table_schema, categorize_columns

@router.get(
    "/{integration_id}/tables/{table_name}/categorized-columns",
    response_model=dict,
)
async def get_categorized_columns(
    integration_id: UUID,
    table_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get table columns categorized into hidden, context, and mapped."""
    integration = await get_integration(db, integration_id, current_user.id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    if integration.type != IntegrationType.SUPABASE:
        raise HTTPException(status_code=400, detail="Only Supabase integrations support this endpoint")

    credentials = decrypt_credentials(integration.encrypted_credentials)
    columns = await get_table_schema(
        url=credentials["url"],
        api_key=credentials["key"],
        table_name=table_name,
    )

    return categorize_columns(columns)
```

**Step 3: Run integration tests**

Run:
```bash
cd backend && uv run pytest tests/integration/test_api/test_integrations.py -v
```

Expected: All tests pass.

**Step 4: Commit**

```bash
git add backend/app/api/v1/integrations.py
git commit -m "feat: add categorized columns endpoint"
```

---

## Task 10: Update Admin API Client

**Files:**
- Modify: `admin/src/lib/api.ts`

**Step 1: Add new API methods**

Edit `admin/src/lib/api.ts`, add to the integrations API section:

```typescript
export const integrationsApi = {
  // ... existing methods ...

  getCategorizedColumns: async (
    integrationId: string,
    tableName: string
  ): Promise<{
    hidden: SupabaseColumnSchema[];
    context: SupabaseColumnSchema[];
    mapped: SupabaseColumnSchema[];
  }> => {
    const response = await apiClient.get(
      `/integrations/${integrationId}/tables/${tableName}/categorized-columns`
    );
    return response.data;
  },
};
```

**Step 2: Update DestinationConfig type**

Edit `admin/src/components/DestinationSelector.tsx`, update the interface:

```typescript
export interface DestinationConfig {
  integrationId: string | null;
  integrationType: "supabase" | "webhook" | null;
  tableName: string | null;
  columnMapping: Record<string, string>;
  contextMapping: Record<string, string>;  // NEW
  supabaseColumns: SupabaseColumnSchema[];
}
```

**Step 3: Commit**

```bash
git add admin/src/lib/api.ts admin/src/components/DestinationSelector.tsx
git commit -m "feat: add categorized columns API client"
```

---

## Task 11: Create ContextColumnsSection Component

**Files:**
- Create: `admin/src/components/ContextColumnsSection.tsx`

**Step 1: Create component**

Create `admin/src/components/ContextColumnsSection.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Copy, ExternalLink } from "lucide-react";
import { SupabaseColumnSchema } from "@/lib/api";

interface ContextColumnConfig {
  columnName: string;
  contextKey: string;
  dataType: string;
  isNullable: boolean;
}

interface ContextColumnsSectionProps {
  columns: ContextColumnConfig[];
  onChange: (columns: ContextColumnConfig[]) => void;
  availableColumns: SupabaseColumnSchema[];
  onMoveToMapped: (columnName: string) => void;
}

export function ContextColumnsSection({
  columns,
  onChange,
  availableColumns,
  onMoveToMapped,
}: ContextColumnsSectionProps) {
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const requiredKeys = columns.filter((c) => !c.isNullable);
  const optionalKeys = columns.filter((c) => c.isNullable);

  const handleContextKeyChange = (columnName: string, newKey: string) => {
    onChange(
      columns.map((c) =>
        c.columnName === columnName ? { ...c, contextKey: newKey } : c
      )
    );
  };

  const handleRemove = (columnName: string) => {
    onChange(columns.filter((c) => c.columnName !== columnName));
  };

  const handleAdd = (column: SupabaseColumnSchema) => {
    onChange([
      ...columns,
      {
        columnName: column.column_name,
        contextKey: column.column_name,
        dataType: column.data_type,
        isNullable: column.is_nullable,
      },
    ]);
  };

  const generateSnippet = () => {
    const required = requiredKeys.map((c) => `    ${c.contextKey}: "..."`);
    const optional = optionalKeys.map((c) => `    // ${c.contextKey}: "..."`);
    const lines = [...required, ...optional].join(",\n");
    return `<CSVImporter\n  context={{\n${lines}\n  }}\n/>`;
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(generateSnippet());
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const unusedColumns = availableColumns.filter(
    (c) => !columns.some((ctx) => ctx.columnName === c.column_name)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Context Columns</h3>
          <p className="text-xs text-muted-foreground">
            These columns are filled from context at import time
          </p>
        </div>
      </div>

      {columns.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">
          No context columns configured
        </p>
      ) : (
        <div className="space-y-2">
          {columns.map((col) => (
            <div
              key={col.columnName}
              className="flex items-center gap-2 p-2 border rounded-md"
            >
              <div className="flex-1">
                <span className="text-sm font-medium">{col.columnName}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({col.dataType})
                </span>
              </div>
              <span className="text-xs text-muted-foreground">←</span>
              <div className="flex-1">
                <Label className="sr-only">Context key</Label>
                <Input
                  value={col.contextKey}
                  onChange={(e) =>
                    handleContextKeyChange(col.columnName, e.target.value)
                  }
                  placeholder="context key"
                  className="h-8 text-sm"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onMoveToMapped(col.columnName)}>
                    Move to Mapped
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRemove(col.columnName)}
                    className="text-destructive"
                  >
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {unusedColumns.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Context Column
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {unusedColumns.map((col) => (
              <DropdownMenuItem key={col.column_name} onClick={() => handleAdd(col)}>
                {col.column_name} ({col.data_type})
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {columns.length > 0 && (
        <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
          {requiredKeys.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-amber-500">⚠️</span>
              <p className="text-sm">
                <strong>Required context keys:</strong>{" "}
                {requiredKeys.map((c) => c.contextKey).join(", ")}
              </p>
            </div>
          )}
          {optionalKeys.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-blue-500">ℹ️</span>
              <p className="text-sm">
                <strong>Optional context keys:</strong>{" "}
                {optionalKeys.map((c) => c.contextKey).join(", ")}
              </p>
            </div>
          )}

          <div className="relative">
            <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
              {generateSnippet()}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={copySnippet}
            >
              <Copy className="h-3 w-3 mr-1" />
              {copiedSnippet ? "Copied!" : "Copy"}
            </Button>
          </div>

          <a
            href="/docs/context-variables"
            target="_blank"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Learn more about context variables
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add admin/src/components/ContextColumnsSection.tsx
git commit -m "feat: create ContextColumnsSection component"
```

---

## Task 12: Update DestinationSelector to Use Sections

**Files:**
- Modify: `admin/src/components/DestinationSelector.tsx`

**Step 1: Import and integrate ContextColumnsSection**

Edit `admin/src/components/DestinationSelector.tsx`:

1. Add import at top:
```typescript
import { ContextColumnsSection } from "./ContextColumnsSection";
```

2. Update state and handlers to manage context columns separately from mapped columns.

3. Use `getCategorizedColumns` API when table is selected.

4. Render both sections in the UI.

(Full implementation depends on existing component structure - follow existing patterns)

**Step 2: Test in browser**

Run:
```bash
cd admin && npm run dev
```

Navigate to importer configuration, select Supabase destination, verify:
- Columns are split into Mapped and Context sections
- Context columns show key input and action menu
- Code snippet generates correctly
- Moving columns between sections works

**Step 3: Run lint and type checks**

Run:
```bash
cd admin && npm run lint && npm run typecheck
```

Expected: No errors.

**Step 4: Commit**

```bash
git add admin/src/components/DestinationSelector.tsx
git commit -m "feat: split destination selector into mapped and context sections"
```

---

## Task 13: End-to-End Testing

**Step 1: Start all services**

Run:
```bash
docker-compose up -d
```

**Step 2: Manual E2E test**

1. Create a Supabase integration in admin
2. Create an importer with Supabase destination
3. Select a table with foreign key columns
4. Verify columns are auto-categorized
5. Configure context columns
6. Copy the code snippet
7. Use the snippet in a test import
8. Verify data is delivered with context values injected

**Step 3: Run all tests**

Run:
```bash
cd backend && uv run pytest
cd admin && npm run lint && npm run build
```

Expected: All tests pass, build succeeds.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete context column injection for Supabase destinations"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Database migration | `alembic/versions/*` |
| 2 | Model update | `models/importer_destination.py` |
| 3 | Schema update | `schemas/integration.py` |
| 4 | Context injection in delivery | `services/delivery.py` |
| 5 | Pass context through pipeline | `services/delivery.py`, `services/import_service.py` |
| 6 | Context validation service | `services/context_validation.py` |
| 7 | Integrate validation into API | `api/v1/imports.py` |
| 8 | Column categorization | `services/supabase.py` |
| 9 | Categorization API endpoint | `api/v1/integrations.py` |
| 10 | Admin API client | `admin/src/lib/api.ts` |
| 11 | ContextColumnsSection component | `admin/src/components/ContextColumnsSection.tsx` |
| 12 | Update DestinationSelector | `admin/src/components/DestinationSelector.tsx` |
| 13 | E2E testing | Manual verification |
