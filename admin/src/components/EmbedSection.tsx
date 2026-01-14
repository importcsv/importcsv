'use client';

import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmbedCodeBlock } from './EmbedCodeBlock';
import { CopyableInput } from './CopyableInput';
import Link from 'next/link';

interface EmbedSectionProps {
  importerKey: string;
  baseUrl?: string;
}

type CodeType = 'react' | 'script';

export function EmbedSection({ importerKey, baseUrl }: EmbedSectionProps) {
  // Use current origin if no baseUrl provided (works in both dev and prod)
  const effectiveBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://app.importcsv.com');
  const [codeType, setCodeType] = useState<CodeType>('react');

  const reactCode = `import { CSVImporter } from '@importcsv/react';

export default function YourComponent() {
  return (
    <CSVImporter
      importerKey="${importerKey}"
      onComplete={(data) => {
        console.log('Import complete:', data);
      }}
      user={{ userId: "YOUR_USER_ID" }}
      metadata={{ source: "YOUR_APP" }}
    />
  );
}`;

  const scriptTagCode = `<!-- Add to your HTML -->
<script src="${effectiveBaseUrl}/embed.js"></script>

<div id="csv-importer"></div>

<script>
  CSVImporter.init({
    element: '#csv-importer',
    importerKey: '${importerKey}',
    onComplete: function(data) {
      console.log('Import complete:', data);
    },
    user: { userId: 'YOUR_USER_ID' },
    metadata: { source: 'YOUR_APP' }
  });
</script>`;

  const shareableLink = `${effectiveBaseUrl}/embed/${importerKey}`;

  const iframeCode = `<iframe
  src="${effectiveBaseUrl}/embed/${importerKey}"
  width="100%"
  height="600"
  frameborder="0"
  allow="clipboard-write"
></iframe>`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">2. Embed in Your App</h2>
        <p className="text-sm text-muted-foreground">Add the importer to your application</p>
      </div>

      <Tabs defaultValue="code" className="w-full">
        <TabsList>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="no-code">Hosted</TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="space-y-4 mt-4">
          <div className="flex items-center gap-4">
            <Select value={codeType} onValueChange={(v) => setCodeType(v as CodeType)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="react">React</SelectItem>
                <SelectItem value="script">Script Tag</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <EmbedCodeBlock
            code={codeType === 'react' ? reactCode : scriptTagCode}
            language={codeType === 'react' ? 'typescript' : 'html'}
          />

          <Link
            href="/docs/integration"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View full documentation
            <ExternalLink className="h-3 w-3" />
          </Link>
        </TabsContent>

        <TabsContent value="no-code" className="space-y-6 mt-4">
          {/* Shareable Link */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Shareable Link</Label>
              <p className="text-sm text-muted-foreground">
                Send this link to anyone who needs to import data
              </p>
            </div>
            <CopyableInput value={shareableLink} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(shareableLink, '_blank')}
            >
              Open in new tab
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>

          {/* Iframe Embed */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Iframe Embed</Label>
              <p className="text-sm text-muted-foreground">
                Embed directly in any website or CMS
              </p>
            </div>
            <EmbedCodeBlock code={iframeCode} language="html" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
