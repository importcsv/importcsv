import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.base import get_db
from app.auth.auth import current_active_user
from app.models.user import User
from app.models.importer import Importer
from app.schemas.importer import ImporterCreate, ImporterUpdate, Importer as ImporterSchema

# For backward compatibility, we're forwarding requests from the schemas API to the importers API
router = APIRouter()

@router.get("/", response_model=List[ImporterSchema])
async def read_schemas(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(current_active_user),
):
    """
    Retrieve schemas (forwarded to importers for backward compatibility)
    """
    importers = db.query(Importer).filter(Importer.user_id == current_user.id).offset(skip).limit(limit).all()
    return importers

@router.post("/", response_model=ImporterSchema)
async def create_schema(
    schema_in: ImporterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(current_active_user),
):
    """
    Create new schema (forwarded to importers for backward compatibility)
    """
    # Convert ImporterField objects to dictionaries for JSON serialization
    fields_json = [field.dict() for field in schema_in.fields]
    
    importer = Importer(
        name=schema_in.name,
        description=schema_in.description,
        fields=fields_json,
        user_id=current_user.id,
    )
    db.add(importer)
    db.commit()
    db.refresh(importer)
    return importer

@router.get("/{schema_id}", response_model=ImporterSchema)
async def read_schema(
    schema_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(current_active_user),
):
    """
    Get schema by ID (forwarded to importers for backward compatibility)
    """
    importer = db.query(Importer).filter(Importer.id == schema_id, Importer.user_id == current_user.id).first()
    if not importer:
        raise HTTPException(status_code=404, detail="Importer not found")
    return importer
