from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.base import get_db
from app.services.auth import get_current_user
from app.models.user import User
from app.models.schema import Schema
from app.schemas.schema import SchemaCreate, SchemaUpdate, Schema as SchemaSchema

router = APIRouter()

@router.get("/", response_model=List[SchemaSchema])
async def read_schemas(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve schemas
    """
    schemas = db.query(Schema).filter(Schema.user_id == current_user.id).offset(skip).limit(limit).all()
    return schemas

@router.post("/", response_model=SchemaSchema)
async def create_schema(
    schema_in: SchemaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create new schema
    """
    # Convert SchemaField objects to dictionaries for JSON serialization
    fields_json = [field.dict() for field in schema_in.fields]
    
    schema = Schema(
        name=schema_in.name,
        description=schema_in.description,
        fields=fields_json,
        user_id=current_user.id,
    )
    db.add(schema)
    db.commit()
    db.refresh(schema)
    return schema

@router.get("/{schema_id}", response_model=SchemaSchema)
async def read_schema(
    schema_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get schema by ID
    """
    schema = db.query(Schema).filter(Schema.id == schema_id, Schema.user_id == current_user.id).first()
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")
    return schema
