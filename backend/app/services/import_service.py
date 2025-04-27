"""
Consolidated import service for processing CSV imports.

This module provides a unified interface for creating, managing, and processing import jobs.
It focuses on direct data imports where the data is pre-processed by the frontend.
"""
# Standard library imports
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Union, Tuple

# Third-party imports
import pandas as pd
from sqlalchemy.orm import Session, joinedload

# Application imports
from app.db.utils import db_transaction
from app.models.import_job import ImportJob, ImportStatus
from app.models.importer import Importer
from app.services.queue import enqueue_job
from app.services.webhook import WebhookService, WebhookEventType

logger = logging.getLogger(__name__)

# Create a single instance of WebhookService
webhook_service = WebhookService()


class ImportService:
    """Unified service for handling all aspects of data imports.

    This service contains all the business logic for:
    - Creating and retrieving import jobs
    - Processing pre-validated data from the frontend
    - Sending webhook notifications
    - Managing import job status

    It's designed to be used by both API endpoints and background workers.
    """

    def __init__(self, webhook_service: WebhookService = webhook_service):
        """Initialize the import service with dependencies"""
        self.webhook_service = webhook_service

    def get_import_jobs(self, db: Session, user_id: str, skip: int = 0, limit: int = 100) -> List[ImportJob]:
        """
        Retrieve a list of import jobs for a given user.

        Args:
            db (Session): The database session.
            user_id (str): The user's ID.
            skip (int, optional): Number of records to skip. Defaults to 0.
            limit (int, optional): Maximum number of records to return. Defaults to 100.

        Returns:
            List[ImportJob]: A list of ImportJob objects.
        """
        return db.query(ImportJob).filter(ImportJob.user_id == user_id).order_by(
            ImportJob.created_at.desc()
        ).offset(skip).limit(limit).all()

    def get_import_job(self, db: Session, user_id: str, import_job_id: Union[str, uuid.UUID]) -> Optional[ImportJob]:
        """
        Retrieve a single import job by ID for a given user.

        Args:
            db (Session): The database session.
            user_id (str): The user's ID.
            import_job_id: The ID of the import job.

        Returns:
            Optional[ImportJob]: The ImportJob object if found, else None.
        """
        # Convert string ID to UUID if needed
        if isinstance(import_job_id, str):
            try:
                import_job_id = uuid.UUID(import_job_id)
            except ValueError:
                logger.error(f"Invalid import job ID format: {import_job_id}")
                return None

        return db.query(ImportJob).filter(
            ImportJob.id == import_job_id,
            ImportJob.user_id == user_id
        ).first()

    async def create_import_job(
        self,
        db: Session,
        user_id: str,
        importer_id: str,
        file_name: str,
        data: List[Dict[str, Any]],
        invalid_data: List[Dict[str, Any]] = None
    ) -> ImportJob:
        """
        Create a new import job and enqueue it for background processing.

        Args:
            db (Session): The database session.
            user_id (str): The user's ID.
            importer_id (str): The ID of the importer to use.
            file_name (str): Name to identify this import.
            data (List[Dict[str, Any]]): The data to import.
            invalid_data (List[Dict[str, Any]], optional): Invalid data rows.

        Returns:
            ImportJob: The created ImportJob object.
        """
        try:
            # Convert string UUID to UUID object
            importer_uuid = uuid.UUID(importer_id)
            user_uuid = uuid.UUID(user_id)

            # Verify importer exists and belongs to user
            importer = db.query(Importer).filter(
                Importer.id == importer_uuid,
                Importer.user_id == user_uuid
            ).first()

            if not importer:
                raise ValueError(f"Importer with ID {importer_id} not found for user {user_id}")

            # Create import job
            total_rows = len(data) + (len(invalid_data) if invalid_data else 0)
            error_count = len(invalid_data) if invalid_data else 0

            import_job = ImportJob(
                user_id=user_uuid,
                importer_id=importer_uuid,
                file_name=file_name,
                file_path="",  # No file path for direct data imports
                file_type="json",
                status=ImportStatus.PENDING,
                row_count=total_rows,
                processed_rows=0,
                error_count=error_count
            )

            # Save to database with transaction
            with db_transaction(db):
                db.add(import_job)

            # Refresh after transaction is committed
            db.refresh(import_job)

            # Enqueue the job for background processing
            job_id = enqueue_job(
                'app.workers.import_worker.process_import_job',
                import_job_id=str(import_job.id),
                valid_data=data,
                invalid_data=invalid_data if invalid_data else []
            )

            logger.info(f"Created import job {import_job.id} for data import and enqueued as RQ job {job_id}")
            return import_job

        except Exception as e:
            logger.error(f"Error creating import job: {str(e)}")
            raise

    async def process_import_data(
        self,
        db: Session,
        import_job_id: str,
        valid_data: List[Dict[str, Any]],
        invalid_data: List[Dict[str, Any]]
    ):
        """
        Processes an import job using pre-validated data (e.g., from frontend).
        """
        logger.info(f"Processing import job {import_job_id} from pre-validated data")
        import_job: Optional[ImportJob] = None
        importer: Optional[Importer] = None
        processed_df = None

        try:
            job_uuid = uuid.UUID(import_job_id)
            import_job = db.query(ImportJob).options(joinedload(ImportJob.importer)).filter(ImportJob.id == job_uuid).first()

            if not import_job:
                logger.error(f"Import job {import_job_id} not found.")
                return

            importer = import_job.importer
            if not importer:
                logger.error(f"Importer associated with job {import_job_id} not found.")
                import_job.status = ImportStatus.FAILED
                import_job.error_message = "Associated importer configuration not found."
                db.commit()
                return

            logger.info(f"Found job {import_job.id}, associated with importer {importer.id}")

            # Process the pre-validated data
            try:
                if valid_data:
                    processed_df = pd.DataFrame(valid_data)
                    logger.info(f"Successfully processed {len(valid_data)} valid rows.")
                    import_job.processed_rows = len(valid_data)

                import_job.status = ImportStatus.COMPLETED
                import_job.completed_at = datetime.now().astimezone()
                db.commit()
                logger.info(f"Job {import_job.id} processing completed successfully.")

            except Exception as process_exc:
                logger.error(f"Error processing pre-validated data for job {import_job_id}: {process_exc}", exc_info=True)
                import_job.status = ImportStatus.FAILED
                import_job.error_message = f"Error during data processing: {str(process_exc)}"
                import_job.processed_rows = 0
                db.commit()

            # Send completion webhook
            await self._send_completion_webhook(db, import_job, importer, processed_df)

        except Exception as e:
            logger.error(f"Unexpected error processing pre-validated data for job {import_job_id}: {e}", exc_info=True)
            if import_job and db.is_active:
                try:
                    import_job.status = ImportStatus.FAILED
                    import_job.error_message = f"Internal server error: {str(e)}"
                    db.commit()
                    if importer:
                        await self._send_completion_webhook(db, import_job, importer)
                except Exception as recovery_exc:
                    logger.error(f"Failed during exception recovery for job {import_job_id}: {recovery_exc}")
                    db.rollback()

    async def _send_completion_webhook(
        self,
        db: Session,
        import_job: ImportJob,
        importer: Importer,
        processed_df: Optional[pd.DataFrame] = None
    ):
        """
        Sends a webhook notification for an import job completion.

        Args:
            db: Database session
            import_job: The import job
            importer: The importer configuration
            processed_df: The processed dataframe (optional)
        """
        try:
            # Prepare payload
            payload = {
                "event_type": WebhookEventType.IMPORT_FINISHED if import_job.status == ImportStatus.COMPLETED else WebhookEventType.IMPORT_FAILED,
                "import_job_id": str(import_job.id),
                "importer_id": str(importer.id),
                "row_count": import_job.row_count,
                "processed_rows": import_job.processed_rows,
                "error_count": import_job.error_count,
                "status": import_job.status.value,
                "timestamp": import_job.updated_at.isoformat() if import_job.updated_at else None,
            }

            # Include data in the webhook payload
            if processed_df is not None and not processed_df.empty:
                payload["data"] = processed_df.to_dict('records')
                logger.info(f"Including full data ({len(processed_df)} rows) in webhook for job {import_job.id}")

            # Only send webhook if configured
            if importer.webhook_enabled and importer.webhook_url:
                # Create webhook event and send webhook
                # The create_event method already sends the webhook
                webhook_event = await self.webhook_service.create_event(
                    db=db,
                    user_id=import_job.user_id,
                    import_job_id=import_job.id,
                    event_type=WebhookEventType.IMPORT_FINISHED if import_job.status == ImportStatus.COMPLETED else WebhookEventType.IMPORT_FAILED,
                    payload=payload
                )

                # Log webhook status based on the event's delivered status
                if webhook_event and webhook_event.delivered:
                    logger.info(f"Webhook successfully sent to {importer.webhook_url} for job {import_job.id}")
                elif webhook_event:
                    logger.warning(f"Webhook delivery failed to {importer.webhook_url} for job {import_job.id}")

        except Exception as e:
            logger.error(f"Error sending webhook for job {import_job.id}: {e}", exc_info=True)


# Create a singleton instance of the ImportService
import_service = ImportService()


def log_import_started(
    importer_id: uuid.UUID,
    import_job_id: uuid.UUID,
    row_count: int,
    user_data: dict = None,
    metadata: dict = None
):
    """Log an import started event.
    
    This is a simplified version that just logs the event without using webhooks.
    For actual webhook delivery, use the webhook_service directly with a DB session.
    
    Args:
        importer_id: UUID of the importer
        import_job_id: UUID of the import job
        row_count: Total number of rows in the import
        user_data: User data to include in the webhook
        metadata: Additional metadata to include
    """
    user_data = user_data or {}
    metadata = metadata or {}
    
    # Create event payload
    payload = {
        "event_type": WebhookEventType.IMPORT_STARTED,
        "import_job_id": str(import_job_id),
        "importer_id": str(importer_id),
        "row_count": row_count,
        "timestamp": datetime.now().isoformat(),
        "user": user_data,
        "metadata": metadata,
    }
    
    # Log the event
    logger.info(f"Import started: {payload}")
