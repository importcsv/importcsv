/**
 * Parse JSON input that can be either an object or a string
 * @param param - The parameter to parse (object or JSON string)
 * @param options - Options for parsing
 * @returns Parsed object or stringified JSON based on options
 */
export function parseJSON<T extends 'object' | 'string' = 'object'>(
  param?: Record<string, unknown> | string,
  options?: {
    returnType?: T;
    escapePercent?: boolean;
  }
): T extends 'string' ? string : Record<string, unknown> {
  const { returnType = 'object', escapePercent = false } = options || {};
  
  if (typeof param === "undefined") {
    return (returnType === 'string' ? "" : {}) as any;
  }

  let parsedObj: Record<string, unknown> = {};

  if (typeof param === "string") {
    try {
      parsedObj = JSON.parse(param);
    } catch (e) {
      // Error parsing JSON
      return (returnType === 'string' ? "" : {}) as any;
    }
  } else {
    parsedObj = param;
  }

  // Replace % symbols with %25 if requested
  if (escapePercent) {
    for (const key in parsedObj) {
      if (typeof parsedObj[key] === "string") {
        parsedObj[key] = (parsedObj[key] as string).replace(/%(?!25)/g, "%25");
      }
    }
  }

  return (returnType === 'string' ? JSON.stringify(parsedObj) : parsedObj) as any;
}

// Backward compatibility exports
export const parseObjectOrStringJSON = (name: string, param?: Record<string, unknown> | string): string => 
  parseJSON(param, { returnType: 'string', escapePercent: true });

export const parseObjectOrStringJSONToRecord = (name: string, param?: Record<string, unknown> | string): Record<string, unknown> => 
  parseJSON(param, { returnType: 'object' });

export const validateJSON = (str: string, paramName: string) => {
  if (!str || str === "undefined") {
    return "";
  }
  try {
    const obj = JSON.parse(str);
    return JSON.stringify(obj);
  } catch (e) {
    // Error validating JSON
    return "";
  }
};

export const sanitizeKey = (input: string): string => {
  let result = input.toLowerCase().replace(/\s/g, "_"); // Replace spaces with underscores
  result = result.replace(/[^a-zA-Z0-9_]/g, ""); // Remove non-alphanumeric characters except underscore
  return result;
};

export const parseOptionalBoolean = (val?: boolean) => {
  return typeof val === "undefined" || val === null ? "" : val ? "true" : "false";
};

export const strToBoolean = (str: string) => !!str && (str.toLowerCase() === "true" || str === "1");

export const strToOptionalBoolean = (str: string) => (str ? str.toLowerCase() === "true" || str === "1" : undefined);

export const strToDefaultBoolean = (str: string, defaultValue: boolean) => (str ? str.toLowerCase() === "true" || str === "1" : defaultValue);

// Color utilities moved to colorUtils.ts
// Export from there for backward compatibility if needed
export { isValidColor, darkenColor } from './colorUtils';
