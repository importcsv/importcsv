import { sizes } from "../../settings/theme";
import { cn } from "../../../utils/cn";
import { Info } from "lucide-react";

export default function Errors({ error, centered = false }: { error?: unknown; centered?: boolean }) {
  return error ? (
    <div className={cn("bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md", centered && "text-center")}>
      <p className="flex items-center gap-2">
        <Info size={sizes.icon.small} />
        {error.toString()}
      </p>
    </div>
  ) : null;
}
