# Validation Step (Step 3) Design Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update Step 3 (Validation) to match the modern design system established in Steps 1 and 2 of the CSV importer.

**Architecture:** This is a pure styling refactor with no logic changes. We update color palette from `gray-*` to `slate-*`, add subtle shadows and gradients, modernize filter tabs to pill style, and ensure consistent table styling across VirtualTable component.

**Tech Stack:** Preact, Tailwind CSS, existing design tokens

---

## Task 1: Update VirtualTable Component Styling

**Files:**
- Modify: `frontend/src/importer/components/VirtualTable/index.tsx`

**Step 1: Update sticky header styling**

Change line 56 from:
```tsx
className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-20 overflow-hidden"
```

To:
```tsx
className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-20 overflow-hidden"
```

**Step 2: Update header row number cell styling**

Change lines 62-63 from:
```tsx
className="text-left px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-50 border-r border-gray-200"
```

To:
```tsx
className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-r border-slate-200"
```

**Step 3: Update header column cells styling**

Change lines 77-78 from:
```tsx
className="text-left px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-50"
```

To:
```tsx
className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80"
```

**Step 4: Update row styling**

Change line 116-117 from:
```tsx
className={cn(
  "flex border-b border-gray-200 hover:bg-gray-50 transition-colors",
  rowClassName
)}
```

To:
```tsx
className={cn(
  "flex border-b border-slate-100 hover:bg-blue-50/50 transition-colors",
  rowClassName
)}
```

**Step 5: Update sticky row number cell background colors**

Change line 136-137 from:
```tsx
backgroundColor: rowClassName.includes('bg-red-50') ? '#FEF2F2' : '#F9FAFB',
```

To:
```tsx
backgroundColor: rowClassName.includes('bg-red-50') ? '#FEF2F2' : '#F8FAFC',
```

And update the className on line 131 from:
```tsx
className="px-6 py-3 text-sm text-gray-700 border-r border-gray-200 flex items-center"
```

To:
```tsx
className="px-6 py-3 text-sm text-slate-600 border-r border-slate-200 flex items-center"
```

**Step 6: Verify changes visually**

Run the dev server and navigate to Step 3 (Validation) to verify table header and row styling matches Step 2.

**Step 7: Commit**

```bash
git add frontend/src/importer/components/VirtualTable/index.tsx
git commit -m "style(VirtualTable): update to slate color palette for consistency"
```

---

## Task 2: Update Validation Table Container Styling

**Files:**
- Modify: `frontend/src/importer/features/validation/Validation.tsx`

**Step 1: Update table container**

Change line 549 from:
```tsx
<div className="h-full overflow-x-auto border border-gray-200 rounded-lg" ref={scrollableSectionRef}>
```

To:
```tsx
<div className="h-full overflow-x-auto border border-slate-200 rounded-xl bg-gradient-to-b from-white to-slate-50/50 shadow-sm" ref={scrollableSectionRef}>
```

**Step 2: Verify changes visually**

Confirm the table container now has rounded-xl corners, subtle shadow, and gradient background matching Step 2.

**Step 3: Commit**

```bash
git add frontend/src/importer/features/validation/Validation.tsx
git commit -m "style(validation): update table container with rounded-xl and shadow"
```

---

## Task 3: Update Filter Tabs to Modern Pill Style

**Files:**
- Modify: `frontend/src/importer/features/validation/Validation.tsx`

**Step 1: Update "All" filter tab styling**

Change lines 478-489 from:
```tsx
<button
  type="button"
  className={cn(
    "px-4 py-2 rounded-md transition-all",
    designTokens.typography.body,
    filterMode === 'all'
      ? 'bg-blue-50 text-blue-700 border-2 border-blue-500 font-medium'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
  )}
  onClick={() => setFilterMode('all')}
>
  All <span className={cn("ml-2 px-2 py-0.5 rounded-full", designTokens.typography.caption, filterMode === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200')}>{dataRows.length}</span>
</button>
```

