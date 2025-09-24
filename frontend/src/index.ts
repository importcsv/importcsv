// Import CSS so it's automatically included when the library is imported
import "./index.css";

import CSVImporter from "./components/CSVImporter";

// Named export for CSVImporter
export { CSVImporter };

// Default export for backward compatibility
export default CSVImporter;

export { importcsvStyles } from "./styles";
export type { Column, Validator, Transformer } from "./types";
