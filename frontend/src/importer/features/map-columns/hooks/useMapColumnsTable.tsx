import { useEffect, useMemo, useState, useRef } from "preact/hooks";
import type { JSX } from "preact";
import { useTranslation } from "../../../../i18n/useTranslation";
import Checkbox from "../../../components/Checkbox";
import { InputOption } from "../../../components/Input/types";
import DropdownFields from "../components/DropDownFields";
import { UploadColumn } from "../../../types";
import { Column } from "../../../../types";
import { TemplateColumnMapping } from "../types";
import { getMappingSuggestions } from "../../../services/mapping";
import { findBestColumnMatches } from "../../../utils/columnMatching";


export default function useMapColumnsTable(
  uploadColumns: UploadColumn[],
  templateColumns: Column[] = [],
  columnsValues: { [uploadColumnIndex: number]: TemplateColumnMapping },
  isLoading?: boolean,
  importerKey?: string,
  backendUrl?: string
) {
  const { t } = useTranslation();

  useEffect(() => {
    Object.keys(columnsValues).map((uploadColumnIndexStr) => {
      const uploadColumnIndex = Number(uploadColumnIndexStr);
      const templateId = columnsValues[uploadColumnIndex].id;
      handleTemplateChange(uploadColumnIndex, templateId);
    });
  }, []);

  const [values, setValues] = useState<{ [key: number]: TemplateColumnMapping }>(() => {
    const initialObject: { [key: number]: TemplateColumnMapping } = {};

    // Use the new two-phase matching algorithm
    const bestMatches = findBestColumnMatches(
      uploadColumns.map(uc => ({ index: uc.index, name: uc.name })),
      templateColumns.map(tc => ({ id: tc.id, label: tc.label }))
    );

    // Convert bestMatches (templateId -> sourceIndex) to our format (sourceIndex -> templateMapping)
    const sourceToTemplate: Record<number, string> = {};
    for (const [templateId, sourceIndex] of Object.entries(bestMatches)) {
      sourceToTemplate[sourceIndex] = templateId;
    }

    // Create initial mappings for all upload columns
    const initialMappings = uploadColumns.reduce((acc, uc) => {
      const matchedTemplateId = sourceToTemplate[uc.index];

      acc[uc.index] = {
        id: matchedTemplateId || "",
        include: !!matchedTemplateId,
        selected: true,
      };
      return acc;
    }, initialObject);

    return initialMappings;
  });

  const [selectedValues, setSelectedValues] = useState<{ id?: string; key?: string; selected: boolean | undefined }[]>(
    Object.values(values).map((v) => ({ id: (v as any).id, key: (v as any).key, selected: v.selected }))
  );

  // Track if LLM enhancement has been called to prevent multiple API calls
  const llmEnhancementCalled = useRef(false);

  // Enhance mappings with LLM suggestions after initial load
  useEffect(() => {
    const enhanceWithLLM = async () => {
      // Skip if already called
      if (llmEnhancementCalled.current) {
        return;
      }
      
      // Only run if we have columns, backend URL, and importer key
      if (!uploadColumns.length || !templateColumns.length || !backendUrl || !importerKey) {
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
          setValues((prevValues) => {
            const newValues = { ...prevValues };
            const usedTemplateKeys = new Set(
              Object.values(prevValues)
                .filter(v => (v as any).id || (v as any).key)
                .map(v => (v as any).id || (v as any).key)
            );

            // Sort by confidence (highest first)
            const sortedSuggestions = [...suggestions].sort((a, b) => b.confidence - a.confidence);

            for (const suggestion of sortedSuggestions) {
              // Only apply if:
              // 1. Good confidence (>0.7)
              // 2. No existing mapping or low-confidence string match
              // 3. Template key not already used
              const currentMapping = prevValues[suggestion.uploadIndex];
              const hasWeakMatch = ((currentMapping as any)?.id || (currentMapping as any)?.key) && !currentMapping?.selected;
              
              if (
                suggestion.confidence > 0.7 &&
                (!(currentMapping as any)?.id && !(currentMapping as any)?.key || hasWeakMatch) &&
                !usedTemplateKeys.has(suggestion.templateKey)
              ) {
                newValues[suggestion.uploadIndex] = {
                  id: suggestion.templateKey,
                  include: true,
                  selected: true
                };
                usedTemplateKeys.add(suggestion.templateKey);
              }
            }

            // Update selected values
            const templateFieldsObj = Object.values(newValues).map((v) => ({ id: (v as any).id, key: (v as any).key, selected: v.selected }));
            setSelectedValues(templateFieldsObj);

            return newValues;
          });
        }
      } catch (error) {
        // Silently fail - fallback to string similarity is already applied
      }
    };

    enhanceWithLLM();
  }, [uploadColumns, templateColumns, backendUrl, importerKey]);

  const templateFields: { [key: string]: InputOption } = useMemo(
    () => templateColumns.reduce((acc, tc) => ({ 
      ...acc, 
      [tc.label]: { 
        value: tc.id, 
        required: tc.validators?.some((v: any) => v.type === 'required') 
      } 
    }), {}),
    [JSON.stringify(templateColumns)]
  );

  const handleTemplateChange = (uploadColumnIndex: number, id: string) => {
    setValues((prev) => {
      const templatesFields = { ...prev, [uploadColumnIndex]: { ...prev[uploadColumnIndex], id: id, include: !!id, selected: !!id } };
      const templateFieldsObj = Object.values(templatesFields).map((v) => ({ id: (v as any).id, key: (v as any).key, selected: v.selected }));
      setSelectedValues(templateFieldsObj);
      return templatesFields;
    });
  };

  const handleUseChange = (id: number, value: boolean) => {
    setValues((prev) => ({ ...prev, [id]: { ...prev[id], include: !!((prev[id] as any).id || (prev[id] as any).key) && value } }));
  };

  const yourFileColumn = t("Your File Column");
  const yourSampleData = t("Your Sample Data");
  const destinationColumn = t("Destination Column");
  const include = t("Include");

  const rows = useMemo(() => {
    return uploadColumns.map((uc, index) => {
      const { name, sample_data } = uc;
      const suggestion = values?.[index] || {};
      const samples = sample_data.filter((d) => d);

      return {
        [yourFileColumn]: {
          raw: name || false,
          content: name || <em>{t("- empty -")}</em>,
        },
        [yourSampleData]: {
          raw: "",
          content: (
            <div title={samples.join(", ")} className="text-sm text-gray-500 truncate">
              {samples.map((d, i) => (
                <small key={i}>{d}</small>
              ))}
            </div>
          ),
        },
        [destinationColumn]: {
          raw: "",
          content: (
            <DropdownFields
              options={templateFields}
              value={(suggestion as any).id || (suggestion as any).key}
              placeholder={t("- Select one -")}
              onChange={(key: string) => handleTemplateChange(index, key)}
              selectedValues={selectedValues}
              updateSelectedValues={setSelectedValues}
            />
          ),
        },
        [include]: {
          raw: false,
          content: (
            <div className="flex justify-center">
              <Checkbox
                checked={suggestion.include}
                disabled={!((suggestion as any).id || (suggestion as any).key) || isLoading}
                onChange={(e: JSX.TargetedEvent<HTMLInputElement>) => handleUseChange(index, (e.target as HTMLInputElement).checked)}
              />
            </div>
          ),
        },
      };
    });
  }, [values, isLoading]);

  return {
    rows,
    formValues: values
  };
}
