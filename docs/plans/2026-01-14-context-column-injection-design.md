# Context Column Injection for Supabase Destinations

## Problem

When importing CSV data to Supabase, some columns (like `user_id`, `org_id`, `tenant_id`) need to be filled with context values passed at import time, not from CSV data. These foreign key columns:

- Shouldn't appear in the end user's field mapping experience
- Need values from the runtime context (who is importing, which org, etc.)
- Must be automatically injected into every row before delivery

**Example:** A `contacts` table has `org_id` as a foreign key. When a user imports contacts, they shouldn't see or map `org_id` — it should be automatically filled from the context passed when initializing the importer.

## Solution

Allow admins to configure "context columns" — destination columns that are automatically filled from the context object passed to the CSVImporter component.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Configuration location | Column-level in Supabase table schema browser | Natural place — admin sees all columns and decides source for each |
| UI layout | Separate sections: "Mapped Columns" and "Context Columns" | Clear visual separation of different column sources |
| Auto-detection | Suggest based on FK constraints + naming heuristics | Smart defaults reduce manual work |
| Context key naming | Keep identical to column name (snake_case) | Predictable — what admin sees in Supabase is what developers pass |
| User control | Full — admin can move columns between sections | Auto-detection is suggestion, not restriction |
| Validation timing | Warn at config time, fail fast at import time | Catch errors early, clear feedback |
| Developer communication | Banner + copyable code snippet + docs link | Actionable handoff to dev team |
| Hidden from mapping | Context columns completely hidden from mapped section | Clean UI, no confusion |
| Batch handling | Inject context during batch preparation | Efficient — single dict update per row in memory |

## User Flow

1. Admin selects Supabase destination and table
2. System analyzes table schema and suggests categorization:
   - **Mapped Columns** — regular data columns (existing behavior)
   - **Context Columns** — likely foreign key/relationship columns (new)
3. Admin confirms or adjusts — full control to move columns between sections
4. Admin maps importer fields → mapped columns (existing)
5. Admin specifies context key for each context column (pre-filled with column name)
6. System shows required context keys with copyable code snippet
7. Admin shares snippet with developers
8. Developers pass context when initializing CSVImporter
9. At import time: validate required context keys exist
10. At delivery time: inject context values into each row before batch insert

## Admin UI

### Destination Configuration

```
┌─────────────────────────────────────────────────────┐
│ Supabase Destination: contacts                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ MAPPED COLUMNS                                      │
│ These columns are mapped from importer fields       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ email (text)          →  [Email Field ▼]    [⋮]│ │
│ │ full_name (text)      →  [Name Field ▼]     [⋮]│ │
│ │ phone (text)          →  [Phone Field ▼]    [⋮]│ │
│ └─────────────────────────────────────────────────┘ │
│                        [+ Import Schema from Table] │
│                                                     │
│ CONTEXT COLUMNS                                     │
│ These columns are filled from context at import     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ org_id (uuid)         ←  context: org_id    [⋮]│ │
│ │ created_by (uuid)     ←  context: created_by[⋮]│ │
│ └─────────────────────────────────────────────────┘ │
│                             [+ Add Context Column]  │
│                                                     │
│ ⚠️ Required context keys: org_id, created_by        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ <CSVImporter                                    │ │
│ │   context={{                                    │ │
│ │     org_id: "...",                              │ │
│ │     created_by: "..."                           │ │
│ │   }}                                            │ │
│ │ />                                    [Copy]    │ │
│ └─────────────────────────────────────────────────┘ │
│ Learn more about context variables                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Column Actions

Each column row has an action menu (⋮) with:
- **Move to Mapped** — removes from Context section, adds to Mapped section
- **Move to Context** — removes from Mapped section, adds to Context section
- **Remove** — removes column from destination config entirely

A column can only exist in one section at a time.

## Auto-Detection Logic

When admin selects a Supabase table, columns are categorized:

### Category 1: Auto-generated (hidden entirely)
- Primary key `id` columns
- Timestamp columns: `created_at`, `updated_at`, `deleted_at`
- Never shown — Supabase handles automatically

### Category 2: Suggested Context Columns

Detection priority:

1. **Foreign key constraints** (highest confidence)
   - Query Supabase for actual FK relationships
   - If column references another table → suggest as context

2. **Naming + type heuristic** (fallback)
   - Column ends in `_id` AND is UUID type AND is not primary key
   - Common names: `user_id`, `org_id`, `tenant_id`, `owner_id`, `account_id`, `workspace_id`, `team_id`, `project_id`, `created_by`, `updated_by`

3. **Everything else → Mapped Columns**

```python
def categorize_columns(columns: List[SupabaseColumn], foreign_keys: List[ForeignKey]) -> dict:
    auto_generated = {"id", "created_at", "updated_at", "deleted_at"}
    context_patterns = {"user_id", "org_id", "tenant_id", "owner_id", "account_id",
                        "workspace_id", "team_id", "project_id", "created_by", "updated_by"}

    fk_columns = {fk.column_name for fk in foreign_keys}

    result = {"mapped": [], "context": [], "hidden": []}

    for col in columns:
        if col.name in auto_generated:
            result["hidden"].append(col)
        elif col.name in fk_columns:
            result["context"].append(col)
        elif col.name.endswith("_id") and col.type == "uuid" and col.name != "id":
            result["context"].append(col)
        elif col.name in context_patterns:
            result["context"].append(col)
        else:
            result["mapped"].append(col)

    return result
