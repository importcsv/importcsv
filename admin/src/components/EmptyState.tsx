import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  tip?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tip,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={24} className="text-gray-400" />
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>

      <p className="text-sm text-gray-500 max-w-sm mb-6">
        {description}
      </p>

      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}

      {tip && (
        <div className="mt-8 pt-6 border-t border-gray-100 max-w-sm">
          <p className="text-xs text-gray-400">
            Tip: {tip}
          </p>
        </div>
      )}
    </div>
  );
}
