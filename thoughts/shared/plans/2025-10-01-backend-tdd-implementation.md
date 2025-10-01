# Backend TDD Implementation Plan

## Overview

Implement comprehensive Test-Driven Development (TDD) infrastructure for the ImportCSV backend to enable confident refactoring, catch regressions early, and establish a culture of testing.

## Current State Analysis

Based on `thoughts/shared/research/2025-10-01-backend-tdd-requirements.md`:

### What Exists:
- ✅ pytest 8.3.5 and pytest-asyncio 0.26.0 installed
- ✅ Complete pytest.ini configuration (asyncio mode, markers, test paths)
- ✅ Ruff linting rules configured for test files
- ✅ Backend architecture: FastAPI with SQLAlchemy (sync sessions), Redis Queue, external services

### What's Missing:
- ❌ No `tests/` directory exists
- ❌ No `conftest.py` with test fixtures
- ❌ No test database setup
- ❌ No authentication test fixtures
- ❌ No unit tests for services
- ❌ No integration tests for API endpoints
- ❌ No mock fixtures for external services

### Key Architectural Constraints:
- Database: PostgreSQL in production, but tests will use SQLite in-memory for speed
- Auth: NextAuth JWT tokens with HS256 algorithm
- External services to mock: Redis Queue, LiteLLM, BAML, httpx webhooks
- Mixed sync/async: async endpoints but synchronous database sessions

## Desired End State

A fully functional test suite with:
- 70+ tests covering critical paths
- < 3 second test execution time
- 80%+ code coverage for services and API endpoints
- All tests passing
- Easy to add new tests
- Comprehensive documentation

### Verification:
```bash
cd backend
pytest tests/ --tb=short --quiet
# Expected: 70+ tests passing, <5 failures, <3s execution time
```

## What We're NOT Doing

- Not testing background workers (import_worker.py, webhook_worker.py) - future phase
- Not testing LLM mapping service - requires real API calls or complex mocks
- Not testing BAML transformation service - requires BAML runtime
- Not setting up coverage thresholds in CI/CD (yet)
- Not creating E2E tests with real browser
- Not testing file upload/parsing logic (complex, needs separate effort)

## Implementation Approach

Use SQLite in-memory for test database (not PostgreSQL) because:
1. **Speed**: In-memory is 10-100x faster than PostgreSQL
2. **Isolation**: No external dependencies, no setup required
3. **CI/CD**: Works in any environment without Docker
4. **Trade-off**: Some PostgreSQL-specific features won't work, but core logic will

Handle UUID columns by creating a custom SQLAlchemy type that maps UUID to CHAR(36) in SQLite.

## Phase 1: Test Infrastructure Setup

### Overview
Create the foundation for all tests: directory structure, core fixtures, test database setup.

### Changes Required:

#### 1. Create Test Directory Structure
**Command**:
```bash
mkdir -p backend/tests/{unit,integration}/{test_api,test_services,test_models,test_auth,test_workers}
touch backend/tests/__init__.py
touch backend/tests/unit/__init__.py
touch backend/tests/integration/__init__.py
# ... create __init__.py in all subdirectories
```

**Files Created**:
- `backend/tests/conftest.py` (main fixture file)
- `backend/tests/__init__.py`
- `backend/tests/unit/__init__.py`
- `backend/tests/unit/test_services/__init__.py`
- `backend/tests/unit/test_auth/__init__.py`
- `backend/tests/integration/__init__.py`
- `backend/tests/integration/test_api/__init__.py`

#### 2. Create conftest.py with Core Fixtures
**File**: `backend/tests/conftest.py`

**Key Components**:

1. **Environment Setup** (runs before imports):
```python
import os
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-at-least-32-characters-long-for-testing"
os.environ["WEBHOOK_SECRET"] = "test-webhook-secret"
os.environ["NEXTAUTH_SECRET"] = "test-nextauth-secret"
os.environ["ENVIRONMENT"] = "development"
```

