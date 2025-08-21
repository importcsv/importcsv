# ImportCSV React - API Documentation

## Overview

The ImportCSV React component supports two modes of operation:
1. **Standalone Mode** - Frontend-only validation using the `columns` prop
2. **Backend Mode** - Server-side validation using the `importerKey` prop

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
| `useIframe` | `boolean` | `true` | Use iframe for CSS isolation |

#### Backend Configuration Props:

| Prop | Type | Description |
|------|------|-------------|
| `backendUrl` | `string` | API endpoint URL (defaults to config) |
| `user` | `Record<string, any>` | User context for backend webhooks |
| `metadata` | `Record<string, any>` | Additional metadata for import |

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
      ]
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      validators: [
        { type: 'min', value: 18, message: 'Must be 18 or older' },
        { type: 'max', value: 120 }
      ]
    },
    {
      id: 'department',
      label: 'Department',
      type: 'select',
      options: ['Engineering', 'Sales', 'Marketing', 'HR'],
      validators: [
        { type: 'required' }
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
      user={{ id: 'user123', name: 'John Doe' }}
      metadata={{ source: 'web-app', version: '1.0' }}
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

## TypeScript Support

The library is fully typed. Import types as needed:

```typescript
import { CSVImporter } from '@importcsv/react';
import type { Column, Validator, CSVImporterProps } from '@importcsv/react';
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- The component uses an iframe by default for CSS isolation (`useIframe={true}`)
- Process.env checks are browser-safe
- Dialog modal requires proper ref handling for automatic opening
- Validation runs on the client side in standalone mode
- Backend mode delegates validation to your server