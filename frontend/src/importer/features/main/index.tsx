import Papa from "papaparse";
import { useEffect, useState } from "preact/hooks";
// Note: XLSX is dynamically imported when needed to reduce bundle size
// Users must install 'xlsx' package separately for Excel support
import { Button } from "../../components/ui/button";
import Errors from "../../components/Errors";
import Stepper from "../../components/Stepper";
import Validation from "../validation/Validation";
import { CSVImporterProps, Column } from "../../../types";
import useCustomStyles from "../../hooks/useCustomStyles";
import { parseObjectOrStringJSON } from "../../utils/utils";
import { ColumnMapping, ColumnMappingDictionary } from "../../../types";
import useStepNavigation, { StepEnum } from "./hooks/useStepNavigation";
import { FileData, FileRow } from "./types";
import Complete from "../complete";
import { cn } from "../../../utils/cn";
import ConfigureImport from "../configure-import";
import Uploader from "../uploader";
import { X } from "lucide-react";
import { useTranslation } from "../../../i18n/useTranslation";
import config from "../../../config";
import Root from "../../components/Root";

// Helper function to map backend field type to Column type
function mapBackendType(backendType: string): Column['type'] {
  const mapping: Record<string, Column['type']> = {
    'text': 'string',
    'string': 'string',
    'number': 'number',
    'email': 'email',
    'date': 'date',
    'phone': 'phone',
    'select': 'select',
    'boolean': 'string', // Map boolean to string for now
    'custom_regex': 'string' // Map custom_regex to string
  };
  
  return mapping[backendType] || 'string';
}

