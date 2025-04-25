import json
import logging
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session

from app.auth.users import get_current_active_user
from app.db.base import get_db
from app.models.user import User
from app.schemas.import_job import ImportJob as ImportJobSchema
from app.services.import_service import import_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[ImportJobSchema])
async def read_import_jobs(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve import jobs for the current user.

    Parameters:
        db: Database session
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return (pagination)
        current_user: Authenticated user making the request

    Returns:
        List of import job records for the current user
    """
    return import_service.get_import_jobs(db, str(current_user.id), skip, limit)


@router.post("/", response_model=ImportJobSchema)
async def create_import_job(
    importer_id: str = Form(...),  # UUID as string
    file_name: str = Form(...),
    column_mapping: str = Form(...),  # JSON string
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Create a new import job and enqueue it for background processing.

    This endpoint creates an import job record in the database and then
    enqueues the job for asynchronous processing using Redis Queue.

    Parameters:
        importer_id: ID of the importer configuration to use
        file_name: Original name of the uploaded file
        column_mapping: JSON string mapping CSV columns to data fields
        db: Database session
        current_user: Authenticated user making the request

    Returns:
        The created import job record

    Raises:
        HTTPException: For validation errors, file not found, or server errors
    """
    try:
        # Parse column mapping
        column_mapping_dict = json.loads(column_mapping)

        import_job = await import_service.create_import_job(
            db=db,
            user_id=str(current_user.id),
            importer_id=importer_id,
            file_name=file_name,
            data=column_mapping_dict.get('data', []),
            invalid_data=column_mapping_dict.get('invalid_data', [])
        )

        return import_job

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid column mapping JSON")
    except ValueError as ve:
        logger.error(f"Validation error creating import job: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except FileNotFoundError as fnf:
        logger.error(f"File not found: {str(fnf)}")
        raise HTTPException(status_code=404, detail=str(fnf))
    except Exception as e:
        logger.error(f"Error creating import job: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error creating import job: {str(e)}")


@router.get("/{import_job_id}", response_model=ImportJobSchema)
async def read_import_job(
    import_job_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retrieve a specific import job by its ID.

    This endpoint fetches details of a single import job, ensuring that
    the job belongs to the authenticated user making the request.

    Parameters:
        import_job_id: UUID of the import job to retrieve
        db: Database session
        current_user: Authenticated user making the request

    Returns:
        The requested import job record

    Raises:
        HTTPException: If the job is not found or an error occurs
    """
    try:
        import_job = import_service.get_import_job(db, str(current_user.id), import_job_id)
        if not import_job:
            raise HTTPException(status_code=404, detail="Import job not found")
        return import_job
    except Exception as e:
        logger.error(f"Error retrieving import job {import_job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving import job: {str(e)}")
