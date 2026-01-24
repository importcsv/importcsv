"use client";

import { useEffect, useState } from "react";
import { Check, Circle } from "lucide-react";
import apiClient from "@/utils/apiClient";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
}

interface OnboardingStatus {
  steps: OnboardingStep[];
  completed_count: number;
  total_count: number;
  all_complete: boolean;
}

const STORAGE_KEY = "importcsv_onboarding_dismissed";

export function OnboardingChecklist() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user dismissed the checklist
    const wasDismissed = localStorage.getItem(STORAGE_KEY) === "true";
    if (wasDismissed) {
      setDismissed(true);
      setIsLoading(false);
      return;
    }

    apiClient
      .get("/users/me/onboarding")
      .then((res) => {
        setStatus(res.data);
        // Auto-dismiss if all complete
        if (res.data.all_complete) {
          localStorage.setItem(STORAGE_KEY, "true");
          setDismissed(true);
        }
      })
      .catch((error) => {
        // Log for debugging but don't block UI
        console.warn("Failed to fetch onboarding status:", error.message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || dismissed || !status || status.all_complete) {
    return null;
  }

  return (
    <div className="bg-zinc-800 rounded-md p-4 mx-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm text-white">
          Getting Started
        </h3>
        <span className="text-xs text-zinc-400">
          {status.completed_count}/{status.total_count}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-zinc-700 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{
            width: `${status.total_count > 0 ? (status.completed_count / status.total_count) * 100 : 0}%`
          }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {status.steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-2 text-sm",
              step.completed ? "text-zinc-500" : "text-zinc-300"
            )}
          >
            {step.completed ? (
              <Check size={16} className="text-emerald-500" />
            ) : (
              <Circle size={16} className="text-zinc-600" />
            )}
            <span className={step.completed ? "line-through" : ""}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
