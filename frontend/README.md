<div align="center">

# @importcsv/react

**The modern CSV importer for React applications**

[![npm version](https://img.shields.io/npm/v/@importcsv/react.svg)](https://www.npmjs.com/package/@importcsv/react)
[![npm downloads](https://img.shields.io/npm/dm/@importcsv/react.svg)](https://www.npmjs.com/package/@importcsv/react)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@importcsv/react)](https://bundlephobia.com/package/@importcsv/react)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

[Live Demo](https://demo.importcsv.com) • [Documentation](https://docs.importcsv.com)

</div>

## Stop wrestling with CSV imports

Every developer has been there. Users upload CSVs with columns in the wrong order, dates in different formats, and data that needs validation. You end up building the same import flow again and again.

**ImportCSV handles it all for you:**
- 🎯 **Smart column mapping** - AI-powered field matching
- ✨ **One-click error fixing** - Transform and validate data automatically
- ⚡ **10,000+ rows?** No problem - virtual scrolling keeps it fast
- 📦 **Tiny footprint** - ~100KB gzipped, including styles

## Quick Start

```bash
npm install @importcsv/react
```

```tsx
import { CSVImporter } from '@importcsv/react';
import { useState } from 'react';

function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Import CSV</button>

      <CSVImporter
        modalIsOpen={isOpen}
        modalOnCloseTriggered={() => setIsOpen(false)}
        onComplete={(data) => console.log(data.rows)}
        columns={[
          { id: 'name', label: 'Name', validators: [{ type: 'required' }] },
          { id: 'email', label: 'Email', type: 'email' }
        ]}
      />
    </>
  );
}
```

**That's it!** Your users get a polished import experience with column mapping, validation, and error handling.

## Features

### 🚀 Core
- CSV, TSV, XLS, XLSX support (Excel support optional)
- Automatic encoding detection
- Header row detection
- Virtual scrolling for large files

### 🎯 Smart Mapping
- AI-powered column matching
- Fuzzy string matching

### ✨ Data Transformation
- **"Fix All Errors" button** - AI analyzes and fixes validation errors
- Natural language transformations ("convert dates to MM/DD/YYYY")
- Built-in transformers (capitalize, normalize phone, parse dates)
- Custom transformation functions

### ✅ Validation
- Required, unique, regex, min/max
- Email, phone, date formats
- Custom validators
- Real-time error display

### 🎨 Customization
- Dark mode support
- Custom CSS variables

### 📦 Framework Support
- React 16, 17, 18, 19
- Preact compatible
- Next.js (App & Pages Router)
- Vanilla JavaScript

## Examples

### Next.js App Router
```tsx
'use client';
import { CSVImporter } from '@importcsv/react';
```

### Vanilla JavaScript
```html
<script src="https://unpkg.com/@importcsv/react@latest/build/bundled/index.umd.js"></script>
<script>
  const importer = CSVImporter.createCSVImporter({
    domElement: document.getElementById('app'),
    columns: [/* ... */],
    onComplete: (data) => console.log(data)
  });

  importer.showModal();
</script>
```

### With Validation & Transformation
```tsx
columns={[
  {
    id: 'email',
    label: 'Email',
    type: 'email',
    validators: [{ type: 'required' }, { type: 'unique' }],
    transformations: [{ type: 'lowercase' }, { type: 'trim' }]
  }
]}
```

## Why ImportCSV?

| Feature | ImportCSV | Build Your Own | Other Libraries |
|---------|-----------|----------------|-----------------|
| Setup time | 5 minutes | Days/weeks | Hours |
| AI-powered fixes | ✅ | ❌ | ❌ |
| Virtual scrolling | ✅ | Maybe | Sometimes |
| Framework agnostic | ✅ | Your choice | Usually not |
| Bundle size | ~100KB | Varies | 200KB+ |
| Theming | 5 presets + custom | DIY | Limited |

## Resources

- 📚 [Documentation](https://docs.importcsv.com) - Complete guides and API reference
- 🐛 [Issues](https://github.com/importcsv/importcsv/issues) - Report bugs or request features
- ⭐ [GitHub](https://github.com/importcsv/importcsv) - Star us if you like it!

## License

MIT © [ImportCSV](https://github.com/importcsv/importcsv)

---

<div align="center">
  <sub>Built with ❤️ for developers who have better things to do than parse CSVs</sub>
</div>