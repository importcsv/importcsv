# Context Prop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify `user` and `metadata` props into a single `context` prop that flows through to webhooks, supporting both React component and iframe embed integrations.

**Architecture:** Replace separate `user` and `metadata` props with a single `context` prop in the React component. For iframe embeds, parse query params (excluding reserved ones) into a `context` object. The `context` flows through the API and appears in all webhook payloads.

**Tech Stack:** React/Preact (frontend), FastAPI/Pydantic (backend), Next.js (admin)

---

## Task 1: Update Frontend Types

**Files:**
- Modify: `frontend/src/types/index.ts:94-95`

**Step 1: Write the failing test**

No test file exists for types. Skip to implementation.

**Step 2: Replace user/metadata with context prop**

```typescript
// In CSVImporterProps, replace lines 94-95:
// OLD:
//   user?: Record<string, any>;  // User context for backend
//   metadata?: Record<string, any>; // Additional data

// NEW:
  context?: Record<string, any>;  // Custom context passed to webhooks
```

**Step 3: Run typecheck to verify**

Run: `cd frontend && npm run typecheck`
Expected: Errors about `user` and `metadata` no longer existing (this is expected - we'll fix in next tasks)

**Step 4: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "$(cat <<'EOF'
feat(frontend): replace user/metadata props with unified context prop

BREAKING CHANGE: `user` and `metadata` props are replaced by single `context` prop
EOF
)"
```

---

## Task 2: Update CSVImporter Component

**Files:**
- Modify: `frontend/src/components/CSVImporter/index.tsx:39-40, 155-156`

**Step 1: Update prop destructuring**

Replace lines 39-40:
```typescript
// OLD:
//     user,
//     metadata,

// NEW:
    context,
```

**Step 2: Update Importer component props**

Replace lines 155-156:
```typescript
// OLD:
//         user={user}
//         metadata={metadata}

// NEW:
        context={context}
```

**Step 3: Run typecheck**

Run: `cd frontend && npm run typecheck`
Expected: Errors in main/index.tsx (expected - fix in next task)

**Step 4: Commit**

```bash
git add frontend/src/components/CSVImporter/index.tsx
git commit -m "feat(frontend): update CSVImporter to use context prop"
```

---

## Task 3: Update Main Importer Feature

**Files:**
- Modify: `frontend/src/importer/features/main/index.tsx:55-56, 377-378`

**Step 1: Update prop destructuring**

Replace lines 55-56:
```typescript
// OLD:
//     user,
//     metadata,

// NEW:
    context,
```

**Step 2: Update API payload**

Replace lines 377-378:
```typescript
// OLD:
//       user: user || {},
//       metadata: metadata || {},

// NEW:
      context: context || {},
```

**Step 3: Run typecheck**

Run: `cd frontend && npm run typecheck`
Expected: PASS (all frontend type errors resolved)

**Step 4: Run frontend tests**

Run: `cd frontend && npm test`
Expected: PASS

**Step 5: Commit**

```bash
git add frontend/src/importer/features/main/index.tsx
git commit -m "feat(frontend): update main importer to send context in API payload"
```

---

## Task 4: Update Backend Request Schema

**Files:**
- Modify: `backend/app/schemas/import_job.py:93-94`

**Step 1: Replace user/metadata with context**

Replace lines 93-94:
```python
# OLD:
#     user: Dict[str, Any] = {}
#     metadata: Dict[str, Any] = {}

# NEW:
    context: Dict[str, Any] = {}
```

**Step 2: Run backend linter**

Run: `cd backend && uv run ruff check app/schemas/import_job.py`
Expected: PASS

**Step 3: Commit**

```bash
git add backend/app/schemas/import_job.py
git commit -m "feat(backend): replace user/metadata with context in request schema"
```

---

## Task 5: Update Backend API Endpoint

**Files:**
- Modify: `backend/app/api/v1/imports.py:212-213, 257-259`

**Step 1: Update data extraction**

Replace lines 212-213:
```python
# OLD:
#     user_data = request.user
#     metadata = request.metadata