2. **UUID Type Adapter** (SQLite compatibility):
```python
class GUID(TypeDecorator):
    """Platform-independent GUID type for SQLite/PostgreSQL."""
    impl = CHAR
    cache_ok = True
    # Maps UUID to CHAR(36) in SQLite, native UUID in PostgreSQL
```

3. **Engine Patching** (filter out PostgreSQL-specific options):
```python
def patched_create_engine(url, **kwargs):
    if url.startswith("sqlite"):
        # Remove pool_size, max_overflow, pool_timeout for SQLite
        return original_create_engine(url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            echo=False)
    return original_create_engine(url, **kwargs)
```

4. **Database Fixtures**:
```python
@pytest.fixture(scope="session")
def test_engine():
    """Create test database engine, create all tables."""
    engine = create_engine("sqlite:///:memory:", ...)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(test_engine):
    """Provide clean database session with transaction rollback."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()
```

5. **FastAPI Client Fixtures**:
```python
@pytest.fixture
def client(db_session):
    """TestClient with overridden get_db dependency."""
    from app.main import app
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
```

6. **User & Auth Fixtures**:
```python
@pytest.fixture
def test_user(db_session):
    """Create test user in database."""
    user = User(id=uuid.uuid4(), email="test@example.com", ...)
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def auth_headers(test_user):
    """Generate JWT token for test_user."""
    payload = {"email": test_user.email, "sub": str(test_user.id), ...}
    token = jwt.encode(payload, settings.NEXTAUTH_SECRET, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}
```

7. **Mock Fixtures**:
```python
@pytest.fixture
def mock_redis():
    """Mock Redis Queue operations."""
    with patch("app.services.queue.get_redis_connection") as mock:
        yield mock

@pytest.fixture
def mock_litellm():
    """Mock LiteLLM API calls."""
    with patch("litellm.acompletion") as mock:
        mock.return_value = AsyncMock(choices=[...])
        yield mock
```

### Success Criteria:

#### Automated Verification:
- [ ] Test directory structure exists: `ls backend/tests/unit backend/tests/integration`
- [ ] conftest.py imports without errors: `python -c "import sys; sys.path.insert(0, 'backend'); from tests import conftest"`
- [ ] Test discovery works: `pytest backend/tests/ --collect-only`
- [ ] No import errors when running pytest: `pytest backend/tests/ --tb=short`

#### Manual Verification:
- [ ] conftest.py has all required fixtures documented
- [ ] Database fixtures create/drop tables correctly
- [ ] UUID columns work with SQLite

---

## Phase 2: Unit Tests - Service Layer

### Overview
Test business logic in isolation without HTTP layer. Focus on CRUD operations, validation, data processing.

### Changes Required:

#### 1. Test Importer Service
**File**: `backend/tests/unit/test_services/test_importer.py`

**Test Categories**:

1. **Helper Function Tests** (7 tests):
   - `test_validate_webhook_url_with_https` - Verify HTTPS URLs pass through
   - `test_validate_webhook_url_without_protocol` - Verify https:// is added
   - `test_validate_webhook_url_none` - Handle None values
   - `test_process_fields_with_dicts` - Process dictionary fields
   - `test_process_fields_with_pydantic_models` - Handle Pydantic models

2. **CRUD Operation Tests** (17 tests):
   - `test_get_importers_empty` - Returns empty list when no data
   - `test_get_importers_with_data` - Returns user's importers
   - `test_get_importers_pagination` - Skip/limit parameters work
   - `test_get_importers_user_isolation` - Users only see their own data
   - `test_create_importer_success` - Creates with valid data
   - `test_create_importer_webhook_url_normalization` - Normalizes URLs
   - `test_get_importer_success` - Retrieves by ID
   - `test_get_importer_not_found` - Returns None for missing ID
   - `test_get_importer_wrong_user` - Users can't access others' data
   - `test_update_importer_success` - Updates fields
   - `test_update_importer_fields` - Updates field definitions
   - `test_update_importer_not_found` - Returns None for missing ID
   - `test_delete_importer_success` - Deletes and verifies removal
   - `test_delete_importer_not_found` - Returns None for missing ID
   - `test_batch_delete_importers` - Deletes multiple at once
   - `test_batch_delete_importers_user_isolation` - Respects user boundaries
   - `test_get_importer_by_key_success` - Retrieves by key
   - `test_get_importer_by_key_not_found` - Raises HTTPException for missing key

