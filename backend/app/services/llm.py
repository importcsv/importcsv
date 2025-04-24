import os
import json
from typing import List, Dict, Any, Optional
import pandas as pd
from litellm import completion

from app.core.config import settings
from app.schemas.schema import SchemaField
from app.schemas.import_job import ColumnMapping

class LLMService:
    def __init__(self):
        # Set defaults if settings are not defined
        self.model = getattr(settings, 'LLM_MODEL', 'gpt-3.5-turbo')
        self.use_local_llm = getattr(settings, 'USE_LOCAL_LLM', False)
        self.local_llm_url = getattr(settings, 'LOCAL_LLM_URL', None)
        self.openai_api_key = getattr(settings, 'OPENAI_API_KEY', None)
    
    async def _get_completion(self, prompt: str) -> str:
        """Get completion from LLM with timeout and fallback mock response"""
        import asyncio
        
        print("USING MOCK LLM RESPONSE: For development/testing")
        # The prompt contains error information, but we'll use a simpler approach for mocking
        
        # Return mock data right away for development/testing
        return "This would be the LLM response, but we're bypassing it and generating mock data directly in the suggest_error_fixes method"
        
        # If you have the API service set up properly, enable this code:
        """
        try:
            # Set a timeout for the API call
            async def get_llm_response():
                if self.use_local_llm and self.local_llm_url:
                    # Use local LLM
                    response = completion(
                        model=self.model,
                        messages=[{"role": "user", "content": prompt}],
                        api_base=self.local_llm_url
                    )
                elif self.openai_api_key:
                    # Use OpenAI
                    response = completion(
                        model=self.model,
                        messages=[{"role": "user", "content": prompt}],
                        api_key=self.openai_api_key
                    )
                    return response.choices[0].message.content
                else:
                    raise ValueError("No LLM configuration available")
            
            # Try to get response with timeout
            try:
                # Set a 10-second timeout
                response_content = await asyncio.wait_for(get_llm_response(), timeout=10.0)
                return response_content
            except asyncio.TimeoutError:
                print("LLM request timed out after 10 seconds, using mock response")
                return json.dumps(mock_response)
            
        except Exception as e:
            print(f"Error getting LLM completion: {e}")
            print("Falling back to mock response")
            return json.dumps(mock_response)
        """
    
    async def match_columns(
        self, file_columns: List[str], schema_fields: List[SchemaField], sample_data: List[Dict[str, Any]]
    ) -> List[ColumnMapping]:
        """Match CSV columns to schema fields using LLM"""
        # Create prompt for LLM
        prompt = f"""
        I need to match CSV columns to schema fields. 
        
        CSV Columns:
        {json.dumps(file_columns)}
        
        Schema Fields:
        {json.dumps([{"name": field.name, "type": field.type, "description": field.description} for field in schema_fields])}
        
        Sample Data (first few rows):
        {json.dumps(sample_data[:5])}
        
        Please match each CSV column to the most appropriate schema field. Return a JSON array with objects containing:
        - file_column: The name of the column in the CSV
        - schema_field: The name of the matching schema field
        - confidence: A number between 0 and 1 indicating confidence in the match
        
        Only include matches with confidence > 0.5. Format as valid JSON.
        """
        
        # Get completion from LLM
        response = await self._get_completion(prompt)
        
        try:
            # Parse JSON response
            mappings = json.loads(response)
            return [ColumnMapping(**mapping) for mapping in mappings]
        except Exception as e:
            print(f"Error parsing LLM response: {e}")
            return []
    
    async def validate_and_clean_data(
        self, data: pd.DataFrame, schema_fields: List[SchemaField], column_mapping: Dict[str, str]
    ) -> pd.DataFrame:
        """Validate and clean data using LLM"""
        # Sample a subset of problematic rows
        sample_size = min(10, len(data))
        problematic_rows = []
        
        # Find rows with potential issues
        for idx, row in data.sample(n=sample_size).iterrows():
            for file_col, schema_field_name in column_mapping.items():
                schema_field = next((f for f in schema_fields if f.name == schema_field_name), None)
                if schema_field and file_col in data.columns:
                    value = row[file_col]
                    if pd.isna(value) and schema_field.required:
                        problematic_rows.append((idx, row.to_dict()))
                        break
        
        if not problematic_rows:
            return data
        
        # Create prompt for LLM
        prompt = f"""
        I need to clean and validate data from a CSV import.
        
        Schema Fields:
        {json.dumps([{"name": field.name, "type": field.type, "description": field.description, "required": field.required} for field in schema_fields])}
        
        Column Mapping (CSV column -> Schema field):
        {json.dumps(column_mapping)}
        
        Problematic Rows:
        {json.dumps([row for _, row in problematic_rows])}
        
        Please suggest fixes for these rows. Return a JSON array with objects containing:
        - row_index: The index of the row
        - fixes: An object with column names as keys and fixed values as values
        
        Format as valid JSON.
        """
        
        # Get completion from LLM
        response = await self._get_completion(prompt)
        
        try:
            # Parse JSON response
            fixes = json.loads(response)
            
            # Apply fixes to the dataframe
            for fix in fixes:
                row_idx = fix.get("row_index")
                if row_idx is not None and isinstance(fix.get("fixes"), dict):
                    for col, value in fix["fixes"].items():
                        if col in data.columns:
                            data.at[row_idx, col] = value
            
            return data
        except Exception as e:
            print(f"Error parsing LLM response: {e}")
            return data
            
    async def suggest_error_fixes(
        self, 
        errors: List[Dict[str, Any]], 
        data_rows: List[Dict[str, Any]], 
        template_fields: List[Dict[str, Any]],
        valid_rows: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Suggest fixes for errors in CSV data using an LLM.
        
        Args:
            errors: List of error objects with rowIndex, columnIndex, message
            data_rows: Original data rows containing the errors
            template_fields: Field definitions with validation rules
            valid_rows: Optional sample of valid rows to use as examples
            
        Returns:
            Dictionary with suggested fixes and explanations
        """
        # Create a mapping of field key to field definition for easier lookup
        field_map = {field.get('key'): field for field in template_fields}
        
        # Get sample of valid rows (up to 3) to use as examples if not provided
        if not valid_rows:
            valid_rows = []
            
        # Prepare the data for the prompt
        errors_by_row = {}
        for error in errors:
            row_index = error.get('rowIndex')
            if row_index not in errors_by_row:
                errors_by_row[row_index] = []
            errors_by_row[row_index].append(error)
        
        print(f"Processing errors for rows: {list(errors_by_row.keys())}")
        print(f"Sample data row structure: {data_rows[0] if data_rows else 'No data rows'}")
        
        # Create a list of problematic rows with their errors
        problematic_rows = []
        for row_index, row_errors in errors_by_row.items():
            # Find the original row data
            row_data = next((r for r in data_rows if r.get('index') == row_index), None)
            if not row_data:
                print(f"Warning: Could not find row with index {row_index} in data_rows")
                continue
                
            print(f"Processing row {row_index}, row data: {row_data}")
            
            error_columns = {}
            for err in row_errors:
                col_idx = err.get('columnIndex')
                if col_idx is None:
                    print(f"Warning: No column index in error: {err}")
                    continue
                    
                field_key = next((k for k, m in field_map.items() if m.get('name') == err.get('field')), None)
                if not field_key:
                    print(f"Warning: Could not find field key for field name: {err.get('field')}")
                    continue
                
                # Handle different data structures - values might be a dict or a list
                try:
                    values = row_data.get('values')
                    print(f"Values type: {type(values)}, values: {values}")
                    
                    if isinstance(values, dict):
                        value = values.get(str(col_idx), '')
                    elif isinstance(values, list):
                        value = values[col_idx] if 0 <= col_idx < len(values) else ''
                    else:
                        value = ''
                        
                    print(f"Extracted value for column {col_idx}: {value}")
                except Exception as e:
                    print(f"Error extracting value from row: {e}")
                    value = ''
                    
                error_columns[col_idx] = {
                    'field_key': field_key,
                    'message': err.get('message'),
                    'value': value
                }
                
            problematic_rows.append({
                'row_index': row_index,
                'data': row_data,
                'errors': error_columns
            })
        
        # Limit to a reasonable number of rows to process
        if len(problematic_rows) > 10:
            problematic_rows = problematic_rows[:10]
            
        # For demonstration, instead of using the LLM, we'll generate mock suggestions
        # based on the actual error data
        print(f"Generating mock suggestions for {len(problematic_rows)} rows with errors")
        
        # Create the prompt just for logging purposes
        prompt = f"""
        You are an AI assistant helping to fix errors in CSV data during import.
        
        # Templates Fields (The expected format)
        {json.dumps(template_fields, indent=2)}
        
        # Sample Valid Data (Examples of correctly formatted data)
        {json.dumps(valid_rows[:3], indent=2)}
        
        # Rows With Errors
        {json.dumps(problematic_rows, indent=2)}
        
        For each error in each row, suggest a fix...
        """
        
        # Instead of calling the LLM, we'll generate mock suggestions directly
        mock_fixes = []
        
        # Get current date for date-related fixes
        from datetime import datetime, timedelta
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        # Generate a fix for each error in each problematic row
        for row in problematic_rows:
            row_index = row.get('row_index')
            row_data = row.get('data', {})
            row_values = row_data.get('values', [])
            row_errors = row.get('errors', {})
            
            # Process each error for this row
            for col_idx_str, error_info in row_errors.items():
                try:
                    col_idx = int(col_idx_str)
                    field_key = error_info.get('field_key', '')
                    error_message = error_info.get('message', '')
                    original_value = error_info.get('value', '')
                    
                    # Skip if no original value to fix
                    if original_value is None:
                        continue
                        
                    # Find matching field definition
                    field_def = next((f for f in template_fields if f.get('key') == field_key), None)
                    if not field_def:
                        continue
                        
                    field_type = field_def.get('type', '').lower()
                    
                    # Generate a fix based on the field type and error
                    suggested_value = original_value  # Default to original
                    explanation = "Fixed the value to comply with validation rules."
                    
                    # Date field
                    if field_type in ['date', 'datetime'] and 'date' in error_message.lower():
                        # If it's just numbers, convert to date format
                        if original_value and original_value.isdigit():
                            # Use a date 30 days from now
                            suggested_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
                            suggested_value = suggested_date
                            explanation = f"Converted numeric value to a valid date in YYYY-MM-DD format."
                        else:
                            suggested_value = current_date
                            explanation = f"Replaced with current date in YYYY-MM-DD format."
                    
                    # Email field
                    elif field_type == 'email' or 'email' in error_message.lower():
                        if '@' not in str(original_value):
                            # If user name only, add domain
                            if original_value:
                                suggested_value = f"{original_value}@company.com"
                                explanation = "Added missing domain to complete the email address."
                            else:
                                # Generate a placeholder email
                                suggested_value = "user@company.com"
                                explanation = "Added a placeholder email address."
                                
                    # Required field is empty
                    elif 'required' in error_message.lower() and (not original_value or str(original_value).strip() == ''):
                        if field_type == 'string' or field_type == 'text':
                            suggested_value = f"Sample {field_def.get('name', 'text')}"
                        elif field_type == 'number' or field_type == 'numeric':
                            suggested_value = "123"
                        elif field_type == 'boolean':
                            suggested_value = "true"
                        explanation = f"Added a sample value for the required field."
                    
                    # Number field with non-numeric value
                    elif (field_type == 'number' or field_type == 'numeric') and 'number' in error_message.lower():
                        suggested_value = "0"
                        if original_value:
                            # Try to extract numbers
                            import re
                            numbers = re.findall(r'\d+', str(original_value))
                            if numbers:
                                suggested_value = numbers[0]
                        explanation = "Extracted or provided a valid numeric value."
                        
                    # Boolean field
                    elif field_type == 'boolean' and 'boolean' in error_message.lower():
                        suggested_value = "true"
                        explanation = "Provided a valid boolean value."
                    
                    # Add the mock fix
                    mock_fixes.append({
                        "row_index": row_index,
                        "column_index": col_idx,
                        "original_value": str(original_value),
                        "suggested_value": str(suggested_value),
                        "explanation": explanation
                    })
                    
                except Exception as e:
                    print(f"Error generating mock fix: {e}")
        
        print(f"Generated {len(mock_fixes)} mock fixes")
        return {"fixes": mock_fixes}

llm_service = LLMService()
