"""
Worker module for processing background jobs with RQ (Redis Queue)
"""
import os
import sys

# Set environment variable to prevent macOS fork safety issues
# This is needed when running on macOS to prevent objc runtime errors
os.environ['OBJC_DISABLE_INITIALIZE_FORK_SAFETY'] = 'YES'

from redis import Redis
from rq import Worker, Queue

from app.core.config import settings

# Try to import logging, but provide a fallback if not available
try:
    from app.core.logging import setup_logging
    logger = setup_logging(__name__)
except ImportError:
    import logging
    logger = logging.getLogger(__name__)
    logging.basicConfig(level=logging.INFO)

# Connect to Redis
redis_conn = Redis.from_url(settings.REDIS_URL)

# Define queues to listen to
QUEUES = [settings.RQ_IMPORT_QUEUE, 'default']

def start_worker():
    """Start a worker process to listen for jobs"""
    logger.info(f"Starting RQ worker, listening to queues: {', '.join(QUEUES)}")
    logger.info(f"Using Redis at: {settings.REDIS_URL}")
    
    try:
        # Create queues from names
        queue_list = [Queue(name, connection=redis_conn) for name in QUEUES]
        
        # Create and start worker
        worker = Worker(queue_list, connection=redis_conn)
        logger.info(f"Worker started with ID: {worker.key}")
        worker.work(with_scheduler=True)
    except Exception as e:
        logger.error(f"Worker failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    start_worker()
