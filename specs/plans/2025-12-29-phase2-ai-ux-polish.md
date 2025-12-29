# Phase 2: AI UX Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish the AI-powered import experience to feel seamless and "invisible" — mappings just work, transformations feel like inline editing, and new users get clear onboarding guidance.

**Architecture:** Migrate mapping from LiteLLM direct calls to BAML (typed, testable), raise transformation confidence threshold to 0.8, add skeleton loading states with staggered animations, show old→new diffs for transformations with confidence-based visual indicators.

**Tech Stack:** BAML (AI functions), Preact (frontend importer), Next.js (admin dashboard), FastAPI (backend), TailwindCSS

---

## Overview

| Area | Changes |
|------|---------|
| **Backend** | Migrate mapping from LiteLLM → BAML, remove Redis caching, raise transformation confidence to 0.8 |
| **Frontend - Mapping** | Skeleton loading state, staggered reveal animation, prefetch on file parse |
| **Frontend - Transformation** | Show old→new diffs, confidence-based tiers with warning icons |
| **Admin - Dashboard** | Onboarding checklist, empty states for importers/imports lists |

**Architecture Change:**

```
Before:
┌─────────────┐     ┌──────────────┐     ┌─────────┐
│ mapping.py  │────▶│  LiteLLM     │────▶│  Redis  │
│             │     │  (raw API)   │     │ (cache) │
└─────────────┘     └──────────────┘     └─────────┘

After:
┌─────────────┐     ┌──────────────┐
│ mapping.py  │────▶│  BAML        │
│             │     │  (typed,     │
└─────────────┘     │   testable)  │
                    └──────────────┘
```

---

## Progress Tracking

| Task | Description | Status |
|------|-------------|--------|
| 1 | Create BAML mapping function | ✅ Done |
| 2 | Rewrite mapping.py to use BAML | ✅ Done |
| 3 | Raise transformation threshold to 0.8 | ✅ Done |
| 4 | Create MappingSkeleton component | ⬚ Pending |
| 5 | Add prefetch logic to configure-import | ⬚ Pending |
| 6 | Update useMapColumnsTable to accept mappings as prop | ⬚ Pending |
| 7 | Add staggered fade-in animation | ⬚ Pending |
| 8 | Update TransformPanel to show diffs | ⬚ Pending |
| 9 | Add confidence tier logic and visual indicators | ⬚ Pending |
| 10 | Update selection summary text | ⬚ Pending |
| 11 | Create onboarding status endpoint | ⬚ Pending |
| 12 | Create OnboardingChecklist component | ⬚ Pending |
| 13 | Add OnboardingChecklist to Sidebar | ⬚ Pending |
| 14 | Create reusable EmptyState component | ⬚ Pending |
| 15 | Add empty state to importers list | ⬚ Pending |
| 16 | Add empty state to imports history | ⬚ Pending |

---

# BACKEND TASKS

## Task 1: Create BAML Mapping Function ✅

**Files:**
- Create: `backend/baml_src/mapping.baml`

**Step 1: Create the BAML mapping function**

Create `backend/baml_src/mapping.baml`:

```baml
// Column mapping function for ImportCSV

// Input types
class UploadColumn {
  index int
  name string
  sample string?  // Optional sample data
}

class TemplateColumn {
  key string
  name string
  required bool
}

// Output types
class ColumnMapping {
  upload_index int
  template_key string
  confidence float @description("Confidence score from 0 to 1")
}

class MappingResult {
  mappings ColumnMapping[]
}

// Main mapping function
function MapColumns(
  upload_columns: UploadColumn[],
  template_columns: TemplateColumn[]
) -> MappingResult {
  client "openai/gpt-4.1"
  prompt #"
    Map CSV columns to template fields based on names and sample data.

    CSV columns:
    {{ upload_columns }}

    Template fields:
    {{ template_columns }}

    Rules:
    - Only include mappings with confidence > 0.8
    - Each template field can only be mapped once
    - Recognize common variations (e.g., "Email Address" → "email")
    - Consider sample data to improve accuracy

    {{ ctx.output_format }}
  "#
}

// Test case
test map_basic_columns {
  functions [MapColumns]
  args {
    upload_columns [
      { index 0, name "Email Address", sample "john@example.com" },
      { index 1, name "Full Name", sample "John Doe" },
      { index 2, name "Phone", sample "555-1234" }
    ]
    template_columns [
      { key "email", name "Email", required true },
      { key "name", name "Name", required true },
      { key "phone", name "Phone Number", required false }
    ]
  }
}
```

