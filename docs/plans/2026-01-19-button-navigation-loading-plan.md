# Button Navigation Loading States - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add immediate loading feedback to all navigation buttons across the admin dashboard.

**Architecture:** Extend the existing `<Button>` component with an `href` prop that automatically handles navigation with loading state. Migration involves replacing `onClick={() => router.push(...)}` patterns with `href="..."`.

**Tech Stack:** React, Next.js App Router, shadcn/ui Button, Lucide icons (Loader2)

---

## Task 1: Update Button Component

**Files:**
- Modify: `admin/src/components/ui/button.tsx`

**Step 1: Add "use client" directive and imports**

Add at top of file:

```tsx
"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
```

**Step 2: Update ButtonProps interface**

Replace the inline type with a named interface after `buttonVariants`:

```tsx
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  href?: string;
  loadingText?: string;
}
```

**Step 3: Replace Button function with new implementation**

Replace the entire `Button` function with:

```tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      href,
      loadingText = "Loading...",
      onClick,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const [isNavigating, setIsNavigating] = React.useState(false);
    const router = useRouter();

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (href) {
        e.preventDefault();
        setIsNavigating(true);

        try {
          if (onClick) {
            await onClick(e);
          }

          if (href.startsWith("http")) {
            window.location.href = href;
          } else {
            router.push(href);
          }
        } catch (error) {
          setIsNavigating(false);
          throw error;
        }
      } else {
        onClick?.(e);
      }
    };

    const isDisabled = disabled || isNavigating;

    // asChild not supported with href (would break navigation logic)
    if (asChild && href) {
      console.warn("Button: asChild prop is ignored when href is provided");
    }

    if (asChild && !href) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref as React.Ref<HTMLElement>}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        onClick={handleClick}
        {...props}
      >
        {isNavigating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
```

**Step 4: Verify build passes**

Run: `cd /Users/abhishekray/Projects/importcsv/importcsv/admin && npm run build`

Expected: Build completes without errors.

**Step 5: Commit**

```bash
git add admin/src/components/ui/button.tsx
git commit -m "feat(admin): add href prop to Button for navigation with loading state"
```

---

## Task 2: Migrate ImportersPage - Create Importer Button

**Files:**
- Modify: `admin/src/app/(dashboard)/importers/page.tsx:722-727`

**Step 1: Find and update the Create Importer button**

Replace:
```tsx
<Button
  className="font-medium"
  onClick={() => router.push('/importers/new')}
>
  Create Importer
</Button>
```

With:
```tsx
<Button
  className="font-medium"
  href="/importers/new"
>
  Create Importer
</Button>
```

**Step 2: Update EmptyState action (line 744)**

The EmptyState component uses an `onClick` prop. Check if it passes to Button or handles differently.

Look at line 738-746:
```tsx
<EmptyState
  icon={FileSpreadsheet}
  title="No importers yet"
  description="Create your first importer to start accepting CSV uploads from your users."
  action={{
    label: "Create Importer",
    onClick: () => router.push("/importers/new")
  }}
  tip="..."
/>
```

This requires updating EmptyState component (Task 3).

**Step 3: Update table row click (line 764-767)**

This is an `<a>` tag, not a Button. Leave as-is for now.

**Step 4: Verify build passes**

Run: `cd /Users/abhishekray/Projects/importcsv/importcsv/admin && npm run build`

Expected: Build completes without errors.

**Step 5: Manual test**

1. Start dev server: `cd admin && npm run dev`
2. Navigate to http://localhost:3000/importers
3. Click "Create Importer" button
4. Verify: Button shows spinner + "Loading..." immediately
5. Verify: Navigation completes to /importers/new

**Step 6: Commit**

```bash
git add admin/src/app/\(dashboard\)/importers/page.tsx
git commit -m "refactor(admin): use href prop for Create Importer button"
```

---

## Task 3: Update EmptyState Component

**Files:**
- Modify: `admin/src/components/EmptyState.tsx`

**Step 1: Read current EmptyState implementation**

Check if it accepts `href` in action prop or only `onClick`.

**Step 2: Update action prop type**

Change action type from:
```tsx
action?: {
  label: string;
  onClick: () => void;
};
```

To:
```tsx
action?: {
  label: string;
  onClick?: () => void;
  href?: string;
};
```

**Step 3: Update Button usage in EmptyState**

Replace:
```tsx
<Button onClick={action.onClick}>{action.label}</Button>
```

With:
```tsx
<Button href={action.href} onClick={action.onClick}>{action.label}</Button>
```

**Step 4: Update importers/page.tsx EmptyState usage**

Replace:
```tsx
action={{
  label: "Create Importer",
  onClick: () => router.push("/importers/new")
}}
```

With:
```tsx
action={{
  label: "Create Importer",
  href: "/importers/new"
}}
```

**Step 5: Verify build passes**

Run: `cd /Users/abhishekray/Projects/importcsv/importcsv/admin && npm run build`

**Step 6: Commit**

