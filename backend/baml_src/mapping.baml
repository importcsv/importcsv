// Column mapping function for ImportCSV

// Input types
class UploadColumn {
  index int
  name string
  sample string?  // Optional sample data
}

class TemplateColumn {
  key string
  name string
  required bool
}

// Output types
class ColumnMapping {
  upload_index int
  template_key string
  confidence float @description("Confidence score from 0 to 1")
}

class MappingResult {
  mappings ColumnMapping[]
}

// Main mapping function
function MapColumns(
  upload_columns: UploadColumn[],
  template_columns: TemplateColumn[]
) -> MappingResult {
  client "openai/gpt-4.1"
  prompt #"
    Map CSV columns to template fields based on names and sample data.

    CSV columns:
    {{ upload_columns }}

    Template fields:
    {{ template_columns }}

    Rules:
    - Only include mappings with confidence > 0.8
    - Each template field can only be mapped once
    - Recognize common variations (e.g., "Email Address" → "email")
    - Consider sample data to improve accuracy

    {{ ctx.output_format }}
  "#
}

// Test case
test map_basic_columns {
  functions [MapColumns]
  args {
    upload_columns [
      { index 0, name "Email Address", sample "john@example.com" },
      { index 1, name "Full Name", sample "John Doe" },
      { index 2, name "Phone", sample "555-1234" }
    ]
    template_columns [
      { key "email", name "Email", required true },
      { key "name", name "Name", required true },
      { key "phone", name "Phone Number", required false }
    ]
  }
}
