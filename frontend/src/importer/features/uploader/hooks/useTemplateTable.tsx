import { useMemo } from "preact/hooks";
import { useTranslation } from "../../../../i18n/useTranslation";
import Tooltip from "../../../components/Tooltip";
import { Column } from "../../../../types";
import { Check } from "lucide-react";

export default function useTemplateTable(fields: Column[] = []) {
  if (!fields) {
    return [];
  }
  const { t } = useTranslation();
  const expectedColumnKey = t("Expected Column");
  const requiredKey = t("Required");
  const result = useMemo(() => {
    return fields.map((item) => ({
      [expectedColumnKey]: item?.description
        ? {
            raw: item.label,
            content: (
              <div>
                <Tooltip title={item?.description}>{item.label}</Tooltip>
              </div>
            ),
          }
        : item.label,
      [requiredKey]: { raw: item?.validators?.some((v: any) => v.type === 'required') ? 1 : 0, content: item?.validators?.some((v: any) => v.type === 'required') ? <Check /> : <></> },
    }));
  }, [fields]);

  return result;
}
