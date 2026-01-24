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
          ? "border-indigo-500 bg-indigo-50"
          : disabled
            ? "border-zinc-200 bg-zinc-50 cursor-not-allowed opacity-60"
            : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
      )}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
      <div className="flex items-start gap-4">
        <div className="text-2xl">{icon}</div>
        <div>
          <h3 className="font-semibold text-zinc-900">{title}</h3>
          <p className="text-sm text-zinc-500 mt-1">{description}</p>
          {disabled && disabledReason && (
            <p className="text-xs text-orange-600 mt-2">{disabledReason}</p>
          )}
        </div>
      </div>
    </button>
  );
}