To:
```tsx
<button
  type="button"
  className={cn(
    "px-4 py-2 rounded-lg transition-all",
    designTokens.typography.body,
    filterMode === 'all'
      ? 'bg-slate-100 text-slate-900 border border-slate-300 font-medium shadow-sm'
      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
  )}
  onClick={() => setFilterMode('all')}
>
  All <span className={cn("ml-2 px-2 py-0.5 rounded-full text-xs font-medium", filterMode === 'all' ? 'bg-white text-slate-700 shadow-sm' : 'bg-slate-200 text-slate-600')}>{dataRows.length}</span>
</button>
```

**Step 2: Update "Valid" filter tab styling**

Change lines 491-502 from:
```tsx
<button
  type="button"
  className={cn(
    "px-4 py-2 rounded-md transition-all",
    designTokens.typography.body,
    filterMode === 'valid'
      ? 'bg-blue-50 text-blue-700 border-2 border-blue-500 font-medium'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
  )}
  onClick={() => setFilterMode('valid')}
>
  Valid <span className={cn("ml-2 px-2 py-0.5 rounded-full", designTokens.typography.caption, filterMode === 'valid' ? 'bg-green-100 text-green-700' : 'bg-green-100 text-green-700')}>{validCount}</span>
</button>
```

To:
```tsx
<button
  type="button"
  className={cn(
    "px-4 py-2 rounded-lg transition-all",
    designTokens.typography.body,
    filterMode === 'valid'
      ? 'bg-slate-100 text-slate-900 border border-slate-300 font-medium shadow-sm'
      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
  )}
  onClick={() => setFilterMode('valid')}
>
  Valid <span className={cn("ml-2 px-2 py-0.5 rounded-full text-xs font-medium", filterMode === 'valid' ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-50 text-emerald-600')}>{validCount}</span>
</button>
```

**Step 3: Update "Error" filter tab styling**

Change lines 504-515 from:
```tsx
<button
  type="button"
  className={cn(
    "px-4 py-2 rounded-md transition-all",
    designTokens.typography.body,
    filterMode === 'error'
      ? 'bg-blue-50 text-blue-700 border-2 border-blue-500 font-medium'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
  )}
  onClick={() => setFilterMode('error')}
>
  Error <span className={cn("ml-2 px-2 py-0.5 rounded-full", designTokens.typography.caption, filterMode === 'error' ? 'bg-red-100 text-red-700' : 'bg-red-100 text-red-700')}>{errorCount}</span>
</button>
```

To:
```tsx
<button
  type="button"
  className={cn(
    "px-4 py-2 rounded-lg transition-all",
    designTokens.typography.body,
    filterMode === 'error'
      ? 'bg-slate-100 text-slate-900 border border-slate-300 font-medium shadow-sm'
      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent'
  )}
  onClick={() => setFilterMode('error')}
>
  Error <span className={cn("ml-2 px-2 py-0.5 rounded-full text-xs font-medium", filterMode === 'error' ? 'bg-red-100 text-red-700' : 'bg-red-50 text-red-600')}>{errorCount}</span>
</button>
```

**Step 4: Verify changes visually**

Navigate to Step 3 and verify filter tabs now have:
- Rounded-lg pill shape
- Subtle shadow on active state
- Consistent slate color palette
- Colored badges (emerald for valid, red for error)

**Step 5: Commit**

```bash
git add frontend/src/importer/features/validation/Validation.tsx
git commit -m "style(validation): modernize filter tabs with pill style"
```

---

## Task 4: Update Input Cell Styling

**Files:**
- Modify: `frontend/src/importer/features/validation/Validation.tsx`

**Step 1: Update input field styling in renderCell**

