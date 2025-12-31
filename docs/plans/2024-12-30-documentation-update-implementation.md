# Documentation Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update ImportCSV documentation to serve library users and cloud users, de-emphasize self-hosting docs, expand AI features, and fix broken links.

**Architecture:** Move backend docs to new self-hosting section, expand AI features with practical guidance, update navigation and redirects, fix broken /advanced/performance links.

**Tech Stack:** Fumadocs (Next.js-based docs), MDX, meta.json for navigation

---

## Task 1: Create Self-Hosting Section Structure

**Files:**
- Create: `docs/content/docs/self-hosting/meta.json`
- Create: `docs/content/docs/self-hosting/index.mdx`

**Step 1: Create self-hosting directory**

```bash
mkdir -p docs/content/docs/self-hosting
```

**Step 2: Create meta.json for self-hosting section**

Create file `docs/content/docs/self-hosting/meta.json`:

```json
{
  "title": "Self-Hosting",
  "pages": [
    "index",
    "getting-started",
    "comparison",
    "api-reference",
    "admin-dashboard"
  ]
}
```

**Step 3: Create index.mdx for self-hosting section**

Create file `docs/content/docs/self-hosting/index.mdx`:

```mdx
---
title: Self-Hosting ImportCSV
description: Deploy ImportCSV backend on your own infrastructure
---

# Self-Hosting

<Callout type="info">
**Most users don't need this.** The [cloud offering](https://importcsv.dev) provides AI features, admin dashboard, and managed infrastructure without any setup.
</Callout>

This section is for teams who want to self-host the ImportCSV backend on their own infrastructure.

## When to Self-Host

- You need data to stay on your own servers
- You have specific compliance requirements
- You want to customize the backend behavior

## What You'll Deploy

- **FastAPI Backend** - Handles imports, validation, webhooks
- **Admin Dashboard** - Next.js app for managing importers
- **PostgreSQL** - Stores importer configurations and import history
- **Redis** - Job queue for background processing

## Getting Started

<Cards>
  <Card
    title="Quick Start"
    href="/self-hosting/getting-started"
    description="Set up the backend and admin dashboard"
  />
  <Card
    title="Backend vs Cloud"
    href="/self-hosting/comparison"
    description="Compare approaches"
  />
  <Card
    title="API Reference"
    href="/self-hosting/api-reference"
    description="Backend API documentation"
  />
  <Card
    title="Admin Dashboard"
    href="/self-hosting/admin-dashboard"
    description="Managing importers"
  />
</Cards>
```

**Step 4: Commit**

```bash
git add docs/content/docs/self-hosting/
git commit -m "docs: create self-hosting section structure"
```

---

## Task 2: Move Backend Files to Self-Hosting

**Files:**
- Move: `docs/content/docs/advanced/backend/*.mdx` → `docs/content/docs/self-hosting/`
- Delete: `docs/content/docs/advanced/backend/` (after moving)

**Step 1: Move the backend files**

```bash
mv docs/content/docs/advanced/backend/getting-started.mdx docs/content/docs/self-hosting/
mv docs/content/docs/advanced/backend/comparison.mdx docs/content/docs/self-hosting/
mv docs/content/docs/advanced/backend/api-reference.mdx docs/content/docs/self-hosting/
mv docs/content/docs/advanced/backend/admin-dashboard.mdx docs/content/docs/self-hosting/
```

**Step 2: Remove old backend directory**

```bash
rm -rf docs/content/docs/advanced/backend
```

**Step 3: Commit**

```bash
git add -A
git commit -m "docs: move backend docs to self-hosting section"
```

---

## Task 3: Update Navigation Configuration

**Files:**
- Modify: `docs/content/docs/meta.json`
- Modify: `docs/content/docs/advanced/meta.json`

**Step 1: Update root meta.json to add self-hosting**

Edit `docs/content/docs/meta.json`:

```json
{
  "pages": [
    "index",
    "getting-started",
    "playground",
    "configuration",
    "advanced",
    "reference",
    "self-hosting"
  ]
}
```

**Step 2: Update advanced meta.json to remove backend**

Edit `docs/content/docs/advanced/meta.json`:

```json
{
  "title": "Advanced",
  "pages": [
    "headless",
    "ai-features",
    "handling-large-files"
  ]
}
```

**Step 3: Commit**

```bash
git add docs/content/docs/meta.json docs/content/docs/advanced/meta.json
git commit -m "docs: update navigation for self-hosting section"
```

---

## Task 4: Add Redirects for Backend URLs

**Files:**
- Modify: `docs/next.config.mjs`

**Step 1: Update redirects in next.config.mjs**

Find the existing backend redirect block (around line 142-147):

```javascript
// Backend → Advanced/Backend
{
  source: '/backend/:slug*',
  destination: '/advanced/backend/:slug*',
  permanent: true
},
```

Replace with:

