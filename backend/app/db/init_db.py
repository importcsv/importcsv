from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User
from app.models.schema import Schema
from app.models.import_job import ImportJob
from app.models.webhook import WebhookEvent
from app.db.base import Base, engine

# Create all tables
def init_db():
    Base.metadata.create_all(bind=engine)
    
# Create initial superuser
def create_superuser(db: Session, email: str, password: str, full_name: str = None):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            is_superuser=True,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