**Step 2: Regenerate BAML client**

Run: `cd backend && baml-cli generate`

Expected: New types appear in `backend/baml_client/types.py`

**Step 3: Verify types generated**

Run: `grep -l "UploadColumn\|MappingResult" backend/baml_client/*.py`

Expected: Files containing the new types

**Step 4: Commit**

```bash
git add backend/baml_src/mapping.baml backend/baml_client/
git commit -m "feat(ai): add BAML mapping function for column suggestions"
```

---

## Task 2: Rewrite mapping.py to Use BAML ✅

**Files:**
- Modify: `backend/app/services/mapping.py`

**Step 1: Replace entire mapping.py**

Replace `backend/app/services/mapping.py` with:

```python
"""
Column mapping service using BAML.
"""

import logging
from typing import List, Dict

from baml_client.async_client import b
from baml_client import types as baml_types

logger = logging.getLogger(__name__)


async def enhance_column_mappings(
    upload_columns: List[Dict], template_columns: List[Dict]
) -> List[Dict]:
    """
    Get column mapping suggestions using BAML.

    Args:
        upload_columns: List of dicts with 'name' and optional 'sample_data'
        template_columns: List of dicts with 'key'/'id', 'name'/'label', and 'required'/'validators'

    Returns:
        List of mapping suggestions with uploadIndex, templateKey, and confidence
    """
    if not upload_columns or not template_columns:
        return []

    try:
        # Convert to BAML types
        baml_upload = [
            baml_types.UploadColumn(
                index=i,
                name=col.get("name", ""),
                sample=_get_first_sample(col.get("sample_data"))
            )
            for i, col in enumerate(upload_columns)
        ]

        baml_template = [
            baml_types.TemplateColumn(
                key=col.get("key", col.get("id", "")),
                name=col.get("name", col.get("label", "")),
                required=_is_required(col)
            )
            for col in template_columns
        ]

        # Call BAML function
        result = await b.MapColumns(
            upload_columns=baml_upload,
            template_columns=baml_template
        )

        # Convert to API response format
        mappings = [
            {
                "uploadIndex": m.upload_index,
                "templateKey": m.template_key,
                "confidence": m.confidence
            }
            for m in result.mappings
            if m.confidence >= 0.8  # Filter by confidence threshold
        ]

        logger.info(f"Generated {len(mappings)} mapping suggestions via BAML")
        return mappings

    except Exception as e:
        logger.error(f"BAML mapping failed: {e}")
        return []


def _get_first_sample(sample_data: List) -> str | None:
    """Extract first non-empty sample value."""
    if sample_data and len(sample_data) > 0 and sample_data[0]:
        return str(sample_data[0])
    return None


def _is_required(col: Dict) -> bool:
    """Check if column is required (supports both formats)."""
    if col.get("required"):
        return True
    validators = col.get("validators", [])
    return any(v.get("type") == "required" for v in validators)
```

**Step 2: Remove unused imports**

Verify no references to `litellm` or `redis` remain:

Run: `grep -E "litellm|redis" backend/app/services/mapping.py`

Expected: No matches

**Step 3: Check if litellm is used elsewhere**

Run: `grep -r "litellm" backend/app/ --include="*.py" | grep -v mapping.py | grep -v __pycache__`

If no other usages, remove `litellm` from `backend/requirements.txt`.

**Step 4: Test the endpoint**

Run: `cd backend && pytest tests/ -v -k mapping`

Expected: Tests pass (may need to update tests for new behavior)

**Step 5: Commit**

```bash
git add backend/app/services/mapping.py backend/requirements.txt
git commit -m "refactor(ai): migrate mapping service from LiteLLM to BAML"
```

---

## Task 3: Raise Transformation Confidence Threshold ✅

**Files:**
- Modify: `backend/app/services/transformation.py` (line 14)

**Step 1: Update threshold constant**

In `backend/app/services/transformation.py`, find and update line 14:

```python
# Change from:
MIN_CONFIDENCE_THRESHOLD = 0.7

# Change to:
MIN_CONFIDENCE_THRESHOLD = 0.8
```

