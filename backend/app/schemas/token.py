from uuid import UUID
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class TokenPayload(BaseModel):
    sub: str
    exp: int
    iat: int
    jti: str
    aud: list[str]

class TokenData(BaseModel):
    # JWT standard fields
    sub: str
    exp: int
    iat: int
    jti: str
    aud: Optional[list[str]] = None
    
    # Convenience fields for our application
    user_id: Optional[UUID] = None
    token_id: Optional[str] = None
    expires_at: Optional[datetime] = None
