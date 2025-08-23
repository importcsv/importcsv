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
          {/* Schema Section (Left Side) */}
          {columns && columns.length > 0 && (
            <div
              className={cn(designTokens.components.card, "p-6 h-fit sticky top-4")}>
              {/* Required Columns */}
              {requiredColumns.length > 0 && (
                <div className={designTokens.spacing.section}>
                  <div className={cn(designTokens.typography.caption, "mb-3 uppercase tracking-wider")}>
                    {t("Required")}
                  </div>
                  <div className="flex flex-col gap-2">
                    {requiredColumns.map((col) => (
                      <div key={col.id} className="flex items-center">
                        <span className={designTokens.typography.body}>{col.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Columns */}
              {optionalColumns.length > 0 && (
                <div className="">
                  <div className={cn(designTokens.typography.caption, "mb-3 uppercase tracking-wider")}>
                    {t("Optional")}
                  </div>
                  <div className="flex flex-col gap-2">
                    {optionalColumns.map((col) => (
                      <div key={col.id} className="flex items-center">
                        <span className={cn(designTokens.typography.body, "text-gray-600")}>{col.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info Box with Download Button */}
              {showDownloadTemplateButton && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 mb-3">
                    <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className={cn(designTokens.typography.caption, "text-blue-700")}>
                      {t("Make sure your file includes all the required columns.")}
                    </p>
                  </div>
                  <Button
                    onClick={downloadTemplate}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
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
