import { StepperProps } from "./types";
import { Check } from "lucide-react";
import { cn } from "../../../utils/cn";

export default function Stepper({ steps, current, hide, skipHeader }: StepperProps) {
  if (hide) return null;

  const activeSteps = steps.filter(step => !step.disabled);
  const currentActiveIndex = steps.slice(0, current + 1).filter(s => !s.disabled).length - 1;

  return (
    <div className="w-full flex items-center justify-center h-10 px-4 py-2">
      <div className="flex items-center">
        {activeSteps.map((step, index) => {
          const isActive = index === currentActiveIndex;
          const isDone = index < currentActiveIndex;

          return (
            <div key={index} className="flex items-center">
              <div className={cn(
                "flex items-center gap-2 transition-all duration-300",
                isActive && "scale-105"
              )}>
                {/* Step circle with pulse effect */}
                <div className={cn(
                  "relative w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                  isActive && "bg-blue-600 text-white shadow-md",
                  isDone && "bg-blue-600 text-white",
                  !isActive && !isDone && "bg-slate-100 dark:bg-[#3a3a3a] border-2 border-slate-300 dark:border-[#3a3a3a] text-slate-500 dark:text-[#6b6b6b]"
                )}>
                  {/* Pulse ring for active step */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-25" />
                  )}
                  <span className="relative">
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      index + 1
                    )}
                  </span>
                </div>

                {/* Step label */}
                <span className={cn(
                  "text-xs tracking-wide transition-all duration-300",
                  isActive && "text-slate-900 dark:text-white font-semibold",
                  isDone && "text-slate-700 dark:text-[#a1a1a1] font-medium",
                  !isActive && !isDone && "text-slate-400 dark:text-[#6b6b6b]"
                )}>
                  {step.label}
                </span>
              </div>

              {/* Gradient connector line */}
              {index < activeSteps.length - 1 && (
                <div className="mx-4 w-16 h-0.5 rounded-full overflow-hidden bg-slate-200 dark:bg-[#3a3a3a]">
                  <div
                    className={cn(
                      "h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500",
                      isDone ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
