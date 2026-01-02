# Column Modal Vertical Layout Design

## Summary

Replace the horizontal tab navigation in the Add/Edit Column modal with a vertical stacked layout where Basic Info is always visible and Validation/Transformation are collapsible sections.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout model | Hybrid | Basic Info always expanded; Validation/Transformation collapsible |
| Multiple open | Yes | Both collapsible sections can be open independently |
| Collapsed summary | Count + status dot | Green dot when configured, gray when empty, plus count |
| Expand/collapse | Chevron + full header clickable | Clear affordance with large click target |

## Visual Structure

### Collapsed State

```
┌─────────────────────────────────────────────────────┐
│  Add Column                                    ✕    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  BASIC INFO                           ✓ Ready │  │
│  │  ┌─────────────────┬─────────────────┐        │  │
│  │  │ Column Name     │ Display Name    │        │  │
│  │  │ [email       ]  │ [Email Address] │        │  │
│  │  └─────────────────┴─────────────────┘        │  │
│  │  Format: [Text (any value)        ▾]          │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  ▶  Validation                     ● 2 rules  │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  ▶  Transformation          ○ No transforms   │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │              + Add Column                     │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Expanded State (Validation open)

```
┌───────────────────────────────────────────────────┐
│  ▼  Validation                         ● 2 rules │
├───────────────────────────────────────────────────┤
│                                                   │
│  ADD RULE                                         │
│  [+ Required] [+ Unique] [+ Min Length] [+ Max]   │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ ✓ Required                              ✕   │  │
│  │   Custom error message (optional)           │  │
│  │   [                                    ]    │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │ ✓ Unique values only                    ✕   │  │
│  │   Custom error message (optional)           │  │
│  │   [                                    ]    │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
└───────────────────────────────────────────────────┘
```

## Implementation Approach

### Component Changes

1. **AddColumnForm.tsx** - Replace Tabs with stacked layout
   - Remove: Tabs, TabsList, TabsTrigger, TabsContent
   - Add: Collapsible from shadcn/ui
   - Basic Info section always visible
   - Validation/Transformation in collapsible containers

2. **State Management**
   ```tsx
   const [validationOpen, setValidationOpen] = useState(false);
   const [transformationOpen, setTransformationOpen] = useState(false);
   ```

3. **Collapsible Header** (inline or extracted)
   - Chevron icon (rotates on open)
   - Title text
   - Status indicator (colored dot + count)
   - Full row clickable with hover state

4. **Existing Builders** - ValidationBuilder and TransformationBuilder unchanged

### Dependencies

- shadcn/ui Collapsible component (may need to add if not present)
- ChevronRight icon from lucide-react

### Scope

- Single file change: `admin/src/components/AddColumnForm.tsx`
- ~100-150 lines modified
- No changes to ValidationBuilder or TransformationBuilder
