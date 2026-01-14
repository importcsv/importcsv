# Import Detail Page UX Redesign

## Problem

The current import detail page has too much information with equal visual weight. Users landing on the page after creating an importer don't have clear guidance on what to do next.

**Primary user goal**: First-time setup — configure schema and embed the importer.

## Design Principles

1. **Schema and Embed are primary** — everything else is secondary
2. **Progressive disclosure** — show what matters, hide complexity
3. **Clear journey** — numbered sections guide users through setup
4. **Auto-save** — no manual save friction

## New Page Structure

```
Header (minimal)
│
├── 1. Define Your Schema (always expanded)
│
├── 2. Embed in Your App (always expanded)
│       ├── Code tab (React, Script Tag)
│       └── No-Code tab (Shareable Link, Iframe)
│
└── ▸ Advanced Settings (collapsed)
        ├── Importer Details (name)
        ├── Webhook
        ├── Processing Rules
        └── Appearance
```

---

## Section 1: Header

### Design

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Importers                                         │
│                                                             │
│ My Importer Name                     Saved ✓    [Preview] [⋮]│
└─────────────────────────────────────────────────────────────┘
```

### Changes from Current

| Removed | Reason |
|---------|--------|
| Name input field | Moved to Advanced Settings (rarely changed after creation) |
| Importer key display | Key only useful inside embed code — shown there instead |

### Actions Menu (⋮)

- Rename Importer
- Delete Importer

### Auto-Save Status

| State | Display |
|-------|---------|
| Clean | `Saved ✓` (muted) |
| Saving | `Saving...` (spinner) |
| Just saved | `Saved ✓` (green flash) |
| Error | `Save failed` (red, clickable for retry) |

---

## Section 2: Define Your Schema

### Design (with columns)

```
┌─────────────────────────────────────────────────────────────┐
│  1. Define Your Schema                                      │
│  What columns should users import?                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ NAME          TYPE        REQUIRED    ACTIONS          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ email         Email       ✓           [Edit] [Delete]  │ │
│  │ first_name    Text        ✓           [Edit] [Delete]  │ │
│  │ company       Text        −           [Edit] [Delete]  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  [+ Add Column]                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Empty State (first-time user)

```
┌─────────────────────────────────────────────────────────────┐
│  1. Define Your Schema                                      │
│  What columns should users import?                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     ┌─────────────────────────────────────┐                 │
│     │                                     │                 │
│     │   No columns defined yet            │                 │
│     │                                     │                 │
│     │   Define the data structure your    │                 │
│     │   users will import.                │                 │
│     │                                     │                 │
│     │   [+ Add Your First Column]         │                 │
│     │                                     │                 │
│     └─────────────────────────────────────┘                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Decisions

- Always expanded (not collapsible)
- Numbered section header ("1.")
- Subtitle frames the task as a question
- Table format for scannable column list
- Prominent empty state for first-time users

---

## Section 3: Embed in Your App

### Code Tab

```
┌─────────────────────────────────────────────────────────────┐
│  2. Embed in Your App                                       │
│  Add the importer to your application                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┬────────────┐                                  │
│  │   Code   │  No-Code   │                                  │
│  └──────────┴────────────┘                                  │
│                                                             │
│  React ▾                                            [Copy]  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ import { CSVImporter } from '@importcsv/react';       │  │
│  │                                                       │  │
│  │ export default function YourComponent() {             │  │
│  │   return (                                            │  │
│  │     <CSVImporter                                      │  │
│  │       importerKey="imp_abc123"                        │  │
│  │       onComplete={(data) => {}}                       │  │
│  │       user={{ userId: "YOUR_USER_ID" }}               │  │
│  │     />                                                │  │
│  │   );                                                  │  │
│  │ }                                                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  → View full documentation                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### No-Code Tab

