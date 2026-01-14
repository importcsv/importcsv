'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface CopyableInputProps {
  value: string;
  className?: string;
}

export function CopyableInput({ value, className }: CopyableInputProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      toast({
        title: 'Copied!',
        description: 'Link copied to clipboard.',
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard. Please copy manually.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Input
        value={value}
        readOnly
        className="font-mono bg-gray-50"
      />
      <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copy to clipboard">
        {isCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
