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
        self.model = settings.LLM_MODEL
        self.use_local_llm = settings.USE_LOCAL_LLM
        self.local_llm_url = settings.LOCAL_LLM_URL
    
    async def _get_completion(self, prompt: str) -> str:
        """Get completion from LLM"""
        try:
            if self.use_local_llm and self.local_llm_url:
                # Use local LLM
                response = completion(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    api_base=self.local_llm_url
                )
            else:
                # Use OpenAI
                response = completion(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    api_key=settings.OPENAI_API_KEY
                )
            
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error getting LLM completion: {e}")
            return ""
    
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

llm_service = LLMService()
