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
  client "openai/gpt-5.2"
  prompt #"
    Map CSV columns to template fields based on names and sample data.

    CSV columns:
    {{ upload_columns }}

    Template fields:
    {{ template_columns }}

    Rules:
    - EXACT MATCH PRIORITY: If a CSV column name exactly matches a template field name
      (ignoring case, underscores, spaces), ALWAYS map it with confidence 1.0
    - When multiple CSV columns contain similar words (e.g., "Email", "Email consent",
      "Email subscription"), prefer the SHORTEST/most specific column name for the base field
    - Use sample data to validate matches:
      - Email fields should contain "@" symbols
      - Date fields should contain date-like values
      - Boolean/consent fields typically contain yes/no/true/false
    - Only include mappings with confidence > 0.8
    - Each template field can only be mapped once
    - Each CSV column can only be mapped once

    Example: Given columns ["Email consent", "Email subscription status", "Email"] and
    template field "email", map "Email" (index 2) because it's an exact match, NOT
    "Email consent" which is a different concept (consent flag, not email address).

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

// Test case for exact match priority (Issue #15)
// "Email" column should map to "email" field, NOT "Email consent"
test map_email_vs_email_consent {
  functions [MapColumns]
  args {
    upload_columns [
      { index 0, name "Email consent", sample "yes" },
      { index 1, name "Email subscription status", sample "active" },
      { index 2, name "Email opt-in date", sample "2024-01-15" },
      { index 3, name "Email", sample "john@example.com" },
      { index 4, name "First Name", sample "John" }
    ]
    template_columns [
      { key "email", name "Email", required true },
      { key "first_name", name "First Name", required true }
    ]
  }
}
