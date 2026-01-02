# Configure Import (Step 2) Design Refresh

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refresh Step 2 (Configure Import) to match the visual polish of the improved Step 1 (Upload) screen.

**Architecture:** Update styling in configure-import/index.tsx using existing Tailwind classes and design tokens. Add new CSS animations to index.css. No structural changes to component logic.

**Tech Stack:** Preact, Tailwind CSS, Lucide icons

---

## Task 1: Update Container Styling

**Files:**
- Modify: `frontend/src/importer/features/configure-import/index.tsx:314`

**Step 1: Update table container classes**

Change line 314 from:
```tsx
<div className="overflow-x-auto border border-gray-200 rounded-lg">
```

To:
```tsx
<div className="overflow-x-auto border border-slate-200 rounded-xl bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
```

**Step 2: Verify change**

Run: `npm run build:preact --prefix frontend`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/importer/features/configure-import/index.tsx
git commit -m "style(configure-import): add gradient background and rounded-xl to container"
```

---

## Task 2: Update Checkmark Color from Green to Blue

**Files:**
- Modify: `frontend/src/importer/features/configure-import/index.tsx:353`

**Step 1: Change checkmark color**

Change line 353 from:
```tsx
<CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
```

To:
```tsx
<CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
```

**Step 2: Verify change**

Run: `npm run build:preact --prefix frontend`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/importer/features/configure-import/index.tsx
git commit -m "style(configure-import): change checkmark to blue for consistency with step 1"
```

---

## Task 3: Enhance Row Styling with Hover Effects

**Files:**
- Modify: `frontend/src/importer/features/configure-import/index.tsx:344-348`

**Step 1: Update table row classes**

Change lines 344-348 from:
```tsx
<tr
  key={field.id}
  className={cn(
    designTokens.components.tableRow,
    mappingsReady && "mapping-row-animate"
  )}
  style={mappingsReady ? { animationDelay: `${index * 50}ms` } : undefined}
>
```

To:
```tsx
<tr
  key={field.id}
  className={cn(
    "border-b border-slate-100 transition-all duration-200",
    "hover:bg-blue-50/50",
    mappingsReady && "mapping-row-animate"
  )}
  style={mappingsReady ? { animationDelay: `${index * 50}ms` } : undefined}
>
```

**Step 2: Verify change**

Run: `npm run build:preact --prefix frontend`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/importer/features/configure-import/index.tsx
git commit -m "style(configure-import): add blue hover effect to mapping rows"
```

---

## Task 4: Increase Row Padding for Better Spacing

**Files:**
- Modify: `frontend/src/importer/features/configure-import/index.tsx:350,369,390`

**Step 1: Update all td padding from py-4 to py-5**

Change line 350 from:
```tsx
<td className="px-6 py-4">
```
To:
```tsx
<td className="px-6 py-5">
```

Change line 369 from:
```tsx
<td className="px-6 py-4">
```
To:
```tsx
<td className="px-6 py-5">
```

Change line 390 from:
```tsx
<td className="px-6 py-4">
```
To:
```tsx
<td className="px-6 py-5">
```

**Step 2: Verify change**

Run: `npm run build:preact --prefix frontend`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/importer/features/configure-import/index.tsx
git commit -m "style(configure-import): increase row padding for better spacing"
```

---

## Task 5: Update Table Header Styling

**Files:**
- Modify: `frontend/src/importer/features/configure-import/index.tsx:316-333`

**Step 1: Update thead and th styling**

Change lines 316-333 from:
```tsx
<thead className={designTokens.components.tableHeader}>
  <tr>
    <th className="text-left px-6 py-3 w-[30%]">
      <span className={cn(designTokens.typography.label)}>
        {t('Fields')}
      </span>
    </th>
    <th className="text-left px-6 py-3 w-[35%]">
      <span className={cn(designTokens.typography.label)}>
        {t('CSV Column')}
      </span>
    </th>
    <th className="text-left px-6 py-3 w-[35%]">
      <span className={cn(designTokens.typography.label)}>
        {t('Preview')}
      </span>
    </th>
  </tr>
</thead>
```

To:
```tsx
<thead className="bg-slate-50/80 border-b border-slate-200">
  <tr>
    <th className="text-left px-6 py-3.5 w-[30%]">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {t('Fields')}
      </span>
    </th>
    <th className="text-left px-6 py-3.5 w-[35%]">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {t('CSV Column')}
      </span>
    </th>
    <th className="text-left px-6 py-3.5 w-[35%]">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {t('Preview')}
      </span>
    </th>
  </tr>
</thead>
```

**Step 2: Verify change**