```bash
git add admin/src/components/EmptyState.tsx admin/src/app/\(dashboard\)/importers/page.tsx
git commit -m "refactor(admin): support href in EmptyState action"
```

---

## Task 4: Migrate ImporterDetailHeader - Preview Button

**Files:**
- Modify: `admin/src/components/ImporterDetailHeader.tsx:92-98`

**Step 1: Update Preview button**

Replace:
```tsx
<Button
  variant="outline"
  onClick={() => router.push(`/importers/${importerId}/preview`)}
>
  Preview
  <ExternalLink className="ml-2 h-4 w-4" />
</Button>
```

With:
```tsx
<Button
  variant="outline"
  href={`/importers/${importerId}/preview`}
  loadingText="Loading preview..."
>
  Preview
  <ExternalLink className="ml-2 h-4 w-4" />
</Button>
```

**Step 2: Remove unused router import if no longer needed**

Check if `router` is still used elsewhere in the file (line 59 in handleDelete). Keep import if so.

**Step 3: Verify build passes**

Run: `cd /Users/abhishekray/Projects/importcsv/importcsv/admin && npm run build`

**Step 4: Commit**

```bash
git add admin/src/components/ImporterDetailHeader.tsx
git commit -m "refactor(admin): use href prop for Preview button"
```

---

## Task 5: Migrate NewImporterPage - Cancel Button

**Files:**
- Modify: `admin/src/app/(dashboard)/importers/new/page.tsx:550-554`

**Step 1: Update Cancel button**

Replace:
```tsx
<Button
  variant="outline"
  onClick={() => router.push('/importers')}
>
  Cancel
</Button>
```

With:
```tsx
<Button
  variant="outline"
  href="/importers"
>
  Cancel
</Button>
```

**Step 2: Verify build passes**

Run: `cd /Users/abhishekray/Projects/importcsv/importcsv/admin && npm run build`

**Step 3: Commit**

```bash
git add admin/src/app/\(dashboard\)/importers/new/page.tsx
git commit -m "refactor(admin): use href prop for Cancel button"
```

---

## Task 6: Migrate DashboardPage - View All Button

**Files:**
- Modify: `admin/src/app/(dashboard)/dashboard/page.tsx:220-226`

**Step 1: Update View all button**

Replace:
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => router.push("/imports")}
>
  View all <ArrowRight className="w-4 h-4 ml-1" />
</Button>
```

With:
```tsx
<Button
  variant="ghost"
  size="sm"
  href="/imports"
>
  View all <ArrowRight className="w-4 h-4 ml-1" />
</Button>
```

**Step 2: Verify build passes**

Run: `cd /Users/abhishekray/Projects/importcsv/importcsv/admin && npm run build`

**Step 3: Commit**

```bash
git add admin/src/app/\(dashboard\)/dashboard/page.tsx
git commit -m "refactor(admin): use href prop for View all button"
```

---

## Task 7: Migrate ImportsPage - EmptyState

**Files:**
- Modify: `admin/src/app/(dashboard)/imports/page.tsx:131`

**Step 1: Update EmptyState action**

Replace:
```tsx
action={{
  label: "...",
  onClick: () => router.push("/importers")
}}
```

With:
```tsx
action={{
  label: "...",
  href: "/importers"
}}
```

**Step 2: Verify build passes**

Run: `cd /Users/abhishekray/Projects/importcsv/importcsv/admin && npm run build`

**Step 3: Commit**

```bash
git add admin/src/app/\(dashboard\)/imports/page.tsx
git commit -m "refactor(admin): use href prop for imports EmptyState action"
```

---

## Task 8: Final Verification

**Step 1: Full build check**

Run: `cd /Users/abhishekray/Projects/importcsv/importcsv/admin && npm run build`

Expected: Build completes without errors.

**Step 2: Lint check**

Run: `cd /Users/abhishekray/Projects/importcsv/importcsv/admin && npm run lint`

Expected: No lint errors.

**Step 3: Manual smoke test**

Start dev server and test each migrated button:

1. `/importers` - "Create Importer" button → shows spinner
2. `/importers` (empty state) - "Create Importer" button → shows spinner
3. `/importers/[id]` - "Preview" button → shows spinner
4. `/importers/new` - "Cancel" button → shows spinner
5. `/dashboard` - "View all" button → shows spinner
6. `/imports` (empty state) - action button → shows spinner

**Step 4: Final commit (if any cleanup needed)**

```bash
git add -A
git commit -m "chore(admin): cleanup unused router imports after href migration"
```

---

## Summary

| Task | File | Change |
|------|------|--------|
| 1 | `button.tsx` | Add href + loading state support |
| 2 | `importers/page.tsx` | Migrate Create Importer button |
| 3 | `EmptyState.tsx` | Support href in action prop |
| 4 | `ImporterDetailHeader.tsx` | Migrate Preview button |
| 5 | `importers/new/page.tsx` | Migrate Cancel button |
| 6 | `dashboard/page.tsx` | Migrate View all button |
| 7 | `imports/page.tsx` | Migrate EmptyState action |
| 8 | - | Final verification |
