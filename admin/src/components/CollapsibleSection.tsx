import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  hasChanges?: boolean;
}

export default function CollapsibleSection({
  title,
  description,
  icon,
  children,
  defaultOpen = true,
  className,
  hasChanges = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-white", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-zinc-50 hover:bg-zinc-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-zinc-600">{icon}</div>}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              {hasChanges && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-indigo-700 rounded-full">
                  Modified
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-zinc-600 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <div className="text-zinc-500">
          {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </div>
      </button>
      
      {isOpen && (
        <div className="p-6 border-t bg-white">
          {children}
        </div>
      )}
    </div>
  );
}