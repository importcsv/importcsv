import { useTranslation } from "../../../i18n/useTranslation";
import { Box, Flex } from "../../components/ui/flex";
import UploaderWrapper from "../../components/UploaderWrapper/UploaderWrapper";
import StepLayout from "../../components/StepLayout";
import { Button } from "../../components/ui/button";
import { UploaderProps } from "./types";
import { AlertCircle, Download } from "lucide-react";
import { designTokens } from "../../theme";
import { cn } from "../../../utils/cn";

export default function Uploader({
  columns,
  skipHeaderRowSelection,
  onSuccess,
  showDownloadTemplateButton,
  setDataError
}: UploaderProps) {
  const uploaderWrapper = (
    <UploaderWrapper
      onSuccess={onSuccess}
      skipHeaderRowSelection={skipHeaderRowSelection}
      setDataError={setDataError}
    />
  );
  showDownloadTemplateButton = showDownloadTemplateButton ?? true;
  const { t } = useTranslation();

  // Separate required and optional columns
  const requiredColumns = columns?.filter(col =>
    col.validators?.some(v => v.type === 'required')
  ) || [];
  const optionalColumns = columns?.filter(col =>
    !col.validators?.some(v => v.type === 'required')
  ) || [];

  function downloadTemplate() {
    // Use column labels for CSV headers
    const headers = (columns || []).map(col => col.label);
    const csvData = headers.join(",");

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvData], { type: "text/csv" }));
    link.download = "template.csv";
    link.click();
  }

  return (
    <StepLayout
      title={t("Upload file")}
      subtitle={t("Choose a CSV or Excel file to import your data")}
      contentClassName="px-6 py-6"
    >
      <div className="w-full max-w-[1200px] mx-auto">

        {/* Grid Container */}
        <div
          className={cn(
            "grid w-full items-start",
            "gap-4 sm:gap-8",
            columns && columns.length > 0
              ? "grid-cols-1 sm:grid-cols-[min(320px,40%)_1fr]"
              : "grid-cols-1"
          )}>
          {/* Upload Section (Primary Action - First in DOM for mobile) */}
          <div className="min-w-0">
            {uploaderWrapper}
          </div>

          {/* Schema Section (Visually first on desktop via sm:order-first) */}
          {columns && columns.length > 0 && (
            <div className="p-4 sm:p-6 h-fit sm:sticky sm:top-4 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#3a3a3a] rounded-xl shadow-sm dark:shadow-none sm:order-first">
              {/* Required Columns */}
              {requiredColumns.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-[#a1a1a1] uppercase tracking-wider">
                      {t("Required")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {requiredColumns.map((col) => (
                      <span
                        key={col.id}
                        className="px-3 py-1.5 text-sm font-medium bg-slate-100 dark:bg-[#2a2a2a] text-slate-700 dark:text-[#e5e5e5] rounded-lg"
                      >
                        {col.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Columns */}
              {optionalColumns.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-[#3a3a3a]" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-[#a1a1a1] uppercase tracking-wider">
                      {t("Optional")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {optionalColumns.map((col) => (
                      <span
                        key={col.id}
                        className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-[#1e1e1e] text-slate-500 dark:text-[#a1a1a1] rounded-lg border border-slate-200 dark:border-[#3a3a3a]"
                      >
                        {col.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Download - Enhanced */}
              {showDownloadTemplateButton && (
                <div className="pt-4 sm:pt-5 border-t border-slate-200 dark:border-[#3a3a3a]">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-[#2a1f0a] border border-amber-200 dark:border-[#5c4813] mb-4">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-[#fbbf24] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-[#fbbf24] leading-relaxed">
                      {t("Make sure your file includes all the required columns.")}
                    </p>
                  </div>
                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    className="w-full group hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200"
                  >
                    <Download className="w-4 h-4 mr-2 transition-transform group-hover:-translate-y-0.5" />
                    {t("Download CSV template")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </StepLayout>
  );
}
