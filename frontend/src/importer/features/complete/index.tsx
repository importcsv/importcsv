import { useTranslation } from "../../../i18n/useTranslation";
import { Button } from "../../components/ui/button";
import StepLayout from "../../components/StepLayout";
import { CompleteProps } from "./types";
import { RotateCcw, Check } from "lucide-react";
import { cn } from "../../../utils/cn";

export default function Complete({ reload, close, isModal, rowCount }: CompleteProps) {
  const { t } = useTranslation();

  return (
    <StepLayout
      title={t("Import Complete")}
      subtitle={rowCount ? t("{{count}} rows imported successfully", { count: rowCount }) : t("Your data has been imported successfully")}
      showFooter={false}
      contentClassName="px-6 py-12"
    >
      <div className="flex flex-col items-center justify-center text-center">
        {/* Success Icon */}
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mb-6",
          "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200"
        )}>
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </div>

        {/* Action Button - Centered */}
        <Button type="button" variant="outline" onClick={reload} className="mt-4">
          <RotateCcw className="mr-2 h-4 w-4" />
          {t("Upload another file")}
        </Button>
      </div>
    </StepLayout>
  );
}
