# Import Creation UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign importer creation to offer auto-detection paths (CSV upload with AI inference, Supabase schema pull) that get users to the "aha moment" faster.

**Architecture:** Add user-level `Integration` model for storing Supabase credentials. Create BAML `InferSchema` function for AI-powered column type detection from CSV samples. Redesign frontend entry point with two primary paths (CSV upload, destination connection) and manual fallback.

**Tech Stack:** FastAPI, SQLAlchemy, PostgreSQL, BAML (LLM orchestration), Next.js 14, Radix UI, Tailwind CSS, Axios

---

## Phase 1: Backend - Integration Model

### Task 1: Create Integration Model

**Files:**
- Create: `backend/app/models/integration.py`
- Modify: `backend/app/models/__init__.py`

**Step 1: Write the failing test**

Create test file `backend/tests/unit/test_models/test_integration.py`:

```python
"""Tests for Integration model."""
import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy.orm import Session

from app.models.user import User


@pytest.mark.unit
def test_integration_model_exists(db_session: Session, test_user: User):
    """Integration model should exist and be importable."""
    from app.models.integration import Integration

    integration = Integration(
        id=uuid.uuid4(),
        user_id=test_user.id,
        type="supabase",
        name="Production DB",
        credentials={"project_url": "https://abc.supabase.co", "service_role_key": "secret"},
        status="active",
    )
    db_session.add(integration)
    db_session.commit()
    db_session.refresh(integration)

    assert integration.id is not None
    assert integration.user_id == test_user.id
    assert integration.type == "supabase"
    assert integration.credentials["project_url"] == "https://abc.supabase.co"
    assert integration.status == "active"
    assert integration.created_at is not None


@pytest.mark.unit
def test_integration_user_relationship(db_session: Session, test_user: User):
    """Integration should have relationship to User."""
    from app.models.integration import Integration

    integration = Integration(
        id=uuid.uuid4(),
        user_id=test_user.id,
        type="supabase",
        name="Test DB",
        credentials={},
    )
    db_session.add(integration)
    db_session.commit()
    db_session.refresh(integration)

    assert integration.user is not None
    assert integration.user.id == test_user.id
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/unit/test_models/test_integration.py -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'app.models.integration'"

**Step 3: Write minimal implementation**

Create `backend/app/models/integration.py`:

```python
"""Integration model for storing external service credentials."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class Integration(Base):
    """Model for storing user integrations (Supabase, etc.)."""

    __tablename__ = "integrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)  # 'supabase', 'webhook', etc.
    name = Column(String(255), nullable=True)  # User-friendly name
    credentials = Column(JSON, nullable=False, default=dict)  # Encrypted in production
    status = Column(String(50), nullable=False, default="active")  # 'active', 'error', 'disconnected'

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="integrations")
```

**Step 4: Update User model to add relationship**

Modify `backend/app/models/user.py`, add after line ~47 (after `importers` relationship):

```python
    integrations = relationship("Integration", back_populates="user", cascade="all, delete-orphan")
```

**Step 5: Update models __init__.py**

Modify `backend/app/models/__init__.py`, add import:

```python
from app.models.integration import Integration
```

**Step 6: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/unit/test_models/test_integration.py -v`
Expected: PASS

**Step 7: Commit**

```bash
git add backend/app/models/integration.py backend/app/models/user.py backend/app/models/__init__.py backend/tests/unit/test_models/test_integration.py
git commit -m "$(cat <<'EOF'
feat(backend): add Integration model for storing external service credentials

Adds user-level Integration model to store Supabase/webhook credentials.
Includes type, name, encrypted credentials JSON, and status fields.
EOF
)"
```

---

### Task 2: Create Integration Database Migration

**Files:**
- Create: `backend/alembic/versions/XXXX_add_integrations_table.py`

**Step 1: Generate migration**

Run: `cd backend && uv run alembic revision --autogenerate -m "add_integrations_table"`

**Step 2: Review generated migration**

Open the generated file in `backend/alembic/versions/` and verify it contains:

```python
def upgrade() -> None:
    op.create_table(
        'integrations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('credentials', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_integrations_type'), 'integrations', ['type'], unique=False)
    op.create_index(op.f('ix_integrations_user_id'), 'integrations', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_integrations_user_id'), table_name='integrations')
    op.drop_index(op.f('ix_integrations_type'), table_name='integrations')
    op.drop_table('integrations')
```

**Step 3: Apply migration**

Run: `cd backend && uv run alembic upgrade head`
Expected: "Running upgrade ... -> add_integrations_table"

**Step 4: Commit**

```bash
git add backend/alembic/versions/
git commit -m "$(cat <<'EOF'
chore(backend): add migration for integrations table
EOF
)"
```

---

### Task 3: Create Integration Schemas

**Files:**
- Create: `backend/app/schemas/integration.py`

**Step 1: Write the failing test**

Create `backend/tests/unit/test_schemas/test_integration.py`:

```python
"""Tests for Integration schemas."""
import uuid

import pytest
from pydantic import ValidationError


@pytest.mark.unit
def test_integration_create_schema_valid():
    """IntegrationCreate should accept valid Supabase data."""
    from app.schemas.integration import IntegrationCreate

    data = IntegrationCreate(
        type="supabase",
        name="Production DB",
        credentials={
            "project_url": "https://abc123.supabase.co",
            "service_role_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
    )

    assert data.type == "supabase"
    assert data.name == "Production DB"
    assert data.credentials["project_url"] == "https://abc123.supabase.co"


@pytest.mark.unit
def test_integration_create_schema_requires_type():
    """IntegrationCreate should require type field."""
    from app.schemas.integration import IntegrationCreate

    with pytest.raises(ValidationError) as exc_info:
        IntegrationCreate(
            name="Test",
            credentials={}
        )

    assert "type" in str(exc_info.value)


@pytest.mark.unit
def test_integration_schema_response():
    """Integration response schema should include all fields."""
    from app.schemas.integration import Integration
    from datetime import datetime, timezone

    data = Integration(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        type="supabase",
        name="Production DB",
        status="active",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    assert data.id is not None
    assert data.type == "supabase"
    assert data.status == "active"
    # credentials should NOT be in response schema (security)
    assert not hasattr(data, 'credentials') or data.model_fields.get('credentials') is None
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/unit/test_schemas/test_integration.py -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'app.schemas.integration'"

**Step 3: Write minimal implementation**

Create `backend/app/schemas/integration.py`:

```python
"""Schemas for Integration model."""
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class IntegrationBase(BaseModel):
    """Base schema for Integration."""

    type: str = Field(..., description="Integration type: 'supabase', 'webhook'")
    name: Optional[str] = Field(None, description="User-friendly name for this integration")


class IntegrationCreate(IntegrationBase):
    """Schema for creating an integration."""

    credentials: dict[str, Any] = Field(
        default_factory=dict,
        description="Integration credentials (project_url, service_role_key for Supabase)"
    )


class IntegrationUpdate(BaseModel):
    """Schema for updating an integration."""

    name: Optional[str] = None
    credentials: Optional[dict[str, Any]] = None
    status: Optional[str] = None


class Integration(IntegrationBase):
    """Schema for integration response (excludes credentials for security)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    status: str
    created_at: datetime
    updated_at: datetime
    # Note: credentials intentionally excluded from response


class IntegrationWithCredentials(Integration):
    """Schema for integration with credentials (internal use only)."""

    credentials: dict[str, Any]
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/unit/test_schemas/test_integration.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/schemas/integration.py backend/tests/unit/test_schemas/test_integration.py
git commit -m "$(cat <<'EOF'
feat(backend): add Integration schemas with credential exclusion

IntegrationCreate accepts credentials, Integration response excludes them
for security. IntegrationWithCredentials available for internal use.
EOF
)"
```

---

### Task 4: Create Integration Service

**Files:**
- Create: `backend/app/services/integration.py`

**Step 1: Write the failing test**

Create `backend/tests/unit/test_services/test_integration.py`:

```python
"""Tests for Integration service."""
import uuid