**Step 2: Commit**

```bash
git add backend/app/services/transformation.py
git commit -m "feat(ai): raise transformation confidence threshold to 0.8"
```

---

# FRONTEND TASKS - MAPPING UX

## Task 4: Create Mapping Skeleton Component

**Files:**
- Create: `frontend/src/importer/components/MappingSkeleton.tsx`

**Step 1: Create the skeleton component**

Create `frontend/src/importer/components/MappingSkeleton.tsx`:

```tsx
import { cn } from "../../utils/cn";

interface MappingSkeletonProps {
  rows?: number;
  className?: string;
}

export default function MappingSkeleton({ rows = 5, className }: MappingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header row */}
      <div className="flex gap-4 py-2 border-b">
        <div className="h-4 bg-gray-200 rounded w-1/5 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 py-3"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          {/* Column name */}
          <div className="w-1/5">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          </div>

          {/* Sample data */}
          <div className="w-1/4">
            <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
          </div>

          {/* Dropdown placeholder */}
          <div className="w-1/4">
            <div className="h-9 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Checkbox placeholder */}
          <div className="w-1/6 flex justify-center">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/importer/components/MappingSkeleton.tsx
git commit -m "feat(ui): add skeleton loading component for column mapping"
```

---

## Task 5: Add Prefetch Logic to Configure Import

**Files:**
- Modify: `frontend/src/importer/features/configure-import/index.tsx`

**Step 1: Add state for prefetched mappings**

Add near the top of the component (after existing useState calls):

```tsx
// Prefetch AI mapping suggestions
const [aiMappings, setAiMappings] = useState<MappingSuggestion[] | null>(null);
const [isLoadingMappings, setIsLoadingMappings] = useState(false);
const mappingsFetched = useRef(false);
```

**Step 2: Add prefetch effect**

Add effect to fetch mappings as soon as data is available:

```tsx
// Prefetch mappings when data is ready
useEffect(() => {
  if (
    !mappingsFetched.current &&
    data.rows.length > 0 &&
    columns &&
    columns.length > 0 &&
    importerKey &&
    backendUrl
  ) {
    mappingsFetched.current = true;
    setIsLoadingMappings(true);

    const uploadColumns = data.rows[0]?.values.map((cell, index) => ({
      index,
      name: cell,
      sample_data: data.rows.slice(1, 4).map(row => row.values[index])
    })) || [];

    getMappingSuggestions(uploadColumns, columns, backendUrl, importerKey)
      .then(suggestions => setAiMappings(suggestions))
      .catch(() => setAiMappings([]))  // Fallback to empty on error
      .finally(() => setIsLoadingMappings(false));
  }
}, [data, columns, importerKey, backendUrl]);
```

**Step 3: Pass to MapColumns component**

Update the MapColumns render to pass prefetched data:

```tsx
<MapColumns
  columns={columns}
  data={data}
  aiMappings={aiMappings}
  isLoadingMappings={isLoadingMappings}
  // ... other props
/>
```

**Step 4: Commit**

```bash
git add frontend/src/importer/features/configure-import/index.tsx
git commit -m "feat(ai): prefetch mapping suggestions on file parse"
```

---

## Task 6: Update useMapColumnsTable to Accept Mappings as Prop

**Files:**
- Modify: `frontend/src/importer/features/map-columns/hooks/useMapColumnsTable.tsx`

**Step 1: Update function signature**

Change the function to accept AI mappings as a prop instead of fetching internally:

```tsx
export default function useMapColumnsTable(
  uploadColumns: UploadColumn[],
  templateColumns: Column[] = [],
  columnsValues: { [uploadColumnIndex: number]: TemplateColumnMapping },
  isLoading?: boolean,
  aiMappings?: MappingSuggestion[] | null,  // NEW: Accept as prop
  isLoadingMappings?: boolean               // NEW: Loading state
) {
```

**Step 2: Remove internal fetch logic**

Delete the `useEffect` that calls `getMappingSuggestions` (around lines 96-168).

Remove the import:
```tsx
// Remove this line:
import { getMappingSuggestions } from "../../../services/mapping";
```

**Step 3: Apply AI mappings when available**

Replace the deleted useEffect with one that applies mappings when they arrive:

```tsx
// Apply AI mappings when they arrive
useEffect(() => {
  if (!aiMappings || aiMappings.length === 0) return;

  setValues((prevValues) => {
    const newValues = { ...prevValues };
    const usedTemplateKeys = new Set(
      Object.values(prevValues)
        .filter(v => v.id)
        .map(v => v.id)
    );

    // Sort by confidence (highest first)
    const sortedMappings = [...aiMappings].sort((a, b) => b.confidence - a.confidence);

    for (const mapping of sortedMappings) {
      const currentMapping = prevValues[mapping.uploadIndex];

      // Only apply if not already mapped and template key available
      if (!currentMapping?.id && !usedTemplateKeys.has(mapping.templateKey)) {
        newValues[mapping.uploadIndex] = {
          id: mapping.templateKey,
          include: true,
          selected: true
        };
        usedTemplateKeys.add(mapping.templateKey);
      }
    }

    return newValues;
  });
}, [aiMappings]);
```

**Step 4: Remove dead code**

Delete the `isSuggestedMapping` function if it always returns false (around line 46-48).

**Step 5: Commit**

```bash
git add frontend/src/importer/features/map-columns/hooks/useMapColumnsTable.tsx
git commit -m "refactor(ai): accept mapping suggestions as prop instead of fetching"
```

---

## Task 7: Add Staggered Fade-in Animation

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/importer/features/map-columns/index.tsx`

**Step 1: Add CSS for staggered animation**

Add to `frontend/src/index.css`:

```css
/* Staggered fade-in animation for mapping rows */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mapping-row-animate {
  animation: fadeInUp 0.3s ease-out forwards;
  opacity: 0;
}
```

**Step 2: Import and use skeleton component**

In `frontend/src/importer/features/map-columns/index.tsx`:

```tsx
import MappingSkeleton from "../../components/MappingSkeleton";

// In the render, before the table:
if (isLoadingMappings) {
  return (
    <StepLayout
      title={t("Map columns from imported CSV")}
      subtitle={t("Analyzing your columns...")}
      footerContent={footerContent}
    >
      <MappingSkeleton rows={uploadColumns.length} />
    </StepLayout>
  );
}
```

**Step 3: Add animation delay to table rows**

When rendering each row, add staggered animation:

```tsx
// In the Table component or row rendering
<tr
  className="mapping-row-animate"
  style={{ animationDelay: `${index * 50}ms` }}