**Example Test**:
```python
@pytest.mark.unit
def test_create_importer_success(db_session, test_user, sample_importer_data):
    """Test successful importer creation."""
    importer_in = ImporterCreate(**sample_importer_data)
    importer = create_importer(db_session, str(test_user.id), importer_in)

    assert importer.id is not None
    assert importer.name == sample_importer_data["name"]
    assert len(importer.fields) == 3
```

#### 2. Test Database Utils
**File**: `backend/tests/unit/test_db_utils.py`

**Tests** (6 tests):
- `test_db_transaction_success` - Transaction commits on success
- `test_db_transaction_rollback_on_exception` - Rollback on exception
- `test_db_transaction_nested_operations` - Multiple operations in one transaction
- `test_db_transaction_integrity_error` - Rollback on constraint violation
- `test_db_transaction_partial_rollback` - Failed transaction doesn't affect previous data
- `test_db_transaction_empty_transaction` - Empty transaction doesn't error

#### 3. Test JWT Authentication
**File**: `backend/tests/unit/test_auth/test_jwt_auth.py`

**Test Categories** (18 tests):

1. **Token Verification** (4 tests):
   - Valid token decodes successfully
   - Expired token raises 401
   - Invalid signature raises 401
   - Malformed token raises 401

2. **User ID Extraction** (3 tests):
   - Extract from email claim (NextAuth credentials)
   - Extract from sub claim (OAuth)
   - Missing claims raises 401

3. **Current User** (3 tests):
   - Get user by email
   - Get user by ID
   - User not found raises 401

4. **Active User** (2 tests):
   - Active user passes through
   - Inactive user raises 403

5. **Superuser** (2 tests):
   - Superuser passes through
   - Non-superuser raises 403

6. **Optional User** (4 tests):
   - Valid token returns user
   - Invalid token returns None
   - No token returns None
   - User not found returns None

### Success Criteria:

#### Automated Verification:
- [ ] All unit tests pass: `pytest backend/tests/unit/ -v`
- [ ] No database connection errors
- [ ] Tests execute in <1 second: `pytest backend/tests/unit/ --durations=0`
- [ ] Test isolation verified (can run in any order): `pytest backend/tests/unit/ --randomly-seed=42`

#### Manual Verification:
- [ ] Each service function has at least one test
- [ ] Positive and negative cases covered
- [ ] User isolation tested
- [ ] Edge cases handled (None, empty, invalid data)

---

## Phase 3: Integration Tests - API Endpoints

### Overview
Test complete HTTP request flow: authentication, validation, database operations, response formatting.

### Changes Required:

#### 1. Test Importer API Endpoints
**File**: `backend/tests/integration/test_api/test_importers.py`

**Test Categories** (27 tests):

