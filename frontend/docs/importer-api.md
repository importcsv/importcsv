# ImportCSV React - API Documentation

## What's New (v0.2.1)

✨ **34% smaller bundle size** - Now only ~68KB gzipped (down from 102KB)  
🚀 **Native Preact implementation** - Better performance with smaller runtime  
🎨 **Automatic CSS injection** - No separate CSS import needed  
📦 **75 fewer dependencies** - Faster installs, removed Radix UI (3.8MB)  
⚡ **Improved CSS isolation** - Automatic scoping without iframes  
🔄 **Smart transformation stages** - Automatic pre/post validation transformations

## Overview

The ImportCSV React component supports two modes of operation:
1. **Standalone Mode** - Frontend-only validation using the `columns` prop
2. **Backend Mode** - Server-side validation using the `importerKey` prop

## Installation

```bash
npm install @importcsv/react
```

Then import and use:

```javascript
import { CSVImporter } from '@importcsv/react';
// CSS is automatically included - no separate import needed!
```

## Component Props

### CSVImporter Component

```typescript
import { CSVImporter } from '@importcsv/react';
```

#### Required Props (one of these):

| Prop | Type | Description |
|------|------|-------------|
| `columns` | `Column[]` | Array of column definitions for standalone mode |
| `importerKey` | `string` | Unique identifier for backend mode |

#### Callback Props:

| Prop | Type | Description |
|------|------|-------------|
| `onComplete` | `(data: any) => void` | Called when import is successfully completed |
| `modalOnCloseTriggered` | `() => void` | Called when modal is closed |

#### UI Customization Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `darkMode` | `boolean` | `false` | Enable dark theme |
| `primaryColor` | `string` | `"#2563eb"` | Primary color for buttons and UI elements |
| `className` | `string` | - | Additional CSS class names |
| `customStyles` | `Record<string, string> \| string` | - | Custom CSS styles |

#### Modal Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isModal` | `boolean` | `true` | Display as modal dialog |
| `modalIsOpen` | `boolean` | `true` | Control modal open state |
| `modalCloseOnOutsideClick` | `boolean` | `false` | Close modal when clicking outside |

#### Behavior Props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showDownloadTemplateButton` | `boolean` | `false` | Show template download button |
| `skipHeaderRowSelection` | `boolean` | `false` | Skip header row selection step |
| `waitOnComplete` | `boolean` | `false` | Wait for async completion |

#### Backend Configuration Props:

| Prop | Type | Description |
|------|------|-------------|
| `backendUrl` | `string` | API endpoint URL (defaults to config) |
| `context` | `Record<string, any>` | Custom context passed to backend webhooks |

#### Localization Props:

| Prop | Type | Description |
|------|------|-------------|
| `language` | `string` | Language code (e.g., 'en', 'es') |
| `customTranslations` | `CustomTranslationResource` | Custom translation strings |

#### Demo Mode Props:

| Prop | Type | Description |
|------|------|-------------|
| `demoData` | `{ fileName: string; csvContent: string }` | Pre-populate with demo data |

## Column Schema

### Column Interface

```typescript
interface Column {
  id: string;              // Unique identifier for the column
  label: string;           // Display name for the column
  type?: ColumnType;       // Data type (default: 'string')
  validators?: Validator[]; // Validation rules
  transformations?: Transformer[]; // Data transformations (auto-staged)
  options?: string[];      // Options for 'select' type
  description?: string;    // Helper text for users
  placeholder?: string;    // Placeholder text for input
}
```

### Column Types

```typescript
type ColumnType = 
  | 'string'   // Text data (default)
  | 'number'   // Numeric values
  | 'email'    // Email addresses
  | 'date'     // Date values
  | 'phone'    // Phone numbers
  | 'select';  // Dropdown selection
```

### Validators

```typescript
type Validator = 
  | { type: 'required'; message?: string }
  | { type: 'unique'; message?: string }
  | { type: 'regex'; pattern: string; message?: string }
  | { type: 'min'; value: number; message?: string }
  | { type: 'max'; value: number; message?: string }
  | { type: 'min_length'; value: number; message?: string }
  | { type: 'max_length'; value: number; message?: string };
```

### Transformations

Transformations automatically clean and format data. They run at the optimal stage - either before or after validation - based on their type.

```typescript
type Transformer = 
  | { type: 'trim'; stage?: 'pre' | 'post' }           // Remove whitespace (auto: pre)
  | { type: 'uppercase'; stage?: 'pre' | 'post' }      // Convert to uppercase (auto: pre)
  | { type: 'lowercase'; stage?: 'pre' | 'post' }      // Convert to lowercase (auto: pre)
  | { type: 'capitalize'; stage?: 'pre' | 'post' }     // Capitalize words (auto: post)
  | { type: 'remove_special_chars'; stage?: 'pre' | 'post' } // Remove special chars (auto: pre)
  | { type: 'normalize_phone'; stage?: 'pre' | 'post' } // Format phone numbers (auto: pre)
  | { type: 'normalize_date'; format?: string; stage?: 'pre' | 'post' } // Parse dates (auto: pre)
  | { type: 'default'; value: string; stage?: 'pre' | 'post' } // Default value (auto: post)
  | { type: 'replace'; find: string; replace: string; stage?: 'pre' | 'post' } // Find/replace (auto: post)
  | { type: 'custom'; fn: (value: any) => any; stage?: 'pre' | 'post' }; // Custom function (auto: post)
```

