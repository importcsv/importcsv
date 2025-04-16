from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json

from app.db.base import get_db
from app.services.auth import get_current_user
from app.models.user import User
from app.models.import_job import ImportJob, ImportStatus
from app.models.schema import Schema
from app.schemas.import_job import ImportJobCreate, ImportJob as ImportJobSchema, ColumnMappingRequest
from app.services.file_processor import file_processor
from app.services.webhook import webhook_service, WebhookEventType

router = APIRouter()

@router.get("/", response_model=List[ImportJobSchema])
async def read_import_jobs(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve import jobs
    """
    import_jobs = db.query(ImportJob).filter(ImportJob.user_id == current_user.id).offset(skip).limit(limit).all()
    return import_jobs

@router.post("/upload", response_model=Dict[str, Any])
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a file for analysis
    """
    file_path = await file_processor.save_upload_file(file)
    file_info = file_processor.get_file_info(file_path)
    
    # Auto-detect schema
    detected_schema = await file_processor.detect_schema(file_path)
    
    return {
        "file_name": file.filename,
        "file_path": file_path,
        "columns": file_info["columns"],
        "row_count": file_info["row_count"],
        "sample_data": file_info["sample_data"],
        "detected_schema": detected_schema
    }

@router.post("/", response_model=ImportJobSchema)
async def create_import_job(
    schema_id: int = Form(...),
    file_path: str = Form(...),
    file_name: str = Form(...),
    file_type: str = Form(...),
    column_mapping: str = Form(...),  # JSON string
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create new import job
    """
    # Verify schema exists and belongs to user
    schema = db.query(Schema).filter(Schema.id == schema_id, Schema.user_id == current_user.id).first()
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    # Parse column mapping
    try:
        column_mapping_dict = json.loads(column_mapping)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid column mapping JSON")
    
    # Create import job
    import_job = ImportJob(
        user_id=current_user.id,
        schema_id=schema_id,
        file_name=file_name,
        file_path=file_path,
        file_type=file_type,
        status=ImportStatus.PENDING,
        column_mapping=column_mapping_dict
    )
    db.add(import_job)
    db.commit()
    db.refresh(import_job)
    
    # Create webhook event
    await webhook_service.create_event(
        db,
        current_user.id,
        import_job.id,
        WebhookEventType.IMPORT_STARTED,
        {
            "event_type": WebhookEventType.IMPORT_STARTED,
            "import_job_id": import_job.id,
            "schema_id": schema_id,
            "file_name": file_name,
            "row_count": import_job.row_count,
            "timestamp": import_job.created_at.isoformat()
        }
    )
    
    return import_job

@router.get("/{import_job_id}", response_model=ImportJobSchema)
async def read_import_job(
    import_job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get import job by ID
    """
    import_job = db.query(ImportJob).filter(
        ImportJob.id == import_job_id, 
        ImportJob.user_id == current_user.id
    ).first()
    
    if not import_job:
        raise HTTPException(status_code=404, detail="Import job not found")
    
    return import_job
