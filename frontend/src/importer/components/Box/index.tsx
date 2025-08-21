import { BoxProps } from "./types";
import { cn } from "../../../utils/cn";

export default function Box({ className, variants = [], ...props }: BoxProps) {
  const variantClasses: Record<string, string> = {
    fluid: "max-w-none",
    mid: "max-w-[440px]",
    wide: "max-w-[660px]",
    "space-l": "p-8",
    "space-mid": "p-4",
    "space-none": "p-0",
    "bg-shade": "bg-gray-50"
  };

  const selectedVariants = variants
    .map((v) => variantClasses[v as string])
    .filter(Boolean)
    .join(" ");

  return (
    <div
      {...props}
      className={cn(
        "block mx-auto p-4 bg-white rounded-lg shadow-lg max-w-full",
        selectedVariants,
        className
      )}
    />
  );
}