# NEW:
    context = request.context
```

**Step 2: Update webhook payload**

Replace lines 257-259:
```python
# OLD:
#         webhook_payload = {
#             "user": user_data or {},
#             "metadata": metadata or {},
#             "source": "api",
#         }

# NEW:
        webhook_payload = {
            "context": context or {},
            "source": "api",
        }
```

**Step 3: Run backend linter**

Run: `cd backend && uv run ruff check app/api/v1/imports.py`
Expected: PASS

**Step 4: Commit**

```bash
git add backend/app/api/v1/imports.py
git commit -m "feat(backend): update API to use context in webhook payload"
```

---

## Task 6: Update Import Service Completion Webhook

**Files:**
- Modify: `backend/app/services/import_service.py:337-351`

**Step 1: Add context to completion webhook payload**

After line 350 (`"error_count": import_job.error_count,`), add:
```python
                # Include context from the import job's file_metadata if available
                # Context is stored in file_metadata during job creation
                "context": import_job.file_metadata.get("context", {}) if import_job.file_metadata else {},
```

**Step 2: Run backend linter**

Run: `cd backend && uv run ruff check app/services/import_service.py`
Expected: PASS

**Step 3: Commit**

```bash
git add backend/app/services/import_service.py
git commit -m "feat(backend): include context in completion webhook payload"
```

---

## Task 7: Store Context in Import Job

**Files:**
- Modify: `backend/app/api/v1/imports.py:238-252`

**Step 1: Store context in file_metadata when creating import job**

After line 249 (`error_count=len(invalid_data),`), add:
```python
        file_metadata={"context": context or {}},
```

**Step 2: Run backend linter**

Run: `cd backend && uv run ruff check app/api/v1/imports.py`
Expected: PASS

**Step 3: Run backend tests**

Run: `cd backend && uv run pytest tests/ -v -k import`
Expected: PASS (or update tests if they reference user/metadata)

**Step 4: Commit**

```bash
git add backend/app/api/v1/imports.py
git commit -m "feat(backend): store context in import job file_metadata"
```

---

## Task 8: Parse Query Params in Embed Page

**Files:**
- Modify: `admin/src/app/embed/[key]/page.tsx:96-117`
- Modify: `admin/src/types/embed.ts` (add context to EmbedQueryParams if needed)

**Step 1: Define reserved params constant**

Add after line 21 (after isValidUUID function):
```typescript
/**
 * Reserved query params that are NOT passed to context.
 * These are used for embed configuration only.
 */
const RESERVED_PARAMS = ['theme', 'primaryColor', 'returnData', 'hideHeader', 'origin'];
```

**Step 2: Extract context from query params**

After line 117 (after embedParams definition), add:
```typescript
  // Extract context from remaining query params (exclude reserved ones)
  const context: Record<string, string> = {};
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (!RESERVED_PARAMS.includes(key) && typeof value === 'string') {
      context[key] = value;
    }
  }
```

**Step 3: Pass context to EmbedClient**

Update the EmbedClient component call (around line 120-125):
```typescript
  return (
    <EmbedClient
      importerKey={key}
      params={embedParams}
      targetOrigin={originParam || undefined}
      context={context}
    />
  );
