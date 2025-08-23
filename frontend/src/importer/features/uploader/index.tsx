import { useTranslation } from "../../../i18n/useTranslation";
import { Box, Flex } from "../../components/ui/flex";
import UploaderWrapper from "../../components/UploaderWrapper/UploaderWrapper";
import { UploaderProps } from "./types";
import { AlertCircle } from "lucide-react";

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
    <div className="w-full max-w-[1000px] mx-auto p-8">
      {/* Title Section */}
      <h2 className="text-center text-2xl font-semibold text-gray-900 p-2">
        {t("Upload file")}
      </h2>

      {/* Grid Container */}
      <div
        className="grid gap-12 w-full items-start"
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '3rem',
          alignItems: 'start'
        }}>
        {/* Schema Section (Left Side) */}
        {columns && columns.length > 0 && (
          <div
            className="border border-gray-200 rounded-lg p-6 bg-white h-fit"
            style={{
              position: 'sticky',
              top: '2rem',
              height: 'fit-content'
            }}>
            {/* Required Columns */}
            {requiredColumns.length > 0 && (
              <div className="mb-8">
                <div className="text-xs font-normal text-gray-700 mb-4 uppercase tracking-wider">
                  {t("Required")}
                </div>
                <div className="flex flex-col gap-3">
                  {requiredColumns.map((col) => (
                    <div key={col.id} className="flex items-center">
                      <span className="text-sm text-gray-900">{col.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Columns */}
            {optionalColumns.length > 0 && (
              <div className="pb-2">
                <div className="text-xs font-normal text-gray-700 mt-4 mb-2 uppercase tracking-wider">
                  {t("Optional")}
                </div>
                <div className="flex flex-col gap-3">
                  {optionalColumns.map((col) => (
                    <div key={col.id} className="flex items-center">
                      <span className="text-sm text-gray-900">{col.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md border border-blue-200 mt-4">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-900 leading-tight">
                {t("Make sure your file includes all the required columns.")}
              </p>
            </div>
          </div>
        )}

        {/* Upload Section (Right Side) */}
        <div className="flex flex-col w-full">
          {/* Upload Area */}
          <Box className="mb-4">
            {uploaderWrapper}
          </Box>

          {/* Footer Links */}
          <Flex className="items-center justify-center flex-wrap gap-2 text-sm">
            <span className="text-gray-400">or</span>
            {showDownloadTemplateButton && (
              <a
                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                onClick={downloadTemplate}
              >
                <span className="hover:underline">{t("Download a sample CSV file")}</span>
              </a>
            )}
          </Flex>
        </div>
      </div>
    </div>
  );
}
