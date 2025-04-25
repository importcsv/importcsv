from uuid import UUID

from datetime import datetime
from pydantic import BaseModel

class TokenPayload(BaseModel):
    sub: str
    exp: int
    iat: int
    jti: str
    aud: list[str]

class TokenData(BaseModel):
    user_id: UUID
    token_id: str
    expires_at: datetime
