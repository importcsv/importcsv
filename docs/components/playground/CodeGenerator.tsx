'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { PlaygroundConfig } from './ImporterPlayground';

const DynamicCodeBlock = dynamic(
  () => import('fumadocs-ui/components/dynamic-codeblock').then(mod => mod.DynamicCodeBlock),
  { ssr: false }
);

interface CodeGeneratorProps {
  config: PlaygroundConfig;
}

export default function CodeGenerator({ config }: CodeGeneratorProps) {
  const [showTypeScript, setShowTypeScript] = useState(true);
  const [showAdvancedExample, setShowAdvancedExample] = useState(false);

  const generateCode = () => {
    const imports = showTypeScript
      ? `import { CSVImporter } from '@importcsv/react';
import type { Column, Validator, Transformer } from '@importcsv/react';
import { useState } from 'react';`
      : `import { CSVImporter } from '@importcsv/react';
import { useState } from 'react';`;

    // Format columns with proper indentation and include all properties
    const formatColumn = (column: any, indent: string) => {
      const lines = [];
      lines.push(`${indent}{`);
      lines.push(`${indent}  id: '${column.id}',`);
      lines.push(`${indent}  label: '${column.label}',`);

      if (column.description) {
        lines.push(`${indent}  description: '${column.description}',`);
      }

      if (column.type && column.type !== 'string') {
        lines.push(`${indent}  type: '${column.type}',`);
      }

      if (column.validators && column.validators.length > 0) {
        lines.push(`${indent}  validators: [`);
        column.validators.forEach((v: any, i: number) => {
          let validatorStr = `${indent}    { type: '${v.type}'`;
          if (v.value !== undefined) validatorStr += `, value: ${typeof v.value === 'string' ? `'${v.value}'` : v.value}`;
          if (v.message) validatorStr += `, message: '${v.message}'`;
          validatorStr += ` }${i < column.validators.length - 1 ? ',' : ''}`;
          lines.push(validatorStr);
        });
        lines.push(`${indent}  ],`);
      }

      if (column.transformers && column.transformers.length > 0) {
        lines.push(`${indent}  transformers: [`);
        column.transformers.forEach((t: any, i: number) => {
          lines.push(`${indent}    { type: '${t.type}' }${i < column.transformers.length - 1 ? ',' : ''}`);
        });
        lines.push(`${indent}  ],`);
      }

      lines.push(`${indent}}`);
      return lines.join('\n');
    };

    const columnsCode = showTypeScript
      ? `const columns: Column[] = [\n${config.columns.map(col => formatColumn(col, '  ')).join(',\n')}\n];`
      : `const columns = [\n${config.columns.map(col => formatColumn(col, '  ')).join(',\n')}\n];`;

    if (showAdvancedExample) {
      return generateAdvancedExample();
    }

    const componentCode = `function MyImporter() {
  const [isOpen, setIsOpen] = useState(false);
  const [importedData, setImportedData] = useState(null);

  const handleComplete = (data${showTypeScript ? ': any' : ''}) => {
    console.log('Import complete:', data);
    setImportedData(data);
    setIsOpen(false);

    // Process your data here
    // Example: Send to API endpoint
    // fetch('/api/import', {
    //   method: 'POST',
    //   body: JSON.stringify(data)
    // });
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Import CSV
      </button>

      <CSVImporter${config.isModal ? `
        modalIsOpen={isOpen}
        modalOnCloseTriggered={() => setIsOpen(false)}` : `
        isModal={false}`}
        columns={columns}
        darkMode={${config.darkMode}}
        showDownloadTemplateButton={${config.showDownloadTemplateButton}}
        skipHeaderRowSelection={${config.skipHeaderRowSelection}}
        onComplete={handleComplete}
      />

      {importedData && (
        <div>
          Imported {importedData.num_rows} rows successfully!
        </div>
      )}
    </>
  );
}`;

    return `${imports}\n\n${columnsCode}\n\n${componentCode}`;
  };

  const generateAdvancedExample = () => {
    const imports = showTypeScript
      ? `import { CSVImporter } from '@importcsv/react';
import type { Column, Validator, Transformer } from '@importcsv/react';
import { useState } from 'react';`
      : `import { CSVImporter } from '@importcsv/react';
import { useState } from 'react';`;

    const advancedCode = `${imports}

// Custom validator function
const validateCustomField = (value${showTypeScript ? ': string' : ''})${showTypeScript ? ': boolean' : ''} => {
  // Custom validation logic here
  return value.length > 3 && value.includes('valid');
};

// Custom transformer function
const customTransform = (value${showTypeScript ? ': string' : ''})${showTypeScript ? ': string' : ''} => {
  // Custom transformation logic here
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

const columns${showTypeScript ? ': Column[]' : ''} = [
  {
    id: 'customer_id',
    label: 'Customer ID',
    description: 'Unique customer identifier',
    type: 'string',
    validators: [
      { type: 'required' },
      { type: 'unique' },
      { type: 'regex', value: '^CUST-\\\\d{6}$', message: 'Must be format CUST-000000' }
    ],
    transformers: [
      { type: 'trim' },
      { type: 'uppercase' }
    ]
  },
  {
    id: 'full_name',
    label: 'Full Name',
    description: 'Customer full name',
    validators: [
      { type: 'required' },
      { type: 'minLength', value: 2, message: 'Name too short' },
      { type: 'maxLength', value: 100, message: 'Name too long' }
    ],
    transformers: [
      { type: 'trim' },
      { type: 'capitalize' }
    ]
  },
  {
    id: 'email',
    label: 'Email Address',
    type: 'email',
    validators: [
      { type: 'required' },
      { type: 'unique', message: 'Email already exists' },
      { type: 'regex', value: '^[^@]+@[^@]+\\\\.[^@]+$', message: 'Invalid email format' }
    ],
    transformers: [
      { type: 'trim' },
      { type: 'lowercase' }
    ]
  },
  {
    id: 'phone',
    label: 'Phone Number',
    type: 'phone',
    description: 'Include country code',
    validators: [
      { type: 'regex', value: '^\\\\+?[1-9]\\\\d{1,14}$', message: 'Invalid phone format' }
    ],
    transformers: [
      { type: 'trim' },
      { type: 'normalizePhone' }
    ]
  },
  {
    id: 'registration_date',
    label: 'Registration Date',
    type: 'date',
    description: 'Date of registration',
    validators: [
      { type: 'required' }
    ],
    transformers: [
      { type: 'trim' },
      { type: 'parseDate' }
    ]
  },
  {
    id: 'account_type',
    label: 'Account Type',
    description: 'Select account tier',
    type: 'string',
    validators: [
      { type: 'required' },
      {
        type: 'regex',
        value: '^(Basic|Premium|Enterprise)$',
        message: 'Must be Basic, Premium, or Enterprise'
      }
    ],
    transformers: [
      { type: 'trim' },
      { type: 'capitalize' }
    ]
  },
  {
    id: 'credit_limit',
    label: 'Credit Limit',
    type: 'number',
    description: 'Maximum credit amount',
    validators: [
      { type: 'required' },
      { type: 'min', value: 0, message: 'Cannot be negative' },
      { type: 'max', value: 1000000, message: 'Exceeds maximum limit' }
    ]
  },
  {
    id: 'notes',
    label: 'Additional Notes',
    description: 'Optional comments',
    transformers: [
      { type: 'trim' }
    ]
  }
];

function AdvancedImporter() {
  const [isOpen, setIsOpen] = useState(false);
  const [importedData, setImportedData] = useState${showTypeScript ? '<any>' : ''}(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState${showTypeScript ? '<string | null>' : ''}(null);

  const handleComplete = async (data${showTypeScript ? ': any' : ''}) => {
    console.log('Import complete:', data);
    setImportedData(data);
    setIsOpen(false);
    setIsProcessing(true);
    setError(null);

    try {
      // Send to your API endpoint
      const response = await fetch('/api/customers/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rows: data.rows,
          columns: data.columns,
          importedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      console.log('Server response:', result);

      // Handle success (e.g., redirect, show message, refresh data)
      alert(\`Successfully imported \${data.num_rows} customers!\`);

    } catch (err) {
      console.error('Import error:', err);
      setError(err${showTypeScript ? ' as string' : ''});
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        disabled={isProcessing}
      >
        {isProcessing ? 'Processing...' : 'Import Customers'}
      </button>

      <CSVImporter
        modalIsOpen={isOpen}
        modalOnCloseTriggered={() => setIsOpen(false)}
        columns={columns}
        darkMode={${config.darkMode}}
        showDownloadTemplateButton={true}
        skipHeaderRowSelection={false}
        onComplete={handleComplete}
      />

      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {error}
        </div>
      )}

      {importedData && !isProcessing && (
        <div style={{ marginTop: '10px' }}>
          <h3>Import Summary</h3>
          <p>✓ Imported {importedData.num_rows} rows</p>
          <p>✓ {importedData.columns.length} columns mapped</p>
          <details>
            <summary>View first 3 rows</summary>
            <pre>{JSON.stringify(importedData.rows.slice(0, 3), null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default AdvancedImporter;`;

    return advancedCode;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setShowTypeScript(true)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            showTypeScript
              ? 'bg-fd-primary text-fd-primary-foreground'
              : 'bg-fd-muted text-fd-muted-foreground hover:bg-fd-muted/80'
          }`}
        >
          TypeScript
        </button>
        <button
          onClick={() => setShowTypeScript(false)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            !showTypeScript
              ? 'bg-fd-primary text-fd-primary-foreground'
              : 'bg-fd-muted text-fd-muted-foreground hover:bg-fd-muted/80'
          }`}
        >
          JavaScript
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowAdvancedExample(false)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              !showAdvancedExample
                ? 'bg-fd-primary text-fd-primary-foreground'
                : 'bg-fd-muted text-fd-muted-foreground hover:bg-fd-muted/80'
            }`}
          >
            Current Config
          </button>
          <button
            onClick={() => setShowAdvancedExample(true)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              showAdvancedExample
                ? 'bg-fd-primary text-fd-primary-foreground'
                : 'bg-fd-muted text-fd-muted-foreground hover:bg-fd-muted/80'
            }`}
          >
            Advanced Example
          </button>
        </div>
      </div>

      <DynamicCodeBlock
        lang={showTypeScript ? 'tsx' : 'jsx'}
        code={generateCode()}
        options={{
          themes: {
            light: 'github-light',
            dark: 'github-dark'
          }
        }}
      />

      <div className="rounded-lg border p-4 bg-fd-muted/30">
        <h4 className="font-medium text-sm mb-2">Quick Start</h4>
        <ol className="text-sm text-fd-muted-foreground space-y-1">
          <li>1. Install: <code className="px-1 py-0.5 bg-fd-muted rounded text-xs">npm install @importcsv/react</code></li>
          <li>2. Copy the code above</li>
          <li>3. Customize columns, validators, and transformers</li>
          <li>4. Handle the imported data in onComplete callback</li>
        </ol>
      </div>

      {showAdvancedExample && (
        <div className="rounded-lg border border-fd-primary/20 p-4 bg-fd-primary/5">
          <h4 className="font-medium text-sm mb-2 text-fd-primary">Advanced Features Demonstrated</h4>
          <ul className="text-sm text-fd-muted-foreground space-y-1">
            <li>• Complex validation patterns with regex</li>
            <li>• Multiple transformers per column</li>
            <li>• Custom error messages</li>
            <li>• API integration example</li>
            <li>• Error handling and loading states</li>
            <li>• Import summary display</li>
          </ul>
        </div>
      )}
    </div>
  );
}