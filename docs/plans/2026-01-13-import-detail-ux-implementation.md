# Import Detail UX Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the importer detail page to optimize for first-time setup with Schema and Embed as primary actions, auto-save, and consolidated Advanced Settings.

**Architecture:** Replace the current 5-collapsible layout with 2 always-visible sections (Schema, Embed) + 1 collapsed Advanced Settings. Remove manual save bar, add debounced auto-save with status indicator in header. Add Code/No-Code tabs for embed options.

**Tech Stack:** Next.js 15, React 19, Radix UI Tabs, Tailwind CSS v4, shadcn/ui components, custom useAutoSave hook.

**Design Doc:** `docs/plans/2026-01-13-import-detail-ux-redesign.md`

---

## Task 1: Create useAutoSave Hook

**Files:**
- Create: `admin/src/hooks/useAutoSave.ts`

**Step 1: Create the hook file**

```typescript
import { useRef, useCallback, useState, useEffect } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  status: SaveStatus;
  error: string | null;
  retry: () => void;
  save: () => void;
}

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 1500,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<T>(data);
  const initialDataRef = useRef<T>(data);
  const isFirstRender = useRef(true);

  // Update data ref when data changes
  dataRef.current = data;

  const performSave = useCallback(async () => {
    if (!enabled) return;

    setStatus('saving');
    setError(null);

    try {
      await onSave(dataRef.current);
      setStatus('saved');
      // Reset to idle after showing "saved" briefly
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Save failed';
      setError(message);
    }
  }, [onSave, enabled]);

  const retry = useCallback(() => {
    performSave();
  }, [performSave]);

  const save = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    performSave();
  }, [performSave]);

  // Debounced save on data change
  useEffect(() => {
    // Skip first render (initial data load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      initialDataRef.current = data;
      return;
    }

    // Skip if data hasn't actually changed from initial
    if (JSON.stringify(data) === JSON.stringify(initialDataRef.current)) {
      return;
    }

    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new debounced save
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, enabled, performSave]);

  return { status, error, retry, save };
}
```

**Step 2: Verify file was created**

Run: `ls -la admin/src/hooks/useAutoSave.ts`
Expected: File exists with correct permissions

**Step 3: Verify TypeScript compiles**

Run: `cd admin && npm run typecheck`
Expected: PASS (no type errors)

**Step 4: Commit**

```bash
git add admin/src/hooks/useAutoSave.ts
git commit -m "feat(admin): add useAutoSave hook for debounced saves"
```

---

## Task 2: Create SaveStatusIndicator Component

**Files:**
- Create: `admin/src/components/SaveStatusIndicator.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SaveStatus } from '@/hooks/useAutoSave';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function SaveStatusIndicator({
  status,
  error,
  onRetry,
  className,
}: SaveStatusIndicatorProps) {
  if (status === 'idle') {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1.5 text-sm', className)}>
      {status === 'saving' && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3.5 w-3.5 text-green-600" />
          <span className="text-green-600">Saved</span>
        </>
      )}
      {status === 'error' && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-red-600 hover:text-red-700"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error || 'Save failed'}</span>
        </button>
      )}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd admin && npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add admin/src/components/SaveStatusIndicator.tsx
git commit -m "feat(admin): add SaveStatusIndicator component"
```

---

## Task 3: Create EmbedCodeBlock Component

**Files:**
- Create: `admin/src/components/EmbedCodeBlock.tsx`

**Step 1: Create the component**

```tsx
'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface EmbedCodeBlockProps {
  code: string;
  language?: string;
}

export function EmbedCodeBlock({ code, language = 'typescript' }: EmbedCodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    toast({
      title: 'Copied!',
      description: 'Code copied to clipboard.',
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 h-8 w-8"
        aria-label="Copy code"
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
        <code data-language={language}>{code}</code>
      </pre>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd admin && npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add admin/src/components/EmbedCodeBlock.tsx
git commit -m "feat(admin): add EmbedCodeBlock component with copy functionality"
```

---

## Task 4: Create CopyableInput Component

**Files:**
- Create: `admin/src/components/CopyableInput.tsx`

**Step 1: Create the component**

