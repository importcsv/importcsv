import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json
from datetime import datetime
import logging

from app.db.base import get_db
from app.auth.auth import current_active_user
from app.models.user import User
from app.models.import_job import ImportJob, ImportStatus
from app.models.importer import Importer
from app.schemas.import_job import ImportJobCreate, ImportJob as ImportJobSchema, ColumnMappingRequest
from app.services.file_processor import file_processor
from app.services.webhook import WebhookService, WebhookEventType
from app.services.import_processor import run_background_import
from app.db.base import SessionLocal

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[ImportJobSchema])
async def read_import_jobs(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(current_active_user),
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
    current_user: User = Depends(current_active_user),
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
    background_tasks: BackgroundTasks,
    importer_id: str = Form(...),  # UUID as string
    file_path: str = Form(...),
    file_name: str = Form(...),
    file_type: str = Form(...),
    column_mapping: str = Form(...),  # JSON string
    db: Session = Depends(get_db),
    current_user: User = Depends(current_active_user),
):
    """
    Create new import job
    """
    # Convert string UUID to UUID object
    importer_uuid = uuid.UUID(importer_id)
    
    # Verify importer exists and belongs to user
    importer = db.query(Importer).filter(Importer.id == importer_uuid, Importer.user_id == current_user.id).first()
    if not importer:
        raise HTTPException(status_code=404, detail="Importer not found")
    
    # Parse column mapping
    try:
        column_mapping_dict = json.loads(column_mapping)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid column mapping JSON")
    
    # Create import job
    import_job = ImportJob(
        user_id=current_user.id,
        importer_id=importer_uuid,
        file_name=file_name,
        file_path=file_path,
        file_type=file_type,
        status=ImportStatus.PENDING,
        row_count=0,
        processed_rows=0,
        error_count=0,
        column_mapping=column_mapping_dict
    )
    db.add(import_job)
    db.commit()
    db.refresh(import_job)
    
    # Create webhook event with serializable payload
    # Convert UUIDs to strings for JSON serialization
    webhook_service = WebhookService()
    await webhook_service.create_event(
        db,
        current_user.id,
        import_job.id,
        WebhookEventType.IMPORT_STARTED,
        {
            "event_type": WebhookEventType.IMPORT_STARTED,
            "import_job_id": str(import_job.id),
            "importer_id": str(importer_uuid),
            "file_name": file_name,
            "row_count": import_job.row_count,
            "timestamp": import_job.created_at.isoformat()
        }
    )

    # Schedule the background task using the top-level runner function
    background_tasks.add_task(
        run_background_import, 
        import_job_id=str(import_job.id),
        file_path=file_path,
        column_mapping=column_mapping_dict
    )
    logger.info(f"Background task scheduled for job {import_job.id} with file {file_path}")

    # Logging before return
    logger.warning(f"Returning ImportJob object immediately after scheduling background task: {import_job.__dict__}")
    logger.debug(f"  id type: {type(import_job.id)}")
    logger.debug(f"  user_id type: {type(import_job.user_id)}")
    logger.debug(f"  importer_id type: {type(import_job.importer_id)}")

    return import_job

@router.get("/{import_job_id}", response_model=ImportJobSchema)
async def read_import_job(
    import_job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(current_active_user),
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
