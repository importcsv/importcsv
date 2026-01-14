'use client';

import { Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SaveStatus } from '@/hooks/useAutoSave';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function SaveStatusIndicator({
  status,
  error,
  onRetry,
  className,
}: SaveStatusIndicatorProps) {
  if (status === 'idle') {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1.5 text-sm', className)}>
      {status === 'saving' && (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check className="h-3.5 w-3.5 text-green-600" />
          <span className="text-green-600">Saved</span>
        </>
      )}
      {status === 'error' && (
        onRetry ? (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 text-red-600 hover:text-red-700"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error || 'Save failed'} - Click to retry</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error || 'Save failed'}</span>
          </div>
        )
      )}
    </div>
  );
}
