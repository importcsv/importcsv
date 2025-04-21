from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Any, Optional
import json
import pandas as pd
from datetime import datetime
import uuid
import logging

from app.db.base import get_db, SessionLocal
from app.services.auth import get_current_user
from app.models.user import User
from app.models.import_job import ImportJob, ImportStatus
from app.models.importer import Importer
from app.services.webhook import webhook_service, WebhookEventType
from app.services.file_processor import file_processor

logger = logging.getLogger(__name__)

# Function for background processing of import data
async def process_import_data(import_job_id, valid_data, invalid_data, db):
    """
    Process the import data in the background
    """
    # Get a new database session
    db_session = SessionLocal()
    
    try:
        # Get the import job
        import_job = db_session.query(ImportJob).filter(ImportJob.id == import_job_id).first()
        if not import_job:
            print(f"Error: Import job {import_job_id} not found")
            return
        
        # Get the importer associated with the job
        importer = import_job.importer
        if not importer:
            logger.error(f"Importer not found for import job {import_job_id}")
            import_job.status = ImportStatus.FAILED
            import_job.error_message = "Associated importer configuration not found."
            db_session.commit()
            return
        
        # Process valid data
        if valid_data:
            try:
                # Convert to DataFrame for processing
                df = pd.DataFrame(valid_data)
                
                # TODO: Add your data processing logic here
                # For example, send to destination, store in database, etc.
                
                # Update import job
                import_job.processed_rows = len(valid_data)
                import_job.status = ImportStatus.COMPLETED
                import_job.completed_at = datetime.now()
                
                # Create webhook event for completion
                webhook_service.create_event(
                    db_session,
                    importer.user_id,
                    import_job.id,
                    WebhookEventType.IMPORT_FINISHED,
                    {
                        "event_type": WebhookEventType.IMPORT_FINISHED,
                        "import_job_id": import_job.id,
                        "importer_id": import_job.importer_id,
                        "processed_rows": import_job.processed_rows,
                        "error_count": import_job.error_count,
                        "timestamp": datetime.now().isoformat()
                    }
                )
            except Exception as e:
                print(f"Error processing import data: {e}")
                import_job.status = ImportStatus.FAILED
                import_job.errors = {"errors": [str(e)]}
                
                # Create webhook event for error
                webhook_service.create_event(
                    db_session,
                    importer.user_id,
                    import_job.id,
                    WebhookEventType.IMPORT_VALIDATION_ERROR,
                    {
                        "event_type": WebhookEventType.IMPORT_VALIDATION_ERROR,
                        "import_job_id": import_job.id,
                        "importer_id": import_job.importer_id,
                        "error": str(e),
                        "timestamp": datetime.now().isoformat()
                    }
                )
        else:
            import_job.status = ImportStatus.FAILED
            import_job.errors = {"errors": ["No valid data to process"]}
        
        db_session.add(import_job)
        db_session.commit()
    finally:
        db_session.close()

router = APIRouter()

# Public endpoints that don't require authentication

@router.post("/public/process-csv-data-by-importer/{importer_id}", response_model=Dict[str, Any])
async def process_csv_data_by_importer(
    importer_id: str,
    data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Public endpoint to process data from the frontend CSV importer using importer_id
    Authentication is done via the importer_id in the URL
    """
    logger.info(f"Received raw request data on public importer endpoint: {data}")
    
    # Verify importer exists and get associated user
    importer = db.query(Importer).options(joinedload(Importer.user)).filter(Importer.id == importer_id).first()
    if not importer:
        logger.error(f"Importer not found: {importer_id}")
        raise HTTPException(status_code=404, detail="Importer not found")
    if not importer.user:
        logger.error(f"User not found for importer: {importer_id}")
        raise HTTPException(status_code=500, detail="Internal server error: Importer owner missing")
    
    user_id = importer.user.id

    valid_data = data.get("validData", [])
    invalid_data = data.get("invalidData", [])

    logger.info(f"Received data on public importer endpoint: importer_id={importer_id}, valid_data={len(valid_data)}, invalid_data={len(invalid_data)}")

    try:
        # Logging for Debugging
        logger.info(f"Attempting to create ImportJob for importer {importer_id}")
        logger.info(f"ImportJob class attributes: {dir(ImportJob)}") # Simplified logging
        
        # Create import job (schema_id is no longer needed/valid)
        import_job = ImportJob(
            user_id=user_id,
            importer_id=importer_id,
            file_name="frontend_import.csv",
            file_path="", # No file path for frontend-processed data
            file_type="csv",
            status=ImportStatus.PROCESSING,
            row_count=len(valid_data),
            processed_data={"validData": valid_data, "invalidData": invalid_data}
        )
        
        db.add(import_job)
        db.commit()
        db.refresh(import_job)
        
        logger.info(f"Created ImportJob {import_job.id} for importer {importer_id}")
        
        # Start background task
        background_tasks.add_task(process_import_data, import_job.id, valid_data, invalid_data, SessionLocal())
        
        return {"message": "Data received and processing started.", "import_job_id": import_job.id}
    
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error in public process_csv_data_by_importer: {e}", exc_info=True)
        # This might now indicate issues with importer_id or user_id constraints
        raise HTTPException(status_code=500, detail=f"Database constraint error: {e.orig}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error in public process_csv_data_by_importer: {e}", exc_info=True)
        # General error, removed specific schema_id check as it's no longer passed
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")