>
```

**Step 4: Commit**

```bash
git add frontend/src/importer/features/map-columns/index.tsx frontend/src/index.css
git commit -m "feat(ui): add skeleton and staggered animation for mapping"
```

---

# FRONTEND TASKS - TRANSFORMATION UX

## Task 8: Update TransformPanel to Show Diffs

**Files:**
- Modify: `frontend/src/importer/features/validation/components/TransformPanel.tsx`

**Step 1: Add ArrowRight import**

Add import at top of file:

```tsx
import { Sparkles, X, Check, Info, AlertCircle, ChevronRight, ArrowRight } from 'lucide-react';
```

**Step 2: Update change item rendering**

Find the changes list rendering (around line 429-450) and update to show old→new diff:

```tsx
{changes.slice(0, 100).map((change, index) => (
  <div
    key={index}
    className="flex items-center gap-3 py-2 px-1 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors rounded"
    onClick={() => handleToggleChange(index)}
  >
    <Checkbox
      checked={change.selected}
      onCheckedChange={() => handleToggleChange(index)}
      onClick={(e: JSX.TargetedEvent<HTMLInputElement, Event>) => e.stopPropagation()}
      className="flex-shrink-0"
    />
    <div className="flex-1 min-w-0">
      {/* Diff display */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <span className="line-through text-gray-400 truncate max-w-[120px]" title={String(change.oldValue || '')}>
          {String(change.oldValue || '(empty)')}
        </span>
        <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
        <span className="font-medium text-green-600 dark:text-green-400 truncate max-w-[200px]" title={String(change.newValue)}>
          {String(change.newValue)}
        </span>
      </div>
      {/* Row info */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Row {change.rowIndex + 1}, {change.columnKey}
      </div>
    </div>
  </div>
))}
```

**Step 3: Commit**

```bash
git add frontend/src/importer/features/validation/components/TransformPanel.tsx
git commit -m "feat(ui): show old→new diffs in transformation panel"
```

---

## Task 9: Add Confidence Tier Logic and Visual Indicators

**Files:**
- Modify: `frontend/src/importer/features/validation/components/TransformPanel.tsx`

**Step 1: Add AlertTriangle import and helper function**

Add import:
```tsx
import { Sparkles, X, Check, Info, AlertCircle, ChevronRight, ArrowRight, AlertTriangle } from 'lucide-react';
```

Add helper function after imports:

```tsx
type ConfidenceTier = 'high' | 'medium';

function getConfidenceTier(confidence: number): ConfidenceTier {
  return confidence >= 0.9 ? 'high' : 'medium';
}
```

**Step 2: Update change item with confidence indicator**

Update the diff display in the changes list:

```tsx
<div className="flex items-center gap-2 text-sm flex-wrap">
  <span className="line-through text-gray-400 truncate max-w-[120px]" title={String(change.oldValue || '')}>
    {String(change.oldValue || '(empty)')}
  </span>
  <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
  <span className={cn(
    "font-medium truncate max-w-[200px]",
    getConfidenceTier(change.confidence) === 'high'
      ? "text-green-600 dark:text-green-400"
      : "text-amber-600 dark:text-amber-400"
  )} title={String(change.newValue)}>
    {String(change.newValue)}
  </span>
  {/* Warning icon for medium confidence */}
  {getConfidenceTier(change.confidence) === 'medium' && (
    <AlertTriangle
      size={14}
      className="text-amber-500 flex-shrink-0"
      title={`Confidence: ${Math.round(change.confidence * 100)}%`}
    />
  )}
</div>
```

**Step 3: Add cn import if not present**

Ensure cn utility is imported:

```tsx
import { cn } from "../../../../utils/cn";
```

**Step 4: Commit**

```bash
git add frontend/src/importer/features/validation/components/TransformPanel.tsx
git commit -m "feat(ui): add confidence tiers with visual indicators"
```

---

## Task 10: Update Selection Summary Text

**Files:**
- Modify: `frontend/src/importer/features/validation/components/TransformPanel.tsx`

**Step 1: Update footer summary**

Find the footer section (around line 467-481) and update:

```tsx
{/* Footer */}
{hasChanges && (
  <div className="border-t dark:border-gray-700 p-4">
    <div className="flex justify-between items-center">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {selectedCount} selected
        {changes.filter(c => c.confidence < 0.9).length > 0 && (
          <span className="text-amber-600 dark:text-amber-400 ml-1">
            ({changes.filter(c => c.confidence < 0.9).length} need review)
          </span>
        )}
      </div>
      <button
        type="button"
        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => handleApply(selectedCount === changes.length)}
        disabled={selectedCount === 0}
      >
        {t(`Apply ${selectedCount}`)}
      </button>
    </div>
  </div>
)}
```

**Step 2: Commit**

```bash
git add frontend/src/importer/features/validation/components/TransformPanel.tsx
git commit -m "feat(ui): set default selections based on confidence"
```

---

# ADMIN DASHBOARD TASKS - EMPTY STATES + ONBOARDING

## Task 11: Create Onboarding Status Endpoint

**Files:**
- Create: `backend/app/api/v1/onboarding.py`
- Modify: `backend/app/api/routes.py`

**Step 1: Create the onboarding endpoint**

Create `backend/app/api/v1/onboarding.py`:

```python
"""
Onboarding status endpoint for tracking user progress.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.base import get_db
from app.auth.jwt_auth import get_current_user
from app.models.user import User
from app.models.importer import Importer
from app.models.import_job import ImportJob, ImportStatus

router = APIRouter()


@router.get("/onboarding")
async def get_onboarding_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get onboarding checklist status for the current user.
    Auto-detects completion of each step.
    """
    user_id = current_user.id

    # Check each step
    has_importer = db.query(Importer).filter(
        Importer.user_id == user_id
    ).first() is not None

    has_columns = db.query(Importer).filter(
        Importer.user_id == user_id,
        func.json_array_length(Importer.fields) > 0
    ).first() is not None

    has_completed_import = db.query(ImportJob).join(Importer).filter(
        Importer.user_id == user_id,
        ImportJob.status == ImportStatus.COMPLETED
    ).first() is not None

    steps = [
        {
            "id": "create_account",
            "label": "Create account",
            "completed": True  # Always true if they're authenticated
        },
        {
            "id": "create_importer",
            "label": "Create your first importer",
            "completed": has_importer
        },
        {
            "id": "define_columns",
            "label": "Define at least one column",
            "completed": has_columns
        },
        {
            "id": "first_import",
            "label": "Complete first import",
            "completed": has_completed_import
        }
    ]

    completed_count = sum(1 for step in steps if step["completed"])

    return {
        "steps": steps,
        "completed_count": completed_count,
        "total_count": len(steps),
        "all_complete": completed_count == len(steps)
    }
```

**Step 2: Register the route**

Add to `backend/app/api/routes.py`:

```python
from app.api.v1 import auth, auth_oauth, importers, imports, usage, onboarding

# ... existing includes ...

# Onboarding routes (under /v1/users/me)
api_router.include_router(
    onboarding.router,
    prefix="/v1/users/me",
    tags=["Onboarding"]
)
```

**Step 3: Commit**

```bash
git add backend/app/api/v1/onboarding.py backend/app/api/routes.py
git commit -m "feat(onboarding): add endpoint for onboarding status"
```

---

## Task 12: Create Onboarding Checklist Component

**Files:**
- Create: `admin/src/components/OnboardingChecklist.tsx`

**Step 1: Create the component**

Create `admin/src/components/OnboardingChecklist.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Check, Circle } from "lucide-react";
import apiClient from "@/utils/apiClient";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
}

