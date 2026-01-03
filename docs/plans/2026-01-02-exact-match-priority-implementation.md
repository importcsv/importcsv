# Exact Match Priority Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix auto-mapping so "Email" column maps to `email` field instead of "Email consent" stealing the match.

**Architecture:** Two-phase matching algorithm. Phase 1 finds exact matches (after normalizing underscores/spaces/case). Phase 2 falls back to existing fuzzy matching for remaining unmatched columns. Extracted into a separate utility module for testability.

**Tech Stack:** TypeScript, Vitest, Preact hooks

---

## Task 1: Create normalizeColumnName utility with tests

**Files:**
- Create: `frontend/src/importer/utils/columnMatching.ts`
- Create: `frontend/src/importer/utils/columnMatching.test.ts`

**Step 1: Write the failing tests for normalizeColumnName**

In `frontend/src/importer/utils/columnMatching.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { normalizeColumnName } from './columnMatching';

describe('normalizeColumnName', () => {
  it('converts to lowercase', () => {
    expect(normalizeColumnName('Email')).toBe('email');
    expect(normalizeColumnName('FIRST_NAME')).toBe('first name');
  });

  it('replaces underscores with spaces', () => {
    expect(normalizeColumnName('first_name')).toBe('first name');
    expect(normalizeColumnName('email_address')).toBe('email address');
  });

  it('trims whitespace', () => {
    expect(normalizeColumnName('  email  ')).toBe('email');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeColumnName('first   name')).toBe('first name');
  });

  it('handles combined normalization', () => {
    expect(normalizeColumnName('  First_Name  ')).toBe('first name');
    expect(normalizeColumnName('EMAIL__ADDRESS')).toBe('email address');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- src/importer/utils/columnMatching.test.ts`

Expected: FAIL with "Cannot find module './columnMatching'"

**Step 3: Write minimal implementation**

In `frontend/src/importer/utils/columnMatching.ts`:

```typescript
/**
 * Normalizes a column name for comparison:
 * - Lowercase
 * - Replace underscores with spaces
 * - Trim whitespace
 * - Collapse multiple spaces to single space
 */
export function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/_/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- src/importer/utils/columnMatching.test.ts`

Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add frontend/src/importer/utils/columnMatching.ts frontend/src/importer/utils/columnMatching.test.ts
git commit -m "feat(mapping): add normalizeColumnName utility for column matching"
```

---

## Task 2: Add isExactMatch utility with tests

**Files:**
- Modify: `frontend/src/importer/utils/columnMatching.ts`
- Modify: `frontend/src/importer/utils/columnMatching.test.ts`

**Step 1: Write the failing tests for isExactMatch**

Append to `frontend/src/importer/utils/columnMatching.test.ts`:

```typescript
import { normalizeColumnName, isExactMatch } from './columnMatching';

// ... existing tests ...