```tsx
'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface CopyableInputProps {
  value: string;
  className?: string;
}

export function CopyableInput({ value, className }: CopyableInputProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setIsCopied(true);
    toast({
      title: 'Copied!',
      description: 'Link copied to clipboard.',
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Input
        value={value}
        readOnly
        className="font-mono bg-gray-50"
      />
      <Button variant="outline" size="icon" onClick={handleCopy}>
        {isCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd admin && npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add admin/src/components/CopyableInput.tsx
git commit -m "feat(admin): add CopyableInput component for URLs"
```

---

## Task 5: Create EmbedSection Component

**Files:**
- Create: `admin/src/components/EmbedSection.tsx`

**Step 1: Create the component**

```tsx
'use client';

import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmbedCodeBlock } from './EmbedCodeBlock';
import { CopyableInput } from './CopyableInput';
import Link from 'next/link';

interface EmbedSectionProps {
  importerKey: string;
  baseUrl?: string;
}

type CodeType = 'react' | 'script';

export function EmbedSection({ importerKey, baseUrl = 'https://app.importcsv.com' }: EmbedSectionProps) {
  const [codeType, setCodeType] = useState<CodeType>('react');

  const reactCode = `import { CSVImporter } from '@importcsv/react';

export default function YourComponent() {
  return (
    <CSVImporter
      importerKey="${importerKey}"
      onComplete={(data) => {
        console.log('Import complete:', data);
      }}
      user={{ userId: "YOUR_USER_ID" }}
      metadata={{ source: "YOUR_APP" }}
    />
  );
}`;

  const scriptTagCode = `<!-- Add to your HTML -->
<script src="${baseUrl}/embed.js"></script>

<div id="csv-importer"></div>

<script>
  CSVImporter.init({
    element: '#csv-importer',
    importerKey: '${importerKey}',
    onComplete: function(data) {
      console.log('Import complete:', data);
    },
    user: { userId: 'YOUR_USER_ID' },
    metadata: { source: 'YOUR_APP' }
  });
</script>`;

  const shareableLink = `${baseUrl}/i/${importerKey}`;

  const iframeCode = `<iframe
  src="${baseUrl}/embed/${importerKey}"
  width="100%"
  height="600"
  frameborder="0"
  allow="clipboard-write"
></iframe>`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">2. Embed in Your App</h2>
        <p className="text-sm text-muted-foreground">Add the importer to your application</p>
      </div>

      <Tabs defaultValue="code" className="w-full">
        <TabsList>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="no-code">No-Code</TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="space-y-4 mt-4">
          <div className="flex items-center gap-4">
            <Select value={codeType} onValueChange={(v) => setCodeType(v as CodeType)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="react">React</SelectItem>
                <SelectItem value="script">Script Tag</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <EmbedCodeBlock
            code={codeType === 'react' ? reactCode : scriptTagCode}
            language={codeType === 'react' ? 'typescript' : 'html'}
          />

          <Link
            href="/docs/integration"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View full documentation
            <ExternalLink className="h-3 w-3" />
          </Link>
        </TabsContent>

        <TabsContent value="no-code" className="space-y-6 mt-4">
          {/* Shareable Link */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Shareable Link</Label>
              <p className="text-sm text-muted-foreground">
                Send this link to anyone who needs to import data
              </p>
            </div>
            <CopyableInput value={shareableLink} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(shareableLink, '_blank')}
            >
              Open in new tab
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>

          {/* Iframe Embed */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Iframe Embed</Label>
              <p className="text-sm text-muted-foreground">
                Embed directly in any website or CMS
              </p>
            </div>
            <EmbedCodeBlock code={iframeCode} language="html" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd admin && npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add admin/src/components/EmbedSection.tsx
git commit -m "feat(admin): add EmbedSection with Code/No-Code tabs"
```

---

## Task 6: Create SchemaSection Component

**Files:**
- Create: `admin/src/components/SchemaSection.tsx`

**Step 1: Create the component**

