import logging
import uuid
from typing import Optional, List, Dict, Any

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.db.utils import db_transaction
from app.models.importer import Importer
from app.schemas.importer import ImporterCreate, ImporterUpdate

logger = logging.getLogger(__name__)


def _process_fields(fields: List[Any]) -> List[Dict[str, Any]]:
    """Process fields to ensure they are dictionaries"""
    fields_json = []
    for field in fields:
        if hasattr(field, 'model_dump'):
            # Pydantic v2
            fields_json.append(field.model_dump())
        elif hasattr(field, 'dict'):
            # Pydantic v1
            fields_json.append(field.dict())
        else:
            # Already a dictionary
            fields_json.append(field)
    return fields_json


def get_importers(db: Session, user_id: str, skip: int = 0, limit: int = 100) -> List[Importer]:
    """
    Retrieve a list of importers for a given user.
    Args:
        db (Session): The database session.
        user_id (str): The user's ID.
        skip (int, optional): Number of records to skip. Defaults to 0.
        limit (int, optional): Maximum number of records to return. Defaults to 100.
    Returns:
        List[Importer]: A list of Importer objects.
    """
    return db.query(Importer).filter(Importer.user_id == user_id).offset(skip).limit(limit).all()


def create_importer(db: Session, user_id: str, importer_in: ImporterCreate) -> Importer:
    """
    Create a new importer for a user.
    Args:
        db (Session): The database session.
        user_id (str): The user's ID.
        importer_in (ImporterCreate): The importer creation schema.
    Returns:
        Importer: The created Importer object.
    """
    try:
        # Process fields to ensure they are dictionaries
        fields_json = _process_fields(importer_in.fields)

        importer = Importer(
            name=importer_in.name,
            description=importer_in.description,
            fields=fields_json,
            user_id=user_id,
            include_unmatched_columns=importer_in.include_unmatched_columns,
            filter_invalid_rows=importer_in.filter_invalid_rows,
            disable_on_invalid_rows=importer_in.disable_on_invalid_rows,
            dark_mode=importer_in.dark_mode,
        )

        # Add and commit in the transaction
        with db_transaction(db):
            db.add(importer)
            
        # Refresh after the transaction is committed
        db.refresh(importer)
        return importer
    except Exception as e:
        logger.error(f"Error creating importer: {str(e)}")
        raise


def get_importer(db: Session, user_id: str, importer_id) -> Optional[Importer]:
    """
    Retrieve a single importer by ID for a given user.
    Args:
        db (Session): The database session.
        user_id (str): The user's ID.
        importer_id: The ID of the importer.
    Returns:
        Optional[Importer]: The Importer object if found, else None.
    """
    return db.query(Importer).filter(Importer.id == importer_id, Importer.user_id == user_id).first()


def update_importer(db: Session, user_id: str, importer_id, importer_in: ImporterUpdate) -> Optional[Importer]:
    """
    Update an existing importer for a user.
    Args:
        db (Session): The database session.
        user_id (str): The user's ID.
        importer_id: The ID of the importer to update.
        importer_in (ImporterUpdate): The importer update schema.
    Returns:
        Optional[Importer]: The updated Importer object if found, else None.
    """
    try:
        importer = get_importer(db, user_id, importer_id)
        if not importer:
            return None

        # Get update data, handling both Pydantic v1 and v2
        if hasattr(importer_in, 'model_dump'):
            update_data = importer_in.model_dump(exclude_unset=True)
        else:
            update_data = importer_in.dict(exclude_unset=True)

        # Process fields if present
        if "fields" in update_data and update_data["fields"]:
            update_data["fields"] = _process_fields(update_data["fields"])

        # Update fields
        for field, value in update_data.items():
            setattr(importer, field, value)
            if field == "fields":
                flag_modified(importer, "fields")

        # Add and commit in the transaction
        with db_transaction(db):
            db.add(importer)
            
        # Refresh after the transaction is committed
        db.refresh(importer)
        return importer
    except Exception as e:
        logger.error(f"Error updating importer {importer_id}: {str(e)}")
        raise


def delete_importer(db: Session, user_id: str, importer_id) -> Optional[Importer]:
    """
    Delete an importer for a user.
    Args:
        db (Session): The database session.
        user_id (str): The user's ID.
        importer_id: The ID of the importer to delete.
    Returns:
        Optional[Importer]: The deleted Importer object if found and deleted, else None.
    """
    try:
        importer = get_importer(db, user_id, importer_id)
        if importer:
            with db_transaction(db):
                db.delete(importer)
        return importer
    except Exception as e:
        logger.error(f"Error deleting importer {importer_id}: {str(e)}")
        raise

def batch_delete_importers(db: Session, user_id: str, importer_ids: List[str]) -> int:
    """
    Delete multiple importers at once.
    Args:
        db (Session): The database session.
        user_id (str): The user's ID.
        importer_ids: List of importer IDs to delete.
    Returns:
        int: Number of importers deleted.
    """
    try:
        with db_transaction(db):
            result = db.query(Importer).filter(
                Importer.id.in_(importer_ids),
                Importer.user_id == user_id
            ).delete(synchronize_session=False)
        return result
    except Exception as e:
        logger.error(f"Error batch deleting importers: {str(e)}")
        raise


def get_importer_by_key(db: Session, importer_key: uuid.UUID) -> Importer:
    """Helper function to get an importer by key and handle common error cases.

    Args:
        db: Database session
        importer_key: UUID key of the importer

    Returns:
        Importer object if found

    Raises:
        HTTPException: If importer not found
    """
    importer = db.query(Importer).filter(Importer.key == importer_key).first()
    if not importer:
        msg = f"Importer with key {importer_key} not found"
        raise HTTPException(status_code=404, detail=msg)
    return importer