Run: `npm run build:preact --prefix frontend`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/importer/features/configure-import/index.tsx
git commit -m "style(configure-import): update table header with uppercase labels and refined styling"
```

---

## Task 6: Add Pulse Animation for Mapped Status

**Files:**
- Modify: `frontend/src/index.css` (add after line 194)

**Step 1: Add checkmark pulse animation**

Add after line 194 (after `.mapping-row-animate` block):
```css
  /* Checkmark success pulse */
  @keyframes checkPulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }

  .check-pulse {
    animation: checkPulse 0.3s ease-out;
  }
```

**Step 2: Verify CSS is valid**

Run: `npm run build:preact --prefix frontend`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: add checkmark pulse animation for mapping success feedback"
```

---

## Task 7: Apply Pulse Animation to Checkmark

**Files:**
- Modify: `frontend/src/importer/features/configure-import/index.tsx:352-354`

**Step 1: Add pulse class to checkmark**

Change lines 352-354 from:
```tsx
{isMapped && (
  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
)}
```

To:
```tsx
{isMapped && (
  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 check-pulse" />
)}
```

**Step 2: Verify change**

Run: `npm run build:preact --prefix frontend`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/importer/features/configure-import/index.tsx
git commit -m "style(configure-import): add pulse animation to mapped checkmarks"
```

---

## Task 8: Improve Preview Column Display

**Files:**
- Modify: `frontend/src/importer/features/configure-import/index.tsx:390-394`

**Step 1: Update preview cell styling**

Change lines 390-394 from:
```tsx
<td className="px-6 py-5">
  <span className={cn(designTokens.typography.body, "text-gray-600 truncate block max-w-[300px]")} title={mappedColumn ? getSampleData(parseInt(mappedColumn)) : ''}>
    {mappedColumn ? (getSampleData(parseInt(mappedColumn)) || '-') : ''}
  </span>
</td>
```

To:
```tsx
<td className="px-6 py-5">
  {mappedColumn ? (
    <div className="flex flex-wrap gap-1.5 max-w-[320px]">
      {getSampleData(parseInt(mappedColumn)).split(', ').slice(0, 3).map((sample, i) => (
        <span
          key={i}
          className="inline-flex px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-md truncate max-w-[100px]"
          title={sample}
        >
          {sample}
        </span>
      ))}
    </div>
  ) : (
    <span className="text-sm text-slate-400">—</span>
  )}
</td>
```

**Step 2: Verify change**

Run: `npm run build:preact --prefix frontend`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/importer/features/configure-import/index.tsx
git commit -m "style(configure-import): display preview data as chips instead of truncated text"
```

---

## Task 9: Update Unmapped Required Field Indicator

**Files:**
- Modify: `frontend/src/importer/features/configure-import/index.tsx:355-357`

**Step 1: Enhance unmapped required indicator**

Change lines 355-357 from:
```tsx
{!isMapped && isRequired && (
  <Box className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
)}
```

To:
```tsx
{!isMapped && isRequired && (
  <div className="w-5 h-5 rounded-full border-2 border-dashed border-slate-300 flex-shrink-0 flex items-center justify-center">
    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
  </div>
)}
```

**Step 2: Verify change**

Run: `npm run build:preact --prefix frontend`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add frontend/src/importer/features/configure-import/index.tsx
git commit -m "style(configure-import): enhance unmapped required field indicator with dashed border"
```

---

## Task 10: Final Visual QA and Squash Commit

**Files:**
- Review: `frontend/src/importer/features/configure-import/index.tsx`
- Review: `frontend/src/index.css`

**Step 1: Run full build**

Run: `npm run build:preact --prefix frontend`
Expected: Build succeeds with no errors

**Step 2: Run tests**

Run: `npm run test --prefix frontend`
Expected: All tests pass

**Step 3: Visual verification**

Start dev server and verify:
- Container has gradient background and rounded-xl corners
- Checkmarks are blue (not green)
- Rows have blue hover effect
- Row spacing feels spacious (py-5)
- Table headers are uppercase with tracking
- Preview shows data as chips
- Unmapped required fields have dashed circle indicator

---

## Summary of Changes

| Element | Before | After |
|---------|--------|-------|
| Container | `rounded-lg`, flat white | `rounded-xl`, gradient, shadow |
| Checkmarks | Green (`text-green-500`) | Blue (`text-blue-500`) with pulse |
| Row hover | `hover:bg-gray-50` | `hover:bg-blue-50/50` |
| Row padding | `py-4` | `py-5` |
| Headers | Default label style | Uppercase, tracking-wider |
| Preview | Truncated text | Chips/badges |
| Unmapped indicator | Solid border circle | Dashed border with dot |