```tsx
'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImporterField } from './AddColumnForm';
import ColumnManager from './ColumnManager';

interface SchemaSectionProps {
  columns: ImporterField[];
  onColumnsChange: (columns: ImporterField[]) => void;
}

export function SchemaSection({ columns, onColumnsChange }: SchemaSectionProps) {
  const handleAddColumn = (field: ImporterField) => {
    onColumnsChange([...columns, field]);
  };

  const handleEditColumn = (index: number, field: ImporterField) => {
    const updated = [...columns];
    updated[index] = field;
    onColumnsChange(updated);
  };

  const handleDeleteColumn = (index: number) => {
    onColumnsChange(columns.filter((_, i) => i !== index));
  };

  const isEmpty = columns.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">1. Define Your Schema</h2>
        <p className="text-sm text-muted-foreground">What columns should users import?</p>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">No columns defined yet</p>
            <p className="text-sm text-muted-foreground">
              Define the data structure your users will import.
            </p>
            <ColumnManager
              columns={[]}
              onAddColumn={handleAddColumn}
              onEditColumn={handleEditColumn}
              onDeleteColumn={handleDeleteColumn}
              emptyStateButton={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Column
                </Button>
              }
            />
          </div>
        </div>
      ) : (
        <ColumnManager
          columns={columns}
          onAddColumn={handleAddColumn}
          onEditColumn={handleEditColumn}
          onDeleteColumn={handleDeleteColumn}
        />
      )}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd admin && npm run typecheck`
Expected: May fail - we need to update ColumnManager to accept emptyStateButton prop

---

## Task 7: Update ColumnManager for Empty State Button

**Files:**
- Modify: `admin/src/components/ColumnManager.tsx`

**Step 1: Read current ColumnManager**

Run: `cat admin/src/components/ColumnManager.tsx`

**Step 2: Add emptyStateButton prop**

Update the interface and component to accept an optional `emptyStateButton` prop. The exact edit will depend on the current file structure, but the change should:

1. Add to interface:
```typescript
interface ColumnManagerProps {
  columns: ImporterField[];
  onAddColumn: (field: ImporterField) => void;
  onEditColumn: (index: number, field: ImporterField) => void;
  onDeleteColumn: (index: number) => void;
  emptyStateButton?: React.ReactNode;
}
```

2. Use the prop in the add button area when columns is empty

**Step 3: Verify TypeScript compiles**

Run: `cd admin && npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add admin/src/components/ColumnManager.tsx admin/src/components/SchemaSection.tsx
git commit -m "feat(admin): add SchemaSection with empty state"
```

---

## Task 8: Create AdvancedSettings Component

**Files:**
- Create: `admin/src/components/AdvancedSettings.tsx`

**Step 1: Create the component**

