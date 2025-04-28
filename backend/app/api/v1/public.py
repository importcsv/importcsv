from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import uuid
import json
from datetime import datetime
from pydantic import BaseModel

from app.db.base import get_db
from app.models.import_job import ImportJob as ImportJobModel, ImportStatus
from app.models.importer import Importer
from app.services.importer import get_importer_by_key
from app.services.import_service import log_import_started
from app.schemas.import_job import ImportJob as ImportJobSchema
from app.schemas.importer import Importer as ImporterSchema
from app.services.webhook import webhook_service, WebhookEventType
from app.services.import_service import import_service

from app.services.queue import enqueue_job

router = APIRouter()


# Define request/response models

# Define a request model for process-import
class ProcessImportRequest(BaseModel):
    validData: List[Dict[str, Any]]
    invalidData: List[Dict[str, Any]] = []
    columnMapping: Dict[str, Any] = {}
    user: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}
    importer_key: uuid.UUID


def process_import_data(
    import_job_id: str,
    valid_data: List[Dict[str, Any]],
    invalid_data: List[Dict[str, Any]],
):
    """
    Process import data as a background job in Redis Queue.
    This function creates its own database session and handles all database operations.

    Args:
        import_job_id (str): The ID of the import job as a string
        valid_data (List[Dict[str, Any]]): List of valid data rows to process
        invalid_data (List[Dict[str, Any]]): List of invalid data rows for reference

    Returns:
        Dict[str, Any]: Result of the processing
    """
    # Create a new database session for this worker
    from app.db.base import SessionLocal
    import asyncio

    db = SessionLocal()

    try:
        # Use the import_service to process the data
        # We need to run the async function in a new event loop since this is a worker process
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            # Run the async function in the event loop
            loop.run_until_complete(
                import_service.process_import_data(
                    db=db,
                    import_job_id=import_job_id,
                    valid_data=valid_data,
                    invalid_data=invalid_data,
                )
            )
            print(
                f"Successfully processed {len(valid_data)} rows for import job {import_job_id}"
            )
            return {
                "status": "success",
                "processed_rows": len(valid_data),
                "invalid_rows": len(invalid_data),
            }
        finally:
            loop.close()

    except Exception as e:
        print(f"Error processing import data: {str(e)}")
        return {"status": "error", "message": str(e)}

    finally:
        # Always close the database session
        db.close()


@router.post("/process-import", response_model=ImportJobSchema)
async def process_public_import(
    request: ProcessImportRequest,
    db: Session = Depends(get_db)
):
    """
    Public endpoint to process data from the embedded CSV importer
    Authentication is done via the importer_key in the request
    """
    # Find the importer by key
    importer = get_importer_by_key(db, request.importer_key)

    # Extract data from the request
    valid_data = request.validData
    invalid_data = request.invalidData
    user_data = request.user
    metadata = request.metadata
    total_rows = len(valid_data) + len(invalid_data)

    # Log the received data for debugging
    print("=" * 80)
    print(f"IMPORT REQUEST RECEIVED:")
    print(f"  Importer Key: {request.importer_key}")
    print(f"  Valid data rows: {len(valid_data)}")
    print(f"  Invalid data rows: {len(invalid_data)}")
    print(f"  User data: {json.dumps(user_data, indent=2)}")
    print(f"  Metadata: {json.dumps(metadata, indent=2)}")
    print("=" * 80)

    # Create import job
    import_job = ImportJobModel(
        user_id=importer.user_id,  # Associate with the importer's owner
        importer_id=importer.id,
        file_name="embedded_import.csv",
        file_path="",  # No file path for frontend-processed data
        file_type="csv",
        status=ImportStatus.PROCESSING,
        row_count=total_rows,
        processed_rows=0,
        error_count=len(invalid_data),
    )
    db.add(import_job)
    db.commit()
    db.refresh(import_job)

    # Process data in background
    # Extract column mapping from the request
    column_mapping = request.columnMapping

    # Enqueue processing job in Redis Queue
    job_id = enqueue_job(
        "app.api.v1.public.process_import_data",
        import_job_id=str(import_job.id),
        valid_data=valid_data,
        invalid_data=invalid_data,
    )

    if job_id:
        print(f"Import job {import_job.id} enqueued with RQ job ID: {job_id}")
    else:
        print(f"Failed to enqueue import job {import_job.id}")
        # Update job status to indicate queueing failure
        import_job.status = ImportStatus.FAILED
        import_job.error_message = "Failed to enqueue job for processing"
        db.commit()

    # Log the import started event
    log_import_started(
        importer_id=importer.id,
        import_job_id=import_job.id,
        row_count=total_rows,
        user_data=user_data,
        metadata=metadata
    )
    
    # Create webhook event if enabled
    if importer.webhook_enabled and importer.webhook_url:
        # This would be handled by a background task or worker
        # The actual webhook delivery is now done in the import service
        pass

    return import_job





@router.get("/schema", response_model=ImporterSchema)
async def get_public_schema(importer_key: uuid.UUID, db: Session = Depends(get_db)):
    """
    Public endpoint to fetch the schema for an importer by key
    This endpoint does not require authentication
    """
    # Find the importer by key
    importer = get_importer_by_key(db, importer_key)

    # Convert UUID fields to strings
    importer.id = str(importer.id)
    importer.user_id = str(importer.user_id)

    return importer