```

**Important:** These are suggestions only. Admin has full control to move any column between sections.

## Validation

### Config-time (when admin saves destination)

For each context column, check if Supabase column is `NOT NULL` without default:
- If yes → mark context key as **required**
- If nullable or has default → mark as **optional**

Display in UI:
```
⚠️ Required context keys: org_id, created_by
ℹ️ Optional context keys: team_id
```

Code snippet shows required keys, optional ones commented:
```jsx
<CSVImporter
  context={{
    org_id: "...",      // required
    created_by: "...",  // required
    // team_id: "...",  // optional
  }}
/>
```

### Import-time (when import starts)

Before processing any rows:

1. Check if destination has context columns configured
2. For each **required** context key, verify it exists in provided context object
3. Treat `null` values same as missing — fail with clear error
4. If missing → fail immediately:
   ```
   Import failed: Missing required context key 'org_id'.
   This destination requires: org_id, created_by
   ```

Optional context keys that are missing → silently skip (column uses Supabase default or NULL)

## Delivery Behavior

### Batch Preparation

Context injection happens during batch preparation (existing batch flow):

```python
def prepare_batch_for_supabase(
    rows: List[dict],
    column_mapping: dict,      # {"importer_field": "table_column"}
    context_mapping: dict,     # {"table_column": "context_key"}
    context: dict
) -> List[dict]:
    prepared_rows = []

    for row in rows:
        # Apply regular column mapping
        prepared = {col: row[field] for field, col in column_mapping.items() if field in row}

        # Inject context values
        for column_name, context_key in context_mapping.items():
            if context_key in context and context[context_key] is not None:
                prepared[column_name] = context[context_key]

        prepared_rows.append(prepared)

    return prepared_rows

# Single batch insert to Supabase
POST /rest/v1/table [prepared_rows]
```

Performance: Context injection is O(n) simple dict operations in memory — negligible compared to HTTP/DB time.

## Error Handling

### Scenario 1: Missing required context key

```
When: Developer doesn't pass required context key
Error: Immediate failure before processing
Message: "Import failed: Missing required context key 'org_id'.
         Required keys for this destination: org_id, created_by"
Where: Returned from /imports/process endpoint
```

### Scenario 2: Context value type mismatch

```
When: Context has org_id: "not-a-uuid" but column expects UUID
Error: Supabase returns 400 on insert
Message: "Delivery failed: Invalid value for column 'org_id'.
         Expected UUID, got 'not-a-uuid'"
