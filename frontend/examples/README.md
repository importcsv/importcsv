# ImportCSV Examples

Interactive examples showcasing ImportCSV features with live testing.

## 🚀 Quick Start

```bash
cd frontend/examples
npm install
npm run dev
```

Open http://localhost:3001 to view the examples.

## 📦 How It Works

The examples app uses **Vite aliases** to import directly from the library source code:

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@importcsv/react': resolve(__dirname, '../src/index.ts'),
  }
}
```

This means:
- ✅ **No build step needed** - Changes to `frontend/src` are reflected immediately
- ✅ **Hot module reload** - Edit source files and see changes instantly
- ✅ **TypeScript support** - Full type checking and IntelliSense

## 📚 Available Examples

### 🎨 Headless Components (New!)
**File**: `examples/HeadlessExample.tsx`

Build custom CSV importers with unstyled primitives:
- No UI dependencies
- Zod schema integration
- `asChild` pattern for design system composition
- Complete control over styling

**Test Coverage**:
- Custom upload UI
- Custom validation display
- Schema-based validation
- Type inference

---

### 🛡️ Zod Schema Validation (New!)
**File**: `examples/ZodSchemaExample.tsx`

Type-safe CSV validation with Zod:
- Automatic TypeScript inference
- Runtime + compile-time validation
- Complex validation rules (refinements)
- Data transformations

**Test Coverage**:
- Schema definition
- Type inference
- Custom validation rules
- Error handling

---

### ✅ Validation & Transformation
**File**: `examples/ValidationExample.tsx`

Comprehensive validation and transformation testing:
- Pre-validation transformations (trim, uppercase)
- Post-validation transformations (capitalize, default)
- Multiple validators per column
- Error handling modes

**Test Coverage**:
- Email, phone, regex validation
- Unique and required validators
- Min/max length validation
- Transformation ordering

---

### 🚀 Large Dataset Performance
**File**: `examples/LargeFileExample.tsx`

Performance testing with large datasets:
- Virtual scrolling with 10k-100k rows
- Progressive validation
- Memory optimization
- Responsive UI

**Test Coverage**:
- Large file handling
- Virtual scrolling
- Progressive validation
- Performance metrics

---

### 🌙 Theme & Dark Mode
**File**: `examples/DarkModeExample.tsx`

Visual theming and customization:
- Dark mode support
- Theme presets
- Custom colors
- Responsive design

**Test Coverage**:
- Theme switching
- Color customization
- Dark mode
- Modal styles

---

## 🧪 Testing New Features

### 1. Make Changes to Library Source

Edit files in `frontend/src/`:

```bash
# Example: Update headless components
vim frontend/src/headless/validator.tsx
```

### 2. Test in Examples App

The dev server automatically reloads:

```bash
cd frontend/examples
npm run dev  # If not already running
```

Navigate to the relevant example and test your changes.

### 3. Add New Examples

To showcase a new feature:

#### Step 1: Create Example Component

```tsx
// frontend/examples/examples/MyNewExample.tsx
import { useState } from 'react';
import { CSVImporter } from '../../src';

export default function MyNewExample() {
  // Your example implementation
  return <div>...</div>;
}
```

#### Step 2: Update App.tsx

```tsx
// frontend/examples/App.tsx
import MyNewExample from './examples/MyNewExample';

// Add to examples array
const examples = [
  // ...existing examples,
  {
    id: 'my-new-feature' as ExampleType,
    name: 'My New Feature',
    description: 'Description of the feature',
    icon: '✨',
    color: 'from-pink-500 to-pink-600',
    badge: 'New'
  }
];

// Add to render logic
{activeExample === 'my-new-feature' && <MyNewExample />}
```

#### Step 3: Update Type Definition

```tsx
// frontend/examples/App.tsx
type ExampleType = 'validation' | 'large-file' | 'dark-mode' | 'headless' | 'zod-schema' | 'my-new-feature' | null
```

### 4. Test Production Build

```bash
npm run build
npm run preview  # Test production build locally
```

## 🔧 Configuration

### Vite Config

Key configuration in `vite.config.ts`:

```typescript
{
  resolve: {
    alias: {
      // Import from source, not built package
      '@importcsv/react': resolve(__dirname, '../src/index.ts'),

      // React compatibility shims for Preact
      'preact/compat': resolve(__dirname, '../src/shims/react-compat-shim.js'),
      'preact/hooks': 'react',
      'preact': 'react'
    }
  },
  optimizeDeps: {
    // Don't optimize local package
    exclude: ['@importcsv/react']
  },
  server: {
    port: 3001,
    fs: {
      // Allow Vite to serve parent directory
      allow: [resolve(__dirname, '..')]
    }
  }
}
```

### TypeScript Config

`tsconfig.json` extends parent config:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true
  }
}
```

## 📝 Best Practices

### 1. Sample Data

Include downloadable sample CSV in each example:

```tsx
const sampleCSV = `name,email,phone
John Doe,john@example.com,555-1234`;

const downloadSampleCSV = () => {
  const blob = new Blob([sampleCSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sample.csv';
  a.click();
  URL.revokeObjectURL(url);
};
```

### 2. Show Results

Display imported data to verify functionality:

```tsx
{data && (
  <div className="mt-4">
    <h3>Imported {data.length} rows</h3>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>
)}
```

### 3. Document Features

Add feature descriptions and usage notes:

```tsx
<div className="mb-6">
  <h2 className="text-3xl font-bold mb-2">Feature Name</h2>
  <p className="text-gray-600">
    Clear description of what this example demonstrates
  </p>
</div>
```

### 4. Error States

Show error handling and edge cases:

```tsx
{errors.length > 0 && (
  <div className="bg-red-50 p-4 rounded">
    <h3>Validation Errors</h3>
    {errors.map(error => (
      <div key={error.row}>
        Row {error.row}: {error.message}
      </div>
    ))}
  </div>
)}
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port
vite --port 3002
```

### Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Hot Reload Not Working

```bash
# Restart dev server
npm run dev
```

### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf .tsbuildinfo

# Check TypeScript config
npx tsc --noEmit
```

## 📦 Dependencies

### Runtime
- `react` - UI framework
- `react-dom` - React DOM renderer
- `zod` - Schema validation (for Zod examples)

### Development
- `vite` - Build tool and dev server
- `@vitejs/plugin-react` - React plugin for Vite
- `typescript` - Type checking
- `tailwindcss` - Utility-first CSS
- `autoprefixer` - CSS vendor prefixes
- `postcss` - CSS processing

## 🚢 Deployment

The examples app is for **development and testing only**. For production:

1. Build the main library:
   ```bash
   cd frontend
   npm run build
   ```

2. Publish to npm:
   ```bash
   npm publish
   ```

3. Use in production apps:
   ```bash
   npm install @importcsv/react
   ```

## 📚 Related Documentation

- [Main README](../../README.md) - Project overview
- [API Documentation](../../docs/api.md) - Complete API reference
- [Templates](../../templates/README.md) - Production-ready templates
- [Headless Components](../../docs/content/docs/headless.mdx) - Headless API docs
- [Zod Schemas](../../docs/content/docs/guides/zod-schemas.mdx) - Zod integration guide

---

**Need help?** Open an issue or check the [documentation](../../docs).
