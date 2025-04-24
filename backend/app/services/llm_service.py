import os
import logging
import json
from typing import List, Dict, Any, Optional
from openai import OpenAI
from pydantic import BaseModel

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Define models for type hints
class UploadColumn(BaseModel):
    index: int
    name: str
    sampleData: List[Optional[str]] = []

class TemplateColumn(BaseModel):
    key: str
    name: str
    description: Optional[str] = None
    required: bool = False
    type: Optional[str] = None

class ColumnMapping(BaseModel):
    uploadColumnIndex: int
    templateColumnKey: str
    confidence: float

# Get API key from environment variable
LLM_API_KEY = os.getenv("OPENAI_API_KEY")
LLM_MODEL = os.getenv("OPENAI_MODEL", "o3-mini")

# Initialize OpenAI client
client = None
if LLM_API_KEY:
    try:
        client = OpenAI(api_key=LLM_API_KEY)
    except Exception as e:
        logger.error(f"Error initializing OpenAI client: {str(e)}")

def get_column_mapping_suggestions(
    upload_columns: List[UploadColumn],
    template_columns: List[TemplateColumn]
) -> List[ColumnMapping]:
    """
    Use LLM to suggest mappings between uploaded columns and template columns.

    Args:
        upload_columns: List of columns from the uploaded file
        template_columns: List of columns from the template schema

    Returns:
        List of suggested mappings with confidence scores
    """
    if not LLM_API_KEY:
        logger.warning("LLM_API_KEY not set. Using fallback similarity matching.")
        return fallback_similarity_matching(upload_columns, template_columns)

    try:
        # Prepare the prompt for the LLM
        prompt = create_mapping_prompt(upload_columns, template_columns)

        # Call the LLM API
        response = call_llm_api(prompt)

        # Parse the response
        mappings = parse_llm_response(response, upload_columns, template_columns)

        logger.info(f"LLM suggested {len(mappings)} column mappings")
        return mappings

    except Exception as e:
        logger.error(f"Error in LLM column mapping: {str(e)}")
        logger.info("Falling back to similarity matching")
        return fallback_similarity_matching(upload_columns, template_columns)

def create_mapping_prompt(
    upload_columns: List[UploadColumn],
    template_columns: List[TemplateColumn]
) -> str:
    """
    Create a prompt for the LLM to suggest column mappings.
    """
    # Format the upload columns with sample data
    upload_cols_text = []
    for col in upload_columns:
        # Handle None values and convert to strings
        safe_samples = ['' if s is None else str(s) for s in col.sampleData[:3]]
        sample_data = ", ".join([f'"{s}"' for s in safe_samples])
        upload_cols_text.append(f"Column {col.index}: \"{col.name}\" with sample values: [{sample_data}]")

    # Format the template columns with descriptions
    template_cols_text = []
    for col in template_columns:
        required_text = "REQUIRED" if col.required else "OPTIONAL"
        type_text = f", type: {col.type}" if col.type else ""
        description = f" - {col.description}" if col.description else ""
        template_cols_text.append(
            f"Field \"{col.key}\": \"{col.name}\"{type_text} ({required_text}){description}"
        )

    # Construct the full prompt
    prompt = f"""
You are an AI assistant helping with CSV data import. Your task is to match columns from an uploaded file to fields in a destination schema.

UPLOADED FILE COLUMNS:
{chr(10).join(upload_cols_text)}

DESTINATION SCHEMA FIELDS:
{chr(10).join(template_cols_text)}

For each uploaded column, suggest the best matching destination field based on:
1. Name similarity (accounting for variations, abbreviations, and synonyms)
2. Sample data compatibility with the destination field type
3. Context and common patterns in data imports

Return your suggestions in the following JSON format:
```json
[
  {{
    "uploadColumnIndex": 0,
    "templateColumnKey": "example_key",
    "confidence": 0.95
  }},
  ...
]
```

Only include mappings with reasonable confidence (>0.6). Confidence should be between 0 and 1.
Do not map multiple upload columns to the same destination field.
Prioritize required fields in the destination schema.
"""
    return prompt

def call_llm_api(prompt: str) -> str:
    """
    Call the LLM API with the given prompt using the OpenAI Python library.
    """
    if not client:
        raise Exception("OpenAI client not initialized. Please set OPENAI_API_KEY environment variable.")

    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that specializes in data mapping."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,  # Lower temperature for more deterministic results
            max_tokens=1000
        )

        # Extract the content from the response
        return response.choices[0].message.content

    except Exception as e:
        logger.error(f"OpenAI API error: {str(e)}")
        raise Exception(f"OpenAI API error: {str(e)}")

