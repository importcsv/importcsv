import { useState, useEffect } from "preact/hooks";
import type { JSX } from "preact";
import { useTranslation } from "../../../i18n/useTranslation";
import { Button } from "../../components/ui/button";
import { Flex, Text } from "../../components/ui/flex";
import { Info } from "lucide-react";
import Errors from "../../components/Errors";
import Table from "../../components/Table";
import StepLayout from "../../components/StepLayout";
import { UploadColumn } from "../../types";
import { Column } from "../../../types";
import useMapColumnsTable from "./hooks/useMapColumnsTable";
import { MapColumnsProps, TemplateColumnMapping } from "./types";
import { designTokens } from "../../theme";
import { cn } from "../../../utils/cn";

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

  const onSubmit = (e: JSX.TargetedEvent<HTMLFormElement>) => {
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

  const footerContent = (
    <>
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
      <Button type="button" isLoading={isSubmitting} onClick={onSubmit as any}>
        {t("Continue")}
      </Button>
    </>
  );

  return (
    <StepLayout
      title={t("Map columns from imported CSV")}
      subtitle={t("Match your CSV columns to the required fields")}
      footerContent={footerContent}
    >
      <form onSubmit={onSubmit} className="h-full">
        {data ? (
          <div className="overflow-auto border rounded-lg">
            <Table data={rows} background="dark" fixHeader columnWidths={getColumnWidths()} columnAlignments={["", "", "", "center"]} />
          </div>
        ) : (
          <div className="p-8 text-center">
            <span className={designTokens.typography.body}>{t("Loading...")}</span>
          </div>
        )}
      </form>
    </StepLayout>
  );
}
