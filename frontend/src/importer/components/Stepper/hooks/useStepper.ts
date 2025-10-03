import { useMemo, useState } from "preact/hooks";
import { Step, StepperProps } from "../types";

type UseStepperReturn = Required<Pick<StepperProps, 'steps' | 'current' | 'step' | 'setCurrent' | 'skipHeader'>>;

export default function useStepper(steps: Step[], initialStep = 0, skipHeader: boolean): UseStepperReturn {
  const [current, setCurrent] = useState(initialStep);

  const step = useMemo(() => steps[current], [current, steps]);

  return { steps, current, step, setCurrent, skipHeader };
}