describe('isExactMatch', () => {
  it('matches identical strings', () => {
    expect(isExactMatch('email', 'email')).toBe(true);
    expect(isExactMatch('Email', 'email')).toBe(true);
  });

  it('matches with underscore/space normalization', () => {
    expect(isExactMatch('first_name', 'First Name')).toBe(true);
    expect(isExactMatch('email_address', 'Email Address')).toBe(true);
  });

  it('does not match partial strings', () => {
    expect(isExactMatch('Email', 'Email consent')).toBe(false);
    expect(isExactMatch('Email', 'Email Address')).toBe(false);
    expect(isExactMatch('email', 'email_consent')).toBe(false);
  });

  it('handles empty strings', () => {
    expect(isExactMatch('', '')).toBe(true);
    expect(isExactMatch('a', '')).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- src/importer/utils/columnMatching.test.ts`

Expected: FAIL with "isExactMatch is not exported"

**Step 3: Write minimal implementation**

Append to `frontend/src/importer/utils/columnMatching.ts`:

```typescript
/**
 * Checks if two column names are an exact match after normalization.
 */
export function isExactMatch(name1: string, name2: string): boolean {
  return normalizeColumnName(name1) === normalizeColumnName(name2);
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- src/importer/utils/columnMatching.test.ts`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add frontend/src/importer/utils/columnMatching.ts frontend/src/importer/utils/columnMatching.test.ts
git commit -m "feat(mapping): add isExactMatch utility"
```

---

## Task 3: Add findBestColumnMatches utility with tests

**Files:**
- Modify: `frontend/src/importer/utils/columnMatching.ts`
- Modify: `frontend/src/importer/utils/columnMatching.test.ts`

**Step 1: Write the failing tests for findBestColumnMatches**

Append to `frontend/src/importer/utils/columnMatching.test.ts`:

```typescript
import { normalizeColumnName, isExactMatch, findBestColumnMatches } from './columnMatching';

// ... existing tests ...

describe('findBestColumnMatches', () => {
  const templateColumns = [
    { id: 'email', label: 'Email' },
    { id: 'first_name', label: 'First Name' },
    { id: 'consent', label: 'Consent' },
  ];

  describe('exact match priority - the bug fix', () => {
    it('prefers exact match over fuzzy match for Email vs Email consent', () => {
      const sourceColumns = [
        { index: 0, name: 'Email consent' },
        { index: 1, name: 'Email' },
      ];

      const matches = findBestColumnMatches(sourceColumns, templateColumns);

      // "Email" (index 1) should match "email", not "Email consent" (index 0)
      expect(matches['email']).toBe(1);
    });

    it('prefers exact match regardless of source column order', () => {
      const sourceColumns = [
        { index: 0, name: 'Email' },
        { index: 1, name: 'Email consent' },
      ];

      const matches = findBestColumnMatches(sourceColumns, templateColumns);

      expect(matches['email']).toBe(0);
    });

    it('correctly maps Email column among many Email-prefixed columns', () => {
      const sourceColumns = [
        { index: 0, name: 'Email consent' },
        { index: 1, name: 'Email subscription status' },
        { index: 2, name: 'Email opt-in date' },
        { index: 3, name: 'Email' },
        { index: 4, name: 'First Name' },
      ];

      const matches = findBestColumnMatches(sourceColumns, templateColumns);

      expect(matches['email']).toBe(3);
      expect(matches['first_name']).toBe(4);
    });
  });

  describe('normalization in exact matches', () => {
    it('handles underscore/space normalization', () => {
      const sourceColumns = [
        { index: 0, name: 'first_name' },
      ];

      const matches = findBestColumnMatches(sourceColumns, templateColumns);

      expect(matches['first_name']).toBe(0);
    });
  });

  describe('fuzzy fallback', () => {
    it('falls back to fuzzy matching when no exact match exists', () => {
      const sourceColumns = [
        { index: 0, name: 'Email Address' },
      ];

      const matches = findBestColumnMatches(sourceColumns, templateColumns);

      expect(matches['email']).toBe(0);
    });

    it('does not match columns that are too dissimilar', () => {
      const sourceColumns = [
        { index: 0, name: 'Phone Number' },
      ];

      const matches = findBestColumnMatches(sourceColumns, templateColumns);

      expect(matches['email']).toBeUndefined();
    });
  });

  describe('constraint: each source maps to at most one template', () => {
    it('first template wins when source could match multiple', () => {
      const duplicateTemplates = [
        { id: 'email1', label: 'Email' },
        { id: 'email2', label: 'Email' },
      ];
      const sourceColumns = [
        { index: 0, name: 'Email' },
      ];

      const matches = findBestColumnMatches(sourceColumns, duplicateTemplates);

      const mappedTemplates = Object.keys(matches);
      expect(mappedTemplates.length).toBe(1);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- src/importer/utils/columnMatching.test.ts`

Expected: FAIL with "findBestColumnMatches is not exported"

**Step 3: Write minimal implementation**

Append to `frontend/src/importer/utils/columnMatching.ts`:

```typescript
import stringsSimilarity from './stringSimilarity';

interface SourceColumn {
  index: number;
  name: string;
}

interface TemplateColumn {
  id: string;
  label: string;
}

/**
 * Finds the best column matches using a two-phase approach:
 * 1. Exact matches (after normalization) - these take priority
 * 2. Fuzzy matches (similarity > 0.8) - fallback for remaining columns
 *
 * Returns a mapping of templateId -> sourceIndex
 */
export function findBestColumnMatches(
  sourceColumns: SourceColumn[],
  templateColumns: TemplateColumn[]
): Record<string, number> {
  const mappings: Record<string, number> = {};
  const usedSourceIndices = new Set<number>();

  // Phase 1: Exact matches (priority)
  for (const template of templateColumns) {
    for (const source of sourceColumns) {
      if (usedSourceIndices.has(source.index)) continue;

      if (isExactMatch(source.name, template.label)) {
        mappings[template.id] = source.index;
        usedSourceIndices.add(source.index);
        break;
      }
    }
  }

  // Phase 2: Fuzzy matches (fallback)
  for (const template of templateColumns) {
    if (mappings[template.id] !== undefined) continue;

    for (const source of sourceColumns) {
      if (usedSourceIndices.has(source.index)) continue;

      const similarity = stringsSimilarity(
        source.name.toLowerCase(),
        template.label.toLowerCase()
      );

      if (similarity > 0.8) {
        mappings[template.id] = source.index;
        usedSourceIndices.add(source.index);
        break;
      }
    }
  }

  return mappings;
}
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- src/importer/utils/columnMatching.test.ts`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add frontend/src/importer/utils/columnMatching.ts frontend/src/importer/utils/columnMatching.test.ts
git commit -m "feat(mapping): add findBestColumnMatches with exact match priority"
```

---

## Task 4: Integrate findBestColumnMatches into useMapColumnsTable

**Files:**
- Modify: `frontend/src/importer/features/map-columns/hooks/useMapColumnsTable.tsx`

**Step 1: Update imports**

At line 9, add import:

```typescript
import { findBestColumnMatches } from '../../../utils/columnMatching';
```

**Step 2: Replace the initial mappings logic**

Replace lines 50-86 (the `useState` initializer) with:

```typescript
const [values, setValues] = useState<{ [key: number]: TemplateColumnMapping }>(() => {
  const initialObject: { [key: number]: TemplateColumnMapping } = {};

  // Use the new two-phase matching algorithm
  const bestMatches = findBestColumnMatches(
    uploadColumns.map(uc => ({ index: uc.index, name: uc.name })),
    templateColumns.map(tc => ({ id: tc.id, label: tc.label }))
  );

  // Convert bestMatches (templateId -> sourceIndex) to our format (sourceIndex -> templateMapping)
  const sourceToTemplate: Record<number, string> = {};
  for (const [templateId, sourceIndex] of Object.entries(bestMatches)) {
    sourceToTemplate[sourceIndex] = templateId;
  }

  // Create initial mappings for all upload columns
  const initialMappings = uploadColumns.reduce((acc, uc) => {
    const matchedTemplateId = sourceToTemplate[uc.index];

    acc[uc.index] = {
      id: matchedTemplateId || "",
      include: !!matchedTemplateId,
      selected: true,
    };
    return acc;
  }, initialObject);

  return initialMappings;
});
```

**Step 3: Remove unused functions**

Remove the `checkSimilarity` function (lines 32-44) and `isSuggestedMapping` function (lines 46-48) as they are no longer used.

**Step 4: Run all tests to verify nothing broke**

Run: `cd frontend && npm test`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add frontend/src/importer/features/map-columns/hooks/useMapColumnsTable.tsx
git commit -m "refactor(mapping): integrate findBestColumnMatches for exact match priority

Fixes #15 - Email consent no longer incorrectly maps to Email field"
```

---

## Task 5: Manual verification

**Step 1: Start dev server**

Run: `cd frontend && npm run dev`

**Step 2: Test the bug scenario**

1. Open the importer
2. Upload a CSV with columns: `Email consent`, `Email subscription status`, `Email`, `First Name`
3. Define a schema with fields: `email`, `first_name`

**Step 3: Verify correct behavior**

Expected:
- `Email` column maps to `email` field ✅
- `Email consent` is NOT mapped ✅
- `First Name` maps to `first_name` field ✅

**Step 4: Test edge cases**

1. Upload CSV with only `Email Address` (no exact `Email`) → should fuzzy match to `email`
2. Upload CSV with `first_name` column → should exact match to `First Name` template

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | normalizeColumnName utility | `columnMatching.ts`, `columnMatching.test.ts` |
| 2 | isExactMatch utility | `columnMatching.ts`, `columnMatching.test.ts` |
| 3 | findBestColumnMatches utility | `columnMatching.ts`, `columnMatching.test.ts` |
| 4 | Integrate into useMapColumnsTable | `useMapColumnsTable.tsx` |
| 5 | Manual verification | - |

Total: 5 tasks, ~20 steps
