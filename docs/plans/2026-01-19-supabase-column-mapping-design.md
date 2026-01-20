# Supabase Column Mapping Design

**Goal:** When a user creates an importer via CSV upload or manual schema, then selects a Supabase table as destination, provide a mapping UI to reconcile schema mismatches.

**Problem:** Currently, if importer columns don't match Supabase table columns, there's no way to map them. Data either fails to insert or goes to wrong columns.

---

## When Mapping UI Appears

Show the column mapping UI when **importer schema source ≠ destination table**:

| Schema Source | Destination | Show Mapping UI |
|---------------|-------------|-----------------|
| CSV upload | Supabase table X | ✅ Yes |
| Manual | Supabase table X | ✅ Yes |
| Connect Database (table X) | Supabase table X | ❌ No (same table) |
| Connect Database (table X) | Supabase table Y | ✅ Yes (different table) |

---

## Auto-Mapping Rules

Keep it simple — only high-confidence matches:

1. **Exact match**: `email` → `email`
2. **Case-insensitive**: `Email` → `email`

Everything else requires manual mapping. No fuzzy/semantic matching.

---

## Unmapped Column Handling

### Importer columns with no destination

**Behavior:** User must explicitly select "Ignore" to proceed.

**Rationale:** Prevents accidental data loss. User consciously acknowledges this column's data won't be imported.

### Table columns with no source

| Column Type | Behavior |
|-------------|----------|
| Auto-generated (`id`, `created_at`, `updated_at`, `deleted_at`) | Hidden from mapping UI |
| Nullable | Info: "Won't be populated" — no action required |
| NOT NULL (required) | ⚠️ Warning: "Required column has no source — insert will fail" |

**Rationale:** Nullable columns being empty is usually fine. Required columns being empty will cause database errors — surface this clearly.

---

## UI Design

Mapping UI appears **inline** in the destination selector, after table selection:

```
┌─────────────────────────────────────────────────────────────┐
│ Column Mapping                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Your Column        →    Table Column                         │
│ ─────────────────────────────────────────────────────────── │
│ email              →    [email ▼]              ✓ matched     │
│ name               →    [— Select —▼]          ⚠ unmapped    │
│ company            →    [— Ignore —▼]          ○ ignored     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Table columns without source:                                │
│ • notes (nullable) — won't be populated                      │
│ ⚠ phone (required) — insert will fail without this          │
└─────────────────────────────────────────────────────────────┘
```

### Dropdown options for each importer column

- All available table columns (that aren't already mapped)
- "— Ignore —" option to explicitly skip

### Validation

Cannot save destination until:
- All importer columns are either mapped OR explicitly ignored
- User acknowledges any NOT NULL warnings (or maps something to them)

---

## Implementation Notes

### Files to modify

- `admin/src/components/DestinationSelector.tsx` — add mapping UI after table selection
- `admin/src/components/ChangeDestinationModal.tsx` — pass importer fields for mapping context
- `admin/src/app/(dashboard)/importers/new/page.tsx` — track schema source for conditional display

### New component

Create `admin/src/components/ColumnMappingEditor.tsx`:
- Accepts: importer fields, table columns (with nullability info)
- Outputs: column mapping record, ignored columns list
- Handles: auto-mapping on mount, validation state

### Data flow

1. User selects Supabase table
2. Fetch table schema (already exists via `getCategorizedColumns`)
3. Run auto-mapping (exact + case-insensitive)
4. Display mapping UI with results
5. User adjusts as needed
6. Validation checks pass → can save

### Backend

No backend changes needed — `column_mapping` field already exists on destination model.

---

## Out of Scope

- Fuzzy/semantic matching (e.g., `company` → `organization`)
- Type validation (e.g., warning if mapping text → integer)
- Transformation during mapping (e.g., split full_name → first + last)

These can be added later if users need them.