```tsx
'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import CollapsibleSection from './CollapsibleSection';
import { Settings } from 'lucide-react';

interface AdvancedSettingsProps {
  name: string;
  onNameChange: (name: string) => void;
  webhookEnabled: boolean;
  onWebhookEnabledChange: (enabled: boolean) => void;
  webhookUrl: string;
  onWebhookUrlChange: (url: string) => void;
  webhookError?: string | null;
  includeUnmatchedColumns: boolean;
  onIncludeUnmatchedColumnsChange: (include: boolean) => void;
  filterInvalidRows: boolean;
  onFilterInvalidRowsChange: (filter: boolean) => void;
  disableOnInvalidRows: boolean;
  onDisableOnInvalidRowsChange: (disable: boolean) => void;
  darkMode: boolean;
  onDarkModeChange: (darkMode: boolean) => void;
}

export function AdvancedSettings({
  name,
  onNameChange,
  webhookEnabled,
  onWebhookEnabledChange,
  webhookUrl,
  onWebhookUrlChange,
  webhookError,
  includeUnmatchedColumns,
  onIncludeUnmatchedColumnsChange,
  filterInvalidRows,
  onFilterInvalidRowsChange,
  disableOnInvalidRows,
  onDisableOnInvalidRowsChange,
  darkMode,
  onDarkModeChange,
}: AdvancedSettingsProps) {
  return (
    <CollapsibleSection
      title="Advanced Settings"
      description="Webhook, processing rules, appearance"
      icon={<Settings className="h-5 w-5" />}
      defaultOpen={false}
    >
      <div className="space-y-8">
        {/* Importer Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Importer Details
          </h3>
          <div className="space-y-2">
            <Label htmlFor="importer-name">Name</Label>
            <Input
              id="importer-name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Enter importer name"
              className="max-w-md"
            />
          </div>
        </div>

        {/* Webhook */}
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Webhook
          </h3>

          <div className="flex items-center justify-between">
            <Label htmlFor="webhook-enabled">Enable Webhook</Label>
            <Switch
              id="webhook-enabled"
              checked={webhookEnabled}
              onCheckedChange={onWebhookEnabledChange}
            />
          </div>

          {webhookEnabled && (
            <div className="space-y-2">
              <Label htmlFor="webhook-url">
                Webhook URL
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => onWebhookUrlChange(e.target.value)}
                placeholder="https://api.example.com/webhook"
                className={webhookError ? 'border-red-500' : ''}
              />
              {webhookError && (
                <p className="text-sm text-red-500">{webhookError}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Data will be sent here after import completes
              </p>
            </div>
          )}
        </div>

        {/* Processing Rules */}
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Processing Rules
          </h3>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Label>Include unmatched columns</Label>
              <p className="text-sm text-muted-foreground">
                Import columns even if they don&apos;t match schema
              </p>
            </div>
            <Switch
              checked={includeUnmatchedColumns}
              onCheckedChange={onIncludeUnmatchedColumnsChange}
            />
          </div>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Label>Filter invalid rows</Label>
              <p className="text-sm text-muted-foreground">
                Skip rows that fail validation
              </p>
            </div>
            <Switch
              checked={filterInvalidRows}
              onCheckedChange={onFilterInvalidRowsChange}
            />
          </div>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Label>Block import on invalid rows</Label>
              <p className="text-sm text-muted-foreground">
                Require all rows to pass validation
              </p>
            </div>
            <Switch
              checked={disableOnInvalidRows}
              onCheckedChange={onDisableOnInvalidRowsChange}
            />
          </div>
        </div>

        {/* Appearance */}
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Appearance
          </h3>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <Label>Dark mode</Label>
              <p className="text-sm text-muted-foreground">
                Use dark theme for the importer UI
              </p>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={onDarkModeChange}
            />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd admin && npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add admin/src/components/AdvancedSettings.tsx
git commit -m "feat(admin): add AdvancedSettings consolidated component"
```

---

## Task 9: Create ImporterDetailHeader Component

**Files:**
- Create: `admin/src/components/ImporterDetailHeader.tsx`

**Step 1: Create the component**

```tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ExternalLink,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import type { SaveStatus } from '@/hooks/useAutoSave';

interface ImporterDetailHeaderProps {
  name: string;
  importerId: string;
  saveStatus: SaveStatus;
  saveError: string | null;
  onRetry: () => void;
  onDelete: () => Promise<void>;
}

export function ImporterDetailHeader({
  name,
  importerId,
  saveStatus,
  saveError,
  onRetry,
  onDelete,
}: ImporterDetailHeaderProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      router.push('/importers');
    } catch {
      // Error handling done in parent
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link
        href="/importers"
        className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Importers
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{name}</h1>

        <div className="flex items-center gap-3">
          <SaveStatusIndicator
            status={saveStatus}
            error={saveError}
            onRetry={onRetry}
          />

          <Button
            variant="outline"
            onClick={() => router.push(`/importers/${importerId}/preview`)}
          >
            Preview
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
              >
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Importer
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this importer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the importer and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd admin && npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add admin/src/components/ImporterDetailHeader.tsx
git commit -m "feat(admin): add ImporterDetailHeader with save status"
```

---

## Task 10: Rewrite Importer Detail Page

**Files:**
- Modify: `admin/src/app/(dashboard)/importers/[id]/page.tsx`

**Step 1: Backup current file**

```bash
cp admin/src/app/(dashboard)/importers/[id]/page.tsx admin/src/app/(dashboard)/importers/[id]/page.tsx.backup
```

**Step 2: Rewrite the page**

Replace the entire file with:

```tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { importersApi } from '@/utils/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { ImporterDetailHeader } from '@/components/ImporterDetailHeader';
import { SchemaSection } from '@/components/SchemaSection';
import { EmbedSection } from '@/components/EmbedSection';
import { AdvancedSettings } from '@/components/AdvancedSettings';
import { ImporterField } from '@/components/AddColumnForm';

interface Importer {
  id: string;
  key: string;
  name: string;
  description?: string;
  fields: ImporterField[];
  webhook_url?: string;
  webhook_enabled: boolean;
  include_unmatched_columns: boolean;
  filter_invalid_rows: boolean;
  disable_on_invalid_rows: boolean;
  dark_mode?: boolean;
  created_at: string;
  updated_at?: string;
}

interface ImporterFormData {
  name: string;
  fields: ImporterField[];
  webhookEnabled: boolean;
  webhookUrl: string;
  includeUnmatchedColumns: boolean;
  filterInvalidRows: boolean;
  disableOnInvalidRows: boolean;
  darkMode: boolean;
}

export default function ImporterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const importerId = params.id as string;

  // Loading and error states
  const [importer, setImporter] = useState<Importer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ImporterFormData>({
    name: '',
    fields: [],
    webhookEnabled: false,
    webhookUrl: '',
    includeUnmatchedColumns: false,
    filterInvalidRows: false,
    disableOnInvalidRows: false,
    darkMode: false,
  });

  // Validate before save
  const validateForm = useCallback((): boolean => {
    if (formData.webhookEnabled && !formData.webhookUrl.trim()) {
      setWebhookError('Webhook URL is required when webhook is enabled');
      return false;
    }
    setWebhookError(null);
    return true;
  }, [formData.webhookEnabled, formData.webhookUrl]);

  // Save function for auto-save
  const handleSave = useCallback(async (data: ImporterFormData) => {
    if (!validateForm()) {
      throw new Error('Validation failed');
    }

    await importersApi.updateImporter(importerId, {
      name: data.name,
      fields: data.fields,
      webhook_enabled: data.webhookEnabled,
      webhook_url: data.webhookUrl,
      include_unmatched_columns: data.includeUnmatchedColumns,
      filter_invalid_rows: data.filterInvalidRows,
      disable_on_invalid_rows: data.disableOnInvalidRows,
      dark_mode: data.darkMode,
    });
  }, [importerId, validateForm]);

  // Auto-save hook
  const { status: saveStatus, error: saveError, retry } = useAutoSave({
    data: formData,
    onSave: handleSave,
    debounceMs: 1500,
    enabled: importer !== null,
  });

  // Fetch importer data
  useEffect(() => {
    const fetchImporter = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await importersApi.getImporter(importerId);
        setImporter(data);
        setFormData({
          name: data.name,
          fields: data.fields,
          webhookEnabled: data.webhook_enabled,
          webhookUrl: data.webhook_url || '',
          includeUnmatchedColumns: data.include_unmatched_columns,
          filterInvalidRows: data.filter_invalid_rows,
          disableOnInvalidRows: data.disable_on_invalid_rows,
          darkMode: data.dark_mode || false,
        });
      } catch (err: unknown) {
        let errorMessage = 'Failed to load importer';
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosError = err as { response?: { data?: { detail?: string } } };
          if (axiosError.response?.data?.detail) {
            errorMessage = axiosError.response.data.detail;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImporter();
  }, [importerId]);

  // Delete handler
  const handleDelete = async () => {
    await importersApi.deleteImporter(importerId);
    toast({
      title: 'Deleted',
      description: 'Importer has been deleted.',
    });
  };

  // Update helpers
  const updateField = <K extends keyof ImporterFormData>(
    key: K,
    value: ImporterFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (key === 'webhookUrl' || key === 'webhookEnabled') {
      setWebhookError(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading importer...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !importer) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error || 'Importer not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 pb-12">
      <ImporterDetailHeader
        name={formData.name}
        importerId={importerId}
        saveStatus={saveStatus}
        saveError={saveError}
        onRetry={retry}
        onDelete={handleDelete}
      />

      <div className="space-y-8">
        {/* Section 1: Schema */}
        <section className="p-6 bg-white border rounded-lg">
          <SchemaSection
            columns={formData.fields}
            onColumnsChange={(fields) => updateField('fields', fields)}
          />
        </section>

        {/* Section 2: Embed */}
        <section className="p-6 bg-white border rounded-lg">
          <EmbedSection importerKey={importer.key} />
        </section>

        {/* Advanced Settings */}
        <AdvancedSettings
          name={formData.name}
          onNameChange={(name) => updateField('name', name)}
          webhookEnabled={formData.webhookEnabled}
          onWebhookEnabledChange={(enabled) => updateField('webhookEnabled', enabled)}
          webhookUrl={formData.webhookUrl}
          onWebhookUrlChange={(url) => updateField('webhookUrl', url)}
          webhookError={webhookError}
          includeUnmatchedColumns={formData.includeUnmatchedColumns}
          onIncludeUnmatchedColumnsChange={(v) => updateField('includeUnmatchedColumns', v)}
          filterInvalidRows={formData.filterInvalidRows}
          onFilterInvalidRowsChange={(v) => updateField('filterInvalidRows', v)}
          disableOnInvalidRows={formData.disableOnInvalidRows}
          onDisableOnInvalidRowsChange={(v) => updateField('disableOnInvalidRows', v)}
          darkMode={formData.darkMode}
          onDarkModeChange={(v) => updateField('darkMode', v)}
        />
      </div>
    </div>
  );
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd admin && npm run typecheck`
Expected: PASS (may have minor fixes needed)