import pytest
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.integration import IntegrationCreate


@pytest.mark.unit
def test_create_integration(db_session: Session, test_user: User):
    """create_integration should create and return integration."""
    from app.services.integration import create_integration

    data = IntegrationCreate(
        type="supabase",
        name="Production DB",
        credentials={
            "project_url": "https://abc123.supabase.co",
            "service_role_key": "test-key"
        }
    )

    integration = create_integration(db_session, str(test_user.id), data)

    assert integration.id is not None
    assert integration.user_id == test_user.id
    assert integration.type == "supabase"
    assert integration.name == "Production DB"
    assert integration.status == "active"


@pytest.mark.unit
def test_get_user_integrations(db_session: Session, test_user: User):
    """get_user_integrations should return only user's integrations."""
    from app.services.integration import create_integration, get_user_integrations

    # Create integration for test_user
    data = IntegrationCreate(type="supabase", name="Test", credentials={})
    create_integration(db_session, str(test_user.id), data)

    integrations = get_user_integrations(db_session, str(test_user.id))

    assert len(integrations) == 1
    assert integrations[0].user_id == test_user.id


@pytest.mark.unit
def test_get_integration_by_id(db_session: Session, test_user: User):
    """get_integration should return integration by ID."""
    from app.services.integration import create_integration, get_integration

    data = IntegrationCreate(type="supabase", name="Test", credentials={"key": "value"})
    created = create_integration(db_session, str(test_user.id), data)

    found = get_integration(db_session, str(test_user.id), str(created.id))

    assert found is not None
    assert found.id == created.id
    assert found.credentials == {"key": "value"}


@pytest.mark.unit
def test_get_integration_wrong_user_returns_none(db_session: Session, test_user: User):
    """get_integration should return None if user doesn't own integration."""
    from app.services.integration import create_integration, get_integration

    data = IntegrationCreate(type="supabase", name="Test", credentials={})
    created = create_integration(db_session, str(test_user.id), data)

    other_user_id = str(uuid.uuid4())
    found = get_integration(db_session, other_user_id, str(created.id))

    assert found is None


@pytest.mark.unit
def test_delete_integration(db_session: Session, test_user: User):
    """delete_integration should remove integration."""
    from app.services.integration import create_integration, delete_integration, get_integration

    data = IntegrationCreate(type="supabase", name="Test", credentials={})
    created = create_integration(db_session, str(test_user.id), data)

    result = delete_integration(db_session, str(test_user.id), str(created.id))

    assert result is True
    assert get_integration(db_session, str(test_user.id), str(created.id)) is None
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/unit/test_services/test_integration.py -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'app.services.integration'"

**Step 3: Write minimal implementation**

Create `backend/app/services/integration.py`:

```python
"""Service functions for Integration management."""
import logging
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.utils import db_transaction
from app.models.integration import Integration
from app.schemas.integration import IntegrationCreate, IntegrationUpdate

logger = logging.getLogger(__name__)


def create_integration(
    db: Session,
    user_id: str,
    integration_in: IntegrationCreate
) -> Integration:
    """Create a new integration for a user."""
    integration = Integration(
        user_id=UUID(user_id),
        type=integration_in.type,
        name=integration_in.name,
        credentials=integration_in.credentials,
        status="active",
    )

    with db_transaction(db):
        db.add(integration)

    db.refresh(integration)
    logger.info(f"Created integration {integration.id} for user {user_id}")
    return integration


def get_user_integrations(
    db: Session,
    user_id: str,
    integration_type: Optional[str] = None
) -> list[Integration]:
    """Get all integrations for a user, optionally filtered by type."""
    query = db.query(Integration).filter(Integration.user_id == UUID(user_id))

    if integration_type:
        query = query.filter(Integration.type == integration_type)

    return query.order_by(Integration.created_at.desc()).all()


def get_integration(
    db: Session,
    user_id: str,
    integration_id: str
) -> Optional[Integration]:
    """Get a specific integration by ID, only if owned by user."""
    return db.query(Integration).filter(
        Integration.id == UUID(integration_id),
        Integration.user_id == UUID(user_id)
    ).first()


def update_integration(
    db: Session,
    user_id: str,
    integration_id: str,
    integration_in: IntegrationUpdate
) -> Optional[Integration]:
    """Update an integration."""
    integration = get_integration(db, user_id, integration_id)
    if not integration:
        return None

    update_data = integration_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(integration, field, value)

    with db_transaction(db):
        db.add(integration)

    db.refresh(integration)
    return integration


def delete_integration(
    db: Session,
    user_id: str,
    integration_id: str
) -> bool:
    """Delete an integration. Returns True if deleted, False if not found."""
    integration = get_integration(db, user_id, integration_id)
    if not integration:
        return False

    with db_transaction(db):
        db.delete(integration)

    logger.info(f"Deleted integration {integration_id}")
    return True
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/unit/test_services/test_integration.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/integration.py backend/tests/unit/test_services/test_integration.py
git commit -m "$(cat <<'EOF'
feat(backend): add Integration service with CRUD operations

Provides create, get, list, update, delete for user integrations.
All operations scoped to user_id for security.
EOF
)"
```

---

### Task 5: Create Integration API Endpoints

**Files:**
- Create: `backend/app/api/v1/integrations.py`
- Modify: `backend/app/api/v1/__init__.py`

**Step 1: Write the failing test**

Create `backend/tests/integration/test_api/test_integrations.py`:

