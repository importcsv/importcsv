import { cn } from "@/lib/utils";

interface DestinationTypeCardProps {
  type: "webhook" | "supabase" | "frontend";
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onSelect: () => void;
}

export function DestinationTypeCard({
  title,
  description,
  icon,
  selected,
  disabled,
  disabledReason,
  onSelect,
}: DestinationTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "relative p-6 rounded-lg border-2 text-left transition-all",
        selected
          ? "border-blue-500 bg-blue-50"
          : disabled
            ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="text-2xl">{icon}</div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
          {disabled && disabledReason && (
            <p className="text-xs text-orange-600 mt-2">{disabledReason}</p>
          )}
        </div>
      </div>
    </button>
  );
}
