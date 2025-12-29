import { cn } from "../../../utils/cn";

interface MappingSkeletonProps {
  rows?: number;
  className?: string;
}

export default function MappingSkeleton({ rows = 5, className }: MappingSkeletonProps) {
  return (
    <div className={cn("overflow-x-auto border border-gray-200 rounded-lg", className)}>
      <div className="min-w-[600px]">
        {/* Header row - matches ConfigureImport table headers */}
        <div className="flex gap-4 py-3 px-6 border-b bg-gray-50">
          <div className="w-[30%]">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
          <div className="w-[35%]">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          </div>
          <div className="w-[35%]">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
        </div>

        {/* Data rows - matches ConfigureImport column widths (30%, 35%, 35%) */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 py-4 px-6 border-b border-gray-100 last:border-b-0"
          >
            {/* Field name with icon placeholder */}
            <div className="w-[30%] flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            </div>

            {/* Dropdown placeholder */}
            <div className="w-[35%]">
              <div className="h-9 bg-gray-200 rounded w-full max-w-[250px] animate-pulse" />
            </div>

            {/* Preview text placeholder */}
            <div className="w-[35%]">
              <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