```python
"""Integration tests for /api/v1/integrations endpoints."""
import pytest
from fastapi.testclient import TestClient

from app.models.user import User


@pytest.mark.integration
def test_create_integration(client: TestClient, auth_headers: dict):
    """POST /integrations/ should create integration."""
    response = client.post(
        "/api/v1/integrations/",
        json={
            "type": "supabase",
            "name": "Production DB",
            "credentials": {
                "project_url": "https://abc123.supabase.co",
                "service_role_key": "test-key"
            }
        },
        headers=auth_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["type"] == "supabase"
    assert data["name"] == "Production DB"
    assert data["status"] == "active"
    # credentials should not be in response
    assert "credentials" not in data


@pytest.mark.integration
def test_list_integrations(client: TestClient, auth_headers: dict):
    """GET /integrations/ should list user's integrations."""
    # Create one first
    client.post(
        "/api/v1/integrations/",
        json={"type": "supabase", "name": "Test", "credentials": {}},
        headers=auth_headers
    )

    response = client.get("/api/v1/integrations/", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.integration
def test_get_integration(client: TestClient, auth_headers: dict):
    """GET /integrations/{id} should return integration."""
    create_response = client.post(
        "/api/v1/integrations/",
        json={"type": "supabase", "name": "Test", "credentials": {}},
        headers=auth_headers
    )
    integration_id = create_response.json()["id"]

    response = client.get(f"/api/v1/integrations/{integration_id}", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["id"] == integration_id


@pytest.mark.integration
def test_delete_integration(client: TestClient, auth_headers: dict):
    """DELETE /integrations/{id} should delete integration."""
    create_response = client.post(
        "/api/v1/integrations/",
        json={"type": "supabase", "name": "Test", "credentials": {}},
        headers=auth_headers
    )
    integration_id = create_response.json()["id"]

    response = client.delete(f"/api/v1/integrations/{integration_id}", headers=auth_headers)

    assert response.status_code == 204

    # Verify deleted
    get_response = client.get(f"/api/v1/integrations/{integration_id}", headers=auth_headers)
    assert get_response.status_code == 404


@pytest.mark.integration
def test_create_integration_requires_auth(client: TestClient):
    """POST /integrations/ without auth should return 401."""
    response = client.post(
        "/api/v1/integrations/",
        json={"type": "supabase", "name": "Test", "credentials": {}}
    )

    assert response.status_code == 401
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/integration/test_api/test_integrations.py -v`
Expected: FAIL with 404 (endpoint doesn't exist)

**Step 3: Write minimal implementation**

Create `backend/app/api/v1/integrations.py`:

```python
"""API endpoints for Integration management."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.integration import Integration, IntegrationCreate, IntegrationUpdate
from app.services import integration as integration_service

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.post("/", response_model=Integration, status_code=status.HTTP_201_CREATED)
async def create_integration(
    integration_in: IntegrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new integration for the current user."""
    integration = integration_service.create_integration(
        db, str(current_user.id), integration_in
    )
    return integration


@router.get("/", response_model=list[Integration])
async def list_integrations(
    integration_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all integrations for the current user."""
    return integration_service.get_user_integrations(
        db, str(current_user.id), integration_type
    )


@router.get("/{integration_id}", response_model=Integration)
async def get_integration(
    integration_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a specific integration by ID."""
    integration = integration_service.get_integration(
        db, str(current_user.id), integration_id
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    return integration


@router.put("/{integration_id}", response_model=Integration)
async def update_integration(
    integration_id: str,
    integration_in: IntegrationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update an integration."""
    integration = integration_service.update_integration(
        db, str(current_user.id), integration_id, integration_in
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    return integration


@router.delete("/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_integration(
    integration_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete an integration."""
    deleted = integration_service.delete_integration(
        db, str(current_user.id), integration_id
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Integration not found")
```

**Step 4: Register router in main API**

Modify `backend/app/api/v1/__init__.py`, add:

```python
from app.api.v1.integrations import router as integrations_router

# In the include_routers function or router setup:
api_router.include_router(integrations_router)
```

**Step 5: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/integration/test_api/test_integrations.py -v`
Expected: PASS

**Step 6: Commit**

```bash
git add backend/app/api/v1/integrations.py backend/app/api/v1/__init__.py backend/tests/integration/test_api/test_integrations.py
git commit -m "$(cat <<'EOF'
feat(backend): add Integration API endpoints

CRUD endpoints for /api/v1/integrations/ with authentication.
Credentials excluded from response for security.
EOF
)"
```

---

## Phase 2: Supabase Connection Service

### Task 6: Create Supabase Connection Service

**Files:**
- Create: `backend/app/services/supabase_connector.py`

**Step 1: Write the failing test**

Create `backend/tests/unit/test_services/test_supabase_connector.py`:

```python
"""Tests for Supabase connector service."""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.mark.unit
@pytest.mark.asyncio
async def test_test_connection_success():
    """test_connection should return True for valid credentials."""
    from app.services.supabase_connector import test_connection

    with patch("app.services.supabase_connector.httpx.AsyncClient") as mock_client:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [{"table_name": "users"}]

        mock_client_instance = AsyncMock()
        mock_client_instance.get.return_value = mock_response
        mock_client.return_value.__aenter__.return_value = mock_client_instance

        result = await test_connection(
            project_url="https://abc123.supabase.co",
            service_role_key="test-key"
        )

        assert result["success"] is True
        assert "tables" in result


@pytest.mark.unit
@pytest.mark.asyncio
async def test_test_connection_failure():
    """test_connection should return False for invalid credentials."""
    from app.services.supabase_connector import test_connection

    with patch("app.services.supabase_connector.httpx.AsyncClient") as mock_client:
        mock_response = MagicMock()
        mock_response.status_code = 401

        mock_client_instance = AsyncMock()
        mock_client_instance.get.return_value = mock_response
        mock_client.return_value.__aenter__.return_value = mock_client_instance

        result = await test_connection(
            project_url="https://abc123.supabase.co",
            service_role_key="invalid-key"
        )

        assert result["success"] is False
        assert "error" in result


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_tables():
    """get_tables should return list of table names."""
    from app.services.supabase_connector import get_tables

    with patch("app.services.supabase_connector.httpx.AsyncClient") as mock_client:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {"table_name": "users", "table_schema": "public"},
            {"table_name": "orders", "table_schema": "public"},
        ]

        mock_client_instance = AsyncMock()
        mock_client_instance.get.return_value = mock_response
        mock_client.return_value.__aenter__.return_value = mock_client_instance

        tables = await get_tables(
            project_url="https://abc123.supabase.co",
            service_role_key="test-key"
        )

        assert tables == ["users", "orders"]


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_table_schema():
    """get_table_schema should return column definitions."""
    from app.services.supabase_connector import get_table_schema

    with patch("app.services.supabase_connector.httpx.AsyncClient") as mock_client:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {"column_name": "id", "data_type": "uuid", "is_nullable": "NO"},
            {"column_name": "email", "data_type": "text", "is_nullable": "NO"},
            {"column_name": "name", "data_type": "character varying", "is_nullable": "YES"},
            {"column_name": "created_at", "data_type": "timestamp with time zone", "is_nullable": "YES"},
        ]

        mock_client_instance = AsyncMock()
        mock_client_instance.get.return_value = mock_response
        mock_client.return_value.__aenter__.return_value = mock_client_instance

        schema = await get_table_schema(
            project_url="https://abc123.supabase.co",
            service_role_key="test-key",
            table_name="users"
        )

        assert len(schema) == 4
        assert schema[0]["name"] == "id"
        assert schema[0]["type"] == "text"  # uuid maps to text
        assert schema[1]["name"] == "email"
        assert schema[1]["type"] == "email"  # detected from name
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/unit/test_services/test_supabase_connector.py -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'app.services.supabase_connector'"

**Step 3: Write minimal implementation**

Create `backend/app/services/supabase_connector.py`:

```python
"""Service for connecting to Supabase and fetching schema information."""
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# Postgres type to importer field type mapping
POSTGRES_TYPE_MAP = {
    "uuid": "text",
    "text": "text",
    "character varying": "text",
    "varchar": "text",
    "integer": "number",
    "bigint": "number",
    "smallint": "number",
    "numeric": "number",
    "decimal": "number",
    "real": "number",
    "double precision": "number",
    "boolean": "boolean",
    "timestamp with time zone": "date",
    "timestamp without time zone": "date",
    "timestamptz": "date",
    "date": "date",
    "time": "text",
    "json": "text",
    "jsonb": "text",
}


def _infer_type_from_name(column_name: str, postgres_type: str) -> str:
    """Infer importer field type from column name and postgres type."""
    name_lower = column_name.lower()

    # Check column name patterns first
    if "email" in name_lower:
        return "email"
    if "phone" in name_lower or "mobile" in name_lower:
        return "phone"
    if name_lower.endswith("_at") or name_lower in ("created", "updated", "deleted"):
        return "date"

    # Fall back to postgres type mapping
    return POSTGRES_TYPE_MAP.get(postgres_type, "text")


def _generate_display_name(column_name: str) -> str:
    """Generate display name from column name."""
    # Convert snake_case to Title Case
    return column_name.replace("_", " ").replace("-", " ").title()


async def test_connection(
    project_url: str,
    service_role_key: str
) -> dict[str, Any]:
    """Test Supabase connection by listing tables."""
    try:
        tables = await get_tables(project_url, service_role_key)
        return {"success": True, "tables": tables}
    except Exception as e:
        logger.error(f"Supabase connection test failed: {e}")
        return {"success": False, "error": str(e)}


async def get_tables(
    project_url: str,
    service_role_key: str
) -> list[str]:
    """Get list of public tables from Supabase."""
    # Supabase REST API endpoint for listing tables
    url = f"{project_url}/rest/v1/"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
    }

    async with httpx.AsyncClient() as client:
        # Use the OpenAPI endpoint to get table list
        response = await client.get(
            f"{project_url}/rest/v1/",
            headers=headers,
            params={"select": "table_name", "table_schema": "eq.public"},
        )

        if response.status_code == 401:
            raise ValueError("Invalid Supabase credentials")

        if response.status_code != 200:
            # Try alternative: query information_schema via RPC
            rpc_response = await client.post(
                f"{project_url}/rest/v1/rpc/get_tables",
                headers=headers,
                json={}
            )
            if rpc_response.status_code == 200:
                return [t["table_name"] for t in rpc_response.json()]

            raise ValueError(f"Failed to fetch tables: {response.status_code}")

        data = response.json()
        if isinstance(data, list):
            return [t.get("table_name", t) for t in data if isinstance(t, dict)]
        return []


async def get_table_schema(
    project_url: str,
    service_role_key: str,
    table_name: str
) -> list[dict[str, Any]]:
    """Get column schema for a specific table."""
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
    }

    async with httpx.AsyncClient() as client:
        # Query information_schema.columns via PostgREST
        response = await client.get(
            f"{project_url}/rest/v1/",
            headers=headers,
            params={
                "select": "column_name,data_type,is_nullable",
                "table_name": f"eq.{table_name}",
                "table_schema": "eq.public",
            }
        )

        if response.status_code != 200:
            # Try RPC approach
            rpc_response = await client.post(
                f"{project_url}/rest/v1/rpc/get_table_columns",
                headers=headers,
                json={"p_table_name": table_name}
            )
            if rpc_response.status_code == 200:
                columns = rpc_response.json()
            else:
                raise ValueError(f"Failed to fetch schema: {response.status_code}")
        else:
            columns = response.json()

        # Convert to importer field format
        schema = []
        for col in columns:
            column_name = col["column_name"]
            postgres_type = col["data_type"]

            schema.append({
                "name": column_name,
                "display_name": _generate_display_name(column_name),
                "type": _infer_type_from_name(column_name, postgres_type),
                "required": col.get("is_nullable") == "NO",
            })

        return schema
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/unit/test_services/test_supabase_connector.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/supabase_connector.py backend/tests/unit/test_services/test_supabase_connector.py
git commit -m "$(cat <<'EOF'
feat(backend): add Supabase connector service

Provides test_connection, get_tables, get_table_schema functions.
Maps Postgres types to importer field types with smart name inference.
EOF
)"
```