#### Smart Auto-Detection

Transformations automatically run at the optimal stage:

**Pre-validation transformations** (clean data before validation):
- `trim` - Remove whitespace before checking required fields
- `uppercase` / `lowercase` - Normalize case before pattern matching
- `remove_special_chars` - Clean input before validation
- `normalize_phone` - Format phones before validation
- `normalize_date` - Parse dates before date validation

**Post-validation transformations** (enrich valid data):
- `capitalize` - Format text for display
- `default` - Add defaults for empty fields
- `replace` - Content modifications
- `custom` - Business logic transformations

#### Override Auto-Detection

You can explicitly control when a transformation runs:

```typescript
transformations: [
  { type: 'uppercase', stage: 'post' }, // Override: run after validation
  { type: 'custom', fn: cleanData, stage: 'pre' } // Override: run before
]
```

## Usage Examples

### Standalone Mode (Frontend-only)

```tsx
import { CSVImporter } from '@importcsv/react';
import type { Column } from '@importcsv/react';

const MyComponent = () => {
  const columns: Column[] = [
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      validators: [
        { type: 'required' },
        { type: 'unique', message: 'Email must be unique' }
      ],
      transformations: [
        { type: 'trim' },        // Auto: runs before validation
        { type: 'lowercase' }    // Auto: runs before validation
      ]
    },
    {
      id: 'name',
      label: 'Full Name',
      type: 'string',
      validators: [
        { type: 'required' },
        { type: 'min_length', value: 2 },
        { type: 'max_length', value: 100 }
      ],
      transformations: [
        { type: 'trim' },        // Auto: runs before validation
        { type: 'capitalize' }   // Auto: runs after validation
      ]
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      validators: [
        { type: 'min', value: 18, message: 'Must be 18 or older' },
        { type: 'max', value: 120 }
      ],
      transformations: [
        { type: 'trim' },                 // Auto: runs before validation
        { type: 'remove_special_chars' }  // Auto: runs before validation
      ]
    },
    {
      id: 'department',
      label: 'Department',
      type: 'select',
      options: ['Engineering', 'Sales', 'Marketing', 'HR'],
      validators: [
        { type: 'required' }
      ],
      transformations: [
        { type: 'capitalize' }   // Auto: runs after validation
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'string',
      transformations: [
        { type: 'default', value: 'active' }  // Auto: runs after validation
      ]
    }
  ];

  const handleComplete = (data) => {
    console.log('Imported data:', data);
  };

  return (
    <CSVImporter
      columns={columns}
      onComplete={handleComplete}
      primaryColor="#3b82f6"
      darkMode={false}
    />
  );
};
```

### Backend Mode (Server-driven)

```tsx
import { CSVImporter } from '@importcsv/react';

const MyComponent = () => {
  const handleComplete = (data) => {
    console.log('Import completed:', data);
  };

  return (
    <CSVImporter
      importerKey="usr_employees_import"
      onComplete={handleComplete}
      backendUrl="https://api.example.com"
      context={{ userId: 'user123', userName: 'John Doe', source: 'web-app', version: '1.0' }}
    />
  );
};
```

### Mixed Mode with Conditional Logic

```tsx
const MyComponent = ({ useBackend }) => {
  const columns = [...]; // Define columns for standalone
  
  return (
    <CSVImporter
      {...(useBackend 
        ? { importerKey: 'usr_import_key' }
        : { columns }
      )}
      onComplete={handleComplete}
    />
  );
};
```

## Common Transformation Patterns

### Employee ID Normalization
```typescript
{
  id: 'employee_id',
  label: 'Employee ID',
  validators: [
    { type: 'regex', pattern: '^EMP\\d{3,6}$' }
  ],
  transformations: [
    { type: 'trim' },        // Remove spaces: "  emp001  " → "emp001"
    { type: 'uppercase' }    // Normalize case: "emp001" → "EMP001"
  ]
}
// Result: "  emp001  " → "EMP001" (passes validation!)
```

### Phone Number Formatting
```typescript
{
  id: 'phone',
  label: 'Phone Number',
  type: 'phone',
  transformations: [
    { type: 'normalize_phone' }  // Formats: "555.123.4567" → "(555) 123-4567"
  ]
}
```

### Date Normalization
```typescript
{
  id: 'hire_date',
  label: 'Hire Date',
  type: 'date',
  transformations: [
    { type: 'normalize_date', format: 'YYYY-MM-DD' }
  ]
}
// Handles: "03/15/2023", "2023-03-15", "March 15, 2023" → "2023-03-15"
```

