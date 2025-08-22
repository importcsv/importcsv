import { Template } from "../types";
import { Column, Validator } from "../../types";
import { parseObjectOrStringJSONToRecord, sanitizeKey } from "./utils";

export function convertRawTemplate(rawTemplate?: Record<string, unknown> | string): [Template | null, string | null] {
  const template = parseObjectOrStringJSONToRecord("template", rawTemplate);

  if (!template || Object.keys(template).length === 0) {
    return [null, "The parameter 'template' is required. Please check the documentation for more details."];
  }

  const columnData = template["columns"];
  if (!columnData) {
    return [null, "Invalid template: No columns provided"];
  }
  if (!Array.isArray(columnData)) {
    return [null, "Invalid template: columns should be an array of objects"];
  }

  const seenIds: Record<string, boolean> = {};
  const columns: Column[] = [];

  for (let i = 0; i < columnData.length; i++) {
    const item = columnData[i];

    if (typeof item !== "object") {
      return [null, `Invalid template: Each item in columns should be an object (check column ${i})`];
    }

    // Support both old (key/name) and new (id/label) formats
    const id: string = item.id || item.key || "";
    const label: string = item.label || item.name || "";
    const description: string = item.description || "";
    const required: boolean = item.required || false;
    const data_type: string = item.data_type || "";
    const validation_format: string = item.validation_format || "";
    const type: Column['type'] = item.type || data_type || 'string';

    if (label === "") {
      return [null, `Invalid template: The parameter "label" or "name" is required for each column (check column ${i})`];
    }
    
    const finalId = id || sanitizeKey(label);
    
    if (seenIds[finalId]) {
      return [null, `Invalid template: Duplicate ids are not allowed (check column ${i})`];
    }

    seenIds[finalId] = true;

    // Build validators array from flat fields
    const validators: Validator[] = [];
    if (required) {
      validators.push({ type: 'required' });
    }
    if (validation_format && type !== 'select') {
      validators.push({ 
        type: 'regex', 
        pattern: validation_format 
      });
    }

    const column: Column = {
      id: finalId,
      label,
      type: type as Column['type'],
      description,
    };

    if (validators.length > 0) {
      column.validators = validators;
    }

    // Handle select options
    if (type === 'select' && validation_format) {
      column.options = validation_format.split(',').map(o => o.trim());
    }

    columns.push(column);
  }

  if (columns.length === 0) {
    return [null, "Invalid template: No columns were provided"];
  }

  return [{ columns }, null];
}