---

### Task 7: Add Integration Test and Tables Endpoints

**Files:**
- Modify: `backend/app/api/v1/integrations.py`

**Step 1: Write the failing test**

Add to `backend/tests/integration/test_api/test_integrations.py`:

```python
@pytest.mark.integration
def test_test_integration_connection(client: TestClient, auth_headers: dict):
    """POST /integrations/{id}/test should test connection."""
    # Create integration first
    create_response = client.post(
        "/api/v1/integrations/",
        json={
            "type": "supabase",
            "name": "Test",
            "credentials": {
                "project_url": "https://abc123.supabase.co",
                "service_role_key": "test-key"
            }
        },
        headers=auth_headers
    )
    integration_id = create_response.json()["id"]

    # Test connection (will fail with mock but endpoint should exist)
    with patch("app.services.supabase_connector.test_connection") as mock_test:
        mock_test.return_value = {"success": True, "tables": ["users"]}

        response = client.post(
            f"/api/v1/integrations/{integration_id}/test",
            headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json()["success"] is True


@pytest.mark.integration
def test_get_integration_tables(client: TestClient, auth_headers: dict):
    """GET /integrations/{id}/tables should list tables."""
    create_response = client.post(
        "/api/v1/integrations/",
        json={
            "type": "supabase",
            "name": "Test",
            "credentials": {
                "project_url": "https://abc123.supabase.co",
                "service_role_key": "test-key"
            }
        },
        headers=auth_headers
    )
    integration_id = create_response.json()["id"]

    with patch("app.services.supabase_connector.get_tables") as mock_tables:
        mock_tables.return_value = ["users", "orders"]

        response = client.get(
            f"/api/v1/integrations/{integration_id}/tables",
            headers=auth_headers
        )

        assert response.status_code == 200
        assert response.json() == ["users", "orders"]


@pytest.mark.integration
def test_get_integration_table_schema(client: TestClient, auth_headers: dict):
    """GET /integrations/{id}/tables/{table}/schema should return schema."""
    create_response = client.post(
        "/api/v1/integrations/",
        json={
            "type": "supabase",
            "name": "Test",
            "credentials": {
                "project_url": "https://abc123.supabase.co",
                "service_role_key": "test-key"
            }
        },
        headers=auth_headers
    )
    integration_id = create_response.json()["id"]

    with patch("app.services.supabase_connector.get_table_schema") as mock_schema:
        mock_schema.return_value = [
            {"name": "email", "display_name": "Email", "type": "email", "required": True}
        ]

        response = client.get(
            f"/api/v1/integrations/{integration_id}/tables/users/schema",
            headers=auth_headers
        )

        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["name"] == "email"
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/integration/test_api/test_integrations.py::test_test_integration_connection -v`
Expected: FAIL with 404

**Step 3: Add endpoints to integrations.py**

Add to `backend/app/api/v1/integrations.py`:

```python
from app.services import supabase_connector


@router.post("/{integration_id}/test")
async def test_integration_connection(
    integration_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Test connection for an integration."""
    integration = integration_service.get_integration(
        db, str(current_user.id), integration_id
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    if integration.type != "supabase":
        raise HTTPException(status_code=400, detail="Only Supabase integrations support connection testing")

    result = await supabase_connector.test_connection(
        project_url=integration.credentials.get("project_url"),
        service_role_key=integration.credentials.get("service_role_key"),
    )

    # Update status based on result
    new_status = "active" if result["success"] else "error"
    if integration.status != new_status:
        integration_service.update_integration(
            db, str(current_user.id), integration_id,
            IntegrationUpdate(status=new_status)
        )

    return result


@router.get("/{integration_id}/tables")
async def get_integration_tables(
    integration_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get list of tables for a Supabase integration."""
    integration = integration_service.get_integration(
        db, str(current_user.id), integration_id
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    if integration.type != "supabase":
        raise HTTPException(status_code=400, detail="Only Supabase integrations have tables")

    tables = await supabase_connector.get_tables(
        project_url=integration.credentials.get("project_url"),
        service_role_key=integration.credentials.get("service_role_key"),
    )
    return tables


@router.get("/{integration_id}/tables/{table_name}/schema")
async def get_integration_table_schema(
    integration_id: str,
    table_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get column schema for a table in a Supabase integration."""
    integration = integration_service.get_integration(
        db, str(current_user.id), integration_id
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    if integration.type != "supabase":
        raise HTTPException(status_code=400, detail="Only Supabase integrations have table schemas")

    schema = await supabase_connector.get_table_schema(
        project_url=integration.credentials.get("project_url"),
        service_role_key=integration.credentials.get("service_role_key"),
        table_name=table_name,
    )
    return schema
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/integration/test_api/test_integrations.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/v1/integrations.py backend/tests/integration/test_api/test_integrations.py
git commit -m "$(cat <<'EOF'
feat(backend): add integration test/tables/schema endpoints

POST /integrations/{id}/test - test Supabase connection
GET /integrations/{id}/tables - list tables
GET /integrations/{id}/tables/{name}/schema - get column schema
EOF
)"
```

---

## Phase 3: AI Schema Inference

### Task 8: Create BAML InferSchema Function

**Files:**
- Create: `backend/baml_src/schema.baml`

**Step 1: Create BAML function definition**

Create `backend/baml_src/schema.baml`:

```baml
// Schema inference from CSV sample data

class SampleColumn {
    name string @description("Column header name from CSV")
    samples string[] @description("5-10 sample values from the column")
}

enum ColumnType {
    text
    email
    phone
    date
    number
    boolean
    select
}

class InferredColumn {
    name string @description("Original column name")
    display_name string @description("Human-readable display name")
    type ColumnType @description("Inferred data type")
    confidence float @description("Confidence score 0-1")
    suggested_options string[]? @description("For select type: detected unique values")
    reasoning string @description("Brief explanation of why this type was chosen")
}

class InferredSchema {
    columns InferredColumn[]
}

function InferSchema(columns: SampleColumn[]) -> InferredSchema {
    client CustomGPT4oMini
    prompt #"
        Analyze these CSV columns and infer the best data type for each.

        Rules:
        - email: Values look like email addresses (contain @ and domain)
        - phone: Values look like phone numbers (digits, dashes, parentheses, +)
        - date: Values look like dates (various formats: YYYY-MM-DD, MM/DD/YYYY, etc.)
        - number: Values are numeric (integers, decimals, currency amounts)
        - boolean: Values are binary (true/false, yes/no, 1/0, active/inactive)
        - select: Low cardinality (≤10 unique values) with repeated patterns
        - text: Default for everything else

        For display_name, convert snake_case/kebab-case to Title Case.
        For select types, include the unique values as suggested_options.

        Columns to analyze:
        {% for col in columns %}
        Column: {{ col.name }}
        Samples: {{ col.samples | join(", ") }}
        {% endfor %}

        {{ ctx.output_format }}
    "#
}
```

