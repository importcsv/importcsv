# Exact Match Priority for Auto-Mapping

**Issue:** [#15](https://github.com/importcsv/importcsv/issues/15)
**Date:** 2026-01-02
**Status:** Draft

## Problem

The auto-mapping algorithm incorrectly matches columns like "Email consent" to the "Email" destination field. This happens because the current algorithm uses word-level similarity matching — if any word matches well, the whole column is considered a match.

This particularly affects users importing marketing data (Klaviyo, Mailchimp) where multiple columns contain "Email" in their names but only one is the actual email address.

## Solution

Prioritize exact matches before falling back to fuzzy matching.

**Two-phase approach:**
1. **Phase 1 (Exact):** Find source columns that exactly match destination fields (after normalization)
2. **Phase 2 (Fuzzy):** For remaining unmatched fields, use current similarity algorithm

## Normalization Rules

Before comparing for exact match:
1. Lowercase both strings
2. Replace underscores with spaces
3. Trim whitespace
4. Collapse multiple spaces to single space

**Examples:**

| Source | Destination | Normalized | Exact Match? |
|--------|-------------|------------|--------------|
| `First Name` | `first_name` | `first name` = `first name` | ✅ |
| `EMAIL` | `email` | `email` = `email` | ✅ |
| `email_address` | `Email Address` | `email address` = `email address` | ✅ |
| `Email consent` | `email` | `email consent` ≠ `email` | ❌ (fuzzy fallback) |

## Algorithm

```
Input: sourceColumns[], templateColumns[]
Output: mappings { templateId → sourceIndex }

Phase 1 - Exact Matches:
  usedSources = Set()
  mappings = {}

  For each template in templateColumns:
    For each source in sourceColumns:
      If source not in usedSources:
        If normalize(source.name) === normalize(template.label):
          mappings[template.id] = source.index
          usedSources.add(source.index)
          break

Phase 2 - Fuzzy Matches:
  For each template in templateColumns:
    If template.id not in mappings:
      For each source in sourceColumns:
        If source not in usedSources:
          If stringSimilarity(source.name, template.label) > 0.8:
            mappings[template.id] = source.index
            usedSources.add(source.index)
            break

Return mappings
```

## Files to Modify

| File | Change |
|------|--------|
| `frontend/src/importer/utils/columnMatching.ts` | New file: `normalizeColumnName()`, `isExactMatch()`, `findBestColumnMatches()` |
| `frontend/src/importer/utils/columnMatching.test.ts` | New file: unit tests |
| `frontend/src/importer/features/map-columns/hooks/useMapColumnsTable.tsx` | Replace inline matching logic with `findBestColumnMatches()` |

## Test Cases

### Normalization
- Converts to lowercase
- Replaces underscores with spaces
- Trims whitespace
- Collapses multiple spaces

### Exact Match
- Matches identical strings (case-insensitive)
- Matches with underscore/space normalization (`first_name` ↔ `First Name`)
- Does NOT match partial strings (`Email` ↔ `Email consent`)

### Integration (the bug scenario)
- Source: `["Email consent", "Email subscription status", "Email opt-in date", "Email", "First Name"]`
- Template: `[{id: "email", label: "Email"}, {id: "first_name", label: "First Name"}]`
- Expected: `email` maps to index 3 (`Email`), `first_name` maps to index 4

### Edge Cases
- First exact match wins when multiple sources match same template
- Each source can only map to one template
- Falls back to fuzzy when no exact match exists
- Does not match dissimilar columns even in fuzzy phase

## Constraints

- No changes to backend
- No data inspection (frontend only)
- Preserve existing fuzzy matching as fallback
- No breaking changes to public API

## Out of Scope

- Type-aware matching (requires data inspection)
- User-configurable sensitivity thresholds
- Schema-defined aliases
