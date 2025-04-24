import os
import uuid
import sys
import time
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json
from datetime import datetime
import logging
import pandas as pd

from app.db.base import get_db
from app.auth.auth import current_active_user
from app.models.user import User
from app.models.import_job import ImportJob, ImportStatus
from app.models.importer import Importer
from app.schemas.import_job import ImportJobCreate, ImportJob as ImportJobSchema, ColumnMappingRequest
from app.services.file_processor import file_processor
from app.services.webhook import WebhookService, WebhookEventType, debug_print
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

    # For debugging: Process the CSV and send the webhook directly in the request
    import asyncio
    import sys
    import time
    import pandas as pd
    from app.services.import_processor import ImportProcessor
    from app.services.webhook import webhook_service, debug_print
    
    # Create a debug file specific to this upload
    debug_file = f"/tmp/csv_direct_process_{int(time.time())}.txt"
    
    with open(debug_file, "w") as f:
        f.write(f"Direct CSV processing started at {datetime.now().isoformat()}\n")
        f.write(f"Import job ID: {import_job.id}\n")
        f.write(f"File path: {file_path}\n")
        f.write(f"Importer ID: {importer_uuid}\n")
    
    logger.info(f"DEBUG: Running direct CSV processing for job {import_job.id} (log: {debug_file})")
    print(f"DEBUG: Running direct CSV processing for job {import_job.id} (log: {debug_file})", file=sys.stderr)
    
    try:
        # First verify the file exists and has content
        if not os.path.exists(file_path):
            with open(debug_file, "a") as f:
                f.write(f"ERROR: File {file_path} does not exist\n")
            raise FileNotFoundError(f"File {file_path} not found")
            
        # Read the CSV file directly
        with open(debug_file, "a") as f:
            f.write(f"Reading CSV file: {file_path}\n")
        
        try:
            df = pd.read_csv(file_path)
            with open(debug_file, "a") as f:
                f.write(f"CSV file read successfully. Found {len(df)} rows.\n")
                f.write(f"Columns: {df.columns.tolist()}\n")
            
            # Apply column mapping if provided
            if column_mapping_dict:
                with open(debug_file, "a") as f:
                    f.write(f"Applying column mapping: {column_mapping_dict}\n")
                df.rename(columns=column_mapping_dict, inplace=True, errors='ignore')
            
            # Get the importer specifically to access its webhook_url
            with open(debug_file, "a") as f:
                f.write(f"Retrieving importer details...\n")
            
            importer = db.query(Importer).filter(Importer.id == importer_uuid).first()
            if not importer:
                with open(debug_file, "a") as f:
                    f.write(f"ERROR: Importer {importer_uuid} not found\n")
                raise Exception(f"Importer {importer_uuid} not found")
            
            # Log importer's webhook settings
            with open(debug_file, "a") as f:
                f.write(f"Importer webhook URL: '{importer.webhook_url}'\n")
                f.write(f"Importer webhook enabled: {importer.webhook_enabled}\n")
            
            # Prepare and send a webhook directly
            if importer.webhook_url and importer.webhook_enabled:
                with open(debug_file, "a") as f:
                    f.write(f"Preparing to send webhook directly to {importer.webhook_url}\n")
                
                # Sample the first few rows
                sample_data = df.head(5).to_dict(orient='records')
                
                # Create webhook payload
                payload = {
                    "event_type": "import.completed",
                    "timestamp": datetime.now().isoformat(),
                    "job_id": str(import_job.id),
                    "importer_id": str(importer.id),
                    "file_name": file_name,
                    "row_count": len(df),
                    "message": f"CSV import completed successfully with {len(df)} rows",
                    "data_sample": sample_data,
                    "uploaded_at": datetime.now().isoformat(),
                    "testing_mode": "direct_in_request",
                    "debug_file": debug_file
                }
                
                with open(debug_file, "a") as f:
                    f.write(f"Webhook payload created with {len(sample_data)} sample rows\n")
                
                # Send webhook directly
                logger.info(f"Sending webhook directly for job {import_job.id} to {importer.webhook_url}")
                print(f"DEBUG: Sending webhook directly for job {import_job.id} to {importer.webhook_url}", file=sys.stderr)
                
                # Send in-line, not as a background task
                success = await webhook_service.send_webhook(
                    url=importer.webhook_url,
                    payload=payload,
                    secret=webhook_service.webhook_secret
                )
                
                with open(debug_file, "a") as f:
                    f.write(f"Direct webhook send result: {'SUCCESS' if success else 'FAILED'}\n")
                
                # Update the success status in the response
                logger.info(f"Direct webhook result: {'SUCCESS' if success else 'FAILED'}")
                print(f"DEBUG: Direct webhook result: {'SUCCESS' if success else 'FAILED'}", file=sys.stderr)
                
            else:
                with open(debug_file, "a") as f:
                    f.write(f"Webhook not sent because webhook_url is not set or webhooks are disabled\n")
                logger.warning(f"Webhook not sent for job {import_job.id} because webhook_url is not set or webhooks are disabled")
        
        except Exception as csv_err:
            with open(debug_file, "a") as f:
                f.write(f"ERROR processing CSV: {str(csv_err)}\n")
                import traceback
                f.write(f"Traceback: {traceback.format_exc()}\n")
            logger.error(f"Error processing CSV directly: {csv_err}", exc_info=True)
        
        # Also schedule the normal background task for complete processing
        background_tasks.add_task(
            run_background_import, 
            import_job_id=str(import_job.id),
            file_path=file_path,
            column_mapping=column_mapping_dict
        )
        
        with open(debug_file, "a") as f:
            f.write(f"Background task also scheduled for job {import_job.id}\n")
            
        logger.info(f"Background task scheduled for job {import_job.id} with file {file_path}")
            
    except Exception as e:
        with open(debug_file, "a") as f:
            f.write(f"OUTER ERROR: {str(e)}\n")
            import traceback
            f.write(f"Traceback: {traceback.format_exc()}\n")
        
        logger.error(f"Error in direct CSV processing: {e}", exc_info=True)
        print(f"DEBUG: Error in direct CSV processing: {e}", file=sys.stderr)
        
        # Fall back to background task
        background_tasks.add_task(
            run_background_import, 
            import_job_id=str(import_job.id),
            file_path=file_path,
            column_mapping=column_mapping_dict
        )
        logger.info(f"Falling back to background task for job {import_job.id} with file {file_path}")

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