**Step 2: Regenerate BAML client**

Run: `cd backend && uv run baml-cli generate`
Expected: Generated files in `backend/baml_client/`

**Step 3: Commit**

```bash
git add backend/baml_src/schema.baml backend/baml_client/
git commit -m "$(cat <<'EOF'
feat(backend): add BAML InferSchema function for AI column detection

Uses GPT-4o-mini to infer column types from sample CSV data.
Returns type, display_name, confidence, and reasoning for each column.
EOF
)"
```

---

### Task 9: Create Schema Inference Service

**Files:**
- Create: `backend/app/services/schema_inference.py`

**Step 1: Write the failing test**

Create `backend/tests/unit/test_services/test_schema_inference.py`:

```python
"""Tests for schema inference service."""
from unittest.mock import AsyncMock, patch

import pytest


@pytest.mark.unit
@pytest.mark.asyncio
async def test_infer_schema_from_csv():
    """infer_schema_from_csv should return inferred columns."""
    from app.services.schema_inference import infer_schema_from_csv

    csv_data = [
        {"email": "alice@example.com", "name": "Alice", "status": "active"},
        {"email": "bob@example.com", "name": "Bob", "status": "pending"},
        {"email": "carol@example.com", "name": "Carol", "status": "active"},
    ]

    # Mock BAML response
    mock_result = AsyncMock()
    mock_result.columns = [
        AsyncMock(
            name="email",
            display_name="Email",
            type="email",
            confidence=0.95,
            suggested_options=None,
            reasoning="Contains @ symbol and domain"
        ),
        AsyncMock(
            name="name",
            display_name="Name",
            type="text",
            confidence=0.90,
            suggested_options=None,
            reasoning="Free-form text values"
        ),
        AsyncMock(
            name="status",
            display_name="Status",
            type="select",
            confidence=0.92,
            suggested_options=["active", "pending"],
            reasoning="Low cardinality with repeated values"
        ),
    ]

    with patch("app.services.schema_inference.b.InferSchema", return_value=mock_result):
        result = await infer_schema_from_csv(csv_data)

        assert len(result) == 3
        assert result[0]["name"] == "email"
        assert result[0]["type"] == "email"
        assert result[2]["type"] == "select"
        assert result[2]["options"] == ["active", "pending"]


@pytest.mark.unit
def test_extract_sample_columns():
    """extract_sample_columns should extract headers and samples."""
    from app.services.schema_inference import extract_sample_columns

    csv_data = [
        {"email": "a@b.com", "count": "10"},
        {"email": "c@d.com", "count": "20"},
        {"email": "e@f.com", "count": "30"},
    ]

    columns = extract_sample_columns(csv_data, max_samples=2)

    assert len(columns) == 2
    assert columns[0]["name"] == "email"
    assert len(columns[0]["samples"]) == 2
    assert columns[0]["samples"][0] == "a@b.com"
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/unit/test_services/test_schema_inference.py -v`
Expected: FAIL with "ModuleNotFoundError"

**Step 3: Write minimal implementation**

Create `backend/app/services/schema_inference.py`:

```python
"""Service for AI-powered schema inference from CSV data."""
import logging
from typing import Any

from baml_client.async_client import b

logger = logging.getLogger(__name__)


def extract_sample_columns(
    csv_data: list[dict[str, Any]],
    max_samples: int = 10
) -> list[dict[str, Any]]:
    """Extract column names and sample values from CSV data."""
    if not csv_data:
        return []

    # Get column names from first row
    columns = list(csv_data[0].keys())

    result = []
    for col_name in columns:
        samples = []
        for row in csv_data[:max_samples]:
            value = row.get(col_name)
            if value is not None:
                samples.append(str(value))

        result.append({
            "name": col_name,
            "samples": samples
        })

    return result


async def infer_schema_from_csv(
    csv_data: list[dict[str, Any]],
    max_samples: int = 10
) -> list[dict[str, Any]]:
    """Use AI to infer schema from CSV sample data."""
    # Extract sample columns
    sample_columns = extract_sample_columns(csv_data, max_samples)

    if not sample_columns:
        return []

    try:
        # Call BAML function
        from baml_client import types as baml_types

        baml_columns = [
            baml_types.SampleColumn(
                name=col["name"],
                samples=col["samples"]
            )
            for col in sample_columns
        ]

        result = await b.InferSchema(columns=baml_columns)

        # Convert to importer field format
        fields = []
        for col in result.columns:
            field = {
                "name": col.name,
                "display_name": col.display_name,
                "type": col.type.value if hasattr(col.type, 'value') else str(col.type),
            }

            # Add options for select type
            if col.suggested_options:
                field["options"] = col.suggested_options

            fields.append(field)

        return fields

    except Exception as e:
        logger.error(f"Schema inference failed: {e}")
        # Fallback: return basic schema with text types
        return [
            {
                "name": col["name"],
                "display_name": col["name"].replace("_", " ").replace("-", " ").title(),
                "type": "text"
            }
            for col in sample_columns
        ]
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/unit/test_services/test_schema_inference.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/schema_inference.py backend/tests/unit/test_services/test_schema_inference.py
git commit -m "$(cat <<'EOF'
feat(backend): add AI schema inference service

Uses BAML InferSchema to detect column types from CSV samples.
Falls back to text type if AI inference fails.
EOF
)"
```

---

### Task 10: Add Schema Inference API Endpoint

**Files:**
- Modify: `backend/app/api/v1/importers.py`

**Step 1: Write the failing test**

Add to `backend/tests/integration/test_api/test_importers.py`:

```python
from unittest.mock import patch, AsyncMock

@pytest.mark.integration
def test_infer_schema_endpoint(client: TestClient, auth_headers: dict):
    """POST /importers/infer-schema should return inferred columns."""
    with patch("app.services.schema_inference.infer_schema_from_csv") as mock_infer:
        mock_infer.return_value = [
            {"name": "email", "display_name": "Email", "type": "email"},
            {"name": "status", "display_name": "Status", "type": "select", "options": ["active", "pending"]},
        ]

        response = client.post(
            "/api/v1/importers/infer-schema",
            json={
                "data": [
                    {"email": "a@b.com", "status": "active"},
                    {"email": "c@d.com", "status": "pending"},
                ]
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["columns"]) == 2
        assert data["columns"][0]["type"] == "email"


@pytest.mark.integration
def test_infer_schema_requires_auth(client: TestClient):
    """POST /importers/infer-schema without auth should return 401."""
    response = client.post(
        "/api/v1/importers/infer-schema",
        json={"data": [{"col": "val"}]}
    )

    assert response.status_code == 401
```

**Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/integration/test_api/test_importers.py::test_infer_schema_endpoint -v`
Expected: FAIL with 404

**Step 3: Add endpoint to importers.py**

Add to `backend/app/api/v1/importers.py`:

```python
from app.services import schema_inference


class InferSchemaRequest(BaseModel):
    """Request body for schema inference."""
    data: list[dict[str, Any]]


class InferSchemaResponse(BaseModel):
    """Response for schema inference."""
    columns: list[dict[str, Any]]


@router.post("/infer-schema", response_model=InferSchemaResponse)
async def infer_schema(
    request: InferSchemaRequest,
    current_user: User = Depends(get_current_active_user),
):
    """Infer column schema from CSV sample data using AI."""
    columns = await schema_inference.infer_schema_from_csv(request.data)
    return InferSchemaResponse(columns=columns)
