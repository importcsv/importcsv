// Schema inference from CSV sample data

class SampleColumn {
    name string @description("Column header name from CSV")
    samples string[] @description("5-10 sample values from the column")
}

enum ColumnType {
    Text
    Email
    Phone
    Date
    Number
    Boolean
    Select
}

class InferredColumn {
    name string @description("Original column name")
    display_name string @description("Human-readable display name")
    type ColumnType @description("Inferred data type")
    confidence float @description("Confidence score 0-1")
    suggested_options string[]? @description("For select type: detected unique values")
    reasoning string @description("Brief explanation of why this type was chosen")
}

class InferredSchema {
    columns InferredColumn[]
}

function InferSchema(columns: SampleColumn[]) -> InferredSchema {
    client CustomGPT4oMini
    prompt #"
        Analyze these CSV columns and infer the best data type for each.

        Rules:
        - email: Values look like email addresses (contain @ and domain)
        - phone: Values look like phone numbers (digits, dashes, parentheses, +)
        - date: Values look like dates (various formats: YYYY-MM-DD, MM/DD/YYYY, etc.)
        - number: Values are numeric (integers, decimals, currency amounts)
        - boolean: Values are binary (true/false, yes/no, 1/0, active/inactive)
        - select: Low cardinality (≤10 unique values) with repeated patterns
        - text: Default for everything else

        For display_name, convert snake_case/kebab-case to Title Case.
        For select types, include the unique values as suggested_options.

        Columns to analyze:
        {% for col in columns %}
        Column: {{ col.name }}
        Samples: {{ col.samples | join(", ") }}
        {% endfor %}

        {{ ctx.output_format }}
    "#
}
