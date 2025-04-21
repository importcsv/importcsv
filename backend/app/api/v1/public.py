from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any
import uuid
from datetime import datetime

from app.db.base import get_db
from app.models.import_job import ImportJob as ImportJobModel, ImportStatus
from app.models.importer import Importer
from app.schemas.import_job import ImportJob as ImportJobSchema
from app.services.webhook import webhook_service, WebhookEventType
from app.services.import_processor import import_processor

router = APIRouter()

@router.post("/process-import/{importer_id}", response_model=ImportJobSchema)
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
    import_job = ImportJobModel(
        user_id=importer.user_id,  # Associate with the importer's owner
        importer_id=importer_uuid,
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
        import_processor.process_prevalidated_data,
        import_job.id,
        valid_data,
        invalid_data
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
                "import_job_id": str(import_job.id),
                "importer_id": importer_id,
                "row_count": total_rows,
                "timestamp": datetime.now().isoformat()
            }
        )
    
    return import_job
