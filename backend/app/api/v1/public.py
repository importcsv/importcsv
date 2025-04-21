from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any
import uuid
from datetime import datetime

from app.db.base import get_db
from app.models.import_job import ImportJob, ImportStatus
from app.models.importer import Importer
from app.services.webhook import webhook_service, WebhookEventType

router = APIRouter()

@router.post("/process-import/{importer_id}", response_model=Dict[str, Any])
async def process_public_import(
    importer_id: str,
    data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Public endpoint to process data from the embedded CSV importer
    Authentication is done via the importer_id in the URL
    """
    try:
        # Validate importer_id is a valid UUID
        importer_uuid = uuid.UUID(importer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid importer ID format")
    
    # Find the importer by ID
    importer = db.query(Importer).filter(Importer.id == importer_uuid).first()
    if not importer:
        raise HTTPException(status_code=404, detail="Importer not found")
    
    # Extract data from the request
    valid_data = data.get("validData", [])
    invalid_data = data.get("invalidData", [])
    total_rows = len(valid_data) + len(invalid_data)
    
    # Log the received data for debugging
    print(f"Received data: importer_id={importer_id}, valid_data={len(valid_data)}, invalid_data={len(invalid_data)}")
    
    # Create import job
    import_job = ImportJob(
        user_id=importer.user_id,  # Associate with the importer's owner
        importer_id=importer_id,
        file_name="embedded_import.csv",
        file_path="",  # No file path for frontend-processed data
        file_type="csv",
        status=ImportStatus.PROCESSING,
        row_count=total_rows,
        processed_rows=0,
        error_count=len(invalid_data)
    )
    db.add(import_job)
    db.commit()
    db.refresh(import_job)
    
    # Process data in background
    background_tasks.add_task(
        process_import_data,
        import_job.id,
        valid_data,
        invalid_data,
        db
    )
    
    # Create webhook event if enabled
    if importer.webhook_enabled and importer.webhook_url:
        await webhook_service.create_event(
            db,
            importer.user_id,
            import_job.id,
            WebhookEventType.IMPORT_STARTED,
            {
                "event_type": WebhookEventType.IMPORT_STARTED,
                "import_job_id": import_job.id,
                "importer_id": importer_id,
                "row_count": total_rows,
                "timestamp": datetime.now().isoformat()
            }
        )
    
    return {
        "job_id": import_job.id,
        "status": import_job.status,
        "total_rows": total_rows,
        "valid_rows": len(valid_data),
        "invalid_rows": len(invalid_data)
    }

async def process_import_data(import_job_id, valid_data, invalid_data, db):
    """
    Process the import data in the background
    """
    # Get a new database session
    db_session = Session(bind=db.get_bind())
    
    try:
        # Get the import job
        import_job = db_session.query(ImportJob).filter(ImportJob.id == import_job_id).first()
        if not import_job:
            print(f"Error: Import job {import_job_id} not found")
            return
        
        # Get the importer
        importer = db_session.query(Importer).filter(Importer.id == import_job.importer_id).first()
        if not importer:
            print(f"Error: Importer {import_job.importer_id} not found")
            import_job.status = ImportStatus.FAILED
            import_job.error_message = "Importer not found"
            db_session.commit()
            return
        
        # Process valid data
        # In a real implementation, you would process the data according to your business logic
        # For now, we'll just mark it as successful
        import_job.processed_rows = len(valid_data)
        import_job.status = ImportStatus.COMPLETED
        db_session.commit()
        
        # Send webhook if enabled
        if importer.webhook_enabled and importer.webhook_url:
            await webhook_service.create_event(
                db_session,
                importer.user_id,
                import_job.id,
                WebhookEventType.IMPORT_COMPLETED,
                {
                    "event_type": WebhookEventType.IMPORT_COMPLETED,
                    "import_job_id": import_job.id,
                    "importer_id": import_job.importer_id,
                    "row_count": import_job.row_count,
                    "processed_rows": import_job.processed_rows,
                    "error_count": import_job.error_count,
                    "timestamp": datetime.now().isoformat()
                }
            )
    except Exception as e:
        print(f"Error processing import: {str(e)}")
        import_job.status = ImportStatus.FAILED
        import_job.error_message = str(e)
        db_session.commit()
    finally:
        db_session.close()
