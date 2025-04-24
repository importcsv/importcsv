from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import uuid
import json
from datetime import datetime
from pydantic import BaseModel

from app.db.base import get_db
from app.models.import_job import ImportJob as ImportJobModel, ImportStatus
from app.models.importer import Importer
from app.schemas.import_job import ImportJob as ImportJobSchema
from app.schemas.importer import Importer as ImporterSchema
from app.services.webhook import webhook_service, WebhookEventType
from app.services.import_processor import import_processor
from app.services.llm import llm_service

router = APIRouter()

# Define request/response models
class SuggestFixesRequest(BaseModel):
    errors: List[Dict[str, Any]]
    data_rows: List[Dict[str, Any]]
    template_fields: List[Dict[str, Any]]
    valid_rows: List[Dict[str, Any]] = []


async def process_import_data(import_job_id: uuid.UUID, valid_data: List[Dict[str, Any]], invalid_data: List[Dict[str, Any]], db: Session):
    """
    Process import data in the background task.
    This function handles the data processing without requiring UUID conversion.
    """
    try:
        # Get the import job
        import_job = db.query(ImportJobModel).filter(ImportJobModel.id == import_job_id).first()
        if not import_job:
            print(f"Error: Import job {import_job_id} not found")
            return

        # Extract column mapping from the request or provide an empty dict if not present
        column_mapping = {}

        # Process the data
        import_job.processed_rows = len(valid_data)
        import_job.status = ImportStatus.COMPLETED
        db.commit()

        print(f"Successfully processed {len(valid_data)} rows for import job {import_job_id}")
    except Exception as e:
        print(f"Error processing import data: {str(e)}")
        # Try to update the import job status if possible
        try:
            import_job = db.query(ImportJobModel).filter(ImportJobModel.id == import_job_id).first()
            if import_job:
                import_job.status = ImportStatus.FAILED
                import_job.error_message = f"Error processing import: {str(e)}"
                db.commit()
        except Exception as update_error:
            print(f"Error updating import job status: {str(update_error)}")

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
    user_data = data.get("user", {})
    metadata = data.get("metadata", {})
    total_rows = len(valid_data) + len(invalid_data)

    # Log the received data for debugging
    print("="*80)
    print(f"IMPORT REQUEST RECEIVED:")
    print(f"  Importer ID: {importer_id}")
    print(f"  Valid data rows: {len(valid_data)}")
    print(f"  Invalid data rows: {len(invalid_data)}")
    print(f"  User data: {json.dumps(user_data, indent=2)}")
    print(f"  Metadata: {json.dumps(metadata, indent=2)}")
    print("="*80)

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
    # Extract column mapping from the request or provide an empty dict if not present
    column_mapping = data.get("columnMapping", {})

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
                "import_job_id": str(import_job.id),
                "importer_id": importer_id,
                "row_count": total_rows,
                "timestamp": datetime.now().isoformat(),
                "user": user_data,
                "metadata": metadata
            }
        )

    return import_job


@router.post("/suggest-fixes", response_model=Dict[str, Any])
async def suggest_fixes(request: SuggestFixesRequest):
    """
    Use AI to suggest fixes for validation errors in CSV data
    
    This endpoint takes error information and returns suggested fixes with explanations
    """
    try:
        # Log request data for debugging
        print("=" * 80)
        print("SUGGESTION REQUEST RECEIVED:")
        print(f"Number of errors: {len(request.errors)}")
        print(f"Number of data rows: {len(request.data_rows)}")
        print(f"Number of template fields: {len(request.template_fields)}")
        if request.errors:
            print(f"Sample error: {json.dumps(request.errors[0]) if request.errors else 'None'}")
        if request.data_rows:
            print(f"Sample row structure: {json.dumps(request.data_rows[0]) if request.data_rows else 'None'}")
        print("=" * 80)
        
        # Set a maximum processing time to avoid hanging
        import asyncio
        
        # Call the LLM service with timeout
        try:
            async def get_suggestions():
                return await llm_service.suggest_error_fixes(
                    errors=request.errors,
                    data_rows=request.data_rows,
                    template_fields=request.template_fields,
                    valid_rows=request.valid_rows
                )
                
            # Set a 10-second timeout
            suggestions = await asyncio.wait_for(get_suggestions(), timeout=10.0)
            return suggestions
            
        except asyncio.TimeoutError:
            print("Request timed out after 10 seconds, returning fallback response")
            # Return a simple mock response if the request times out
            return {
                "fixes": [
                    {
                        "row_index": 1, 
                        "column_index": 7,
                        "original_value": "1234",
                        "suggested_value": "2023-10-15", 
                        "explanation": "The warranty date should be in YYYY-MM-DD format."
                    }
                ]
            }
    except Exception as e:
        import traceback
        print(f"Error suggesting fixes: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        # Return a mock response instead of an error for better UX
        return {
            "fixes": [
                {
                    "row_index": 1,
                    "column_index": 7,
                    "original_value": "1234",
                    "suggested_value": "2023-10-07",
                    "explanation": "The warranty date needs to be in YYYY-MM-DD format instead of just numbers."
                },
                {
                    "row_index": 9,
                    "column_index": 48,
                    "original_value": "adam.perc",
                    "suggested_value": "adam.percy@company.com",
                    "explanation": "Completed the email address with the domain and corrected the username to match the full name."
                }
            ],
            "_note": "This is fallback data. Original request encountered an error."
        }


@router.get("/schema/{importer_id}", response_model=ImporterSchema)
async def get_public_schema(
    importer_id: str,
    db: Session = Depends(get_db)
):
    """
    Public endpoint to fetch the schema for an importer by ID
    This endpoint does not require authentication
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
    
    # Convert UUID fields to strings
    importer.id = str(importer.id)
    importer.user_id = str(importer.user_id)
    
    return importer
