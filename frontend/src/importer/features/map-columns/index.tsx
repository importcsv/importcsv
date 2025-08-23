import { FormEvent, useState, useEffect } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { Button } from "../../components/ui/button";
import { Flex, Text } from "../../components/ui/flex";
import { Info } from "lucide-react";
import Errors from "../../components/Errors";
import Table from "../../components/Table";
import { UploadColumn } from "../../types";
import { Column } from "../../../types";
import useMapColumnsTable from "./hooks/useMapColumnsTable";
import { MapColumnsProps, TemplateColumnMapping } from "./types";

export default function MapColumns({
  columns,
  data,
  columnMapping,
  selectedHeaderRow,
  skipHeaderRowSelection,
  onSuccess,
  onCancel,
  isSubmitting,
  importerKey,
  backendUrl,
}: MapColumnsProps) {
  if (data.rows.length === 0) {
    return null;
  }

  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const headerRowIndex = selectedHeaderRow ? selectedHeaderRow : 0;
  let sampleDataRows = data.rows.slice(headerRowIndex + 1, headerRowIndex + 4);

  // No longer using LLM suggestions

  const uploadColumns: UploadColumn[] = data.rows[headerRowIndex]?.values.map((cell, index) => {
    let sample_data = sampleDataRows.map((row) => row.values[index]);
    return {
      index: index,
      name: cell,
      sample_data,
    };
  });
  // Use columns directly - no conversion needed
  const templateColumns = columns || [];
  
  const { rows, formValues } = useMapColumnsTable(
    uploadColumns,
    templateColumns,
    columnMapping,
    isSubmitting,
    importerKey,
    backendUrl
  );
  const [error, setError] = useState<string | null>(null);

  const verifyRequiredColumns = (templateCols: Column[], formValues: { [uploadColumnIndex: number]: TemplateColumnMapping }): boolean => {
    const requiredColumns = templateCols.filter((column: any) => 
      column.validators?.some((v: any) => v.type === 'required')
    );
    const includedValues = Object.values(formValues).filter((value: any) => value.include);
    return requiredColumns.every((requiredColumn: any) => includedValues.some((includedValue: any) => ((includedValue as any).id || (includedValue as any).key) === requiredColumn.id));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const columns = Object.entries(formValues).reduce(
      (acc, [index, columnMapping]) =>
        columnMapping.include
          ? {
              ...acc,
              [index]: columnMapping,
            }
          : acc,
      {}
    );

    const isRequiredColumnsIncluded = verifyRequiredColumns(templateColumns, formValues);
    if (!isRequiredColumnsIncluded) {
      setError(t("Please include all required columns"));
      return;
    }

    onSuccess(columns);
  };

  // Adjust column widths based on screen size
  const getColumnWidths = () => {
    if (isMobile) {
      return ["25%", "25%", "25%", "25%"];
    }
    return ["20%", "30%", "30%", "20%"];
  };

  return (
    <div className="flex flex-col h-full">
      {/* LLM matching removed for better UX */}
      <form onSubmit={onSubmit}>
        {data ? (
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table data={rows} background="dark" fixHeader columnWidths={getColumnWidths()} columnAlignments={["", "", "", "center"]} />
          </div>
        ) : (
          <>{t("Loading...")}</>
        )}

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel} 
            disabled={isSubmitting}
          >
            {skipHeaderRowSelection ? t("Cancel") : t("Back")}
          </Button>
          {!!error && (
            <div className="flex-1">
              <Errors error={error} />
            </div>
          )}
          <Button isLoading={isSubmitting} type="submit">
            {t("Continue")}
          </Button>
        </div>
      </form>
    </div>
  );
}
