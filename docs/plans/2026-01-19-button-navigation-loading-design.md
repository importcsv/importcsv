# Button Navigation Loading States

## Problem

Clicking buttons that navigate to new pages (e.g., "Create Importer") provides no immediate feedback. Users experience a jarring delay with no indication that their click registered.

## Solution

Extend the existing `<Button>` component with an `href` prop that automatically handles navigation with loading state.

## API

```tsx
interface ButtonProps {
  // ... existing props (variant, size, disabled, etc.)

  href?: string;              // Internal route to navigate to
  loadingText?: string;       // Text shown during navigation (default: "Loading...")
}
```

### Usage

```tsx
// Simple navigation
<Button href="/importers/new">Create Importer</Button>

// With custom loading text
<Button href="/importers/new" loadingText="Creating...">
  Create Importer
</Button>

// Still works as regular button
<Button onClick={handleSave}>Save</Button>

// Can combine - onClick runs first, then navigates
<Button href="/next-step" onClick={trackAnalytics}>
  Continue
</Button>
```

## Behavior

1. User clicks button
2. Button immediately shows spinner + loadingText, becomes disabled
3. `onClick` runs if provided (can be async)
4. `router.push(href)` executes
5. Spinner stays until component unmounts (page transition)

## Implementation

### Changes to `admin/src/components/ui/button.tsx`

```tsx
"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ... existing buttonVariants ...

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  href?: string;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, href, loadingText = "Loading...", onClick, disabled, children, ...props }, ref) => {
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

    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || isNavigating;

    // asChild not supported with href (would break navigation logic)
    if (asChild && href) {
      console.warn("Button: asChild prop is ignored when href is provided");
    }

    if (asChild && !href) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
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
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
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

export { Button, buttonVariants };
```

### Edge Cases

| Case | Handling |
|------|----------|
| Double-click | Prevented via `disabled={isNavigating}` |
| External links | Detect `http` prefix, use `window.location` |
| onClick + href | Run onClick first (await if async), then navigate |
| Navigation error | Reset `isNavigating` to false |
| Back button | Component unmounts cleanly |
| asChild + href | Log warning, ignore asChild |

## Migration

Find and replace pattern across admin codebase:

```tsx
// Before
<Button onClick={() => router.push('/path')}>Label</Button>

// After
<Button href="/path">Label</Button>
```

### Files to Update

1. `app/(dashboard)/importers/page.tsx` - "Create Importer" button
2. `app/(dashboard)/imports/page.tsx` - Any navigation buttons
3. `app/(dashboard)/settings/page.tsx` - Any navigation buttons
4. `components/Sidebar.tsx` - If using Button for nav items
5. Any other `router.push` inside Button onClick handlers

## Testing

- Click button → spinner appears immediately
- Click disabled button → no action
- Rapid clicks → only one navigation
- External link → opens in same tab
- onClick + href → onClick completes before navigation
