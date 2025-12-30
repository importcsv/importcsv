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
            "grid gap-8 w-full items-start",
            columns && columns.length > 0 ? "grid-cols-[320px_1fr]" : "grid-cols-1"
          )}>
          {/* Schema Section (Left Side) - Enhanced */}
          {columns && columns.length > 0 && (
            <div className="p-6 h-fit sticky top-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              {/* Required Columns */}
              {requiredColumns.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("Required")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {requiredColumns.map((col) => (
                      <span
                        key={col.id}
                        className="px-3 py-1.5 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg"
                      >
                        {col.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Columns */}
              {optionalColumns.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {t("Optional")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {optionalColumns.map((col) => (
                      <span
                        key={col.id}
                        className="px-3 py-1.5 text-sm bg-slate-50 text-slate-500 rounded-lg border border-slate-200"
                      >
                        {col.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Download - Enhanced */}
              {showDownloadTemplateButton && (
                <div className="pt-5 border-t border-slate-200">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-4">
                    <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 leading-relaxed">
                      {t("Make sure your file includes all the required columns.")}
                    </p>
                  </div>
                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    className="w-full group hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                  >
                    <Download className="w-4 h-4 mr-2 transition-transform group-hover:-translate-y-0.5" />
                    {t("Download CSV template")}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Upload Section (Right Side or Full Width) */}
          <div className="">
            {uploaderWrapper}
          </div>
        </div>
      </div>
    </StepLayout>
  );
}