Change line 585 from:
```tsx
className={`w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
```

To:
```tsx
className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-colors ${error ? 'border-red-400 bg-red-50/70' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
```

**Step 2: Verify changes visually**

Confirm input fields now have:
- Rounded-lg corners
- Slate border colors
- Softer focus ring
- Subtle error state styling

**Step 3: Commit**

```bash
git add frontend/src/importer/features/validation/Validation.tsx
git commit -m "style(validation): update input cells with slate colors and rounded-lg"
```

---

## Task 5: Update Validation Progress Bar and Empty State

**Files:**
- Modify: `frontend/src/importer/features/validation/Validation.tsx`

**Step 1: Update progress bar background**

Change line 455 from:
```tsx
<div className="w-full bg-gray-200 rounded-full h-2">
```

To:
```tsx
<div className="w-full bg-slate-200 rounded-full h-2">
```

**Step 2: Update empty state text color**

Change line 604 from:
```tsx
<span className={cn(designTokens.typography.body, "text-gray-500")}>
```

To:
```tsx
<span className={cn(designTokens.typography.body, "text-slate-400")}>
```

**Step 3: Verify changes visually**

Test by filtering to show empty states and verify colors are consistent.

**Step 4: Commit**

```bash
git add frontend/src/importer/features/validation/Validation.tsx
git commit -m "style(validation): update progress bar and empty state to slate colors"
```

---

## Task 6: Update Error Row Highlighting

**Files:**
- Modify: `frontend/src/importer/features/validation/Validation.tsx`

**Step 1: Update error row class in getRowClassName**

Change lines 560-564 from:
```tsx
getRowClassName={(row, actualRowIdx) => {
  const displayRowIndex = actualRowIdx + headerRowIndex + 1;
  const rowHasError = errors.some(err => err.rowIndex === displayRowIndex);
  return rowHasError ? 'bg-red-50 hover:bg-red-100' : '';
}}
```

To:
```tsx
getRowClassName={(row, actualRowIdx) => {
  const displayRowIndex = actualRowIdx + headerRowIndex + 1;
  const rowHasError = errors.some(err => err.rowIndex === displayRowIndex);
  return rowHasError ? 'bg-red-50/70 hover:bg-red-100/70' : '';
}}
```

**Step 2: Verify changes visually**

Import a file with validation errors and confirm error rows have softer red highlighting.

**Step 3: Commit**

```bash
git add frontend/src/importer/features/validation/Validation.tsx
git commit -m "style(validation): soften error row highlighting"
```

---

## Task 7: Final Visual QA and Combined Commit

**Step 1: Run full visual QA**

1. Start dev server: `npm run dev` in frontend directory
2. Navigate through all 3 steps of the importer
3. Verify visual consistency:
   - Step 1: Reference for design (should be unchanged)
   - Step 2: Reference for design (should be unchanged)
   - Step 3: Should now match Steps 1 & 2 with:
     - Slate color palette throughout
     - Rounded-xl table container with shadow
     - Modern pill-style filter tabs
     - Consistent input styling
     - Softer error highlighting

**Step 2: Create summary commit if needed**

If all previous commits were made individually, skip this step. Otherwise:

```bash
git add -A
git commit -m "style(validation): complete design refresh to match Steps 1 & 2

- Update VirtualTable to slate color palette
- Add rounded-xl, shadow-sm, gradient to table container
- Modernize filter tabs with pill style
- Update input cells with slate colors
- Soften error row highlighting
- Update progress bar and empty states"
```

---

## Design Token Reference

For consistency, these are the key color mappings used:

| Old (gray) | New (slate) |
|------------|-------------|
| `gray-50` | `slate-50` |
| `gray-100` | `slate-100` |
| `gray-200` | `slate-200` |
| `gray-300` | `slate-300` |
| `gray-500` | `slate-500` |
| `gray-600` | `slate-600` |
| `gray-700` | `slate-700` |
| `gray-900` | `slate-900` |

Key styling patterns from Steps 1 & 2:
- Table containers: `border border-slate-200 rounded-xl bg-gradient-to-b from-white to-slate-50/50 shadow-sm`
- Headers: `bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider`
- Row borders: `border-b border-slate-100`
- Hover states: `hover:bg-blue-50/50`