Where: Job status shows failed, error details in job metadata
```

### Scenario 3: Context key exists but value is null

```
When: context = { org_id: null } and column is NOT NULL
Behavior: Treat same as missing key — fail with "Missing required context key"
Rationale: null for a required field is effectively missing
```

### Scenario 4: Foreign key constraint violation

```
When: Context has org_id: "valid-uuid" but UUID doesn't exist in referenced table
Error: Supabase returns 409 (FK violation)
Message: "Delivery failed: Foreign key constraint violation.
         Value '...' for column 'org_id' does not exist in referenced table."
Where: Job status shows failed
```

### Scenario 5: Partial batch failure

```
When: Batch of 1000 rows, some fail due to context/FK issues
Behavior: Atomic — all or nothing (Supabase default)
Recommendation: Keep atomic behavior, report full failure with details
```

## Data Model Changes

### ImporterDestination Model

```python
class ImporterDestination(Base):
    __tablename__ = "importer_destinations"

    id: UUID
    importer_id: UUID                    # FK to Importer
    integration_id: UUID                 # FK to Integration
    table_name: str                      # Target Supabase table
    column_mapping: dict = {}            # {"importer_field": "table_column"}
    context_mapping: dict = {}           # NEW: {"table_column": "context_key"}
    created_at: datetime
    updated_at: datetime
```

**Key difference in mapping direction:**
- `column_mapping`: keyed by **importer field** → maps to column
- `context_mapping`: keyed by **table column** → maps from context key

### Pydantic Schemas

```python
class ImporterDestinationCreate(BaseModel):
    integration_id: UUID
    table_name: str
    column_mapping: Dict[str, str] = {}
    context_mapping: Dict[str, str] = {}  # NEW

class ImporterDestinationUpdate(BaseModel):
    integration_id: Optional[UUID] = None
    table_name: Optional[str] = None
    column_mapping: Optional[Dict[str, str]] = None
    context_mapping: Optional[Dict[str, str]] = None  # NEW

class ImporterDestinationResponse(BaseModel):
    id: UUID
    importer_id: UUID
    integration_id: UUID
    table_name: str
    column_mapping: Dict[str, str]
    context_mapping: Dict[str, str]  # NEW
    created_at: datetime
    updated_at: datetime
```

### Migration

```python
def upgrade():
    op.add_column(
        'importer_destinations',
        sa.Column('context_mapping', sa.JSON(), nullable=False, server_default='{}')
    )

def downgrade():
    op.drop_column('importer_destinations', 'context_mapping')
```

Backward compatible — existing destinations work unchanged with empty context_mapping.

## Files to Modify

| Area | File | Changes |
|------|------|---------|
| Backend model | `backend/app/models/importer_destination.py` | Add `context_mapping` column |
| Backend schema | `backend/app/schemas/importer_destination.py` | Add `context_mapping` field |
| Backend delivery | `backend/app/services/delivery.py` | Inject context values during batch prep |
| Backend validation | `backend/app/api/v1/imports.py` | Validate required context keys at import start |
| Backend Supabase | `backend/app/services/supabase.py` | Add FK detection for auto-categorization |
| Admin UI | `admin/src/components/DestinationSelector.tsx` | Split into two sections |
| Admin UI | New: `admin/src/components/ContextColumnsSection.tsx` | Context column configuration UI |
| Admin UI | `admin/src/components/SupabaseTablePicker.tsx` | Pass FK info for categorization |
| Migration | New: `backend/alembic/versions/xxx_add_context_mapping.py` | Add column |
| Docs | `docs/` | Context variables documentation |

## Out of Scope

- Context columns for webhook destinations (different delivery mechanism)
- Dynamic context keys (computed at runtime)
- Per-row context values (all rows get same context)
- Context validation against FK tables (would require Supabase queries)

## Open Questions

None — design is complete.
