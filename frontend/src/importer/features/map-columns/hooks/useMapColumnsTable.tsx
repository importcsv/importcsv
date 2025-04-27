import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Checkbox from "../../../components/Checkbox";
import { InputOption } from "../../../components/Input/types";
import DropdownFields from "../components/DropDownFields";
import { TemplateColumn, UploadColumn } from "../../../types";
import stringsSimilarity from "../../../utils/stringSimilarity";
import { TemplateColumnMapping } from "../types";
import style from "../style/MapColumns.module.scss";
import { getLLMColumnMappingSuggestions } from "../../../services/api";

export default function useMapColumnsTable(
  uploadColumns: UploadColumn[],
  templateColumns: TemplateColumn[] = [],
  columnsValues: { [uploadColumnIndex: number]: TemplateColumnMapping },
  isLoading?: boolean,
  importerKey?: string,
  backendUrl?: string,
  useLLMSuggestions: boolean = false
) {
  const { t } = useTranslation();
  const [isLoadingLLMSuggestions, setIsLoadingLLMSuggestions] = useState(false);
  
  useEffect(() => {
    Object.keys(columnsValues).map((uploadColumnIndexStr) => {
      const uploadColumnIndex = Number(uploadColumnIndexStr);
      const templateKey = columnsValues[uploadColumnIndex].key;
      handleTemplateChange(uploadColumnIndex, templateKey);
    });
  }, []);

  const checkSimilarity = (templateColumnKey: string, uploadColumnName: string) => {
    const templateColumnKeyFormatted = templateColumnKey.replace(/_/g, " ");
    return stringsSimilarity(templateColumnKeyFormatted, uploadColumnName.toLowerCase()) > 0.9;
  };

  const isSuggestedMapping = (templateColumn: TemplateColumn, uploadColumnName: string) => {
    if (!templateColumn?.suggested_mappings) {
      return false;
    }
    return templateColumn.suggested_mappings.some((suggestion) => suggestion.toLowerCase() === uploadColumnName.toLowerCase());
  };

  const [values, setValues] = useState<{ [key: number]: TemplateColumnMapping }>(() => {
    const usedTemplateColumns = new Set<string>();
    const initialObject: { [key: number]: TemplateColumnMapping } = {};

    // Create initial mappings using traditional string matching
    const initialMappings = uploadColumns.reduce((acc, uc) => {
      const matchedSuggestedTemplateColumn = templateColumns?.find((tc) => isSuggestedMapping(tc, uc.name));

      if (matchedSuggestedTemplateColumn && matchedSuggestedTemplateColumn.key) {
        usedTemplateColumns.add(matchedSuggestedTemplateColumn.key);
        acc[uc.index] = { 
          key: matchedSuggestedTemplateColumn.key, 
          include: true,
          // Don't mark as selected so LLM can override it
          selected: false 
        };
        return acc;
      }

      const similarTemplateColumn = templateColumns?.find((tc) => {
        if (tc.key && !usedTemplateColumns.has(tc.key) && checkSimilarity(tc.key, uc.name)) {
          usedTemplateColumns.add(tc.key);
          return true;
        }
        return false;
      });

      acc[uc.index] = {
        key: similarTemplateColumn?.key || "",
        include: !!similarTemplateColumn?.key,
        // Don't mark as selected so LLM can override it
        selected: false,
      };
      return acc;
    }, initialObject);

    return initialMappings;
  });

  const [selectedValues, setSelectedValues] = useState<{ key: string; selected: boolean | undefined }[]>(
    Object.values(values).map(({ key, selected }) => ({ key, selected }))
  );

  const templateFields: { [key: string]: InputOption } = useMemo(
    () => templateColumns.reduce((acc, tc) => ({ ...acc, [tc.name]: { value: tc.key, required: tc.required } }), {}),
    [JSON.stringify(templateColumns)]
  );

  const handleTemplateChange = (uploadColumnIndex: number, key: string) => {
    setValues((prev) => {
      const templatesFields = { ...prev, [uploadColumnIndex]: { ...prev[uploadColumnIndex], key: key, include: !!key, selected: !!key } };
      const templateFieldsObj = Object.values(templatesFields).map(({ key, selected }) => ({ key, selected }));
      setSelectedValues(templateFieldsObj);
      return templatesFields;
    });
  };

  const handleUseChange = (id: number, value: boolean) => {
    setValues((prev) => ({ ...prev, [id]: { ...prev[id], include: !!prev[id].key && value } }));
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
            <div title={samples.join(", ")} className={style.samples}>
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
              value={suggestion.key}
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
            <Checkbox
              checked={suggestion.include}
              disabled={!suggestion.key || isLoading}
              onChange={(e) => handleUseChange(index, e.target.checked)}
            />
          ),
        },
      };
    });
  }, [values, isLoading]);
  // Fetch LLM suggestions if enabled
  useEffect(() => {
    const fetchLLMSuggestions = async () => {
      if (!useLLMSuggestions || !importerKey || !backendUrl || 
          uploadColumns.length === 0 || templateColumns.length === 0) {
        return;
      }

      try {
        setIsLoadingLLMSuggestions(true);
        const llmSuggestions = await getLLMColumnMappingSuggestions(
          backendUrl,
          importerKey,
          uploadColumns,
          templateColumns
        );

        if (Object.keys(llmSuggestions).length > 0) {
          // Create a new mappings object preserving user selections
          const newMappings: { [key: number]: TemplateColumnMapping } = {};
          const usedTemplateColumns = new Set<string>();
          
          // Preserve user selections
          Object.entries(values).forEach(([columnIndexStr, mapping]) => {
            const columnIndex = Number(columnIndexStr);
            if (mapping.selected === true && mapping.key) {
              newMappings[columnIndex] = mapping;
              usedTemplateColumns.add(mapping.key);
            } else {
              newMappings[columnIndex] = { key: "", include: false, selected: false };
            }
          });
          
          // Apply LLM suggestions to unmapped columns
          Object.entries(llmSuggestions).forEach(([columnIndexStr, suggestion]) => {
            const index = Number(columnIndexStr);
            if (!newMappings[index]?.selected && !usedTemplateColumns.has(suggestion.key)) {
              newMappings[index] = suggestion;
              usedTemplateColumns.add(suggestion.key);
            }
          });
          
          // Update state
          setValues(newMappings);
          setSelectedValues(Object.values(newMappings).map((mapping: TemplateColumnMapping) => ({
            key: mapping.key,
            selected: mapping.selected
          })) as { key: string; selected: boolean | undefined }[]);
        }
      } catch (error) {
        console.error('Error fetching LLM suggestions:', error);
      } finally {
        setIsLoadingLLMSuggestions(false);
      }
    };

    fetchLLMSuggestions();
  }, [useLLMSuggestions, importerKey, backendUrl, JSON.stringify(uploadColumns), JSON.stringify(templateColumns)]);

  return { 
    rows, 
    formValues: values,
    isLoadingLLMSuggestions 
  };
}
