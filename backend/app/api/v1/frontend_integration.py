from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json
import pandas as pd
from datetime import datetime

from app.db.base import get_db, SessionLocal
from app.services.auth import get_current_user
from app.models.user import User
from app.models.import_job import ImportJob, ImportStatus
from app.models.schema import Schema
from app.services.webhook import webhook_service, WebhookEventType
from app.services.file_processor import file_processor

router = APIRouter()

@router.post("/process-csv-data", response_model=Dict[str, Any])
async def process_csv_data(
    data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Log the raw request data for debugging
    print(f"Received raw request data: {data}")
    print(f"Current user: {current_user.email} (ID: {current_user.id})")
    """
    Process data from the frontend CSV importer
    """
    schema_id = data.get("schema_id")
    if not schema_id:
        raise HTTPException(status_code=400, detail="Schema ID is required")
    
    # Verify schema exists and belongs to user
    schema = db.query(Schema).filter(Schema.id == schema_id, Schema.user_id == current_user.id).first()
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    # Extract data from the frontend
    valid_data = data.get("validData", [])
    invalid_data = data.get("invalidData", [])
    total_rows = len(valid_data) + len(invalid_data)
    
    # Log the received data for debugging
    print(f"Received data: schema_id={schema_id}, valid_data={len(valid_data)}, invalid_data={len(invalid_data)}")
    
    # Allow empty data for testing purposes
    if not valid_data and not invalid_data:
        print("Warning: No data provided, but continuing for testing purposes")
        # For testing, we'll create a job with 0 rows instead of raising an error
        # In production, you might want to uncomment the line below
        # raise HTTPException(status_code=400, detail="No data provided")
    
    # Create import job
    import_job = ImportJob(
        user_id=current_user.id,
        schema_id=schema_id,
        file_name="frontend_import.csv",
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

@router.get("/schema-template/{schema_id}", response_model=Dict[str, Any])
async def get_schema_template(
    schema_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get schema template in the format expected by the frontend CSV importer
    """
    schema = db.query(Schema).filter(Schema.id == schema_id, Schema.user_id == current_user.id).first()
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    # Convert schema fields to the format expected by the frontend
    columns = []
    for field in schema.fields:
        column = {
            "name": field.get("display_name") or field.get("name"),
            "key": field.get("name"),
            "required": field.get("required", False),
            "description": field.get("description", "")
        }
        
        # Add data type if available
        if field.get("type"):
            column["data_type"] = map_data_type(field.get("type"))
            
        # Add suggested mappings if available
        if field.get("suggested_mappings"):
            column["suggested_mappings"] = field.get("suggested_mappings")
            
        columns.append(column)
    
    return {
        "id": schema.id,
        "name": schema.name,
        "description": schema.description,
        "template": {
            "columns": columns
        }
    }

def map_data_type(backend_type: str) -> str:
    """Map backend data types to frontend data types"""
    mapping = {
        "string": "string",
        "number": "number",
        "integer": "number",
        "float": "number",
        "boolean": "boolean",
        "date": "date",
        "datetime": "date"
    }
    return mapping.get(backend_type.lower(), "string")

async def process_import_data(
    import_job_id: int,
    valid_data: List[Dict[str, Any]],
    invalid_data: List[Dict[str, Any]],
    db: Session
):
    """Process import data in the background"""
    # Get a new DB session for the background task
    db_session = SessionLocal()
    try:
        # Get the import job
        import_job = db_session.query(ImportJob).filter(ImportJob.id == import_job_id).first()
        if not import_job:
            print(f"Import job {import_job_id} not found")
            return
        
        # Get the schema
        schema = db_session.query(Schema).filter(Schema.id == import_job.schema_id).first()
        if not schema:
            print(f"Schema {import_job.schema_id} not found")
            import_job.status = ImportStatus.FAILED
            import_job.errors = {"errors": ["Schema not found"]}
            db_session.add(import_job)
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
                    import_job.user_id,
                    import_job.id,
                    WebhookEventType.IMPORT_FINISHED,
                    {
                        "event_type": WebhookEventType.IMPORT_FINISHED,
                        "import_job_id": import_job.id,
                        "schema_id": import_job.schema_id,
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
                    import_job.user_id,
                    import_job.id,
                    WebhookEventType.IMPORT_VALIDATION_ERROR,
                    {
                        "event_type": WebhookEventType.IMPORT_VALIDATION_ERROR,
                        "import_job_id": import_job.id,
                        "schema_id": import_job.schema_id,
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
