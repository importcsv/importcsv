import { useEffect, useState } from "react";
import { useTranslation } from "../../../../i18n/useTranslation";
import useStepper from "../../../components/Stepper/hooks/useStepper";
import { Steps } from "../types";
import useMutableLocalStorage from "./useMutableLocalStorage";

export const StepEnum = {
  Upload: 0,
  RowSelection: 1,
  MapColumns: 2,
  ConfigureImport: 2, // Consolidated step
  Validation: 3,
  Complete: 4,
};

const calculateNextStep = (nextStep: number, skipHeader: boolean) => {
  if (skipHeader && nextStep === StepEnum.RowSelection) {
    return StepEnum.MapColumns;
  }
  return nextStep;
};

const getStepConfig = (skipHeader: boolean, useConsolidated: boolean = true) => {
  if (useConsolidated) {
    return [
      { label: "Upload", id: 0 },
      { label: "Configure", id: 1 },
      { label: "Validation", id: 2 },
    ];
  }
  // Legacy flow
  return [
    { label: "Upload", id: Steps.Upload },
    { label: "Select Header", id: Steps.RowSelection, disabled: skipHeader },
    { label: "Map Columns", id: Steps.MapColumns },
    { label: "Validation", id: Steps.Validation },
  ];
};

function useStepNavigation(initialStep: number, skipHeader: boolean, useConsolidated: boolean = true, isDemoMode: boolean = false) {
  const { t } = useTranslation();
  const translatedSteps = getStepConfig(skipHeader, useConsolidated).map((step) => ({
    ...step,
    label: t(step.label),
  }));
  // Map initial step to stepper index for consolidated flow
  const initialStepperIndex = useConsolidated && initialStep === StepEnum.MapColumns ? 1 : 
                             useConsolidated && initialStep === StepEnum.Validation ? 2 : 
                             useConsolidated && initialStep === StepEnum.Complete ? 3 : 0;
  const stepper = useStepper(translatedSteps, initialStepperIndex, skipHeader);
  // Don't use localStorage in demo mode - use a dummy state instead
  const localStorageResult = isDemoMode ? 
    [null, () => {}] : 
    useMutableLocalStorage(`tf_steps`, "");
  const [storageStep, setStorageStep] = localStorageResult as [any, any];
  const [currentStep, setCurrentStep] = useState(initialStep);

  const goBack = (backStep?: number) => {
    const targetStep = backStep !== undefined ? backStep : Math.max(0, currentStep - 1);
    setStep(targetStep);
  };

  const goNext = (nextStep = 0) => {
    nextStep = nextStep || currentStep + 1 || 0;
    const calculatedStep = calculateNextStep(nextStep, skipHeader);
    setStep(calculatedStep);
  };

  const setStep = (newStep: number) => {
    setCurrentStep(newStep);
    setStorageStep(newStep);
    // Map the step to the correct stepper index for consolidated flow
    const stepperIndex = useConsolidated ? 
      (newStep === StepEnum.Upload ? 0 : 
       newStep === StepEnum.MapColumns ? 1 : 
       newStep === StepEnum.Validation ? 2 : 
       newStep === StepEnum.Complete ? 3 : newStep) 
      : newStep;
    stepper.setCurrent(stepperIndex);
  };

  useEffect(() => {
    // In demo mode or when storageStep is null, don't update from localStorage
    if (isDemoMode || storageStep === null) {
      return;
    }
    const step = storageStep || 0;
    // Map the step to the correct stepper index for consolidated flow
    const stepperIndex = useConsolidated ? 
      (step === StepEnum.Upload ? 0 : 
       step === StepEnum.MapColumns ? 1 : 
       step === StepEnum.Validation ? 2 : 
       step === StepEnum.Complete ? 3 : step) 
      : step;
    stepper.setCurrent(stepperIndex);
    setCurrentStep(step);
  }, [storageStep, isDemoMode]);

  return {
    currentStep: isDemoMode ? currentStep : (storageStep ?? currentStep),
    setStep,
    goBack,
    goNext,
    stepper,
    stepId: stepper?.step?.id,
    setStorageStep,
  };
}

export default useStepNavigation;
