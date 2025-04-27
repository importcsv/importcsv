from fastapi import APIRouter, Body, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import logging
import json
import os

from app.db.base import get_db
from app.models.importer import Importer
from app.services.importer import get_importer_by_key
from app.services.llm_service import get_column_mapping_suggestions

router = APIRouter()
logger = logging.getLogger(__name__)

class UploadColumn(BaseModel):
    index: int
    name: str
    sampleData: List[Optional[str]] = []  # Allow None values, they'll be converted to empty strings

class TemplateColumn(BaseModel):
    key: str
    name: str
    description: Optional[str] = None
    required: bool = False
    type: Optional[str] = None

class ColumnMappingRequest(BaseModel):
    uploadColumns: List[UploadColumn]
    templateColumns: List[TemplateColumn]
    importer_key: uuid.UUID

class ColumnMapping(BaseModel):
    uploadColumnIndex: int
    templateColumnKey: str
    confidence: float

class ColumnMappingResponse(BaseModel):
    mappings: List[ColumnMapping]

@router.post("/llm-column-mapping", response_model=ColumnMappingResponse)
async def get_llm_column_mapping(
    request: ColumnMappingRequest = Body(...),
    db: Session = Depends(get_db)
):
    """
    Use LLM to suggest column mappings between uploaded columns and template columns.
    Authentication is done via the importer_key in the query parameter.
    """
    # Verify the importer exists by key
    importer = get_importer_by_key(db, request.importer_key)
    
    try:
        # Log the request for debugging
        logger.info(f"LLM column mapping request for importer {request.importer_key}")
        
        # Sanitize sample data - convert None to empty strings
        for col in request.uploadColumns:
            col.sampleData = ['' if item is None else str(item) for item in col.sampleData]
        
        logger.debug(f"Upload columns: {json.dumps([col.dict() for col in request.uploadColumns])}")
        logger.debug(f"Template columns: {json.dumps([col.dict() for col in request.templateColumns])}")
        
        # Call the LLM service to get mapping suggestions
        mappings = get_column_mapping_suggestions(
            upload_columns=request.uploadColumns,
            template_columns=request.templateColumns
        )
        
        return {"mappings": mappings}
    
    except Exception as e:
        logger.error(f"Error in LLM column mapping: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing LLM column mapping: {str(e)}")
