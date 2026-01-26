<div align="center">

# @importcsv/react

**CSV imports for React**

[![npm version](https://img.shields.io/npm/v/@importcsv/react.svg)](https://www.npmjs.com/package/@importcsv/react)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@importcsv/react)](https://bundlephobia.com/package/@importcsv/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

[Demo](https://demo.importcsv.com) • [Docs](https://docs.importcsv.com)

</div>

## Install

```bash
npm install @importcsv/react zod
```

## Quick Start

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
        onComplete={(result) => console.log(result.rows)}
      />
    </>
  );
}
```

## Features

- **Column mapping** — Auto-matches headers to your schema
- **Zod validation** — Type-safe with automatic error messages
- **Large files** — Virtual scrolling handles 100k+ rows
- **~100KB gzipped** — Styles included

**File formats:** CSV, TSV, XLS, XLSX (Excel requires `npm install xlsx`)

**Frameworks:** React 16–19, Preact, Next.js

## Theming

```tsx
<CSVImporter theme="dark" primaryColor="#10b981" />
```

Presets: `default`, `minimal`, `modern`, `compact`, `dark`, `corporate`, `playful`

## Next.js / Preact

```tsx
// Next.js App Router
'use client';
import { CSVImporter } from '@importcsv/react';

// Preact
import { CSVImporter } from '@importcsv/react/preact';
```

## AI Features (Backend Required)

With the [ImportCSV backend](https://github.com/importcsv/importcsv/tree/main/backend):

- AI column matching
- AI error fixing
- Natural language transforms

## Links

- [Documentation](https://docs.importcsv.com)
- [GitHub](https://github.com/importcsv/importcsv)
- [Issues](https://github.com/importcsv/importcsv/issues)

## License

MIT
