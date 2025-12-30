import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import type { ComponentChildren, FunctionComponent, JSX } from 'preact';
import { Button } from '../../components/ui/button';
import { Box, Flex, Text, VStack, HStack } from '../../components/ui/flex';
import { Switch } from '../../components/ui/switch';
import { Select } from '../../components/ui/select';
import StepLayout from '../../components/StepLayout';
import MappingSkeleton from '../../components/MappingSkeleton';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n/useTranslation';
import { Column, ColumnMapping, ColumnMappingDictionary } from '../../../types';
import stringSimilarity from '../../utils/stringSimilarity';
import { getMappingSuggestions } from '../../services/mapping';
import { designTokens } from '../../theme';
import { cn } from '../../../utils/cn';

interface ConfigureImportProps {
  columns?: Column[];
  data: any;
  onSuccess: (mapping: ColumnMappingDictionary, headerRow: number) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  importerKey?: string;
  backendUrl?: string;
  isDemoMode?: boolean;
}

export default function ConfigureImport({
  columns,
  data,
  onSuccess,
  onCancel,
  isSubmitting = false,
  importerKey,
  backendUrl,
  isDemoMode = false,
}: ConfigureImportProps) {
  const { t } = useTranslation();
  const selectedHeaderRow = 0; // Always use first row as headers
  const [columnMapping, setColumnMapping] = useState<ColumnMappingDictionary>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMappings, setIsLoadingMappings] = useState(false);
  const [mappingsReady, setMappingsReady] = useState(false);
  const llmEnhancementCalled = useRef(false);

  // Get preview data (first 5 rows)
  const previewRows = useMemo(() => {
    return data.rows.slice(0, Math.min(5, data.rows.length));
  }, [data.rows]);

  // Get column headers from first row
  const columnHeaders = useMemo(() => {
    if (data.rows[selectedHeaderRow]) {
      return data.rows[selectedHeaderRow].values;
    }
    return [];
  }, [data.rows]);

  // Prepare uploadColumns for AI mapping
  const uploadColumns = useMemo(() => {
    return columnHeaders.map((header: string, index: number) => ({
      index: index,
      name: header,
      sample_data: data.rows
        .slice(selectedHeaderRow + 1, selectedHeaderRow + 4)
        .map((row: any) => row.values[index])
        .filter((val: any) => val)
    }));
  }, [columnHeaders, data.rows, selectedHeaderRow]);

  // Get sample data for each column (skip header row)
  const getSampleData = (columnIndex: number) => {
    const startRow = selectedHeaderRow + 1;
    const samples = data.rows
      .slice(startRow, startRow + 3)
      .map((row: any) => row.values[columnIndex])
      .filter((val: any) => val);
    return samples.join(', ');
  };

  // Use columns directly - no conversion needed
  const templateColumns = columns || [];

  // Auto-map columns based on name similarity
  useEffect(() => {
    // Start loading if we have backend URL and importer key (will fetch AI mappings)
    if (backendUrl && importerKey && columnHeaders.length > 0 && templateColumns.length > 0) {
      setIsLoadingMappings(true);
    }

    const autoMap: ColumnMappingDictionary = {};

    columnHeaders.forEach((header: string, index: number) => {
      let bestMatch = { column: null as any, score: 0 };

      templateColumns.forEach((templateCol) => {
        const score = stringSimilarity(
          header.toLowerCase().trim(),
          templateCol.label.toLowerCase().trim()
        );

        if (score > bestMatch.score && score > 0.6) {
          bestMatch = { column: templateCol, score };
        }
      });

      if (bestMatch.column) {
        autoMap[index] = {
          id: bestMatch.column.id || '',
          label: bestMatch.column.label,
          include: true,
        };
      }
    });

    setColumnMapping(autoMap);

    // If no backend, mark mappings as ready immediately (string match only)
    if (!backendUrl || !importerKey) {
      setMappingsReady(true);
    }
  }, [columnHeaders, templateColumns, backendUrl, importerKey]);

  // Enhance mappings with LLM suggestions after initial load
  useEffect(() => {
    const enhanceWithLLM = async () => {
      // Skip if already called
      if (llmEnhancementCalled.current) {
        return;
      }

      // Only run if we have columns, backend URL, and importer key
      if (!uploadColumns.length || !templateColumns.length || !backendUrl || !importerKey) {
        setIsLoadingMappings(false);
        setMappingsReady(true);
        return;
      }

      // Mark as called to prevent duplicate requests
      llmEnhancementCalled.current = true;

      try {
        // Get LLM-enhanced mapping suggestions
        const suggestions = await getMappingSuggestions(
          uploadColumns,
          templateColumns,
          backendUrl,
          importerKey
        );

        if (suggestions.length > 0) {
          // Apply high-confidence suggestions that don't override existing good matches
          setColumnMapping((prevMapping) => {
            const newMapping = { ...prevMapping };
            const usedTemplateIds = new Set(
              Object.values(prevMapping)
                .filter(v => v.id)
                .map(v => v.id)
            );

            // Sort by confidence (highest first)
            const sortedSuggestions = [...suggestions].sort((a, b) => b.confidence - a.confidence);

            for (const suggestion of sortedSuggestions) {
              // Only apply if:
              // 1. Good confidence (>0.7)
              // 2. No existing mapping or low-confidence string match
              // 3. Template key not already used
              const currentMapping = prevMapping[suggestion.uploadIndex];
              const hasWeakMatch = currentMapping?.id && !currentMapping?.include;

              if (
                suggestion.confidence > 0.7 &&
                (!currentMapping?.id || hasWeakMatch) &&
                !usedTemplateIds.has(suggestion.templateKey)
              ) {
                const templateCol = templateColumns.find(col => col.id === suggestion.templateKey);
                if (templateCol) {
                  newMapping[suggestion.uploadIndex] = {
                    id: suggestion.templateKey,
                    label: templateCol.label,
                    include: true,
                  };
                  usedTemplateIds.add(suggestion.templateKey);
                }
              }
            }

            return newMapping;
          });
        }
      } catch (error) {
        // Silently fail - fallback to string similarity is already applied
      } finally {
        // Mark loading complete and trigger animation
        setIsLoadingMappings(false);
        setMappingsReady(true);
      }
    };

    enhanceWithLLM();
  }, [uploadColumns, templateColumns, backendUrl, importerKey]);

  // Handle column mapping change
  const handleMappingChange = (templateFieldId: string, csvColumnIndex: string) => {
    const newMapping = { ...columnMapping };

    // Clear previous mapping for this template field
    Object.keys(newMapping).forEach((key) => {
      if (newMapping[parseInt(key)].id === templateFieldId) {
        delete newMapping[parseInt(key)];
      }
    });

    // Set new mapping if column selected (and not "none")
    if (csvColumnIndex !== '' && csvColumnIndex !== 'none') {
      const colIndex = parseInt(csvColumnIndex);
      const templateField = templateColumns.find(col => col.id === templateFieldId);

      if (templateField) {
        newMapping[colIndex] = {
          id: templateFieldId,
          label: templateField.label,
          include: true,
        };
      }
    }

    setColumnMapping(newMapping);
  };

  // Get CSV column index for a template field
  const getMappedColumn = (templateFieldId: string): string => {
    const entry = Object.entries(columnMapping).find(
      ([_, mapping]) => mapping.id === templateFieldId
    );
    return entry ? entry[0] : '';
  };

  // Check if all required fields are mapped
  const allRequiredFieldsMapped = useMemo(() => {
    const requiredFields = templateColumns.filter((col: any) =>
      col.validators?.some((v: any) => v.type === 'required')
    );
    return requiredFields.every((field: any) =>
      Object.values(columnMapping).some(mapping => mapping.id === field.id)
    );
  }, [templateColumns, columnMapping]);

  // Handle form submission
  const handleSubmit = () => {
    if (!allRequiredFieldsMapped) {
      setError(t('Please map all required fields'));
      return;
    }

    setError(null);
    onSuccess(columnMapping, selectedHeaderRow);
  };

  const footerContent = (
    <>
      {!isDemoMode && onCancel && (
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          size="default"
        >
          {t('Back')}
        </Button>
      )}
      {isDemoMode && <div />}
      {error && (
        <div className="flex-1 mx-4">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            <span className={cn(designTokens.typography.body, "text-red-700")}>{error}</span>
          </div>
        </div>
      )}
      <Button
        onClick={handleSubmit}
        isLoading={isSubmitting}
        disabled={!allRequiredFieldsMapped}
        size="default"
        variant="default"
      >
        {t('Continue')}
      </Button>
    </>
  );

  // Show skeleton while loading AI mappings
  if (isLoadingMappings) {
    return (
      <StepLayout
        title={t('Configure Import')}
        subtitle={t('Analyzing your columns...')}
        footerContent={footerContent}
        contentClassName="px-6 py-4"
      >
        <MappingSkeleton rows={templateColumns.length || 5} />
      </StepLayout>
    );
  }

  return (
    <StepLayout
      title={t('Configure Import')}
      subtitle={t('Map your CSV columns to the required fields')}
      footerContent={footerContent}
      contentClassName="px-6 py-4"
    >
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
        <table className={cn(designTokens.components.table, "min-w-[600px]")}>
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3.5 w-[30%]">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t('Fields')}
                </span>
              </th>
              <th className="text-left px-6 py-3.5 w-[35%]">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t('CSV Column')}
                </span>
              </th>
              <th className="text-left px-6 py-3.5 w-[35%]">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t('Preview')}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {templateColumns.map((field: any, index: number) => {
              const mappedColumn = getMappedColumn(field.id);
              const isMapped = mappedColumn !== '';
              const isRequired = field.validators?.some((v: any) => v.type === 'required');

              return (
                <tr
                  key={field.id}
                  className={cn(
                    "border-b border-slate-100 transition-all duration-200",
                    "hover:bg-blue-50/50",
                    mappingsReady && "mapping-row-animate"
                  )}
                  style={mappingsReady ? { animationDelay: `${index * 50}ms` } : undefined}
                >
                  <td className="px-6 py-5">
                    <HStack className="gap-2 items-center">
                      {isMapped && (
                        <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 check-pulse" />
                      )}
                      {!isMapped && isRequired && (
                        <div className="w-5 h-5 rounded-full border-2 border-dashed border-slate-300 flex-shrink-0 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        </div>
                      )}
                      {!isMapped && !isRequired && (
                        <Box className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span className={designTokens.typography.body}>
                        {field.label}
                        {isRequired && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </span>
                    </HStack>
                  </td>
                  <td className="px-6 py-5">
                    <Select
                      value={mappedColumn}
                      onValueChange={(value) => handleMappingChange(field.id, value)}
                      placeholder={t('Select...')}
                      className="h-9 w-full max-w-[250px]"
                      options={[
                        { value: "none", label: "— None —" },
                        ...columnHeaders.map((header: string, idx: number) => {
                          const isAlreadyMapped = Object.keys(columnMapping).includes(idx.toString()) &&
                            columnMapping[idx].id !== field.id;

                          return {
                            value: idx.toString(),
                            label: isAlreadyMapped ? `${header} (mapped)` : header,
                            disabled: isAlreadyMapped
                          };
                        })
                      ]}
                    />
                  </td>
                  <td className="px-6 py-5">
                    {mappedColumn ? (
                      <div className="flex flex-wrap gap-1.5 max-w-[320px]">
                        {getSampleData(parseInt(mappedColumn)).split(', ').filter(Boolean).slice(0, 3).map((sample: string, i: number) => (
                          <span
                            key={i}
                            className="inline-flex px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-md truncate max-w-[100px]"
                            title={sample}
                          >
                            {sample}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </StepLayout>
  );
}
