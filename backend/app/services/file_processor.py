import os
import pandas as pd
import json
from typing import List, Dict, Any, Tuple, Optional
from fastapi import UploadFile, HTTPException
import uuid
from datetime import datetime

from app.core.config import settings
from app.schemas.schema import SchemaField
from app.services.llm import llm_service

class FileProcessor:
    def __init__(self):
        # Create upload directory if it doesn't exist
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    async def save_upload_file(self, file: UploadFile) -> str:
        """Save uploaded file to disk and return the file path"""
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        return file_path
    
    def read_file(self, file_path: str) -> pd.DataFrame:
        """Read file into pandas DataFrame"""
        file_extension = os.path.splitext(file_path)[1].lower()
        
        try:
            if file_extension == '.csv':
                return pd.read_csv(file_path)
            elif file_extension in ['.xls', '.xlsx']:
                return pd.read_excel(file_path)
            elif file_extension == '.tsv':
                return pd.read_csv(file_path, sep='\t')
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file format: {file_extension}"
                )
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error reading file: {str(e)}"
            )
    
    def get_file_info(self, file_path: str) -> Dict[str, Any]:
        """Get file information"""
        df = self.read_file(file_path)
        
        return {
            "columns": df.columns.tolist(),
            "row_count": len(df),
            "sample_data": df.head(5).to_dict('records')
        }
    
    async def detect_schema(self, file_path: str) -> List[SchemaField]:
        """Detect schema from file"""
        df = self.read_file(file_path)
        sample_data = df.head(10).to_dict('records')
        
        # Create schema fields based on DataFrame columns and data types
        schema_fields = []
        for column in df.columns:
            # Determine column type
            if df[column].dtype == 'int64' or df[column].dtype == 'float64':
                field_type = "number"
            elif pd.api.types.is_datetime64_any_dtype(df[column]):
                field_type = "date"
            elif df[column].dtype == 'bool':
                field_type = "boolean"
            else:
                field_type = "string"
            
            # Check if column has any null values
            required = not df[column].isnull().any()
            
            schema_fields.append(
                SchemaField(
                    name=column,
                    display_name=column.replace('_', ' ').title(),
                    type=field_type,
                    required=required
                )
            )
        
        return schema_fields
    
    async def validate_data(
        self, 
        file_path: str, 
        schema_fields: List[SchemaField],
        column_mapping: Dict[str, str]
    ) -> Tuple[bool, List[Dict[str, Any]], pd.DataFrame]:
        """Validate data against schema"""
        df = self.read_file(file_path)
        validation_errors = []
        
        # Apply column mapping
        mapped_df = pd.DataFrame()
        for file_col, schema_field_name in column_mapping.items():
            if file_col in df.columns:
                mapped_df[schema_field_name] = df[file_col]
        
        # Validate each row
        for idx, row in mapped_df.iterrows():
            row_errors = []
            
            for field in schema_fields:
                # Skip if field is not in mapping
                if field.name not in mapped_df.columns:
                    continue
                
                value = row[field.name]
                
                # Check required fields
                if field.required and (pd.isna(value) or value == ''):
                    row_errors.append({
                        "field": field.name,
                        "error": "Required field is missing"
                    })
                    continue
                
                # Skip validation for null values in non-required fields
                if pd.isna(value) or value == '':
                    continue
                
                # Type validation
                try:
                    if field.type == "number":
                        float(value)
                    elif field.type == "boolean":
                        if not isinstance(value, bool) and str(value).lower() not in ['true', 'false', '0', '1']:
                            raise ValueError("Not a boolean value")
                    elif field.type == "date":
                        pd.to_datetime(value)
                except Exception:
                    row_errors.append({
                        "field": field.name,
                        "error": f"Invalid {field.type} format"
                    })
                
                # Custom validation rules
                if field.validation:
                    # Implement custom validation based on JSON Schema rules
                    pass
            
            if row_errors:
                validation_errors.append({
                    "row": idx,
                    "errors": row_errors
                })
        
        # Clean data using LLM if there are errors
        if validation_errors:
            cleaned_df = await llm_service.validate_and_clean_data(df, schema_fields, column_mapping)
            return len(validation_errors) == 0, validation_errors, cleaned_df
        
        return True, [], df

file_processor = FileProcessor()
