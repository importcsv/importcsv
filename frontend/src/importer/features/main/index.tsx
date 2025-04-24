import Papa from "papaparse";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { IconButton, Button } from "@chakra-ui/react";
import Errors from "../../components/Errors";
import Stepper from "../../components/Stepper";
import { CSVImporterProps } from "../../../types";
import useCustomStyles from "../../hooks/useCustomStyles";
import { Template } from "../../types";
import { convertRawTemplate } from "../../utils/template";
import { parseObjectOrStringJSON } from "../../utils/utils";
import { TemplateColumnMapping } from "../map-columns/types";
import useStepNavigation, { StepEnum } from "./hooks/useStepNavigation";
import { FileData, FileRow } from "./types";
import style from "./style/Main.module.scss";
import Complete from "../complete";
import MapColumns from "../map-columns";
import RowSelection from "../row-selection";
import Uploader from "../uploader";
import Validation from '../validation/Validation';
import { PiX } from "react-icons/pi";
import { useTranslation } from "react-i18next";

export default function Main(props: CSVImporterProps) {
  const {
    isModal = true,
    modalOnCloseTriggered = () => null,
    onComplete,
    customStyles,
    showDownloadTemplateButton,
    skipHeaderRowSelection,
    importerId,
    backendUrl = process.env.BACKEND_URL || 'http://localhost:8000',
    user,
    metadata,
  } = props;
  const skipHeader = skipHeaderRowSelection ?? false;

  const { t } = useTranslation();

  // Apply custom styles
  useCustomStyles(parseObjectOrStringJSON("customStyles", customStyles));

  // Stepper handler
  const { currentStep, setStep, goNext, goBack, stepper, setStorageStep } = useStepNavigation(StepEnum.Upload, skipHeader);

  // Error handling
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  // File data
  const emptyData = {
    fileName: "",
    rows: [],
    sheetList: [],
    errors: [],
  };
  const [data, setData] = useState<FileData>(emptyData);

  // Header row selection state
  const [selectedHeaderRow, setSelectedHeaderRow] = useState<number | null>(0);

  // Map of upload column index -> TemplateColumnMapping
  const [columnMapping, setColumnMapping] = useState<{ [index: number]: TemplateColumnMapping }>({});

  // Used in the final step to show a loading indicator while the data is submitting
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [parsedTemplate, setParsedTemplate] = useState<Template>({
    columns: [],
  });
  const [isLoadingSchema, setIsLoadingSchema] = useState<boolean>(false);

  // Fetch schema from the backend using importerId
  useEffect(() => {
    const fetchSchema = async () => {
      // ImporterId is required
      if (!importerId) {
        setInitializationError('ImporterId is required for CSV import. Please provide a valid importer ID.');
        return;
      }

      try {
        setIsLoadingSchema(true);
        // Fetch schema from the backend
        const response = await fetch(`${backendUrl}/api/v1/public/schema/${importerId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch schema: ${response.statusText}`);
        }
        
        const schemaData = await response.json();
        console.log('Fetched schema from backend:', schemaData);
        
        // Convert the schema to the format expected by the importer
        const schemaTemplate = {
          columns: schemaData.fields.map((field: any) => {
            console.log('Processing backend field:', field);
            return {
              name: field.name,
              key: field.key || field.name.toLowerCase().replace(/\s+/g, '_'), // Convert to snake_case for keys if key is not provided
              required: field.required || false,
              description: field.description || `${field.name} field`,
              type: field.type, // Use the type directly from backend
              data_type: field.type, // Also store as data_type for compatibility
              validation_format: field.validation_format
            };
          })
        };
        console.log('Converted schema template:', schemaTemplate);
        
        const [parsedTemplate, parsedTemplateError] = convertRawTemplate(schemaTemplate);
        if (parsedTemplateError) {
          setInitializationError(parsedTemplateError);
        } else if (parsedTemplate) {
          setParsedTemplate(parsedTemplate);
        }
      } catch (error) {
        console.error('Error fetching schema:', error);
        setInitializationError(`Failed to fetch schema: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoadingSchema(false);
      }
    };

    fetchSchema();
  }, [importerId, backendUrl]);

  useEffect(() => {
    // TODO (client-sdk): Have the importer continue where left off if closed
    // Temporary solution to reload state if closed and opened again
    if (data.rows.length === 0 && currentStep !== StepEnum.Upload) {
      reload();
    }
  }, [data]);

  // Actions
  const reload = () => {
    setData(emptyData);
    setSelectedHeaderRow(0);
    setColumnMapping({});
    setDataError(null);
    setStep(StepEnum.Upload);
  };

  const requestClose = () => {
    if (!isModal) {
      return;
    }
    modalOnCloseTriggered && modalOnCloseTriggered();
    if (currentStep === StepEnum.Complete) {
      reload();
    }
  };

  const handleValidationComplete = (validatedData: FileData) => {
    // Update data with validated values
    setData(validatedData);
    setIsSubmitting(true);

    // TODO (client-sdk): Move this type, add other data attributes (i.e. column definitions), and move the data processing to a function
    type MappedRow = {
      index: number;
      values: Record<string, number | string>;
    };
    const startIndex = (selectedHeaderRow || 0) + 1;

    const mappedRows: MappedRow[] = [];
    validatedData.rows.slice(startIndex).forEach((row: FileRow) => {
      const resultingRow: MappedRow = {
        index: row.index - startIndex,
        values: {},
      };
      row.values.forEach((value: string, valueIndex: number) => {
        const mapping = columnMapping[valueIndex];
        if (mapping && mapping.include) {
          resultingRow.values[mapping.key] = value;
        }
      });
      mappedRows.push(resultingRow);
    });

    const includedColumns = Object.values(columnMapping).filter(({ include }) => include);

    const onCompleteData = {
      num_rows: mappedRows.length,
      num_columns: includedColumns.length,
      error: null,
      columns: includedColumns.map(({ key }) => ({ key, name: key })),
      rows: mappedRows,
    };

    // Check if importerId is provided - it's required
    if (!importerId) {
      console.error('ERROR: importerId is required for CSV import');
      setDataError('ImporterId is required for CSV import. Please provide a valid importer ID.');
      setIsSubmitting(false);
      return;
    }

    console.log('DEBUG: Processing import with:', { importerId, backendUrl });

    // Transform data for the backend format
    const transformedData = {
      validData: mappedRows.map(row => row.values),
      invalidData: [] // We don't track invalid rows in this version
    };
    console.log('DEBUG: Transformed data:', transformedData);

    // Transform column mapping to a format expected by the backend
    const columnMappingForBackend: Record<string, string> = {};
    Object.entries(columnMapping).forEach(([index, mapping]) => {
      if (mapping.include) {
        columnMappingForBackend[index] = mapping.key;
      }
    });
    console.log('DEBUG: Column mapping for backend:', columnMappingForBackend);

    // Use the public endpoint which doesn't require authentication
    const apiEndpoint = `${backendUrl}/api/v1/public/process-import/${importerId}`;

    // Prepare the request payload
    const payload = {
      ...transformedData,
      columnMapping: columnMappingForBackend,
      user: user || {},
      metadata: metadata || {}
    };
    console.log('DEBUG: Request payload:', payload);

    // Send the data to the backend
    console.log('DEBUG: Sending fetch request to:', apiEndpoint);
    fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(response => {
        console.log('DEBUG: Received response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: response.headers
        });
        if (!response.ok) {
          throw new Error(`Failed to process import: ${response.statusText}`);
        }
        return response.json();
      })
      .then(result => {
        console.log('DEBUG: Import processed successfully:', result);
        // Call onComplete with the original data and backend response
        console.log('DEBUG: Calling onComplete with backendResponse');
        onComplete && onComplete({
          ...onCompleteData,
          backendResponse: result
        });
      })
      .catch(error => {
        console.error('DEBUG: Error processing import:', error);
        console.log('DEBUG: Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        // Call onComplete with the error
        console.log('DEBUG: Calling onComplete with error');
        onComplete && onComplete({
          ...onCompleteData,
          error: error.message
        });
      });

    setIsSubmitting(false);
    goNext();
  };

  const handleBackToMapColumns = () => {
    goBack(StepEnum.MapColumns);
  };

  if (initializationError) {
    return (
      <div className={style.wrapper}>
        <Errors error={initializationError} centered />
      </div>
    );
  }

  const renderContent = () => {
    switch (currentStep) {
      case StepEnum.Upload:
        return (
          <Uploader
            template={parsedTemplate}
            skipHeaderRowSelection={skipHeader || false}
            showDownloadTemplateButton={showDownloadTemplateButton}
            setDataError={setDataError}
            onSuccess={async (file: File) => {
              setDataError(null);
              const fileType = file.name.slice(file.name.lastIndexOf(".") + 1);
              if (!["csv", "xls", "xlsx"].includes(fileType)) {
                setDataError(t("Only CSV, XLS, and XLSX files can be uploaded"));
                return;
              }
              const reader = new FileReader();
              const isNotBlankRow = (row: string[]) => row.some((cell) => cell.toString().trim() !== "");
              reader.onload = async (e) => {
                const bstr = e?.target?.result;
                if (!bstr) {
                  return;
                }
                switch (fileType) {
                  case "csv":
                    Papa.parse(bstr.toString(), {
                      complete: function (results) {
                        const csvData = results.data as Array<Array<string>>;
                        const rows: FileRow[] = csvData.filter(isNotBlankRow).map((row: string[], index: number) => ({ index, values: row }));
                        setData({
                          fileName: file.name,
                          rows: rows,
                          sheetList: [],
                          errors: results.errors.map((error) => error.message),
                        });
                        goNext();
                      },
                    });
                    break;
                  case "xlsx":
                  case "xls":
                    const workbook = XLSX.read(bstr as string, { type: "binary" });
                    const sheetList = workbook.SheetNames;
                    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetList[0]], { header: 1 }) as Array<Array<string>>;
                    const rows: FileRow[] = data.filter(isNotBlankRow).map((row: string[], index: number) => ({ index, values: row }));
                    setData({
                      fileName: file.name,
                      rows: rows,
                      sheetList: sheetList,
                      errors: [], // TODO: Handle any parsing errors
                    });
                    goNext();
                    break;
                }
              };

              switch (fileType) {
                case "csv":
                  reader.readAsText(file, "utf-8");
                  break;
                case "xlsx":
                case "xls":
                  reader.readAsBinaryString(file);
                  break;
              }
            }}
          />
        );
      case StepEnum.RowSelection:
        return (
          <RowSelection
            data={data}
            onCancel={reload}
            onSuccess={() => goNext()}
            selectedHeaderRow={selectedHeaderRow}
            setSelectedHeaderRow={setSelectedHeaderRow}
          />
        );
      case StepEnum.MapColumns:
        return (
          <MapColumns
            template={parsedTemplate}
            data={data}
            columnMapping={columnMapping}
            skipHeaderRowSelection={skipHeader}
            selectedHeaderRow={selectedHeaderRow}
            onSuccess={(columns) => {
              setColumnMapping(columns);
              goNext();
            }}
            isSubmitting={isSubmitting}
            onCancel={skipHeader ? reload : () => goBack(StepEnum.RowSelection)}
            importerId={importerId}
            backendUrl={backendUrl}
          />
        );
      case StepEnum.Validation:
        return (
          <Validation
            template={parsedTemplate}
            data={data}
            columnMapping={columnMapping}
            selectedHeaderRow={selectedHeaderRow}
            onSuccess={handleValidationComplete}
            onCancel={handleBackToMapColumns}
            isSubmitting={isSubmitting}
          />
        );
      case StepEnum.Complete:
        return <Complete reload={reload} close={requestClose} isModal={isModal} />;
      default:
        return null;
    }
  };

  return (
    <div className={style.wrapper}>
      <div>
        <Stepper {...stepper} />
      </div>

      <div className={style.content}>{renderContent()}</div>

      {!!dataError && (
        <div className={style.status}>
          <div></div>
          <Errors error={dataError} centered />
          <div></div>
        </div>
      )}

      {isModal && <IconButton isRound className={style.close} colorScheme="secondary" aria-label="Close" icon={<PiX />} onClick={requestClose} />}
    </div>
  );
}
