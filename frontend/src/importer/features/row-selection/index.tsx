import { useState } from "preact/hooks";
import type { JSX } from "preact";
import { useTranslation } from "../../../i18n/useTranslation";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import Table from "../../components/Table";
import Tooltip from "../../components/Tooltip";
import { RowSelectionProps } from "./types";
import { AlertCircle } from "lucide-react";

export default function RowSelection({ data, onSuccess, onCancel, selectedHeaderRow, setSelectedHeaderRow }: RowSelectionProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const handleRadioChange = (e: JSX.TargetedEvent<HTMLInputElement>) => {
    setSelectedHeaderRow(Number((e.target as HTMLInputElement).value));
  };
  const rowLimit = 50;

  const dataWithRadios = data.rows.slice(0, rowLimit).map((row) => {
    const nameWithRadio = (
      <span>
        <input
          type="radio"
          id={`radio-${row.index}`}
          className="mr-2 cursor-pointer"
          name="rowSelection"
          value={row.index}
          checked={selectedHeaderRow === row.index}
          onChange={handleRadioChange}
        />
        {row.values?.[0]}
      </span>
    );
    const mappedRow = Object.entries(row.values).map(([key, value]) => {
      return [
        key,
        {
          raw: value,
          content: key === "0" ? nameWithRadio : <span>{value}</span>,
          tooltip: value,
        },
      ];
    });
    return Object.fromEntries(mappedRow);
  });

  const maxNumberOfColumns = 7;
  const uploadRow = data.rows[0] ?? { values: {} };
  const numberOfColumns = Math.min(Object.keys(uploadRow.values).length, maxNumberOfColumns);
  const widthPercentage = 100 / numberOfColumns;
  const columnWidths = Array(numberOfColumns).fill(`${widthPercentage}%`);
  const hasMultipleExcelSheets = (data.sheetList.length ?? 0) > 1;

  const handleNextClick = (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    onSuccess();
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <form>
        {data ? (
          <>
            {hasMultipleExcelSheets ? (
              <Alert className="border-l-4 border-blue-500 bg-blue-50">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                {t(
                  "Only the first sheet (&quot;{{sheet}}&quot;) of the Excel file will be imported. To import multiple sheets, please upload each sheet individually.",
                  { sheet: data.sheetList[0] }
                )}
              </Alert>
            ) : null}
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table
                fixHeader
                mergeThemes={true}
                data={dataWithRadios || []}
                heading={
                  <div className="px-4 py-2 bg-gray-50 border-b font-semibold">
                    <Tooltip title={t("Select the row which contains the column headers")}>{t("Select Header Row")}</Tooltip>
                  </div>
                }
                keyAsId="index"
                background="zebra"
                columnWidths={columnWidths}
                columnAlignments={Array(numberOfColumns).fill("left")}
                onRowClick={(row) => setSelectedHeaderRow(dataWithRadios?.indexOf(row) || 0)}
              />
            </div>
          </>
        ) : (
          <>{t("Loading...")}</>
        )}

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={isLoading}
          >
            {t("Back")}
          </Button>
          <Button 
            type="submit"
            onClick={handleNextClick} 
            isLoading={isLoading}
          >
            {t("Continue")}
          </Button>
        </div>
        {/*{!isLoading && !!error && (*/}
        {/*  <div className="error-container">*/}
        {/*    <Errors error={error} />*/}
        {/*  </div>*/}
        {/*)}*/}
      </form>
    </div>
  );
}