interface OnboardingStatus {
  steps: OnboardingStep[];
  completed_count: number;
  total_count: number;
  all_complete: boolean;
}

export function OnboardingChecklist() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user dismissed the checklist
    const wasDismissed = localStorage.getItem("onboarding_dismissed") === "true";
    if (wasDismissed) {
      setDismissed(true);
      setIsLoading(false);
      return;
    }

    apiClient
      .get("/users/me/onboarding")
      .then((res) => {
        setStatus(res.data);
        // Auto-dismiss if all complete
        if (res.data.all_complete) {
          localStorage.setItem("onboarding_dismissed", "true");
          setDismissed(true);
        }
      })
      .catch(() => {
        // Silently fail - don't block UI
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || dismissed || !status || status.all_complete) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 mx-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm text-white">
          Getting Started
        </h3>
        <span className="text-xs text-gray-400">
          {status.completed_count}/{status.total_count}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-700 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-500"
          style={{
            width: `${(status.completed_count / status.total_count) * 100}%`
          }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {status.steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-2 text-sm",
              step.completed ? "text-gray-500" : "text-gray-300"
            )}
          >
            {step.completed ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Circle size={16} className="text-gray-600" />
            )}
            <span className={step.completed ? "line-through" : ""}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add admin/src/components/OnboardingChecklist.tsx
git commit -m "feat(ui): add onboarding checklist component"
```

---

## Task 13: Add Onboarding Checklist to Sidebar

**Files:**
- Modify: `admin/src/components/Sidebar.tsx`

**Step 1: Import the checklist component**

Add import:
```tsx
import { OnboardingChecklist } from "./OnboardingChecklist";
```

**Step 2: Add checklist before sign out button**

Find the sign out button section (around line 90) and add checklist before it:

```tsx
{/* Onboarding checklist - shows until complete */}
<OnboardingChecklist />

<div className="p-4 border-t border-gray-800">
  <button
    onClick={() => signOut()}
    // ... rest of button
  >