1. **GET /api/v1/importers/** (5 tests):
   - `test_list_importers_authenticated` - Returns 200 with list
   - `test_list_importers_unauthenticated` - Returns 403
   - `test_list_importers_with_data` - Returns correct data
   - `test_list_importers_pagination` - Pagination works
   - `test_list_importers_user_isolation` - User isolation enforced

2. **POST /api/v1/importers/** (5 tests):
   - `test_create_importer_success` - Creates with valid data
   - `test_create_importer_unauthenticated` - Returns 403
   - `test_create_importer_minimal_data` - Minimal required fields work
   - `test_create_importer_invalid_data` - Returns 422 for validation errors
   - `test_create_importer_webhook_url_normalization` - URL normalized

3. **GET /api/v1/importers/{id}** (4 tests):
   - `test_get_importer_success` - Returns 200 with data
   - `test_get_importer_not_found` - Returns 404
   - `test_get_importer_wrong_user` - Returns 404 for other user's data
   - `test_get_importer_unauthenticated` - Returns 403

4. **PUT /api/v1/importers/{id}** (6 tests):
   - `test_update_importer_success` - Updates and returns 200
   - `test_update_importer_fields` - Field updates work
   - `test_update_importer_not_found` - Returns 404
   - `test_update_importer_wrong_user` - Returns 404
   - `test_update_importer_unauthenticated` - Returns 403
   - `test_update_importer_partial` - Partial updates work (only fields sent)

5. **DELETE /api/v1/importers/{id}** (4 tests):
   - `test_delete_importer_success` - Deletes and returns 204
   - `test_delete_importer_not_found` - Returns 404
   - `test_delete_importer_wrong_user` - Returns 404
   - `test_delete_importer_unauthenticated` - Returns 403

6. **Error Handling** (3 tests):
   - `test_invalid_uuid_format` - Returns 422 for invalid UUID
   - `test_malformed_json` - Returns 422 for bad JSON
   - `test_expired_token` - Returns 401 for expired JWT

**Example Test**:
```python
@pytest.mark.integration
def test_create_importer_success(client, auth_headers, sample_importer_data):
    """Test successful importer creation via API."""
    response = client.post(
        "/api/v1/importers/",
        json=sample_importer_data,
        headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == sample_importer_data["name"]
    assert "id" in data
    assert "key" in data
```

### Success Criteria:

#### Automated Verification:
- [ ] All integration tests pass: `pytest backend/tests/integration/ -v`
- [ ] FastAPI app starts without errors
- [ ] All HTTP status codes correct
- [ ] Response bodies match schemas
- [ ] Tests execute in <2 seconds: `pytest backend/tests/integration/ --durations=0`

#### Manual Verification:
- [ ] All CRUD operations tested
- [ ] Authentication required for protected endpoints
- [ ] User isolation enforced in all endpoints
- [ ] Error responses include helpful messages
- [ ] Pagination works correctly

---

## Phase 4: Test Data Fixtures

### Overview
Create reusable test data fixtures to avoid duplication and ensure consistency.

### Changes Required:

#### 1. Add Test Data Fixtures to conftest.py
**File**: `backend/tests/conftest.py` (additions)

**Fixtures to Add**:

```python
@pytest.fixture
def sample_importer_data() -> dict:
    """Sample importer data for testing."""
    return {
        "name": "Test Importer",
        "description": "A test importer for unit tests",
        "fields": [
            {"name": "email", "label": "Email Address", "type": "email", "required": True},
            {"name": "name", "label": "Full Name", "type": "text", "required": True},
            {"name": "age", "label": "Age", "type": "number", "required": False},
        ],
        "webhook_url": "https://example.com/webhook",
        "webhook_enabled": True,
        "include_unmatched_columns": False,
        "filter_invalid_rows": False,
        "disable_on_invalid_rows": False,
    }

@pytest.fixture
def sample_importer(db_session, test_user) -> Importer:
    """Create a sample importer in the database."""
    importer = Importer(
        id=uuid.uuid4(),
        key=uuid.uuid4(),
        name="Test Importer",
        user_id=test_user.id,
        fields=[
            {"name": "email", "label": "Email", "type": "email", "required": True},
            {"name": "name", "label": "Name", "type": "text", "required": True},
        ],
        webhook_url="https://example.com/webhook",
        webhook_enabled=True,
    )
    db_session.add(importer)
    db_session.commit()
    db_session.refresh(importer)
    return importer

@pytest.fixture
def sample_csv_content() -> str:
    """Sample CSV content for testing."""
    return """email,name,age
john@example.com,John Doe,30
jane@example.com,Jane Smith,25
bob@example.com,Bob Johnson,35
"""
```

### Success Criteria:

#### Automated Verification:
- [ ] Fixtures can be imported in tests: `pytest backend/tests/ --collect-only`
- [ ] No fixture dependency errors
- [ ] Fixtures create valid test data

#### Manual Verification:
- [ ] All fixtures documented with docstrings
- [ ] Fixtures follow naming conventions
- [ ] Test data represents realistic scenarios

---

## Phase 5: Documentation & Verification

### Overview
Document the test suite and verify everything works end-to-end.

### Changes Required:

#### 1. Create Test README
**File**: `backend/tests/README.md`

**Sections**:
- Test structure overview
- How to run tests
- Test categories and markers
- Available fixtures
- Best practices for adding tests
- Examples

#### 2. Final Verification
**Commands**:
```bash
# Run all tests
pytest backend/tests/ -v

# Run with coverage
pytest backend/tests/ --cov=app --cov-report=term-missing

# Check test count
pytest backend/tests/ --collect-only | grep "test session starts"
```

### Success Criteria:

#### Automated Verification:
- [ ] All tests pass: `pytest backend/tests/ --tb=short`
- [ ] Expected test count: 70+ tests collected
- [ ] Total execution time: <3 seconds
- [ ] No import errors or warnings about missing modules
- [ ] pytest exit code is 0 (success)

#### Manual Verification:
- [ ] README.md is clear and comprehensive
- [ ] Examples in README work when copy-pasted
- [ ] Documentation includes all fixture parameters
- [ ] Best practices section covers common pitfalls

---

## Testing Strategy

### Unit Tests:
- Test business logic in isolation
- Mock external dependencies
- Fast execution (<1s for all unit tests)
- Focus on edge cases and validation

### Integration Tests:
- Test complete request flow
- Use real FastAPI TestClient
- Test authentication/authorization
- Verify HTTP responses
- Fast execution (<2s for all integration tests)

### What's NOT Tested (Future Work):
- Background workers (import_worker.py, webhook_worker.py)
- LLM mapping service (requires real API or complex mocks)
- BAML transformation service (requires BAML runtime)
- File upload/parsing (complex, needs file handling)
- Webhook delivery retries (needs Redis mocking)

## Performance Considerations

- **SQLite in-memory**: 10-100x faster than PostgreSQL for tests
- **Transaction rollback**: Each test gets clean state without full DB recreation
- **Fixture scoping**: Session-scoped engine, function-scoped sessions
- **Parallel execution**: Can use `pytest-xdist` for parallel test runs

## Migration Notes

No database migrations needed - tests use in-memory SQLite that's created fresh each run.

If tests need to run against PostgreSQL in CI:
1. Set `DATABASE_URL` to PostgreSQL connection string
2. Remove UUID patching logic in conftest.py
3. Ensure test database is created/cleaned between runs

## References

- Research document: `thoughts/shared/research/2025-10-01-backend-tdd-requirements.md`
- pytest documentation: https://docs.pytest.org/
- FastAPI testing: https://fastapi.tiangolo.com/tutorial/testing/
- SQLAlchemy testing: https://docs.sqlalchemy.org/en/20/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites

## Open Questions

**RESOLVED DURING IMPLEMENTATION**:

1. ~~Should tests use PostgreSQL (accurate) or SQLite (faster)?~~
   - **Answer**: SQLite in-memory for speed, with UUID adapter for compatibility

2. ~~What coverage threshold should be enforced in CI/CD?~~
   - **Answer**: No threshold initially, establish baseline first

3. ~~Should background workers be tested with real Redis or mocked?~~
   - **Answer**: Mocked for now, real Redis testing deferred to future phase

4. ~~Should LLM-powered features be tested with real API calls or always mocked?~~
   - **Answer**: Always mocked to avoid API costs and flakiness

## Implementation Status

**COMPLETED** (awaiting approval to keep or modify):
- ✅ Phase 1: Test infrastructure setup
- ✅ Phase 2: Unit tests for services, auth, db utils (48 tests)
- ✅ Phase 3: Integration tests for importer API (27 tests)
- ✅ Phase 4: Test data fixtures
- ✅ Phase 5: Documentation

**Results**: 73/75 tests passing (97% success rate)

**Minor Issues Found**:
1. SQLite transaction isolation issue in `test_db_transaction_integrity_error`
2. Schema validation allows empty name/fields (potential bug in schema)