### Optional Fields with Defaults
```typescript
{
  id: 'status',
  label: 'Status',
  transformations: [
    { type: 'lowercase' },              // Normalize first
    { type: 'default', value: 'active' } // Then add default if empty
  ]
}
```

## Validation Rules

### Built-in Type Validation

Each column type automatically applies basic validation:

- **email**: Validates email format (user@domain.com)
- **number**: Ensures value is numeric
- **phone**: Validates phone number (minimum 10 digits)
- **date**: Validates parseable date format
- **select**: Ensures value is one of the provided options

### Custom Validators

Validators are applied in the order they are defined:

```typescript
const column: Column = {
  id: 'salary',
  label: 'Annual Salary',
  type: 'number',
  validators: [
    { type: 'required' },                    // Cannot be empty
    { type: 'min', value: 30000 },          // Minimum value
    { type: 'max', value: 500000 },         // Maximum value
  ]
};
```

### Regex Validation

For custom validation patterns:

```typescript
const column: Column = {
  id: 'product_code',
  label: 'Product Code',
  validators: [
    { 
      type: 'regex', 
      pattern: '^[A-Z]{3}-\\d{4}$',
      message: 'Format must be XXX-0000' 
    }
  ]
};
```

## Data Output Format

### Standalone Mode Output

```typescript
{
  success: true,
  data: [
    { email: 'user@example.com', name: 'John Doe', age: 30 },
    { email: 'jane@example.com', name: 'Jane Smith', age: 25 }
  ],
  num_rows: 2,
  num_columns: 3
}
```

### Backend Mode Output

The output format depends on your backend implementation. Typically:

```typescript
{
  import_id: 'imp_123456',
  status: 'completed',
  rows_imported: 100,
  rows_failed: 0,
  // Additional backend-specific fields
}
```

## Migration Guide

### From Template to Columns

If migrating from the old Template format to the new Column format:

```typescript
// Old Template format
const template = {
  name: 'Employee Import',
  fields: [
    { name: 'email', type: 'email', required: true }
  ]
};

// New Column format
const columns: Column[] = [
  {
    id: 'email',
    label: 'Email',
    type: 'email',
    validators: [
      { type: 'required' }
    ]
  }
];
```

## Best Practices

1. **Always provide meaningful labels** - Users see these in the mapping interface
2. **Use appropriate column types** - This enables automatic validation
3. **Add descriptions for complex fields** - Help users understand data requirements
4. **Set reasonable min/max values** - Prevent obviously invalid data
5. **Use unique validation for identifiers** - Prevent duplicate records
6. **Test with sample data** - Use the examples app to verify configuration

### Transformation Best Practices

1. **Order matters** - Transformations run in the order defined
2. **Pre-validate cleaning** - Use `trim`, `uppercase`, `lowercase` before validation
3. **Post-validate formatting** - Use `capitalize`, `default` after validation
4. **Normalize early** - Clean data before validation to reduce false errors
5. **Test edge cases** - Verify transformations handle empty values and special characters
6. **Override when needed** - Use explicit `stage` property for special cases

Example of good transformation ordering:
```typescript
transformations: [
  { type: 'trim' },                    // 1. Clean whitespace
  { type: 'remove_special_chars' },    // 2. Remove unwanted chars
  { type: 'uppercase' },                // 3. Normalize case
  // Validation happens here
  { type: 'default', value: 'N/A' }    // 4. Add default after validation
]
```

## TypeScript Support

The library is fully typed. Import types as needed:

```typescript
import { CSVImporter } from '@importcsv/react';
import type { 
  Column, 
  Validator, 
  Transformer,
  CSVImporterProps 
} from '@importcsv/react';
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Plain JavaScript Usage

For non-React environments, use the UMD build:

```html
<script src="https://unpkg.com/@importcsv/react/build/bundled/index.umd.js"></script>
<script>
  // Component is available as window.CSVImporter
  const importer = new CSVImporter({
    columns: [...],
    onComplete: (data) => console.log(data)
  });
</script>
```

## CSS Isolation

The component automatically scopes all styles using the `.importcsv` class. This means:
- Parent styles won't leak into the importer
- Importer styles won't affect your application
- No iframe needed - better performance and no focus issues
- CSS is automatically injected when the component loads

## Performance

The library now uses native Preact internally for optimal performance:
- **68KB gzipped** - 34% smaller than previous versions
- **Faster initial load** - Reduced JavaScript parsing time
- **Better runtime performance** - Smaller virtual DOM overhead
- **Quicker installs** - 75 fewer npm dependencies

## Notes

- CSS is automatically injected into the page when the component loads
- Process.env checks are browser-safe
- Dialog modal requires proper ref handling for automatic opening
- Validation runs on the client side in standalone mode
- Backend mode delegates validation to your server