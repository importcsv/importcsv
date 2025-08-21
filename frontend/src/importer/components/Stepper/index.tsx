import { StepperProps } from "./types";
import { Check } from "lucide-react";
import { cn } from "../../../utils/cn";

export default function Stepper({ steps, current, hide, skipHeader }: StepperProps) {
  // Hide if requested
  if (hide) {
    return null;
  }

  // Filter out disabled steps
  const activeSteps = steps.filter(step => !step.disabled);
  const currentActiveIndex = steps.slice(0, current + 1).filter(s => !s.disabled).length - 1;

  return (
    <div className={cn(
      "w-full flex items-center justify-center",
      "h-8 px-4 py-2"
    )}>
      {/* Step indicators with labels */}
      <div className="flex items-center">
        {activeSteps.map((step, index) => {
          const isActive = index === currentActiveIndex;
          const isDone = index < currentActiveIndex;
          
          return (
            <div key={index} className="flex items-center">
              {/* Step with number and label together */}
              <div className={cn(
                "flex items-center gap-1 transition-all duration-200",
                isActive && "scale-105"
              )}>
                {/* Step circle */}
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-medium transition-all duration-200",
                  isActive && "bg-blue-600 text-white shadow-sm border-2 border-blue-600",
                  isDone && "bg-white border-2 border-blue-600 text-blue-600",
                  !isActive && !isDone && "bg-white border border-gray-300 text-gray-500"
                )}>
                  {isDone ? (
                    <Check className="w-3 h-3 stroke-2" />
                  ) : (
                    index + 1
                  )}
                </div>
                
                {/* Step label */}
                <span className={cn(
                  "text-xs tracking-wide transition-all duration-200",
                  isActive && "text-blue-600 font-semibold",
                  isDone && "text-gray-700 font-medium",
                  !isActive && !isDone && "text-gray-500"
                )}>
                  {step.label}
                </span>
              </div>
              
              {/* Connector line */}
              {index < activeSteps.length - 1 && (
                <div className={cn(
                  "mx-3 w-12 h-[1px] transition-all duration-200",
                  isDone ? "bg-blue-600" : "bg-gray-300"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
