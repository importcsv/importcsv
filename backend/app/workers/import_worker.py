"""
Import worker module for processing CSV import jobs from the Redis Queue.

This module contains worker functions that are executed by Redis Queue workers.
It delegates all business logic to the ImportService class.
"""
import asyncio
import logging
from typing import Dict, Any, List

from app.db.base import SessionLocal
from app.services.import_service import import_service

logger = logging.getLogger(__name__)

def process_import_job(import_job_id: str, valid_data: List[Dict[str, Any]], invalid_data: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Process a data import job in the background using Redis Queue.
    
    This worker function is called by RQ and delegates to the ImportService.
    
    Args:
        import_job_id (str): The ID of the import job
        valid_data (List[Dict[str, Any]]): List of valid data rows
        invalid_data (List[Dict[str, Any]], optional): List of invalid data rows
        
    Returns:
        Dict[str, Any]: Results of the import process
    """
    logger.info(f"RQ Worker: Starting import job {import_job_id}")
    
    # Create a new database session for this worker
    db = SessionLocal()
    
    try:
        # Since we're in a worker process, we need to create a new event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # Process the import job using the import service
            import_job, processed_df = loop.run_until_complete(
                import_service.process_import_data(
                    db=db,
                    import_job_id=import_job_id,
                    valid_data=valid_data,
                    invalid_data=invalid_data if invalid_data else []
                )
            )
            
            if not import_job:
                return {"status": "error", "message": f"Import job {import_job_id} not found or processing failed"}
            
            logger.info(f"RQ Worker: Import job {import_job_id} completed successfully")
            return {
                "status": "success",
                "message": "Import completed successfully",
                "total_rows": import_job.row_count,
                "processed_rows": import_job.processed_rows,
                "error_count": import_job.error_count
            }
        finally:
            loop.close()
            
    except Exception as e:
        logger.error(f"RQ Worker: Error processing import job {import_job_id}: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}
        
    finally:
        # Close the database session
        db.close()


