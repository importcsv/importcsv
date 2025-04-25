"""
Queue service for managing Redis Queue (RQ) operations
"""
import logging
from typing import Any, Dict, Optional
from redis import Redis
from rq import Queue
from rq.job import Job, JobStatus

from app.core.config import settings

logger = logging.getLogger(__name__)

# Connect to Redis
redis_conn = Redis.from_url(settings.REDIS_URL)

# Create queues
import_queue = Queue(settings.RQ_IMPORT_QUEUE, connection=redis_conn)
default_queue = Queue('default', connection=redis_conn)

def enqueue_job(
    func_path: str, 
    queue_name: Optional[str] = None,
    job_timeout: Optional[int] = None,
    **kwargs
) -> Optional[str]:
    """
    Enqueue a job to be processed by a worker
    
    Args:
        func_path (str): Import path to the function (e.g., 'app.services.import_processor.run_background_import')
        queue_name (Optional[str]): Queue to use (defaults to import_queue)
        job_timeout (Optional[int]): Timeout in seconds (defaults to settings.RQ_DEFAULT_TIMEOUT)
        **kwargs: Arguments to pass to the function
        
    Returns:
        Optional[str]: Job ID if successful, None if failed
    """
    try:
        # Select the appropriate queue
        queue = import_queue
        if queue_name == 'default':
            queue = default_queue
        elif queue_name and queue_name != settings.RQ_IMPORT_QUEUE:
            queue = Queue(queue_name, connection=redis_conn)
            
        # Set default timeout if not specified
        if job_timeout is None:
            job_timeout = settings.RQ_DEFAULT_TIMEOUT
            
        # Enqueue the job
        job = queue.enqueue(
            func_path,
            **kwargs,
            job_timeout=job_timeout
        )
        
        logger.info(f"Enqueued job {job.id} to {queue.name} queue")
        return job.id
        
    except Exception as e:
        logger.error(f"Failed to enqueue job: {str(e)}")
        return None

def get_job_status(job_id: str) -> Dict[str, Any]:
    """
    Get the status of a job
    
    Args:
        job_id (str): The job ID
        
    Returns:
        Dict[str, Any]: Job status information
    """
    try:
        job = Job.fetch(job_id, connection=redis_conn)
        
        result = {
            "id": job_id,
            "status": job.get_status(),
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "enqueued_at": job.enqueued_at.isoformat() if job.enqueued_at else None,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "ended_at": job.ended_at.isoformat() if job.ended_at else None,
        }
        
        # Add result or exception if available
        if job.is_finished:
            result["result"] = job.result
        elif job.is_failed:
            result["error"] = str(job.exc_info)
            
        return result
        
    except Exception as e:
        logger.error(f"Error fetching job {job_id}: {str(e)}")
        return {
            "id": job_id,
            "status": "unknown",
            "error": str(e)
        }

def cancel_job(job_id: str) -> bool:
    """
    Cancel a job if it hasn't started yet
    
    Args:
        job_id (str): The job ID
        
    Returns:
        bool: True if cancelled successfully, False otherwise
    """
    try:
        job = Job.fetch(job_id, connection=redis_conn)
        
        if job.get_status() in [JobStatus.QUEUED, JobStatus.SCHEDULED]:
            job.cancel()
            logger.info(f"Cancelled job {job_id}")
            return True
        else:
            logger.warning(f"Cannot cancel job {job_id} with status {job.get_status()}")
            return False
            
    except Exception as e:
        logger.error(f"Error cancelling job {job_id}: {str(e)}")
        return False
