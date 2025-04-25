import logging
from contextlib import contextmanager
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

@contextmanager
def db_transaction(db: Session):
    """
    Context manager for database transactions.
    
    Usage:
        with db_transaction(db):
            # Your database operations here
            db.add(item)
            # No need to call db.commit() - it's handled by the context manager
    
    Args:
        db (Session): The SQLAlchemy database session
        
    Raises:
        Exception: Any exception that occurs during the transaction will be re-raised
                  after the rollback is performed
    """
    try:
        yield
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Transaction failed: {str(e)}")
        raise
