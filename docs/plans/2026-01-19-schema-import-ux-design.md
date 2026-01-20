# Schema Import UX Redesign

## Problem Statement

The current "Import Schema from Database" flow has UX issues:

1. **Jargon terminology** — "context columns" and "importable columns" are system-centric terms that confuse both technical and non-technical users
2. **Information overload** — Shows all columns with types/nullable status upfront, overwhelming users who just want to set up their importer
3. **No progressive disclosure** — All information displayed at once rather than revealing complexity on demand
4. **Unclear action** — The banner "Replace columns from table schema?" and "Import Schema" button don't clearly explain what happens

## Target Audience

Both technical (developers integrating ImportCSV) and non-technical (business users configuring imports) users. The design must work for both.

## Design

### 1. Terminology Changes

Replace system-centric terms with source-based language that answers "where does this data come from?"

| Current Term | New Term | Rationale |
|--------------|----------|-----------|
| Context columns | **From your app** | Clear source — values passed via context prop |
| Importable columns | **From CSV** | Clear source — mapped from uploaded file |
| Hidden columns | **Auto-generated** | Describes behavior (id, created_at, etc.) |

### 2. Progressive Disclosure Hierarchy

#### Level 0 — Summary (Default View)

```
┌─────────────────────────────────────────────────────────────────┐
│  Data Destination                                               │
│                                                                 │
│  Integration          Destination Table                         │
│  [Prod Supabase ▾]    [imports ▾]                   ↻ Refresh  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Ready to import schema                                         │
│                                                                 │
│  • 2 columns from CSV                                           │
│  • 1 column from your app                                       │
│  • 2 auto-generated                                             │
│                                                                 │
│  ▸ Preview columns                                              │
│                                                                 │
│                                        [Import Schema]          │
└─────────────────────────────────────────────────────────────────┘
```

- Summary counts only — enough to act
- Most users click [Import Schema] without expanding
- No types, nullable, or other technical details

#### Level 1 — Column Preview (On Expand)

```
│  ▾ Preview columns                                              │
│                                                                 │
│  From CSV              From your app         Auto-generated     │
│  ─────────────         ──────────────        ──────────────     │
│  asset_name            user_id               id                 │
│  asset_type                                  created_at         │
│                                                                 │
│                        ▸ How to pass this                       │
```

- Shows actual column names grouped by source
- Three-column layout for visual separation
- Developer hint expandable

#### Level 2 — Developer Details (Nested Expand)

```
│                        ▾ How to pass this                       │
│                                                                 │
│                        Pass via context prop:                   │
│                        ┌────────────────────────────────┐       │
│                        │ <CSVImporter                   │       │
│                        │   context={{ user_id: "..." }} │       │
│                        │ />                             │       │
│                        └────────────────────────────────┘       │
```

- Code snippet for developers
- Only visible after two expand actions
- Non-technical users never see this

### 3. Import Confirmation Flow

When user clicks [Import Schema], show confirmation modal:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Import schema from "imports"?                                  │
│                                                                 │
│  This will set up your importer with:                           │
│                                                                 │
│  From CSV (users will map these)                                │
│  • asset_name                                                   │
│  • asset_type                                                   │
│                                                                 │
│  From your app (you'll pass these)                              │
│  • user_id (required)                                           │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ ℹ️ This replaces your current column configuration     │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│                          [Cancel]    [Import Schema]            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Full replace with confirmation (simple, predictable)
- Shows exactly what will be created before committing
- Info note only appears if existing columns will be replaced
- For fresh importers: "This will create your column configuration"

### 4. Post-Import State

```
┌─────────────────────────────────────────────────────────────────┐
│  Data Destination                                               │
│                                                                 │
│  Integration          Destination Table                         │
│  [Prod Supabase ▾]    [imports ▾]                   ↻ Refresh  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✓ Schema imported                                              │
│                                                                 │
│  • 2 columns from CSV                                           │
│  • 1 column from your app                                       │
│  • 2 auto-generated                                             │
│                                                                 │
│  ▸ Preview columns                                              │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Next: Configure column mapping in the Columns tab       │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│                                        [Re-import Schema]       │
└─────────────────────────────────────────────────────────────────┘
```

- Success indicator: "✓ Schema imported"
- Next step hint guides user forward
- Button changes to "Re-import Schema" for clarity
- Selecting different table resets to "Ready to import" state

### 5. Simplifications

- **No inline reconfiguration** — If users need to override auto-detected categories, they customize in the Columns tab after import
- **No types/nullable in default view** — Technical details hidden unless expanded
- **No banner** — The summary IS the information, not a notification about it
- **Schema import is a starting point** — Not the final word; further customization happens in Columns tab

## Implementation Notes

### Files to Modify

**Admin UI:**
- `admin/src/components/DestinationSelector.tsx` — Main component to redesign
- May need new sub-components for progressive disclosure

**Backend:**
- No changes needed — already returns categorized columns correctly
- Terminology is UI-only change

### Terminology Mapping

In code, we keep existing terms but display different labels:

| Code/API Term | Display Label |
|---------------|---------------|
| `context_columns` | "From your app" |
| `mapped_columns` | "From CSV" |
| `hidden_columns` | "Auto-generated" |

### Component Structure

```
<DestinationSelector>
  <IntegrationSelector />
  <TableSelector />
  <SchemaPreview>           <!-- New component -->
    <SchemaSummary />       <!-- Level 0: counts -->
    <ColumnPreview />       <!-- Level 1: names, collapsible -->
    <DeveloperHints />      <!-- Level 2: code snippet, nested collapsible -->
  </SchemaPreview>
  <ImportButton />
</DestinationSelector>

<ImportConfirmationModal>   <!-- New component -->
  <ColumnSummary />
  <ReplaceWarning />        <!-- Conditional -->
</ImportConfirmationModal>
```

## Success Criteria

1. Users understand the column categorization without explanation
2. Non-technical users can complete import without seeing code snippets
3. Developers find the context prop guidance without searching docs
4. Import action consequences are clear before committing