def parse_llm_response(
    response: str,
    upload_columns: List[UploadColumn],
    template_columns: List[TemplateColumn]
) -> List[ColumnMapping]:
    """
    Parse the LLM response to extract column mappings.
    """
    # Extract JSON from the response (it might be wrapped in ```json ... ```)
    json_str = response
    if "```json" in response:
        json_str = response.split("```json")[1].split("```")[0].strip()
    elif "```" in response:
        json_str = response.split("```")[1].split("```")[0].strip()

    try:
        # Parse the JSON
        mappings_data = json.loads(json_str)

        # Validate the mappings
        valid_template_keys = {col.key for col in template_columns}
        valid_upload_indices = {col.index for col in upload_columns}

        # Convert to ColumnMapping objects and validate
        mappings = []
        used_template_keys = set()

        for mapping in mappings_data:
            upload_idx = mapping.get("uploadColumnIndex")
            template_key = mapping.get("templateColumnKey")
            confidence = mapping.get("confidence", 0.0)

            # Validate the mapping
            if upload_idx not in valid_upload_indices:
                logger.warning(f"Invalid upload column index: {upload_idx}")
                continue

            if template_key not in valid_template_keys:
                logger.warning(f"Invalid template column key: {template_key}")
                continue

            if template_key in used_template_keys:
                logger.warning(f"Duplicate template key: {template_key}")
                continue

            if confidence < 0.6:
                logger.debug(f"Low confidence mapping ({confidence}) skipped: {upload_idx} -> {template_key}")
                continue

            # Add the mapping
            mappings.append(ColumnMapping(
                uploadColumnIndex=upload_idx,
                templateColumnKey=template_key,
                confidence=confidence
            ))

            used_template_keys.add(template_key)

        return mappings

    except json.JSONDecodeError as e:
        logger.error(f"Error parsing LLM response JSON: {str(e)}")
        logger.debug(f"Response was: {response}")
        return []
    except Exception as e:
        logger.error(f"Error processing LLM response: {str(e)}")
        return []

def fallback_similarity_matching(
    upload_columns: List[UploadColumn],
    template_columns: List[TemplateColumn]
) -> List[ColumnMapping]:
    """
    Fallback method using simple string similarity for column mapping.
    Used when LLM API is not available or fails.
    """
    import difflib

    mappings = []
    used_template_keys = set()

    # First pass: look for exact matches
    for upload_col in upload_columns:
        upload_name = upload_col.name.lower()

        for template_col in template_columns:
            if template_col.key in used_template_keys:
                continue

            template_name = template_col.name.lower()
            template_key = template_col.key.lower().replace('_', ' ')

            # Check for exact match
            if (upload_name == template_name or
                upload_name == template_key or
                upload_name.replace(' ', '') == template_name.replace(' ', '') or
                upload_name.replace(' ', '') == template_key.replace(' ', '')):

                mappings.append(ColumnMapping(
                    uploadColumnIndex=upload_col.index,
                    templateColumnKey=template_col.key,
                    confidence=1.0
                ))

                used_template_keys.add(template_col.key)
                break

    # Second pass: use string similarity for remaining columns
    for upload_col in upload_columns:
        # Skip if already mapped
        if any(m.uploadColumnIndex == upload_col.index for m in mappings):
            continue

        upload_name = upload_col.name.lower()
        best_match = None
        best_score = 0.7  # Minimum similarity threshold

        for template_col in template_columns:
            if template_col.key in used_template_keys:
                continue

            template_name = template_col.name.lower()
            template_key = template_col.key.lower().replace('_', ' ')

            # Calculate similarity scores
            name_score = difflib.SequenceMatcher(None, upload_name, template_name).ratio()
            key_score = difflib.SequenceMatcher(None, upload_name, template_key).ratio()
            max_score = max(name_score, key_score)

            if max_score > best_score:
                best_score = max_score
                best_match = template_col

        if best_match:
            mappings.append(ColumnMapping(
                uploadColumnIndex=upload_col.index,
                templateColumnKey=best_match.key,
                confidence=best_score
            ))

            used_template_keys.add(best_match.key)

    return mappings