export default function Main(props: CSVImporterProps) {
  const {
    isModal = true,
    modalOnCloseTriggered = () => null,
    onComplete,
    customStyles,
    showDownloadTemplateButton,
    skipHeaderRowSelection,
    invalidRowHandling = 'block', // Default to 'block' for strict validation
    includeUnmatchedColumns: propIncludeUnmatchedColumns = false,
    importerKey,
    columns: propColumns, // HelloCSV-style columns for standalone mode
    backendUrl = config.apiBaseUrl,
    user,
    metadata,
    demoData
  } = props;
  const skipHeader = skipHeaderRowSelection ?? false;
  const isDemoMode = !!demoData;
  const isStandaloneMode = !importerKey; // Standalone if no importerKey

  const { t } = useTranslation();

  // Apply custom styles
  useCustomStyles(parseObjectOrStringJSON("customStyles", customStyles));

  // Stepper handler
  // Start at MapColumns step if demo mode is active
  const initialStep = isDemoMode ? StepEnum.MapColumns : StepEnum.Upload;
  const { currentStep, setStep, goNext, goBack, stepper } = useStepNavigation(initialStep, skipHeader, isDemoMode);

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

  // Map of upload column index -> ColumnMapping
  const [columnMapping, setColumnMapping] = useState<ColumnMappingDictionary>({});

  // Used in the final step to show a loading indicator while the data is submitting
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Loading state for Excel parser
  const [isLoadingExcelParser, setIsLoadingExcelParser] = useState<boolean>(false);

  // Store columns directly - either from props or fetched from backend
  const [importColumns, setImportColumns] = useState<Column[]>([]);
  
  // Initialize states based on props
  const [includeUnmatchedColumns, setIncludeUnmatchedColumns] = useState<boolean>(
    propIncludeUnmatchedColumns
  );
  const [filterInvalidRows, setFilterInvalidRows] = useState<boolean>(
    invalidRowHandling === 'exclude'
  );
  const [disableOnInvalidRows, setDisableOnInvalidRows] = useState<boolean>(
    invalidRowHandling === 'block'
  );

  // Initialize demo data if provided
  useEffect(() => {
    if (isDemoMode && demoData) {
      // Parse the demo CSV content
      Papa.parse(demoData.csvContent, {
        complete: function (results) {
          const csvData = results.data as Array<Array<string>>;
          const isNotBlankRow = (row: string[]) => row.some((cell) => cell.toString().trim() !== "");
          const rows: FileRow[] = csvData.filter(isNotBlankRow).map((row: string[], index: number) => ({ index, values: row }));

          setData({
            fileName: demoData.fileName,
            rows: rows,
            sheetList: [],
            errors: results.errors.map((error) => error.message),
          });
        },
        error: function(error: any) {
          console.error('Papa.parse error:', error);
        }
      });
    }
  }, [isDemoMode, demoData]);

  // Load schema from props or backend
  useEffect(() => {
    const fetchSchema = async () => {
      // Standalone mode: use provided columns
      if (isStandaloneMode) {
        if (!propColumns) {
          setInitializationError("Please provide 'columns' for standalone mode or 'importerKey' for backend mode.");
          return;
        }
        
        // Use columns directly
        setImportColumns(propColumns);
        return;
      }
      
      // Backend mode: fetch from API
      if (!importerKey) {
        setInitializationError("ImporterKey is required for backend mode.");
        return;
      }

      try {
        // Fetch schema from the backend
        const response = await fetch(`${backendUrl}/api/v1/imports/key/schema?importer_key=${importerKey}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch schema: ${response.statusText}`);
        }

        const schemaData = await response.json();

        // Store the include_unmatched_columns setting from the importer configuration
        if (schemaData.include_unmatched_columns !== undefined) {
          setIncludeUnmatchedColumns(schemaData.include_unmatched_columns);
        }

        // Store the filter_invalid_rows setting from the importer configuration
        if (schemaData.filter_invalid_rows !== undefined) {
          setFilterInvalidRows(schemaData.filter_invalid_rows);
        }

        // Store the disable_on_invalid_rows setting from the importer configuration
        if (schemaData.disable_on_invalid_rows !== undefined) {
          setDisableOnInvalidRows(schemaData.disable_on_invalid_rows);
        }
        
        // Store dark_mode setting if provided
        if (schemaData.dark_mode !== undefined && props.darkMode === undefined) {
          // Only use backend dark_mode if not explicitly set via props
          // This would need to be passed to the CSVImporter component
          // For now, we'll just note it for future use
        }

        // Convert backend fields to Column format
        const backendColumns: Column[] = schemaData.fields.map((field: any) => {
          const column: Column = {
            id: field.id || field.name,
            label: field.label || field.display_name || field.name.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type: mapBackendType(field.type)
          };
          
          // Use validators array if provided
          if (field.validators && Array.isArray(field.validators)) {
            column.validators = field.validators;
          } else {
            // Fallback to building validators from legacy fields
            const validators = [];
            
            if (field.required) {
              validators.push({ 
                type: 'required' as const,
                message: field.validation_error_message
              });
            }
            
            if (validators.length > 0) {
              column.validators = validators;
            }
          }
          
          // Add transformations if provided
          if (field.transformations && Array.isArray(field.transformations)) {
            column.transformations = field.transformations;
          }
          
          // Add options for select fields
          if (field.options && Array.isArray(field.options)) {
            column.options = field.options;
          } else if (field.type === 'select' && field.validation_format) {
            // Fallback to parsing validation_format for backward compatibility
            column.options = field.validation_format.split(',').map((o: string) => o.trim());
          } else if (field.validation_format && field.type !== 'select') {
            // If validation_format exists and it's not a select field, treat as regex
            if (!column.validators) {
              column.validators = [];
            }
            
            // Only add regex validator if not already present
            const hasRegex = column.validators.some(v => v.type === 'regex');
            if (!hasRegex) {
              column.validators.push({
                type: 'regex' as const,
                pattern: field.validation_format,
                message: field.validation_error_message
              });
            }
          }
          
          return column;
        });
        
        setImportColumns(backendColumns);
      } catch (error) {
        setInitializationError(`Failed to fetch schema: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    fetchSchema();
  }, [importerKey, backendUrl, isStandaloneMode, propColumns]);

  useEffect(() => {
    // TODO (client-sdk): Have the importer continue where left off if closed
    // Temporary solution to reload state if closed and opened again
    // Don't reload in demo mode - let the demo data load
    if (!isDemoMode && data.rows.length === 0 && currentStep !== StepEnum.Upload) {
      reload();
    }
  }, [data, isDemoMode]);

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
      data: Record<string, number | string>; // Mapped data
      unmapped_data: Record<string, string>; // Unmapped data
    };
    const startIndex = (selectedHeaderRow || 0) + 1;

    // Process rows to create data structure with mapped and unmapped data
    const headerRow = validatedData.rows[selectedHeaderRow || 0];
    const mappedRows = validatedData.rows.slice(startIndex).map((row) => {
      // Initialize the result structure
      const resultingRow: MappedRow = {
        data: {},
        unmapped_data: {},
      };

      // Process each cell in the row
      row.values.forEach((value, valueIndex) => {
        const mapping = columnMapping[valueIndex];
        const headerValue = headerRow.values[valueIndex];

        // Normalize the value (handle empty/null/NaN)
        const normalizedValue = (value === undefined || value === null || value === '' ||
          (typeof value === 'number' && isNaN(value))) ? "" : value.toString();

        if (mapping && mapping.include) {
          // Add to mapped data
          resultingRow.data[mapping.id] = normalizedValue;
        } else if (includeUnmatchedColumns && headerValue) {
          // Add to unmapped data if setting is enabled
          const columnKey = headerValue.toString().toLowerCase().replace(/\s+/g, "_");
          resultingRow.unmapped_data[columnKey] = normalizedValue;
        }
      });

      return resultingRow;
    });

    const includedColumns = Object.values(columnMapping).filter(({ include }) => include);

    // Standalone mode: directly call onComplete with data
    if (isStandaloneMode) {
      // For standalone mode, preserve the original row structure with values array
      // This ensures compatibility with examples that expect rows with values
      const standaloneData = validatedData.rows.slice(startIndex);
      
      onComplete && onComplete({
        success: true,
        data: standaloneData,  // Send rows with values array intact
        mappedData: mappedRows,  // Also include mapped data for compatibility
        num_rows: mappedRows.length,
        num_columns: includedColumns.length,
        headers: headerRow.values,
        columnMapping: columnMapping
      });
      setIsSubmitting(false);
      goNext();
      return;
    }
    
    // Backend mode: send to API
    if (!importerKey) {
      setDataError("ImporterKey is required for backend mode.");
      setIsSubmitting(false);
      return;
    }

    // Transform data for the backend format
    const transformedData = {
      validData: mappedRows,
      invalidData: [], // We don't track invalid rows in this version
    };

    // Transform column mapping to a format expected by the backend
    const columnMappingForBackend: Record<string, string> = {};
    Object.entries(columnMapping).forEach(([index, mapping]) => {
      if (mapping.include) {
        columnMappingForBackend[index] = mapping.id;
      }
    });

    // Use the public endpoint for processing imports
    const apiEndpoint = `${backendUrl}/api/v1/imports/key/process`;

    // Prepare the request payload
    const payload = {
      ...transformedData,
      columnMapping: columnMappingForBackend,
      user: user || {},
      metadata: metadata || {},
      importer_key: importerKey || "",
    };

    // Send the data to the backend

    fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to process import: ${response.statusText}`);
        }
        return response.json();
      })
      .then((result) => {
        // Call onComplete with the simplified backend response


        // The backend now returns a simplified response with just success/failure status
        // and a job_id that can be used to track the job
        if (result.success) {
          onComplete &&
            onComplete({
              success: true,
              message: result.message || "Import job successfully enqueued",
              num_rows: mappedRows.length,
              num_columns: includedColumns.length,
            });
        } else {
          onComplete &&
            onComplete({
              success: false,
              message: result.message || "Failed to process import",
              num_rows: mappedRows.length,
              num_columns: includedColumns.length,
            });
        }
      })
      .catch((error) => {
        // Call onComplete with the error

        onComplete &&
          onComplete({
            success: false,
            message: error.message || "Error processing import",
            num_rows: mappedRows.length,
            num_columns: includedColumns.length,
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
      <div className="flex flex-col h-auto min-h-[400px] p-4 w-full box-border overflow-auto">
        <Errors error={initializationError} centered />
      </div>
    );
  }

  const renderContent = () => {
    switch (currentStep) {
      case StepEnum.Upload:
        return (
          <Uploader
            columns={importColumns || propColumns}
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
                    // Lazy load XLSX library only when needed
                    setIsLoadingExcelParser(true);
                    setDataError(null);
                    import("xlsx").then((XLSX) => {
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
                      setIsLoadingExcelParser(false);
                      goNext();
                    }).catch((error) => {
                      // Check if it's a module not found error
                      const isModuleNotFound = error.message?.includes('Cannot find module') || 
                                               error.message?.includes('Failed to fetch dynamically imported module');
                      
                      const errorMessage = isModuleNotFound
                        ? "Excel support requires the 'xlsx' package. Please install it with: npm install xlsx"
                        : "Failed to load Excel parser. Please try again or use CSV format.";
                      
                      setDataError(errorMessage);
                      setIsLoadingExcelParser(false);
                      console.error("Failed to load XLSX library:", error);
                    });
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
        // This step is deprecated - skip to next
        goNext();
        return null;
      case StepEnum.MapColumns:
        // Use ConfigureImport component for column mapping and configuration
        return (
          <ConfigureImport
            columns={importColumns || propColumns}
            data={data}
            onSuccess={(mapping, headerRow) => {
              setColumnMapping(mapping);
              setSelectedHeaderRow(headerRow);
              goNext();
            }}
            onCancel={isDemoMode ? undefined : () => goBack(StepEnum.Upload)}
            isSubmitting={isSubmitting}
            importerKey={importerKey}
            backendUrl={backendUrl}
            isDemoMode={isDemoMode}
          />
        );
      case StepEnum.Validation:
        return (
          <Validation
            columns={importColumns || propColumns}
            data={data}
            columnMapping={columnMapping}
            selectedHeaderRow={selectedHeaderRow}
            onSuccess={handleValidationComplete}
            onCancel={handleBackToMapColumns}
            isSubmitting={isSubmitting}
            backendUrl={backendUrl}
            importerKey={importerKey}
            filterInvalidRows={filterInvalidRows}
            disableOnInvalidRows={disableOnInvalidRows}
          />
        );
      case StepEnum.Complete:
        return <Complete reload={reload} close={requestClose} isModal={isModal} />;
      default:
        return null;
    }
  };

  const content = (
    <div className={cn(
      "flex flex-col h-auto min-h-[400px] p-4 w-full box-border overflow-auto"
    )}>
      <div>
        <Stepper {...stepper} />
      </div>

      <div className="flex-1 overflow-visible min-w-0 w-full">{renderContent()}</div>

      {(!!dataError || isLoadingExcelParser) && (
        <div className="flex items-center justify-between gap-4 px-2 pb-2">
          <div></div>
          {isLoadingExcelParser ? (
            <div className="text-center p-5">
              <div className="mb-2">
                <span className="text-base">Loading Excel parser...</span>
              </div>
              <small className="opacity-70 text-xs">
                This may take a moment on first use
              </small>
            </div>
          ) : (
            <Errors error={dataError} centered />
          )}
          <div></div>
        </div>
      )}

      {isModal && (
        <button
          className={cn(
            "absolute right-2 top-2 rounded-full",
            "min-w-[36px] h-[36px] aspect-square text-xl p-0",
            "hover:bg-gray-100 transition-colors"
          )}
          aria-label="Close"
          onClick={requestClose}
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );

  // Wrap in Root component for isolation
  return (
    <Root primaryColor={props.primaryColor}>
      <div className="csv-importer" data-theme={props.darkMode ? 'dark' : 'light'}>
        {content}
      </div>
    </Root>
  );
}
