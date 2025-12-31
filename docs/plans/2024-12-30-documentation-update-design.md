# Documentation Update Design

**Date:** 2024-12-30
**Status:** Ready for implementation

## Context

Recent changes to the CSV importer include AI features, billing infrastructure, and UI refreshes. Documentation needs updating to reflect current state and better serve the primary audiences.

## Target Audiences

1. **Embedded React Library Users** - Developers using `@importcsv/react` in their own apps
2. **Cloud Users** - Users connecting to the hosted cloud offering for AI features

Self-hosted backend users are secondary; those docs will be de-emphasized.

## Design Decisions

- **Billing/subscription:** Not documented (cloud implementation detail, handled in-app)
- **AI features:** Practical guidance level (what users experience, not implementation details)
- **Performance:** Merge into handling-large-files, keep simple
- **Backend docs:** Move to "Self-Hosting" section, de-emphasize in navigation

---

## Changes

### 1. Information Architecture

**Current → Proposed:**

```
advanced/
├── ai-features.mdx          # EXPAND
├── handling-large-files.mdx # MERGE performance content
├── headless.mdx             # unchanged
└── backend/                 # MOVE to self-hosting/
    ├── getting-started.mdx
    ├── admin-dashboard.mdx
    ├── api-reference.mdx
    └── comparison.mdx
```

Becomes:

```
advanced/
├── ai-features.mdx
├── handling-large-files.mdx
└── headless.mdx

self-hosting/               # NEW section, de-emphasized in nav
├── index.mdx               # Intro + "most users should use cloud"
├── getting-started.mdx
├── admin-dashboard.mdx
├── api-reference.mdx
└── comparison.mdx
```

### 2. AI Features Page Expansion

**File:** `advanced/ai-features.mdx`

Add sections:

1. **How Smart Mapping Works**
   - Two phases: instant suggestions + AI enhancement
   - High-confidence matches auto-applied (with indicator)
   - Users can override any suggestion
   - Graceful fallback if cloud unavailable

2. **Transform Panel Guide**
   - When it appears (validation step)
   - Two modes: fix errors vs. general transformations
   - Confidence indicators (high/medium)
   - Select/deselect changes before applying
   - Common prompt examples

3. **What to Expect**
   - Works best with clear column names + sample data
   - Handles: emails, dates, phones, text normalization
   - Complex logic still needs Zod transforms

### 3. Handling Large Files + Performance Merge

**File:** `advanced/handling-large-files.mdx`

Ensure page covers:

1. **Automatic optimizations**
   - Virtual scrolling (~20 rows in DOM)
   - Progressive validation (50 instant, rest in chunks)

2. **What to expect by size**
   - Under 1k: instant
   - 1k-10k: works great
   - 10k+: works, consider server-side for production

3. **Tips** (keep brief)
   - Prefer built-in validators
   - Keep transforms short

### 4. Fix Broken Links

Update `/advanced/performance` → `/advanced/handling-large-files` in:
- `index.mdx`
- `reference/api.mdx`
- Any other files referencing this path

### 5. Move Backend → Self-Hosting

1. Create `self-hosting/` directory
2. Move files from `advanced/backend/`
3. Add intro note to index: "For teams who want to self-host. Most users should use the cloud offering."
4. Update navigation (`meta.json`) to de-emphasize
5. Update internal links

---

## Implementation Order

1. Move backend → self-hosting (structural change first)
2. Update navigation
3. Fix broken performance links
4. Expand AI features page
5. Review/update handling-large-files page

## Out of Scope

- Billing/subscription documentation
- Onboarding checklist documentation
- Deep implementation details (BAML, thresholds, etc.)
- Backend API changes