```javascript
// Backend → Self-Hosting
{
  source: '/backend/:slug*',
  destination: '/self-hosting/:slug*',
  permanent: true
},
{
  source: '/advanced/backend',
  destination: '/self-hosting',
  permanent: true
},
{
  source: '/advanced/backend/:slug*',
  destination: '/self-hosting/:slug*',
  permanent: true
},
```

**Step 2: Fix the performance redirect**

Find (around line 131-135):

```javascript
{
  source: '/core-concepts/performance',
  destination: '/advanced/performance',
  permanent: true
},
```

Replace with:

```javascript
{
  source: '/core-concepts/performance',
  destination: '/advanced/handling-large-files',
  permanent: true
},
{
  source: '/advanced/performance',
  destination: '/advanced/handling-large-files',
  permanent: true
},
```

**Step 3: Commit**

```bash
git add docs/next.config.mjs
git commit -m "docs: add redirects for moved backend and performance pages"
```

---

## Task 5: Fix Broken Performance Links in Content

**Files:**
- Modify: `docs/content/docs/index.mdx`
- Modify: `docs/content/docs/reference/api.mdx`

**Step 1: Fix link in index.mdx**

In `docs/content/docs/index.mdx`, find (around line 71):

```mdx
<Card title="⚡ 10k+ Rows Support" href="/advanced/performance" description="Virtual scrolling and progressive validation" />
```

Replace with:

```mdx
<Card title="⚡ 10k+ Rows Support" href="/advanced/handling-large-files" description="Virtual scrolling and progressive validation" />
```

**Step 2: Fix link in api.mdx**

In `docs/content/docs/reference/api.mdx`, find (around line 411):

```mdx
See the [Performance Guide](/advanced/performance) for detailed information.
```

Replace with:

```mdx
See the [Handling Large Files](/advanced/handling-large-files) guide for detailed information.
```

**Step 3: Commit**

```bash
git add docs/content/docs/index.mdx docs/content/docs/reference/api.mdx
git commit -m "docs: fix broken /advanced/performance links"
```

---

## Task 6: Expand AI Features Page

**Files:**
- Modify: `docs/content/docs/advanced/ai-features.mdx`

**Step 1: Rewrite ai-features.mdx with expanded content**

Replace entire contents of `docs/content/docs/advanced/ai-features.mdx` with:

```mdx
---
title: AI-Powered Features
description: Smart column mapping and natural language data transformations
---

ImportCSV includes AI features that make data imports faster and more accurate. These features require connecting to the cloud backend.

## Smart Column Mapping

When users upload a CSV, the importer automatically suggests which columns map to your schema fields.

### How It Works

1. **Instant suggestions** - Column names are matched using similarity (e.g., "Email Address" → `email`)
2. **AI enhancement** - Cloud AI analyzes column names and sample data for smarter matches
3. **Confidence indicators** - High-confidence matches show a checkmark; users can always adjust

### What Users See

- Suggested mappings appear automatically after upload
- High-confidence suggestions are pre-selected
- Users can click any mapping to change it
- Unmapped columns are clearly indicated

### Graceful Fallback

If the cloud is unavailable or AI features aren't configured:
- String similarity matching still works
- Users can manually map all columns
- No errors shown - the experience degrades gracefully

## Natural Language Transformations

Fix validation errors and transform data using plain English prompts.

### The Transform Panel

When validation errors occur, users can open the Transform Panel to fix them:

1. **Click "Fix with AI"** in the validation step
2. **Describe the fix** - e.g., "Fix email addresses" or "Convert dates to YYYY-MM-DD"
3. **Review changes** - Each suggestion shows:
   - Original value → New value
   - Confidence indicator (high/medium)
4. **Select changes** - Check/uncheck individual fixes
5. **Apply** - Selected changes are applied to the data

### Common Prompts

The Transform Panel suggests common fixes:

- "Fix all email addresses"
- "Convert dates to YYYY-MM-DD format"
- "Format phone numbers as (XXX) XXX-XXXX"
- "Capitalize names"
- "Remove special characters"
- "Fill empty values with N/A"

### What AI Can Fix

**Works well:**
- Email format issues (missing @, typos in domains)
- Date format conversions (MM/DD/YYYY → YYYY-MM-DD)
- Phone number normalization
- Text case corrections
- Whitespace cleanup

**Still needs Zod transforms:**
- Complex business logic
- Custom calculations
- Data lookups or enrichment
- Conditional transformations

## Setup

### Cloud Mode (Recommended)

Connect to the cloud backend to enable AI features:

```tsx
import { CSVImporter } from '@importcsv/react';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional()
});

<CSVImporter
  schema={schema}
  backendUrl="https://api.importcsv.dev"
  importerKey="your-importer-key"
  onComplete={handleComplete}