```
┌─────────────────────────────────────────────────────────────┐
│  2. Embed in Your App                                       │
│  Add the importer to your application                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┬────────────┐                                  │
│  │   Code   │  No-Code   │                                  │
│  └──────────┴────────────┘                                  │
│                                                             │
│  ┌─ SHAREABLE LINK ────────────────────────────────────┐    │
│  │                                                     │    │
│  │  Send this link to anyone who needs to import data  │    │
│  │                                                     │    │
│  │  ┌───────────────────────────────────────┐ [Copy]   │    │
│  │  │ https://app.importcsv.com/i/imp_abc123│          │    │
│  │  └───────────────────────────────────────┘          │    │
│  │                                                     │    │
│  │  [Open in new tab ↗]                                │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─ IFRAME EMBED ──────────────────────────────────────┐    │
│  │                                                     │    │
│  │  Embed directly in any website or CMS               │    │
│  │                                              [Copy] │    │
│  │  ┌───────────────────────────────────────────────┐  │    │
│  │  │ <iframe                                       │  │    │
│  │  │   src="https://app.importcsv.com/embed/..."   │  │    │
│  │  │   width="100%"                                │  │    │
│  │  │   height="600"                                │  │    │
│  │  │   frameborder="0"                             │  │    │
│  │  │ ></iframe>                                    │  │    │
│  │  └───────────────────────────────────────────────┘  │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Embed Options Matrix

| Tab | Sub-option | Use Case |
|-----|------------|----------|
| Code | React | npm package in React/Next.js apps |
| Code | Script Tag | CDN script for vanilla JS / non-React |
| No-Code | Shareable Link | Send URL via email/Slack/chat |
| No-Code | Iframe | Embed in websites, Notion, CMS platforms |

### Key Decisions

- Always expanded (not collapsible)
- Importer key embedded in snippets (no separate copy)
- Tab toggle for Code vs No-Code
- Dropdown within Code tab for React/Script Tag
- Both no-code options shown together (link first, iframe second)

---

## Section 4: Advanced Settings

### Collapsed State (default)

```
┌─────────────────────────────────────────────────────────────┐
│  ▸ Advanced Settings                                        │
│    Webhook, processing rules, appearance                    │
└─────────────────────────────────────────────────────────────┘
```

### Expanded State

```
┌─────────────────────────────────────────────────────────────┐
│  ▾ Advanced Settings                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  IMPORTER DETAILS                                           │
│  ─────────────────────────────────────────────────────────  │
│  Name                                                       │
│  ┌─────────────────────────────────────────┐                │
│  │ My Importer Name                        │                │
│  └─────────────────────────────────────────┘                │
│                                                             │
│  WEBHOOK                                                    │
│  ─────────────────────────────────────────────────────────  │
│  Enable Webhook                                    [toggle] │
│                                                             │
│  Webhook URL                                                │
│  ┌─────────────────────────────────────────┐                │
│  │ https://api.example.com/webhook         │                │
│  └─────────────────────────────────────────┘                │
│  Data will be sent here after import completes              │
│                                                             │
│  PROCESSING RULES                                           │
│  ─────────────────────────────────────────────────────────  │
│  Include unmatched columns                         [toggle] │
│  Import columns even if they don't match schema             │
│                                                             │
│  Filter invalid rows                               [toggle] │
│  Skip rows that fail validation                             │
│                                                             │
│  Block import on invalid rows                      [toggle] │
│  Require all rows to pass validation                        │
│                                                             │
│  APPEARANCE                                                 │
│  ─────────────────────────────────────────────────────────  │
│  Dark mode                                         [toggle] │
│  Use dark theme for the importer UI                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Decisions

- Single collapsible (replaces 4 separate sections)
- Collapsed by default
- Grouped by category with section headers
- Name field moved here from header
- Subtitle hints at contents without expanding

---

## Auto-Save Behavior

### Implementation

1. **Debounced saves**: Trigger save 1.5 seconds after last change
2. **Optimistic UI**: Apply changes immediately, save in background
3. **Status in header**: Small indicator next to Preview button

### Error Handling

- **Validation errors**: Show inline immediately, block save until fixed
- **Network errors**: Show "Save failed" in header, clickable for retry
- **Conflict errors**: Prompt to reload if data changed elsewhere

### Validation Example

```
Webhook URL
┌─────────────────────────────────────────┐
│                                         │
└─────────────────────────────────────────┘
⚠ Required when webhook is enabled
```

---

## Migration from Current Design

### Removed

| Element | New Location |
|---------|--------------|
| Name input in header | Advanced Settings |
| Importer key with copy button | Embedded in code snippets |
| Sticky save bar | Replaced by auto-save |
| 4 separate collapsible sections | Consolidated into 1 Advanced Settings |

### Changed

| Element | Change |
|---------|--------|
| Data Configuration section | Now "1. Define Your Schema", always expanded |
| Developer Resources section | Now "2. Embed in Your App", always expanded |
| Integration section | Moved to Advanced Settings > Webhook |
| Processing Rules section | Moved to Advanced Settings > Processing Rules |

### Added

| Element | Purpose |
|---------|---------|
| Code/No-Code tabs | Clear choice for technical vs non-technical users |
| Script Tag option | Support non-React applications |
| Shareable Link | Direct URL for no-code embedding |
| Iframe embed | Website embedding without code |
| Auto-save status | Real-time feedback in header |

---

## Success Metrics

- **Time to first embed**: How quickly new users get to a working integration
- **Schema completion rate**: % of importers with at least one column defined
- **Embed code copy rate**: % of users who copy embed code
- **Advanced settings usage**: Track what % of users expand (validates it should be collapsed)
