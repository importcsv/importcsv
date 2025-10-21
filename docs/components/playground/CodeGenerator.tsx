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
  const [showLegacyAPI, setShowLegacyAPI] = useState(false);

  const generateZodCode = () => {
    const imports = showTypeScript
      ? `import { CSVImporter } from '@importcsv/react';
import { z } from 'zod';
import { useState } from 'react';`
      : `import { CSVImporter } from '@importcsv/react';
import { z } from 'zod';
import { useState } from 'react';`;

    // Generate Zod schema definition
    const schemaFields = config.columns.map(column => {
      let zodChain = '';

      // Start with base type
      switch (column.type) {
        case 'number':
          zodChain = 'z.number()';
          break;
        case 'date':
          zodChain = 'z.string().datetime()';
          break;
        case 'email':
          zodChain = 'z.string().email()';
          break;
        case 'phone':
          zodChain = 'z.string()';
          break;
        default:
          zodChain = 'z.string()';
      }

      // Add validators
      const validators = column.validators || [];
      const isRequired = validators.some(v => v.type === 'required');

      validators.forEach(validator => {
        switch (validator.type) {
          case 'required':
            // Already handled by checking isRequired
            break;
          case 'min':
            zodChain += `.min(${(validator as any).value || 0}${(validator as any).message ? `, '${(validator as any).message}'` : ''})`;
            break;
          case 'max':
            zodChain += `.max(${(validator as any).value || 100}${(validator as any).message ? `, '${(validator as any).message}'` : ''})`;
            break;
          case 'min_length':
            zodChain += `.min(${(validator as any).value || 1}${(validator as any).message ? `, '${(validator as any).message}'` : ''})`;
            break;
          case 'max_length':
            zodChain += `.max(${(validator as any).value || 100}${(validator as any).message ? `, '${(validator as any).message}'` : ''})`;
            break;
          case 'regex':
            const pattern = (validator as any).value || '.*';
            const escapedPattern = pattern.replace(/\\/g, '\\\\');
            zodChain += `.regex(/${escapedPattern}/${(validator as any).message ? `, '${(validator as any).message}'` : ''})`;
            break;
          case 'unique':
            // Note: Unique validation is handled by ImportCSV's validateUnique prop
            break;
        }
      });

      // Add transformations
      const transformers = column.transformers || [];
      transformers.forEach(transformer => {
        switch (transformer.type) {
          case 'trim':
            zodChain += `.transform(s => s.trim())`;
            break;
          case 'lowercase':
            zodChain += `.transform(s => s.toLowerCase())`;
            break;
          case 'uppercase':
            zodChain += `.transform(s => s.toUpperCase())`;
            break;
          case 'capitalize':
            zodChain += `.transform(s => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '))`;
            break;
          case 'normalize_phone':
            zodChain += `.transform(s => s.replace(/[^0-9+]/g, ''))`;
            break;
          case 'normalize_date':
            zodChain += `.transform(s => new Date(s))`;
            break;
        }
      });

      // Make optional if not required
      if (!isRequired) {
        zodChain += '.optional()';
      }

      return `  ${column.id}: ${zodChain}`;
    });

    const schemaCode = `const schema = z.object({\n${schemaFields.join(',\n')}\n});`;

    // Check if we need validateUnique prop
    const uniqueColumns = config.columns
      .filter(col => col.validators?.some(v => v.type === 'unique'))
      .map(col => `'${col.id}'`);
    const validateUniqueCode = uniqueColumns.length > 0
      ? `\n  validateUnique={[${uniqueColumns.join(', ')}]}`
      : '';

    const typeInference = showTypeScript
      ? `\ntype ImportData = z.infer<typeof schema>;`
      : '';

    const componentCode = `function MyImporter() {
  const [isOpen, setIsOpen] = useState(false);

  const handleComplete = (data${showTypeScript ? ': ImportData[]' : ''}) => {
    console.log(\`Imported \${data.length} rows\`);
    ${showTypeScript ? '// data is fully typed: data[0].name, data[0].email, etc.' : '// Process your data here'}

    // Example: Send to API
    // fetch('/api/import', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ data })
    // });

    setIsOpen(false);
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
        schema={schema}${validateUniqueCode}
        darkMode={${config.darkMode}}
        showDownloadTemplateButton={${config.showDownloadTemplateButton}}
        skipHeaderRowSelection={${config.skipHeaderRowSelection}}
        onComplete={handleComplete}
      />
    </>
  );
}`;

    return `${imports}\n\n${schemaCode}${typeInference}\n\n${componentCode}`;
  };

  const generateLegacyCode = () => {
    const imports = showTypeScript
      ? `import { CSVImporter } from '@importcsv/react';
import type { Column } from '@importcsv/react';
import { useState } from 'react';`
      : `import { CSVImporter } from '@importcsv/react';
import { useState } from 'react';`;

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

    const componentCode = `function MyImporter() {
  const [isOpen, setIsOpen] = useState(false);

  const handleComplete = (data${showTypeScript ? ': any' : ''}) => {
    console.log('Import complete:', data);
    setIsOpen(false);
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
    </>
  );
}`;

    return `${imports}\n\n${columnsCode}\n\n${componentCode}`;
  };

  const generateCode = () => {
    return showLegacyAPI ? generateLegacyCode() : generateZodCode();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setShowTypeScript(true)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${
              showTypeScript
                ? 'bg-fd-primary text-fd-primary-foreground'
                : 'bg-fd-muted text-fd-muted-foreground hover:bg-fd-muted/80'
            }`}
          >
            TypeScript
          </button>
          <button
            onClick={() => setShowTypeScript(false)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${
              !showTypeScript
                ? 'bg-fd-primary text-fd-primary-foreground'
                : 'bg-fd-muted text-fd-muted-foreground hover:bg-fd-muted/80'
            }`}
          >
            JavaScript
          </button>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowLegacyAPI(false)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${
              !showLegacyAPI
                ? 'bg-fd-primary text-fd-primary-foreground'
                : 'bg-fd-muted text-fd-muted-foreground hover:bg-fd-muted/80'
            }`}
          >
            Zod Schema (Recommended)
          </button>
          <button
            onClick={() => setShowLegacyAPI(true)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${
              showLegacyAPI
                ? 'bg-fd-primary text-fd-primary-foreground'
                : 'bg-fd-muted text-fd-muted-foreground hover:bg-fd-muted/80'
            }`}
          >
            Columns API
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
        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
          <span className="text-fd-primary">✓</span>
          What You Get
        </h4>
        {!showLegacyAPI ? (
          <ul className="text-sm text-fd-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-fd-primary mt-0.5">•</span>
              <span><strong className="text-fd-foreground">Type-safe data</strong> - Full TypeScript types automatically inferred from schema</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-fd-primary mt-0.5">•</span>
              <span><strong className="text-fd-foreground">Runtime validation</strong> - Zod validates all data at import time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-fd-primary mt-0.5">•</span>
              <span><strong className="text-fd-foreground">Transformations</strong> - Clean and normalize data automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-fd-primary mt-0.5">•</span>
              <span><strong className="text-fd-foreground">Production-ready</strong> - Copy-paste into your app</span>
            </li>
          </ul>
        ) : (
          <ul className="text-sm text-fd-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-fd-primary mt-0.5">•</span>
              <span><strong className="text-fd-foreground">Legacy API</strong> - Uses manual column definitions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-fd-primary mt-0.5">•</span>
              <span><strong className="text-fd-foreground">Less type-safety</strong> - No automatic TypeScript inference</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-fd-muted-foreground/60 mt-0.5">💡</span>
              <span className="text-fd-warning">Consider using Zod schemas for better DX and type safety</span>
            </li>
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-fd-border/50 p-4 bg-fd-card/30">
        <h4 className="font-medium text-sm mb-3">Next Steps</h4>
        <ol className="text-sm text-fd-muted-foreground space-y-2">
          <li className="flex gap-2">
            <span className="text-fd-primary font-medium">1.</span>
            <span>Install dependencies: <code className="px-1.5 py-0.5 bg-fd-muted rounded text-xs font-mono">npm install @importcsv/react zod</code></span>
          </li>
          <li className="flex gap-2">
            <span className="text-fd-primary font-medium">2.</span>
            <span>Copy the code above into your component</span>
          </li>
          <li className="flex gap-2">
            <span className="text-fd-primary font-medium">3.</span>
            <span>Customize the <code className="px-1 py-0.5 bg-fd-muted rounded text-xs">onComplete</code> handler to process your data</span>
          </li>
          <li className="flex gap-2">
            <span className="text-fd-primary font-medium">4.</span>
            <span>See <a href="/integration/handling-data" className="text-fd-primary hover:underline">Handling Data Guide</a> for API integration examples</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
