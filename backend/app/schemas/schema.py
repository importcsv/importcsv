import uuid
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime

# Schema field definition
class SchemaField(BaseModel):
    name: str
    display_name: Optional[str] = None
    type: str  # string, number, boolean, date, etc.
    required: bool = False
    description: Optional[str] = None
    validation: Optional[Dict[str, Any]] = None  # JSON Schema validation rules
    
    def dict(self, *args, **kwargs):
        # Ensure all fields are serializable
        result = super().dict(*args, **kwargs)
        # Remove None values to keep the JSON clean
        return {k: v for k, v in result.items() if v is not None}
        
    class Config:
        from_attributes = True

# Base Schema model
class SchemaBase(BaseModel):
    name: str
    description: Optional[str] = None
    fields: List[SchemaField]
    
    class Config:
        from_attributes = True

# Schema creation model
class SchemaCreate(SchemaBase):
    pass

# Schema update model
class SchemaUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[List[SchemaField]] = None

# Schema in DB
class SchemaInDBBase(SchemaBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schema to return via API
class Schema(SchemaInDBBase):
    pass
