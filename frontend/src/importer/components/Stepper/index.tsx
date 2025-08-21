import { StepperProps } from "./types";
import { Check } from "lucide-react";
import { cn } from "../../../utils/cn";

export default function Stepper({ steps, current, clickable, setCurrent, skipHeader }: StepperProps) {
  return (
    <div className={cn(
      "flex items-center justify-center gap-0 w-full mx-auto my-8 px-8 relative",
      "sm:my-4 sm:px-4",
      "max-[480px]:hidden" // Hide on mobile
    )}>
      {steps.map((step, i) => {
        if (step.disabled) return null;
        const done = i < current;
        const isActive = i === current;

        const Element = clickable ? "button" : "div";

        const buttonProps: any = clickable
          ? {
              onClick: () => setCurrent(i),
              type: "button",
            }
          : {};

        let displayNumber = i + 1;
        if (skipHeader && displayNumber > 1) {
          displayNumber--;
        }

        return (
          <Element
            key={i}
            className={cn(
              "flex flex-col items-center relative flex-1 max-w-[200px] bg-transparent border-none cursor-pointer p-0 transition-all duration-300 ease-out",
              "after:content-[''] after:absolute after:top-5 after:left-[calc(50%+30px)] after:w-[calc(100%-60px)] after:h-0.5 after:transition-all after:duration-300 after:-z-10",
              i !== steps.length - 1 && "after:bg-gray-200",
              done && i !== steps.length - 1 && "after:bg-[var(--color-primary)]",
              i === steps.length - 1 && "after:hidden"
            )}
            {...buttonProps}>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 border-gray-200 text-gray-500 font-semibold text-sm transition-all duration-300 relative z-10",
              isActive && "bg-white text-[var(--color-primary)] border-[var(--color-primary)] border-2 shadow-[0_0_0_4px_rgba(122,94,248,0.1)]",
              done && "bg-purple-100 border-[var(--color-primary)] text-[var(--color-primary)]",
              !isActive && !done && "hover:border-purple-300 hover:bg-purple-50"
            )}>
              {done ? <Check className="w-4 h-4 text-[var(--color-primary)]" /> : displayNumber}
            </div>
            <div className={cn(
              "mt-2 text-[13px] text-gray-500 font-medium transition-all duration-300 text-center whitespace-nowrap",
              "sm:hidden", // Hide labels on small screens
              isActive && "text-[var(--color-primary)] font-semibold",
              done && "text-gray-900",
              steps.length < 4 && "md:block" // Show labels for fewer steps on medium screens
            )}>
              {step.label}
            </div>
          </Element>
        );
      })}
    </div>
  );
}
