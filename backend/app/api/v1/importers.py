import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.base import get_db
from app.auth.auth import current_active_user
from app.models.user import User
from app.models.importer import Importer
from app.schemas.importer import ImporterCreate, ImporterUpdate, Importer as ImporterSchema

router = APIRouter()

@router.get("/", response_model=List[ImporterSchema])
async def read_importers(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(current_active_user),
):
    """
    Retrieve importers
    """
    importers = db.query(Importer).filter(Importer.user_id == current_user.id).offset(skip).limit(limit).all()
    
    # Convert UUID fields to strings for each importer
    for importer in importers:
        importer.id = str(importer.id)
        importer.user_id = str(importer.user_id)
    
    return importers

@router.post("/", response_model=ImporterSchema)
async def create_importer(
    importer_in: ImporterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(current_active_user),
):
    """
    Create new importer
    """
    # Convert ImporterField objects to dictionaries for JSON serialization
    fields_json = [field.dict() for field in importer_in.fields]
    
    importer = Importer(
        name=importer_in.name,
        description=importer_in.description,
        fields=fields_json,
        user_id=current_user.id,
        webhook_url=importer_in.webhook_url,
        webhook_enabled=importer_in.webhook_enabled,
        include_unmatched_columns=importer_in.include_unmatched_columns,
        filter_invalid_rows=importer_in.filter_invalid_rows,
        disable_on_invalid_rows=importer_in.disable_on_invalid_rows
    )
    db.add(importer)
    db.commit()
    db.refresh(importer)
    
    # Convert UUID fields to strings
    importer.id = str(importer.id)
    importer.user_id = str(importer.user_id)
    
    return importer

@router.get("/{importer_id}", response_model=ImporterSchema)
async def read_importer(
    importer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(current_active_user),
):
    """
    Get importer by ID
    """
    importer = db.query(Importer).filter(Importer.id == importer_id, Importer.user_id == current_user.id).first()
    if not importer:
        raise HTTPException(status_code=404, detail="Importer not found")
    
    # Convert UUID fields to strings
    importer.id = str(importer.id)
    importer.user_id = str(importer.user_id)
    
    return importer

@router.put("/{importer_id}", response_model=ImporterSchema)
async def update_importer(
    importer_id: uuid.UUID,
    importer_in: ImporterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(current_active_user),
):
    """
    Update an importer
    """
    importer = db.query(Importer).filter(Importer.id == importer_id, Importer.user_id == current_user.id).first()
    if not importer:
        raise HTTPException(status_code=404, detail="Importer not found")
    
    update_data = importer_in.dict(exclude_unset=True)
    
    if "fields" in update_data and update_data["fields"]:
        # Convert ImporterField objects to dictionaries for JSON serialization
        update_data["fields"] = [field.dict() for field in update_data["fields"]]
    
    for field, value in update_data.items():
        setattr(importer, field, value)
    
    db.add(importer)
    db.commit()
    db.refresh(importer)
    
    # Convert UUID fields to strings
    importer.id = str(importer.id)
    importer.user_id = str(importer.user_id)
    
    return importer

@router.delete("/{importer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_importer(
    importer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(current_active_user),
):
    """
    Delete an importer
    """
    importer = db.query(Importer).filter(Importer.id == importer_id, Importer.user_id == current_user.id).first()
    if not importer:
        raise HTTPException(status_code=404, detail="Importer not found")
    
    db.delete(importer)
    db.commit()
    return None