```

**Step 4: Run admin linter**

Run: `cd admin && npm run lint`
Expected: Error about context prop not existing on EmbedClient (expected - fix in next task)

**Step 5: Commit**

```bash
git add admin/src/app/embed/[key]/page.tsx
git commit -m "feat(admin): parse query params into context for embed"
```

---

## Task 9: Update EmbedClient to Pass Context

**Files:**
- Modify: `admin/src/app/embed/[key]/EmbedClient.tsx:19-29, 115-124`

**Step 1: Add context to props interface**

Update EmbedClientProps (lines 19-23):
```typescript
interface EmbedClientProps {
  importerKey: string;
  params: EmbedQueryParams;
  targetOrigin?: string;
  context?: Record<string, string>;
}
```

**Step 2: Destructure context prop**

Update component signature (lines 25-29):
```typescript
export default function EmbedClient({
  importerKey,
  params,
  targetOrigin,
  context,
}: EmbedClientProps) {
```

**Step 3: Pass context to CSVImporter**

Update CSVImporter component (lines 115-124):
```typescript
      <CSVImporter
        isModal={false}
        darkMode={darkMode}
        primaryColor={primaryColor}
        showDownloadTemplateButton={true}
        skipHeaderRowSelection={false}
        importerKey={importerKey}
        backendUrl={backendUrl}
        onComplete={handleComplete}
        context={context}
      />
```

**Step 4: Run admin linter and build**

Run: `cd admin && npm run lint && npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add admin/src/app/embed/[key]/EmbedClient.tsx
git commit -m "feat(admin): pass context to CSVImporter in embed"
```

---

## Task 10: Update Documentation Examples

**Files:**
- Modify: `admin/src/components/EmbedSection.tsx:39-41, 58-59`

**Step 1: Update React code example**

Replace lines 39-41:
```typescript
// OLD:
//       user={{ userId: "YOUR_USER_ID" }}
//       metadata={{ source: "YOUR_APP" }}

// NEW:
      context={{ userId: "YOUR_USER_ID", source: "YOUR_APP" }}
```

**Step 2: Update script tag example**

Replace lines 58-59:
```typescript
// OLD:
//     user: { userId: 'YOUR_USER_ID' },
//     metadata: { source: 'YOUR_APP' }

// NEW:
    context: { userId: 'YOUR_USER_ID', source: 'YOUR_APP' }
```

**Step 3: Run admin build**

Run: `cd admin && npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add admin/src/components/EmbedSection.tsx
git commit -m "docs(admin): update embed examples to use context prop"
```

---

## Task 11: Rebuild Frontend and Push to Admin

**Step 1: Rebuild frontend package**

Run: `cd frontend && npm run build`
Expected: PASS

**Step 2: Publish to yalc**

Run: `cd frontend && npm run yalc:publish`
Expected: PASS

**Step 3: Update admin's copy**

Run: `cd admin && npm run yalc:update`
Expected: PASS

**Step 4: Verify admin builds with new frontend**

Run: `cd admin && npm run build`
Expected: PASS

**Step 5: Commit yalc updates if any**

```bash
git add -A
git commit -m "chore: update frontend package in admin"
```

---

## Task 12: Integration Test

**Step 1: Start services**

Run: `docker-compose up -d`
Expected: All services start successfully

**Step 2: Verify embed with context query params**

Open in browser: `http://localhost:3000/embed/<YOUR_IMPORTER_KEY>?userId=test123&companyId=acme`

Expected: Importer loads without errors

**Step 3: Test import and check webhook**

Upload a CSV, complete the import, and verify the webhook payload includes:
```json
{
  "context": {
    "userId": "test123",
    "companyId": "acme"
  }
}
```

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: unified context prop for user/metadata

BREAKING CHANGE: Replaces \`user\` and \`metadata\` props with single \`context\` prop.

- React: <CSVImporter context={{ userId: '123' }} />
- Iframe: /embed/key?userId=123&companyId=acme

Context flows through to all webhook payloads (import.started, import.completed, import.failed)."
```

---

## Summary

| File | Change |
|------|--------|
| `frontend/src/types/index.ts` | Replace `user`/`metadata` with `context` |
| `frontend/src/components/CSVImporter/index.tsx` | Update prop handling |
| `frontend/src/importer/features/main/index.tsx` | Update API payload |
| `backend/app/schemas/import_job.py` | Update request schema |
| `backend/app/api/v1/imports.py` | Update endpoint + store context |
| `backend/app/services/import_service.py` | Include context in completion webhook |
| `admin/src/app/embed/[key]/page.tsx` | Parse query params to context |
| `admin/src/app/embed/[key]/EmbedClient.tsx` | Pass context to CSVImporter |
| `admin/src/components/EmbedSection.tsx` | Update doc examples |
