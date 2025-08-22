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

  const generateCode = () => {
    const imports = showTypeScript
      ? `import { CSVImporter } from '@importcsv/react';
import type { Column } from '@importcsv/react';
import { useState } from 'react';`
      : `import { CSVImporter } from '@importcsv/react';
import { useState } from 'react';`;

    const columnsCode = showTypeScript
      ? `const columns: Column[] = ${JSON.stringify(config.columns, null, 2)};`
      : `const columns = ${JSON.stringify(config.columns, null, 2)};`;

    const componentCode = `function MyImporter() {
  const [isOpen, setIsOpen] = useState(false);

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
        primaryColor="${config.primaryColor}"
        showDownloadTemplateButton={${config.showDownloadTemplateButton}}
        skipHeaderRowSelection={${config.skipHeaderRowSelection}}
        onComplete={(data) => {
          console.log('Import complete:', data);
          setIsOpen(false);
        }}
      />
    </>
  );
}`;

    return `${imports}\n\n${columnsCode}\n\n${componentCode}`;
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
          <li>3. Import in your React app</li>
          <li>4. Customize as needed</li>
        </ol>
      </div>
    </div>
  );
}