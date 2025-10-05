// Import CSS so it's automatically included when the library is imported
import "./index.css";

import CSVImporter from "./components/CSVImporter";

// Named export for CSVImporter
export { CSVImporter };

// Default export for backward compatibility
export default CSVImporter;

// Standalone components
export { Uploader } from "./components/Uploader";
export { ColumnMapper } from "./components/ColumnMapper";

// Headless primitives namespace
export * as CSV from "./headless";

// Legacy exports
export { importcsvStyles } from "./styles";
export type { Column, Validator, Transformer } from "./types";

// Export headless types
export type {
  Column as HeadlessColumn,
  ValidationError,
  CSVContextValue,
  RootProps,
  ValidatorProps
} from "./headless/types";
