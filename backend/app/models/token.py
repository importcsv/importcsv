import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    UUID,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.db.base import Base


class TokenBlacklist(Base):
    """
    Model for tracking revoked/blacklisted tokens

    This model serves two purposes:
    1. Track individual revoked tokens by their JTI (token_id)
    2. Track mass revocation events (like 'logout from all devices') using the invalidate_before field
    """

    __tablename__ = "token_blacklist"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    token_id = Column(
        String, unique=True, index=True, nullable=False
    )  # JTI from the token
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # For mass revocation: invalidate all tokens issued before this time for a specific user
    invalidate_before = Column(DateTime(timezone=True), nullable=True)

    # Link to user for easier querying
    user_id = Column(UUID, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="blacklisted_tokens")
