import { useTranslation } from "../../../i18n/useTranslation";
import { Button } from "../../components/ui/button";
import { Box, Flex, Text } from "../../components/ui/flex";
import Table from "../../components/Table";
import UploaderWrapper from "../../components/UploaderWrapper/UploaderWrapper";
import useTemplateTable from "./hooks/useTemplateTable";
import { UploaderProps } from "./types";
import { PiDownloadSimple, PiInfo } from "react-icons/pi";
import { cn } from "../../../utils/cn";

export default function Uploader({
  template,
  skipHeaderRowSelection,
  onSuccess,
  showDownloadTemplateButton,
  setDataError
}: UploaderProps) {
  const fields = useTemplateTable(template.columns);
  const uploaderWrapper = (
    <UploaderWrapper
      onSuccess={onSuccess}
      skipHeaderRowSelection={skipHeaderRowSelection}
      setDataError={setDataError}
    />
  );
  showDownloadTemplateButton = showDownloadTemplateButton ?? true;
  const { t } = useTranslation();

  function downloadTemplate() {
    const { columns } = template;
    const csvData = `${columns.map((obj) => obj.name).join(",")}`;

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvData], { type: "text/csv" }));
    link.download = "example.csv";
    link.click();
  }

  return (
    <div className={cn(
      "flex flex-col w-full max-w-[560px] mx-auto p-8",
      "sm:px-4 sm:py-6",
      "max-[480px]:p-4"
    )}>
      {/* Title Section */}
      <Box className="mb-6 text-center">
        <Text className="text-2xl font-semibold text-gray-900 mb-2">
          {t("Upload a CSV file")}
        </Text>
        <Text className="text-sm text-gray-600">
          {t("Make sure file includes contact name and phone number")}
        </Text>
      </Box>

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

      {/* Template Info Card (Hidden on mobile, shown if needed) */}
      {fields.length > 0 && (
        <Box
          className="mt-6 p-4 bg-white rounded-lg border border-gray-200 hidden md:block"
        >
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            {t("Expected Columns")}
          </Text>
          <Box className="max-h-[120px] overflow-auto">
            <Table
              fixHeader
              data={fields}
              background="transparent"
              columnWidths={["65%", "35%"]}
              columnAlignments={["", "center"]}
            />
          </Box>
        </Box>
      )}
    </div>
  );
}