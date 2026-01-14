# Import Creation UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign importer creation to offer auto-detection paths (CSV upload with AI inference, Supabase schema pull) that get users to the "aha moment" faster.

**Architecture:** Add user-level `Integration` model for storing Supabase credentials. Create BAML `InferSchema` function for AI-powered column type detection from CSV samples. Redesign frontend entry point with two primary paths (CSV upload, destination connection) and manual fallback.

**Tech Stack:** FastAPI, SQLAlchemy, PostgreSQL, BAML (LLM orchestration), Next.js 14, Radix UI, Tailwind CSS, Axios

---

## Status Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1-2: Backend Integration & Supabase | Tasks 1-7 | ✅ DONE (on main) |
| Phase 3: AI Schema Inference | Tasks 8-10 | ✅ DONE |
| Phase 4: Frontend API Client | Task 11 | 🔄 Partial (needs inferSchema) |
| Phase 5: Frontend Components | Tasks 12-15 | 🔄 Partial |
| Phase 6: Page Redesign | Tasks 16-17 | 🔄 Partial |
| Phase 7: Testing | Task 18 | ⬜ TODO |

---

## Completed Tasks (Reference Only)

### Tasks 1-7: Backend Integration & Supabase (✅ DONE - on main)

These are already implemented on main:
- Integration model with encrypted credentials
- Database migration for integrations tables
- Integration schemas with credential exclusion
- Integration service with CRUD operations
- Integration API endpoints with SSRF protection
- Supabase service for table introspection
- Supabase tables and schema endpoints

### Tasks 8-10: AI Schema Inference (✅ DONE)

Just implemented:
- BAML `InferSchema` function (`backend/baml_src/schema.baml`)
- Schema inference service (`backend/app/services/schema_inference.py`)
- `POST /api/v1/importers/infer-schema` endpoint

---

## Remaining Tasks

### Task 11: Add inferSchema API Method to Frontend

**Files:**
- Modify: `admin/src/utils/apiClient.ts`

**What exists:** `integrationsApi` with all CRUD methods, `getSupabaseTables`, `getSupabaseTableSchema`

**What's needed:** Add `inferSchema` method to call the new endpoint

**Step 1: Add inferSchema method to importersApi**

Add to `admin/src/utils/apiClient.ts` in the `importersApi` object:

```typescript
// Add these types near the top
interface InferSchemaRequest {
  data: Record<string, string>[];
}

interface InferredColumn {
  name: string;
  display_name: string;
  type: string;
  options?: string[];
}

interface InferSchemaResponse {
  columns: InferredColumn[];
}

// Add to importersApi object
inferSchema: async (data: Record<string, string>[]): Promise<InferSchemaResponse> => {
  const response = await apiClient.post<InferSchemaResponse>("/importers/infer-schema", { data });
  return response.data;
},
```

**Step 2: Verify**

Run: `cd admin && npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add admin/src/utils/apiClient.ts
git commit -m "feat(admin): add inferSchema method to importers API client"
```

---

### Task 12: Create CsvUploader Component

**Files:**
- Create: `admin/src/components/CsvUploader.tsx`

**Purpose:** Upload CSV, parse it, call AI inference, return inferred schema

**Step 1: Create component**

Create `admin/src/components/CsvUploader.tsx`:

```tsx
'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { importersApi } from '@/utils/apiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InferredColumn {
  name: string;
  display_name: string;
  type: string;
  options?: string[];
}

interface CsvUploaderProps {
  onSchemaInferred: (columns: InferredColumn[], sampleData: Record<string, string>[]) => void;
  onError?: (error: string) => void;
}

export function CsvUploader({ onSchemaInferred, onError }: CsvUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setFileName(file.name);
    setIsLoading(true);

    try {
      // Parse CSV
      const result = await new Promise<Papa.ParseResult<Record<string, string>>>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject,
        });
      });

      if (result.errors.length > 0) {
        throw new Error(`CSV parsing error: ${result.errors[0].message}`);
      }

      if (result.data.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Take first 10 rows for inference
      const sampleData = result.data.slice(0, 10);

      // Call AI inference
      const inferenceResult = await importersApi.inferSchema(sampleData);

      onSchemaInferred(inferenceResult.columns, result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process CSV';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [onSchemaInferred, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && handleFile(files[0]),
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`cursor-pointer border-2 border-dashed transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <CardContent className="flex flex-col items-center justify-center py-10">
          <input {...getInputProps()} />
          {isLoading ? (
            <>
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Analyzing columns with AI...</p>
            </>
          ) : fileName ? (
            <>
              <FileText className="h-10 w-10 text-primary mb-4" />
              <p className="text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground mt-1">Drop another file to replace</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {isDragActive ? 'Drop your CSV here' : 'Drag & drop a CSV file, or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                We&apos;ll automatically detect column types
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

**Step 2: Install dependencies (if needed)**

```bash
cd admin && npm install papaparse react-dropzone && npm install -D @types/papaparse
```

**Step 3: Verify**

Run: `cd admin && npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add admin/src/components/CsvUploader.tsx admin/package.json admin/package-lock.json
git commit -m "feat(admin): add CsvUploader component with AI schema inference"
```

---

### Task 13: Create SchemaEditor Component

**Files:**
- Create: `admin/src/components/SchemaEditor.tsx`

**Purpose:** Display and edit AI-inferred schema before creating importer

**Step 1: Create component**

Create `admin/src/components/SchemaEditor.tsx`:

```tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, GripVertical, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface SchemaColumn {
  name: string;
  display_name: string;
  type: string;
  required?: boolean;
  options?: string[];
}

const COLUMN_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'select', label: 'Select' },
];

interface SchemaEditorProps {
  columns: SchemaColumn[];
  onChange: (columns: SchemaColumn[]) => void;
  showConfidence?: boolean;
}

export function SchemaEditor({ columns, onChange, showConfidence }: SchemaEditorProps) {
  const updateColumn = (index: number, updates: Partial<SchemaColumn>) => {
    const newColumns = [...columns];
    newColumns[index] = { ...newColumns[index], ...updates };
    onChange(newColumns);
  };

  const removeColumn = (index: number) => {
    onChange(columns.filter((_, i) => i !== index));
  };

  const addColumn = () => {
    onChange([
      ...columns,
      {
        name: `column_${columns.length + 1}`,
        display_name: `Column ${columns.length + 1}`,
        type: 'text',
        required: false,
      },
    ]);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Schema Columns</CardTitle>
        <Button variant="outline" size="sm" onClick={addColumn}>
          <Plus className="h-4 w-4 mr-1" />
          Add Column
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {columns.map((column, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />

              <div className="flex-1 grid grid-cols-3 gap-3">
                <Input
                  value={column.display_name}
                  onChange={(e) => updateColumn(index, { display_name: e.target.value })}
                  placeholder="Display Name"
                />
                <Input
                  value={column.name}
                  onChange={(e) => updateColumn(index, { name: e.target.value })}
                  placeholder="Field Key"
                  className="font-mono text-sm"
                />
                <Select
                  value={column.type}
                  onValueChange={(value) => updateColumn(index, { type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMN_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {column.type === 'select' && column.options && (
                <Badge variant="secondary" className="text-xs">
                  {column.options.length} options
                </Badge>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeColumn(index)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {columns.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No columns defined. Upload a CSV or add columns manually.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Verify**

Run: `cd admin && npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add admin/src/components/SchemaEditor.tsx
git commit -m "feat(admin): add SchemaEditor component for editing inferred schema"
```

---

### Task 14: Update New Importer Page with CSV Upload Path

**Files:**
- Modify: `admin/src/app/(dashboard)/importers/new/page.tsx`

**What exists:** Page with manual column entry + Supabase schema import via DestinationSelector

**What's needed:** Add CSV upload tab as primary path, integrate CsvUploader and SchemaEditor

**Step 1: Update the page**

Modify `admin/src/app/(dashboard)/importers/new/page.tsx` to add:

1. A `Tabs` component with three tabs:
   - "Upload CSV" (primary) - uses CsvUploader → SchemaEditor
   - "Connect Database" - uses existing DestinationSelector flow
   - "Manual" - uses existing ImporterColumnsManager

2. Update state management to track which path was used

3. When CSV is uploaded:
   - Parse and infer schema
   - Show SchemaEditor with results
   - User can edit and confirm
   - Create importer with those fields

**Key changes to existing code:**

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CsvUploader } from '@/components/CsvUploader';
import { SchemaEditor, SchemaColumn } from '@/components/SchemaEditor';

// Add state
const [inferredColumns, setInferredColumns] = useState<SchemaColumn[]>([]);
const [activeTab, setActiveTab] = useState<string>('upload');

// Add handler for CSV inference
const handleSchemaInferred = (columns: InferredColumn[], sampleData: Record<string, string>[]) => {
  setInferredColumns(columns.map(col => ({
    name: col.name,
    display_name: col.display_name,
    type: col.type,
    options: col.options,
    required: false,
  })));
  // Optionally store sampleData for preview
};

// Convert schema columns to importer fields before submit
const schemaToFields = (schema: SchemaColumn[]): ImporterField[] => {
  return schema.map(col => ({
    name: col.name,
    display_name: col.display_name,
    type: col.type,
    validators: [],
    transformations: [],
    options: col.options,
  }));
};
```

**Step 2: Verify**

Run: `cd admin && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add admin/src/app/\(dashboard\)/importers/new/page.tsx
git commit -m "feat(admin): add CSV upload with AI inference to new importer page"
```

---

### Task 15: Run Full Verification

**Step 1: Backend verification**

```bash
cd backend
uv run ruff check . && uv run ruff format --check .
uv run pytest -v
```

**Step 2: Admin verification**

```bash
cd admin
npm run lint
npm run build
```

**Step 3: Manual testing**

1. Start services: `docker-compose up -d`
2. Open http://localhost:3000
3. Create new importer via CSV upload:
   - Upload a CSV file
   - Verify AI inference shows appropriate column types
   - Edit schema if needed
   - Save importer
4. Create new importer via database connection:
   - Select Supabase integration
   - Pick table
   - Import schema
   - Save importer

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: verify full import creation UX implementation"
```

---

## Implementation Notes

### Already Implemented on Main
- Integration model with Fernet encryption for credentials
- Supabase service using OpenAPI schema introspection
- DestinationSelector component with table picker
- IntegrationForm component for CRUD
- SSRF protection for webhook and Supabase URLs

### New in This Branch
- BAML InferSchema function for AI column type detection
- Schema inference service wrapping BAML
- `/importers/infer-schema` API endpoint
- CsvUploader component with drag-drop + AI inference
- SchemaEditor component for editing inferred columns
- Updated new importer page with CSV upload path

### Key Design Decisions
1. **AI Inference is additive** - doesn't replace existing flows, adds new primary path
2. **Fallback to text** - if AI fails, columns default to text type
3. **User can edit** - AI results shown in SchemaEditor for review before save
4. **Sample data only** - only first 10 rows sent for inference (privacy + performance)
