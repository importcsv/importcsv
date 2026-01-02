<div align="center">

# @importcsv/react

**CSV imports for React**

[![npm version](https://img.shields.io/npm/v/@importcsv/react.svg)](https://www.npmjs.com/package/@importcsv/react)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@importcsv/react)](https://bundlephobia.com/package/@importcsv/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

[Demo](https://demo.importcsv.com) • [Docs](https://docs.importcsv.com)

</div>

## What it does

- **Column mapping** - Auto-matches columns, users fix the rest
- **Validation** - Required, unique, email, regex, custom
- **Large files** - Virtual scrolling handles 10k+ rows
- **~125KB gzipped**

Optional with backend: AI column matching, AI error fixing, natural language transforms.

## Quick Start

```bash
npm install @importcsv/react
```

```tsx
import { useState } from 'react';
import { CSVImporter } from '@importcsv/react';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Import CSV</button>

      <CSVImporter
        schema={schema}
        modalIsOpen={isOpen}
        modalOnCloseTriggered={() => setIsOpen(false)}
        onComplete={(rows) => console.log(rows)}
      />
    </>
  );
}
```

Zod handles validation automatically. No need to define validators separately.

## Features

**File handling**
- CSV, TSV, XLS, XLSX
- Automatic encoding detection
- Header row detection

**Validation**
- Required, unique, min/max, regex
- Email, phone, date formats
- Custom validators

**Transforms**
- trim, uppercase, lowercase, capitalize
- normalize_phone, normalize_date
- Custom functions

**Frameworks**
- React 16–19
- Preact
- Next.js (App & Pages Router)

**Theming**
- 7 presets: default, minimal, modern, compact, dark, corporate, playful
- Custom themes via `theme` prop
- Dark mode support

## Examples

### Next.js App Router

```tsx
'use client';
import { CSVImporter } from '@importcsv/react';
```

### Preact

```tsx
import { CSVImporter } from '@importcsv/react/preact';
```

## AI Features (Backend Required)

With the [ImportCSV backend](https://github.com/importcsv/importcsv/tree/main/backend):

- **AI column matching**
- **AI error fixing** - Automatically fix validation errors
- **Natural language transforms** - "Convert dates to MM/DD/YYYY"

## Resources

- [Documentation](https://docs.importcsv.com)
- [Issues](https://github.com/importcsv/importcsv/issues)
- [GitHub](https://github.com/importcsv/importcsv)

## License

MIT