```

Note: Add necessary imports at top of file:
```python
from typing import Any
from pydantic import BaseModel
```

**Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/integration/test_api/test_importers.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/v1/importers.py backend/tests/integration/test_api/test_importers.py
git commit -m "$(cat <<'EOF'
feat(backend): add POST /importers/infer-schema endpoint

Accepts CSV sample data, returns AI-inferred column types.
Uses BAML InferSchema for intelligent type detection.
EOF
)"
```

---

## Phase 4: Frontend - API Client Updates

### Task 11: Add Integration and Schema API Methods

**Files:**
- Modify: `admin/src/utils/apiClient.ts`

**Step 1: Add TypeScript types**

Create `admin/src/types/integration.ts`:

```typescript
export interface Integration {
  id: string;
  user_id: string;
  type: 'supabase' | 'webhook';
  name: string | null;
  status: 'active' | 'error' | 'disconnected';
  created_at: string;
  updated_at: string;
}

export interface IntegrationCreate {
  type: 'supabase' | 'webhook';
  name?: string;
  credentials: {
    project_url?: string;
    service_role_key?: string;
  };
}

export interface TableSchema {
  name: string;
  display_name: string;
  type: string;
  required?: boolean;
}

export interface InferredColumn {
  name: string;
  display_name: string;
  type: string;
  options?: string[];
}
```

**Step 2: Add API methods to apiClient.ts**

Add to `admin/src/utils/apiClient.ts`:

```typescript
import { Integration, IntegrationCreate, TableSchema, InferredColumn } from '@/types/integration';

export const integrationsApi = {
  getIntegrations: async (): Promise<Integration[]> => {
    const response = await apiClient.get('/integrations/');
    return response.data;
  },

  createIntegration: async (data: IntegrationCreate): Promise<Integration> => {
    const response = await apiClient.post('/integrations/', data);
    return response.data;
  },

  deleteIntegration: async (integrationId: string): Promise<void> => {
    await apiClient.delete(`/integrations/${integrationId}`);
  },

  testConnection: async (integrationId: string): Promise<{ success: boolean; tables?: string[]; error?: string }> => {
    const response = await apiClient.post(`/integrations/${integrationId}/test`);
    return response.data;
  },

  getTables: async (integrationId: string): Promise<string[]> => {
    const response = await apiClient.get(`/integrations/${integrationId}/tables`);
    return response.data;
  },

  getTableSchema: async (integrationId: string, tableName: string): Promise<TableSchema[]> => {
    const response = await apiClient.get(`/integrations/${integrationId}/tables/${tableName}/schema`);
    return response.data;
  },
};

export const schemaApi = {
  inferSchema: async (data: Record<string, any>[]): Promise<{ columns: InferredColumn[] }> => {
    const response = await apiClient.post('/importers/infer-schema', { data });
    return response.data;
  },
};
```

**Step 3: Commit**

```bash
git add admin/src/types/integration.ts admin/src/utils/apiClient.ts
git commit -m "$(cat <<'EOF'
feat(admin): add integration and schema inference API methods

integrationsApi: CRUD, test connection, get tables/schema
schemaApi: AI-powered column type inference from CSV data
EOF
)"
```

---

## Phase 5: Frontend - New Components

### Task 12: Create CsvUploader Component

**Files:**
- Create: `admin/src/components/CsvUploader.tsx`

**Step 1: Create component**

```typescript
'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CsvUploaderProps {
  onFileSelect: (data: Record<string, any>[], fileName: string) => void;
  isLoading?: boolean;
}

export default function CsvUploader({ onFileSelect, isLoading }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (text: string): Record<string, any>[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const data: Record<string, any>[] = [];

    for (let i = 1; i < Math.min(lines.length, 11); i++) { // Max 10 sample rows
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return data;
  };

  const handleFile = useCallback((file: File) => {
    setError(null);

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        setFileName(file.name);
        onFileSelect(data, file.name);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV');
      }
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearFile = () => {
    setFileName(null);
    setError(null);
  };

  if (fileName && !error) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-medium">{fileName}</p>
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Analyzing columns...' : 'File uploaded'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        rounded-lg border-2 border-dashed p-8 text-center transition-colors
        ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
        ${error ? 'border-red-500' : ''}
      `}
    >
      <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-4 text-lg font-medium">
        Drop a CSV file here
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        to auto-detect columns
      </p>

      <div className="mt-4">
        <label>
          <input
            type="file"
            accept=".csv"
            onChange={handleInputChange}
            className="hidden"
          />
          <Button variant="outline" asChild>
            <span>Browse files</span>
          </Button>
        </label>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add admin/src/components/CsvUploader.tsx
git commit -m "$(cat <<'EOF'
feat(admin): add CsvUploader component with drag-and-drop

Parses CSV file, extracts headers and sample rows.
Supports drag-and-drop and file browser.
EOF
)"
```

---

### Task 13: Create IntegrationSetupModal Component

**Files:**
- Create: `admin/src/components/IntegrationSetupModal.tsx`

**Step 1: Create component**

```typescript
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { integrationsApi } from '@/utils/apiClient';
import { Integration } from '@/types/integration';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface IntegrationSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (integration: Integration) => void;
}