**Step 4: Manual test**

1. Run: `docker-compose up -d`
2. Open: `http://localhost:3000/importers`
3. Click into an existing importer
4. Verify:
   - Header shows name, Preview button, actions menu
   - Schema section shows columns or empty state
   - Embed section has Code/No-Code tabs working
   - Advanced Settings collapses/expands
   - Changes trigger auto-save (watch status indicator)

**Step 5: Commit**

```bash
git add admin/src/app/(dashboard)/importers/[id]/page.tsx
git commit -m "feat(admin): redesign importer detail page UX

- Replace 5 collapsibles with focused layout
- Schema and Embed always visible
- Add Code/No-Code tabs for embed options
- Auto-save with status indicator
- Consolidate settings into Advanced Settings"
```

---

## Task 11: Clean Up Unused Code

**Files:**
- Review: `admin/src/components/ImporterColumnsManager.tsx`
- Potentially remove if SchemaSection replaces it

**Step 1: Check if ImporterColumnsManager is still used elsewhere**

Run: `grep -r "ImporterColumnsManager" admin/src --include="*.tsx" --include="*.ts"`

**Step 2: If only used in old page (now replaced)**

Delete the file and remove any imports:

```bash
rm admin/src/components/ImporterColumnsManager.tsx
```

**Step 3: Verify build still works**

Run: `cd admin && npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add -A
git commit -m "chore(admin): remove unused ImporterColumnsManager"
```

---

## Task 12: Final Verification

**Step 1: Full typecheck**

Run: `cd admin && npm run typecheck`
Expected: PASS

**Step 2: Lint check**

Run: `cd admin && npm run lint`
Expected: PASS (or only pre-existing warnings)

**Step 3: Build check**

Run: `cd admin && npm run build`
Expected: PASS

**Step 4: Manual end-to-end test**

1. Create new importer via UI
2. Land on detail page → verify empty schema state shows
3. Add a column → verify it appears in table
4. Change to No-Code tab → verify shareable link and iframe
5. Expand Advanced Settings → change a toggle
6. Watch for "Saving..." → "Saved" indicator
7. Refresh page → verify changes persisted
8. Delete importer → verify redirect to list

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore(admin): final cleanup for import detail UX redesign"
```

---

## Summary of Files Created/Modified

### New Files
- `admin/src/hooks/useAutoSave.ts`
- `admin/src/components/SaveStatusIndicator.tsx`
- `admin/src/components/EmbedCodeBlock.tsx`
- `admin/src/components/CopyableInput.tsx`
- `admin/src/components/EmbedSection.tsx`
- `admin/src/components/SchemaSection.tsx`
- `admin/src/components/AdvancedSettings.tsx`
- `admin/src/components/ImporterDetailHeader.tsx`

### Modified Files
- `admin/src/components/ColumnManager.tsx` (add emptyStateButton prop)
- `admin/src/app/(dashboard)/importers/[id]/page.tsx` (complete rewrite)

### Potentially Removed
- `admin/src/components/ImporterColumnsManager.tsx` (if no longer needed)
