from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
import logging
import json
import os
from pydantic import BaseModel

from app.db.base import get_db
from app.models.importer import Importer
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

class ColumnMapping(BaseModel):
    uploadColumnIndex: int
    templateColumnKey: str
    confidence: float

class ColumnMappingResponse(BaseModel):
    mappings: List[ColumnMapping]

@router.post("/llm-column-mapping/{importer_id}", response_model=ColumnMappingResponse)
async def get_llm_column_mapping(
    importer_id: str,
    request: ColumnMappingRequest = Body(...),
    db: Session = Depends(get_db)
):
    """
    Use LLM to suggest column mappings between uploaded columns and template columns.
    """
    # Verify the importer exists
    importer = db.query(Importer).filter(Importer.id == importer_id).first()
    if not importer:
        raise HTTPException(status_code=404, detail=f"Importer with ID {importer_id} not found")
    
    try:
        # Log the request for debugging
        logger.info(f"LLM column mapping request for importer {importer_id}")
        
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