/>
```

Get your importer key from the [ImportCSV dashboard](https://importcsv.dev).

### Local Mode

Without cloud connection, the importer still works:
- Column mapping uses string similarity (still helpful)
- Validation uses your Zod schema (full functionality)
- AI transformations are unavailable

```tsx
// Local mode - no backendUrl needed
<CSVImporter
  schema={schema}
  onComplete={handleComplete}
/>
```

## Best Practices

1. **Use clear column names in your schema** - AI works better when schema field names are descriptive (`customer_email` vs `field1`)

2. **Provide sample data in your schema descriptions** - Helps AI understand expected formats

3. **Combine with Zod transforms** - Use AI for user-facing fixes, Zod transforms for guaranteed formatting

4. **Test with real data** - Upload sample CSVs your users will actually import

## Next Steps

<Cards>
  <Card title="Schema Guide" href="/configuration/schemas" description="Define validation with Zod" />
  <Card title="Transformations" href="/configuration/transformations" description="Programmatic data transforms" />
  <Card title="Handling Large Files" href="/advanced/handling-large-files" description="Performance for big datasets" />
</Cards>
```

**Step 2: Commit**

```bash
git add docs/content/docs/advanced/ai-features.mdx
git commit -m "docs: expand AI features page with practical guidance"
```

---

## Task 7: Update Handling Large Files Page

**Files:**
- Modify: `docs/content/docs/advanced/handling-large-files.mdx`

**Step 1: Read current file to understand structure**

```bash
cat docs/content/docs/advanced/handling-large-files.mdx
```

**Step 2: Update handling-large-files.mdx to include performance section**

Ensure the file includes these sections (add if missing, keep existing content that's still relevant):

At the top after frontmatter, add/update intro:

```mdx
---
title: Handling Large Files
description: Performance optimizations for importing large datasets
---

ImportCSV automatically handles large files with optimizations that require no configuration.

## Automatic Optimizations

### Virtual Scrolling

Only ~20 rows are rendered in the DOM at any time, regardless of file size. Users can scroll through thousands of rows smoothly.

### Progressive Validation

- **First 50 rows**: Validated instantly on upload
- **Remaining rows**: Validated in background chunks of 100 rows
- **Progress indicator**: Shows validation progress for large files

### Memory Efficiency

Data is stored in memory-efficient structures. The browser can handle files much larger than a naive implementation would allow.

## What to Expect

| File Size | Experience |
|-----------|------------|
| Under 1,000 rows | Instant - validation completes immediately |
| 1,000 - 10,000 rows | Fast - brief validation progress shown |
| 10,000+ rows | Works well - may see loading states |
| 50,000+ rows | Consider chunking on your server |

## Tips for Best Performance

1. **Use built-in validators** - `z.string().email()` is faster than complex regex
2. **Keep transforms simple** - Chain fewer transformations when possible
3. **Consider server processing** - For 50k+ rows, chunk the file before importing

## Server-Side Chunking

For very large files, process in chunks:

```tsx
// Example: Split large file before import
async function handleLargeFile(file: File) {
  const CHUNK_SIZE = 10000;
  const text = await file.text();
  const lines = text.split('\n');
  const header = lines[0];

  for (let i = 1; i < lines.length; i += CHUNK_SIZE) {
    const chunk = [header, ...lines.slice(i, i + CHUNK_SIZE)].join('\n');
    await processChunk(chunk);
  }
}
```

## Next Steps

<Cards>
  <Card title="AI Features" href="/advanced/ai-features" description="Smart mapping and transforms" />
  <Card title="Headless Components" href="/advanced/headless" description="Custom UI with full control" />
</Cards>
```

**Step 3: Commit**

```bash
git add docs/content/docs/advanced/handling-large-files.mdx
git commit -m "docs: add performance section to handling-large-files"
```

---

## Task 8: Final Verification

**Step 1: Build docs to verify no errors**

```bash
cd docs && npm run build
```

Expected: Build completes without errors

**Step 2: Check for any remaining broken links**

```bash
grep -r "/advanced/performance" docs/content --include="*.mdx"
grep -r "/advanced/backend" docs/content --include="*.mdx"
```

Expected: No matches (all links updated)

**Step 3: Verify self-hosting section exists**

```bash
ls -la docs/content/docs/self-hosting/
```

Expected: Shows index.mdx, getting-started.mdx, comparison.mdx, api-reference.mdx, admin-dashboard.mdx

**Step 4: Final commit if any fixes needed**

```bash
git status
# If clean, skip. Otherwise:
git add -A
git commit -m "docs: fix remaining issues from verification"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Create self-hosting section structure |
| 2 | Move backend files to self-hosting |
| 3 | Update navigation configuration |
| 4 | Add redirects for moved pages |
| 5 | Fix broken performance links in content |
| 6 | Expand AI features page |
| 7 | Update handling large files page |
| 8 | Final verification |

**Total commits:** 7-8 small, focused commits