```

**Step 3: Commit**

```bash
git add admin/src/components/Sidebar.tsx
git commit -m "feat(ui): add onboarding checklist to sidebar"
```

---

## Task 14: Create Reusable Empty State Component

**Files:**
- Create: `admin/src/components/EmptyState.tsx`

**Step 1: Create the component**

Create `admin/src/components/EmptyState.tsx`:

```tsx
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  tip?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tip,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={24} className="text-gray-400" />
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>

      <p className="text-sm text-gray-500 max-w-sm mb-6">
        {description}
      </p>

      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}

      {tip && (
        <div className="mt-8 pt-6 border-t border-gray-100 max-w-sm">
          <p className="text-xs text-gray-400">
            Tip: {tip}
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add admin/src/components/EmptyState.tsx
git commit -m "feat(ui): add reusable empty state component"
```

---

## Task 15: Add Empty State to Importers List

**Files:**
- Modify: `admin/src/app/(dashboard)/importers/page.tsx`

**Step 1: Import EmptyState and icon**

Add imports at top:
```tsx
import { FileSpreadsheet } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
```

**Step 2: Add empty state check**

Find the table rendering section (around line 734) and wrap with empty state check:

```tsx
{/* Importers Table */}
{!isLoading && !error && (
  importers.length === 0 ? (
    <EmptyState
      icon={FileSpreadsheet}
      title="No importers yet"
      description="Create your first importer to start accepting CSV uploads from your users."
      action={{
        label: "Create Importer",
        onClick: () => router.push("/importers/new")
      }}
      tip="Importers define the schema for your CSV uploads — column names, validation rules, and more."
    />
  ) : (
    <AlertDialog>
      {/* ... existing table content ... */}
    </AlertDialog>
  )
)}
```

**Step 3: Commit**

```bash
git add admin/src/app/\(dashboard\)/importers/page.tsx
git commit -m "feat(ui): add empty state to importers list"
```

---

## Task 16: Add Empty State to Imports History

**Files:**
- Modify: `admin/src/app/(dashboard)/imports/page.tsx`

**Step 1: Import EmptyState and icon**

Add imports:
```tsx
import { History } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
```

**Step 2: Add empty state check**

When imports array is empty, show empty state:

```tsx
{imports.length === 0 ? (
  <EmptyState
    icon={History}
    title="No imports yet"
    description="Once users upload CSVs through your importer, you'll see them here."
    action={{
      label: "View Your Importers",
      onClick: () => router.push("/importers")
    }}
    tip="Need to test? Use the preview mode in any importer to try it out."
  />
) : (
  // ... existing table content
)}
```

**Step 3: Commit**

```bash
git add admin/src/app/\(dashboard\)/imports/page.tsx
git commit -m "feat(ui): add empty state to imports history"
```

---

# VERIFICATION

## Final Verification Steps

**Step 1: Run backend tests**

```bash
cd backend && pytest tests/ -v
```

**Step 2: Run frontend build**

```bash
cd frontend && npm run build
```

**Step 3: Run admin build**

```bash
cd admin && npm run build
```

**Step 4: Manual testing checklist**

AI UX:
- [ ] Upload a CSV file
- [ ] Verify skeleton shows while mapping loads
- [ ] Verify mappings appear with staggered animation
- [ ] Trigger validation errors (bad emails, etc.)
- [ ] Click "Fix errors"
- [ ] Verify diffs show old→new values
- [ ] Verify amber warnings on medium confidence changes
- [ ] Apply changes and verify table updates

Dashboard:
- [ ] New user sees onboarding checklist in sidebar
- [ ] Creating importer marks step complete
- [ ] Adding columns marks step complete
- [ ] Empty importers page shows empty state with CTA
- [ ] Empty imports page shows empty state with CTA
- [ ] Completing all steps auto-dismisses checklist

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 2 AI UX polish + onboarding"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Create BAML mapping function | `baml_src/mapping.baml` |
| 2 | Rewrite mapping.py to use BAML | `app/services/mapping.py` |
| 3 | Raise transformation threshold to 0.8 | `app/services/transformation.py` |
| 4 | Create mapping skeleton component | `components/MappingSkeleton.tsx` |
| 5 | Add prefetch logic | `configure-import/index.tsx` |
| 6 | Accept mappings as prop | `useMapColumnsTable.tsx` |
| 7 | Add staggered animation | `map-columns/index.tsx`, CSS |
| 8 | Show diffs in transform panel | `TransformPanel.tsx` |
| 9 | Add confidence tier logic | `TransformPanel.tsx` |
| 10 | Update selection summary | `TransformPanel.tsx` |
| 11 | Create onboarding status endpoint | `api/v1/onboarding.py` |
| 12 | Create onboarding checklist component | `OnboardingChecklist.tsx` |
| 13 | Add checklist to sidebar | `Sidebar.tsx` |
| 14 | Create empty state component | `EmptyState.tsx` |
| 15 | Add empty state to importers list | `importers/page.tsx` |
| 16 | Add empty state to imports history | `imports/page.tsx` |