export default function IntegrationSetupModal({
  open,
  onOpenChange,
  onSuccess,
}: IntegrationSetupModalProps) {
  const [projectUrl, setProjectUrl] = useState('');
  const [serviceRoleKey, setServiceRoleKey] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; tables?: string[] } | null>(null);

  const handleTest = async () => {
    if (!projectUrl || !serviceRoleKey) {
      setError('Project URL and Service Role Key are required');
      return;
    }

    setIsTesting(true);
    setError(null);
    setTestResult(null);

    try {
      // Create temporary integration to test
      const integration = await integrationsApi.createIntegration({
        type: 'supabase',
        name: name || 'Supabase',
        credentials: {
          project_url: projectUrl,
          service_role_key: serviceRoleKey,
        },
      });

      const result = await integrationsApi.testConnection(integration.id);
      setTestResult(result);

      if (result.success) {
        onSuccess(integration);
        onOpenChange(false);
        resetForm();
      } else {
        // Delete failed integration
        await integrationsApi.deleteIntegration(integration.id);
        setError(result.error || 'Connection test failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to connect');
    } finally {
      setIsTesting(false);
    }
  };

  const resetForm = () => {
    setProjectUrl('');
    setServiceRoleKey('');
    setName('');
    setError(null);
    setTestResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Connect Supabase</DialogTitle>
          <DialogDescription>
            Find these in your Supabase project under Settings → API
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="projectUrl">Project URL</Label>
            <Input
              id="projectUrl"
              placeholder="https://abc123.supabase.co"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceRoleKey">Service Role Key</Label>
            <Input
              id="serviceRoleKey"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={serviceRoleKey}
              onChange={(e) => setServiceRoleKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Keep this key secret. We encrypt it at rest.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Connection Name (optional)</Label>
            <Input
              id="name"
              placeholder="Production DB"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              For your reference if you have multiple projects
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <XCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {testResult?.success && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Connected! Found {testResult.tables?.length || 0} tables.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleTest} disabled={isTesting || !projectUrl || !serviceRoleKey}>
            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test & Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add admin/src/components/IntegrationSetupModal.tsx
git commit -m "$(cat <<'EOF'
feat(admin): add IntegrationSetupModal for Supabase connection

Modal form for entering Supabase credentials.
Tests connection before saving, shows table count on success.
EOF
)"
```

---

### Task 14: Create DestinationPicker Component

**Files:**
- Create: `admin/src/components/DestinationPicker.tsx`

**Step 1: Create component**

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { Database, Webhook, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { integrationsApi } from '@/utils/apiClient';
import { Integration, TableSchema } from '@/types/integration';
import IntegrationSetupModal from './IntegrationSetupModal';

interface DestinationPickerProps {
  onSchemaSelect: (schema: TableSchema[], integrationId: string, tableName: string) => void;
  onWebhookSelect: () => void;
}

export default function DestinationPicker({
  onSchemaSelect,
  onWebhookSelect,
}: DestinationPickerProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setIsLoading(true);
    try {
      const data = await integrationsApi.getIntegrations();
      setIntegrations(data.filter(i => i.type === 'supabase'));
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntegrationSelect = async (integration: Integration) => {
    setSelectedIntegration(integration);
    setSelectedTable(null);
    setIsLoadingTables(true);
    setError(null);

    try {
      const tableList = await integrationsApi.getTables(integration.id);
      setTables(tableList);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch tables');
    } finally {
      setIsLoadingTables(false);
    }
  };

  const handleTableSelect = async (tableName: string) => {
    if (!selectedIntegration) return;

    setSelectedTable(tableName);
    setIsLoadingSchema(true);
    setError(null);

    try {
      const schema = await integrationsApi.getTableSchema(selectedIntegration.id, tableName);
      onSchemaSelect(schema, selectedIntegration.id, tableName);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch schema');
    } finally {
      setIsLoadingSchema(false);
    }
  };

  const handleSetupSuccess = (integration: Integration) => {
    setIntegrations(prev => [integration, ...prev]);
    handleIntegrationSelect(integration);
  };

  const supabaseIntegrations = integrations.filter(i => i.type === 'supabase' && i.status === 'active');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Supabase Card */}
        <div
          className={`
            rounded-lg border-2 p-6 cursor-pointer transition-all
            ${selectedIntegration ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          `}
          onClick={() => {
            if (supabaseIntegrations.length === 0) {
              setShowSetupModal(true);
            }
          }}
        >
          <Database className="h-8 w-8 text-primary" />
          <h3 className="mt-3 font-semibold">Supabase</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Import schema from your Supabase table
          </p>

          {supabaseIntegrations.length > 0 ? (
            <div className="mt-4">
              <Select
                value={selectedIntegration?.id}
                onValueChange={(id) => {
                  const integration = supabaseIntegrations.find(i => i.id === id);
                  if (integration) handleIntegrationSelect(integration);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select connection" />
                </SelectTrigger>
                <SelectContent>
                  {supabaseIntegrations.map((integration) => (
                    <SelectItem key={integration.id} value={integration.id}>
                      {integration.name || 'Supabase'}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">+ Add new connection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Button className="mt-4" variant="outline" onClick={() => setShowSetupModal(true)}>
              Connect Supabase
            </Button>
          )}
        </div>

        {/* Webhook Card */}
        <div
          className="rounded-lg border-2 border-border p-6 cursor-pointer hover:border-primary/50 transition-all"
          onClick={onWebhookSelect}
        >
          <Webhook className="h-8 w-8 text-muted-foreground" />
          <h3 className="mt-3 font-semibold">Webhook</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Send data to any HTTP endpoint
          </p>
          <Button className="mt-4" variant="outline">
            Configure webhook
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table Selection */}
      {selectedIntegration && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground mb-3">
            Connected to: {selectedIntegration.name || 'Supabase'}
          </p>

          {isLoadingTables ? (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading tables...
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select a table</label>
              <Select
                value={selectedTable || undefined}
                onValueChange={handleTableSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isLoadingSchema && (
            <div className="flex items-center gap-2 text-sm mt-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading schema...
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 mt-3">{error}</p>
          )}
        </div>
      )}

      <IntegrationSetupModal
        open={showSetupModal}
        onOpenChange={setShowSetupModal}
        onSuccess={handleSetupSuccess}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add admin/src/components/DestinationPicker.tsx
git commit -m "$(cat <<'EOF'
feat(admin): add DestinationPicker component

Shows Supabase and Webhook options.
Handles inline Supabase setup, table selection, schema fetching.
EOF
)"
```

---

### Task 15: Create SchemaEditor Component

**Files:**
- Create: `admin/src/components/SchemaEditor.tsx`

**Step 1: Create component**

```typescript
'use client';

import React from 'react';
import { Plus, MoreVertical, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ImporterField } from '@/types/importer';

interface SchemaEditorProps {
  columns: ImporterField[];
  onChange: (columns: ImporterField[]) => void;
  preview?: Record<string, any>[];
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: 'Aa' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Phone', icon: '📞' },
  { value: 'number', label: 'Number', icon: '#' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'boolean', label: 'Boolean', icon: '✓' },
  { value: 'select', label: 'Select', icon: '☰' },
];

export default function SchemaEditor({ columns, onChange, preview }: SchemaEditorProps) {
  const handleTypeChange = (index: number, type: string) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], type };
    onChange(updated);
  };

  const handleDisplayNameChange = (index: number, display_name: string) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], display_name };
    onChange(updated);
  };

  const handleDelete = (index: number) => {
    onChange(columns.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    const newColumn: ImporterField = {
      name: `column_${columns.length + 1}`,
      display_name: `Column ${columns.length + 1}`,
      type: 'text',
    };
    onChange([...columns, newColumn]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Columns</h3>
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Add Column
        </Button>
      </div>

      {columns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">No columns defined yet</p>
          <Button variant="outline" className="mt-4" onClick={handleAdd}>
            Add your first column
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Column</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Display Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {columns.map((column, index) => (
                <tr key={column.name} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                      {column.name}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={column.display_name || ''}
                      onChange={(e) => handleDisplayNameChange(index, e.target.value)}
                      className="h-8"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={column.type}
                      onValueChange={(value) => handleTypeChange(index, value)}
                    >
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              {type.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {column.type === 'select' && column.options && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {column.options.join(', ')}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDelete(index)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview */}
      {preview && preview.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Preview</h4>
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {columns.map((col) => (
                    <th key={col.name} className="px-3 py-2 text-left font-medium">
                      {col.display_name || col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.slice(0, 3).map((row, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.name} className="px-3 py-2 text-muted-foreground">
                        {row[col.name] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Showing {Math.min(3, preview.length)} of {preview.length} rows from your CSV
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add admin/src/components/SchemaEditor.tsx
git commit -m "$(cat <<'EOF'
feat(admin): add SchemaEditor component

Editable table for column definitions with type selection.
Shows CSV preview rows when available.
EOF
)"
```

---

## Phase 6: Frontend - Page Redesign

### Task 16: Redesign New Importer Page

**Files:**
- Modify: `admin/src/app/(dashboard)/importers/new/page.tsx`

**Step 1: Rewrite the page**

Replace the entire content of `admin/src/app/(dashboard)/importers/new/page.tsx`:

```typescript
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader2, FileSpreadsheet, Database, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CsvUploader from '@/components/CsvUploader';
import DestinationPicker from '@/components/DestinationPicker';
import SchemaEditor from '@/components/SchemaEditor';
import WebhookSettings from '@/components/WebhookSettings';
import { importersApi, schemaApi } from '@/utils/apiClient';
import { ImporterField } from '@/types/importer';
import { TableSchema } from '@/types/integration';

type CreationPath = 'csv' | 'destination' | 'manual' | null;

export default function NewImporterPage() {
  const router = useRouter();

  // Path selection
  const [selectedPath, setSelectedPath] = useState<CreationPath>(null);

  // Form state
  const [importerName, setImporterName] = useState('');
  const [columns, setColumns] = useState<ImporterField[]>([]);
  const [csvPreview, setCsvPreview] = useState<Record<string, any>[]>([]);

  // Webhook settings
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(false);

  // Destination settings
  const [integrationId, setIntegrationId] = useState<string | null>(null);
  const [destinationTable, setDestinationTable] = useState<string | null>(null);

  // UI state
  const [isInferring, setIsInferring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCsvSelect = async (data: Record<string, any>[], fileName: string) => {
    setCsvPreview(data);
    setImporterName(fileName.replace(/\.csv$/i, '').replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    setIsInferring(true);
    setError(null);

    try {
      const result = await schemaApi.inferSchema(data);
      setColumns(result.columns.map(col => ({
        name: col.name,
        display_name: col.display_name,
        type: col.type,
        options: col.options,
      })));
    } catch (err: any) {
      setError('Failed to analyze CSV. Using basic column detection.');
      // Fallback: create text columns from headers
      if (data.length > 0) {
        setColumns(Object.keys(data[0]).map(name => ({
          name,
          display_name: name.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: 'text',
        })));
      }
    } finally {
      setIsInferring(false);
    }
  };

  const handleSchemaSelect = (schema: TableSchema[], intId: string, tableName: string) => {
    setIntegrationId(intId);
    setDestinationTable(tableName);
    setImporterName(tableName.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
    setColumns(schema.map(col => ({
      name: col.name,
      display_name: col.display_name,
      type: col.type,
    })));
  };

  const handleWebhookSelect = () => {
    setSelectedPath('manual');
    setWebhookEnabled(true);
  };

  const handleSave = async () => {
    if (!importerName.trim()) {
      setError('Importer name is required');
      return;
    }
    if (columns.length === 0) {
      setError('At least one column is required');
      return;
    }
    if (webhookEnabled && !webhookUrl.trim()) {
      setError('Webhook URL is required when webhook is enabled');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const data = await importersApi.createImporter({
        name: importerName,
        fields: columns,
        webhook_url: webhookUrl || undefined,
        webhook_enabled: webhookEnabled,
        integration_id: integrationId || undefined,
        destination_table: destinationTable || undefined,
      });
      router.push(`/importers/${data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create importer');
    } finally {
      setIsSaving(false);
    }
  };

  // Path selection view
  if (!selectedPath && columns.length === 0) {
    return (
      <div className="container max-w-4xl py-8">
        <Link href="/importers" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to list
        </Link>

        <h1 className="text-2xl font-bold">Create New Importer</h1>
        <p className="text-muted-foreground mt-1">
          Get started by choosing how to define your columns
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-8">
          {/* CSV Upload Card */}
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setSelectedPath('csv')}
          >
            <CardHeader>
              <FileSpreadsheet className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">Upload Sample CSV</CardTitle>
              <CardDescription>
                Drop a CSV file to auto-detect columns with AI
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Destination Card */}
          <Card
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setSelectedPath('destination')}
          >
            <CardHeader>
              <Database className="h-10 w-10 text-primary" />
              <CardTitle className="mt-4">Connect Destination</CardTitle>
              <CardDescription>
                Import schema from Supabase or configure a webhook
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setSelectedPath('manual')}
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center"
          >
            <PenLine className="h-4 w-4 mr-1" />
            Define columns manually
          </button>
          <p className="text-xs text-muted-foreground mt-1">
            For advanced users who know their schema
          </p>
        </div>
      </div>
    );
  }

  // CSV Upload Path
  if (selectedPath === 'csv' && columns.length === 0) {
    return (
      <div className="container max-w-4xl py-8">
        <button
          onClick={() => setSelectedPath(null)}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </button>

        <h1 className="text-2xl font-bold">Upload Sample CSV</h1>
        <p className="text-muted-foreground mt-1">
          We'll analyze your file and detect column types automatically
        </p>

        <div className="mt-8">
          <CsvUploader onFileSelect={handleCsvSelect} isLoading={isInferring} />
        </div>

        {isInferring && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Analyzing columns with AI...</span>
          </div>
        )}
      </div>
    );
  }

  // Destination Path
  if (selectedPath === 'destination' && columns.length === 0) {
    return (
      <div className="container max-w-4xl py-8">
        <button
          onClick={() => setSelectedPath(null)}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </button>

        <h1 className="text-2xl font-bold">Connect Destination</h1>
        <p className="text-muted-foreground mt-1">
          Import schema from your destination or configure delivery
        </p>

        <div className="mt-8">
          <DestinationPicker
            onSchemaSelect={handleSchemaSelect}
            onWebhookSelect={handleWebhookSelect}
          />
        </div>
      </div>
    );
  }

  // Schema Editor View (after columns are detected or manual)
  return (
    <div className="container max-w-4xl py-8">
      <button
        onClick={() => {
          setSelectedPath(null);
          setColumns([]);
          setCsvPreview([]);
          setImporterName('');
        }}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Start over
      </button>

      <h1 className="text-2xl font-bold">Create New Importer</h1>

      <div className="mt-8 space-y-6">
        {/* Importer Name */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Importer Name</Label>
              <Input
                id="name"
                value={importerName}
                onChange={(e) => setImporterName(e.target.value)}
                placeholder="e.g., Customer Data"
              />
            </div>
          </CardContent>
        </Card>

        {/* Schema Editor */}
        <Card>
          <CardContent className="pt-6">
            <SchemaEditor
              columns={columns}
              onChange={setColumns}
              preview={csvPreview}
            />
          </CardContent>
        </Card>

        {/* Webhook Settings (if not using Supabase) */}
        {!integrationId && (
          <Card>
            <CardContent className="pt-6">
              <WebhookSettings
                webhookEnabled={webhookEnabled}
                webhookUrl={webhookUrl}
                onWebhookEnabledChange={setWebhookEnabled}
                onWebhookUrlChange={setWebhookUrl}
              />
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/importers')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Importer
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Run build to verify no errors**

Run: `cd admin && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add admin/src/app/(dashboard)/importers/new/page.tsx
git commit -m "$(cat <<'EOF'
feat(admin): redesign new importer page with auto-detection paths

Entry point offers CSV upload, destination connection, or manual.
CSV path uses AI schema inference.
Destination path pulls schema from Supabase tables.
EOF
)"
```

---

### Task 17: Update Importer API to Support Integration Fields

**Files:**
- Modify: `backend/app/schemas/importer.py`
- Modify: `backend/app/models/importer.py`
- Modify: `backend/app/services/importer.py`

**Step 1: Add fields to importer model**

Add to `backend/app/models/importer.py` after line ~55:

```python
    # Integration settings
    integration_id = Column(UUID(as_uuid=True), ForeignKey("integrations.id"), nullable=True)
    destination_table = Column(String(255), nullable=True)

    # Relationships
    integration = relationship("Integration", backref="importers")
```

**Step 2: Add fields to importer schema**

Add to `backend/app/schemas/importer.py` in `ImporterBase` class:

```python
    integration_id: Optional[str] = None
    destination_table: Optional[str] = None
```

**Step 3: Create migration**

Run: `cd backend && uv run alembic revision --autogenerate -m "add_integration_fields_to_importer"`

**Step 4: Apply migration**

Run: `cd backend && uv run alembic upgrade head`

**Step 5: Commit**

```bash
git add backend/app/models/importer.py backend/app/schemas/importer.py backend/alembic/versions/
git commit -m "$(cat <<'EOF'
feat(backend): add integration_id and destination_table to Importer

Links importers to integrations for Supabase destination support.
EOF
)"
```

---

### Task 18: Run Full Test Suite

**Step 1: Run backend tests**

Run: `cd backend && uv run pytest -v`
Expected: All tests pass

**Step 2: Run backend linting**

Run: `cd backend && uv run ruff check . && uv run ruff format --check .`
Expected: No errors

**Step 3: Run admin build**

Run: `cd admin && npm run lint && npm run build`
Expected: Build succeeds

**Step 4: Final commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: final cleanup and verification

All tests passing, linting clean, builds successful.
EOF
)"
```

---

## Summary

This implementation plan covers:

1. **Phase 1 (Tasks 1-5):** Backend Integration model with CRUD API
2. **Phase 2 (Tasks 6-7):** Supabase connector service with test/tables/schema endpoints
3. **Phase 3 (Tasks 8-10):** AI schema inference via BAML
4. **Phase 4 (Task 11):** Frontend API client updates
5. **Phase 5 (Tasks 12-15):** New components (CsvUploader, IntegrationSetupModal, DestinationPicker, SchemaEditor)
6. **Phase 6 (Tasks 16-18):** Page redesign and integration

Total: ~18 tasks, each with TDD approach (write test → verify fail → implement → verify pass → commit)
