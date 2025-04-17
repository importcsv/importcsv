from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Create SQLAlchemy engine for synchronous operations
engine = create_engine(settings.DATABASE_URL)

# Create session factory for synchronous operations
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Dependency to get DB session for synchronous operations
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
