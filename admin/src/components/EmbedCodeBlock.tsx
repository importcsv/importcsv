'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface EmbedCodeBlockProps {
  code: string;
  language?: string;
}

export function EmbedCodeBlock({ code, language = 'typescript' }: EmbedCodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast({
        title: 'Copied!',
        description: 'Code copied to clipboard.',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard. Please copy manually.',
        variant: 'destructive',
      });
    }
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 h-8 w-8"
        aria-label="Copy code"
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
      <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
        <code data-language={language}>{code}</code>
      </pre>
    </div>
  );
}
