import pandas as pd
import uuid
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from fastapi import BackgroundTasks, HTTPException, status
import logging
from app.db.base import SessionLocal
from app.core.config import settings # Import settings object
from app.services.webhook import WebhookService # Import WebhookService class
from app.models.import_job import ImportJob, ImportStatus
from app.models.importer import Importer
from app.models.user import User
from app.schemas.importer import ImporterField
from app.services.file_processor import file_processor
from app.services.webhook import webhook_service, WebhookEventType
from app.schemas.webhook import WebhookEventCreate
import sys

logger = logging.getLogger(__name__)

# --- Top-level Background Task Runner ---
async def run_background_import(import_job_id: str, file_path: str, column_mapping: Dict[str, str]):
    """Sets up context and runs the import job processing in the background."""
    # === Outer Exception Handler ===
    try:
        logger.info(f"BG Runner: Starting background task for job {import_job_id}")
        db: Session | None = None
        try:
            db = SessionLocal()
            webhook_service = WebhookService()
            processor = ImportProcessor(webhook_service=webhook_service)
            await processor.process_import_job(
                db=db,
                import_job_id=import_job_id,
                file_path=file_path,
                column_mapping=column_mapping
            )
            logger.info(f"BG Runner: Background task for job {import_job_id} finished.")
        except Exception as e:
            logger.error(f"BG Runner: Unhandled exception INSIDE background task for job {import_job_id}: {e}", exc_info=True)
            # Optionally, update job status to FAILED here if possible
            if db and db.is_active:
                try:
                    job_uuid_fail = uuid.UUID(import_job_id)
                    job_fail = db.query(ImportJob).filter(ImportJob.id == job_uuid_fail).first()
                    if job_fail and job_fail.status not in [ImportStatus.COMPLETED, ImportStatus.FAILED]:
                        job_fail.status = ImportStatus.FAILED
                        job_fail.error_message = f"Internal error during background processing: {e}"
                        job_fail.processing_finished_at = datetime.utcnow()
                        db.commit()
                        logger.warning(f"BG Runner: Set job {import_job_id} status to FAILED due to inner exception.")
                except Exception as update_fail_err:
                     logger.error(f"BG Runner: Failed to update job {import_job_id} status to FAILED after inner error: {update_fail_err}", exc_info=True)
                     db.rollback()
        finally:
            if db:
                db.close()
                logger.debug(f"BG Runner: Database session closed for job {import_job_id}")
    except Exception as outer_exc:
        # Log and print any exception that occurs BEFORE or DURING the inner try-finally block execution
        error_message = f"BG Runner: CRITICAL FAILURE at the start of background task for job {import_job_id}: {outer_exc}"
        logger.critical(error_message, exc_info=True)
        print(f"STDERR: {error_message}", file=sys.stderr) # Print directly in case logging fails
        # Attempt to mark job as failed if possible, but be cautious as DB session might not be available
        db_fail: Session | None = None
        try:
            db_fail = SessionLocal()
            job_uuid_outer = uuid.UUID(import_job_id)
            job_outer = db_fail.query(ImportJob).filter(ImportJob.id == job_uuid_outer).first()
            if job_outer and job_outer.status not in [ImportStatus.COMPLETED, ImportStatus.FAILED]:
                job_outer.status = ImportStatus.FAILED
                job_outer.error_message = f"Critical background task setup error: {outer_exc}"
                job_outer.processing_finished_at = datetime.utcnow()
                db_fail.commit()
                logger.warning(f"BG Runner: Set job {import_job_id} status to FAILED due to outer critical failure.")
        except Exception as final_fail_err:
             logger.error(f"BG Runner: Failed to update job {import_job_id} status to FAILED after outer critical failure: {final_fail_err}", exc_info=True)
             if db_fail: db_fail.rollback()
        finally:
             if db_fail: db_fail.close()


class ImportProcessor:
    def __init__(self, webhook_service: WebhookService):
        self.webhook_service = webhook_service
        # Other initializations if needed

    """
    Service class responsible for creating and processing import jobs.
    Handles both file-based imports (requiring validation) and
    pre-validated data imports (e.g., from frontend components).
    """

    async def start_import_from_file(
        self,
        db: Session,
        background_tasks: BackgroundTasks,
        user: User,
        importer_id: uuid.UUID,
        file_path: str,
        file_name: str,
        file_type: str,
        column_mapping: Dict[str, str]
    ) -> ImportJob:
        """
        Creates an ImportJob record for a file upload and schedules background processing.
        Args:
            db: Database session dependency.
            background_tasks: FastAPI BackgroundTasks dependency.
            user: The user initiating the import.
            importer_id: The UUID of the importer configuration to use.
            file_path: The path to the uploaded file.
            file_name: The original name of the uploaded file.
            file_type: The detected file type (e.g., 'csv').
            column_mapping: The user-defined mapping from file columns to importer fields.
        Returns: The newly created ImportJob ORM object.
        Raises: HTTPException: If the specified importer is not found for the user.
        """
        logger.info(f"Starting import from file: {file_name} for importer {importer_id}")
        importer = db.query(Importer).filter(Importer.id == importer_id, Importer.user_id == user.id).first()
        if not importer:
            logger.error(f"Importer {importer_id} not found for user {user.id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Importer not found")

        import_job = ImportJob(
            user_id=user.id, importer_id=importer_id, file_name=file_name, file_path=file_path,
            file_type=file_type, status=ImportStatus.PENDING, row_count=0, processed_rows=0,
            error_count=0, column_mapping=column_mapping
        )
        db.add(import_job)
        db.commit()
        db.refresh(import_job)
        logger.info(f"Created ImportJob {import_job.id} with status PENDING.")

        # Placeholder for webhook call - will add later
        # await webhook_service.create_event(...)

        background_tasks.add_task(
            run_background_import, 
            import_job_id=str(import_job.id), 
            file_path=file_path,
            column_mapping=column_mapping
        )
        logger.info(f"Scheduled background task process_import_job for job {import_job.id}")
        return import_job

    async def start_import_from_data(
        self,
        db: Session,
        background_tasks: BackgroundTasks,
        importer_id: uuid.UUID,
        valid_data: List[Dict[str, Any]],
        invalid_data: List[Dict[str, Any]]
    ) -> ImportJob:
        """
        Creates an ImportJob record for pre-validated data and schedules background processing.
        Args:
            db: Database session dependency.
            background_tasks: FastAPI BackgroundTasks dependency.
            importer_id: The UUID of the importer configuration used for validation.
            valid_data: List of dictionaries representing valid rows.
            invalid_data: List of dictionaries representing invalid rows with error details.
        Returns: The newly created ImportJob ORM object.
        Raises: HTTPException: If the specified importer is not found.
        """
        logger.info(f"Starting import from pre-validated data for importer {importer_id}")
        importer = db.query(Importer).filter(Importer.id == importer_id).first()
        if not importer:
             logger.error(f"Importer {importer_id} not found.")
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Importer not found")

        total_rows = len(valid_data) + len(invalid_data)
        error_count = len(invalid_data)

        import_job = ImportJob(
            user_id=importer.user_id, importer_id=importer_id, file_name="frontend_import.json",
            file_path="", file_type="json", status=ImportStatus.PROCESSING, row_count=total_rows,
            processed_rows=0, error_count=error_count,
            errors={"invalid_rows_details": invalid_data} if invalid_data else None
        )
        db.add(import_job)
        db.commit()
        db.refresh(import_job)
        logger.info(f"Created ImportJob {import_job.id} with status PROCESSING.")

        # Placeholder for webhook call - will add later
        # await webhook_service.create_event(...)

        background_tasks.add_task(
            self.process_prevalidated_data, 
            import_job_id=str(import_job.id),
            valid_data=valid_data, invalid_data=invalid_data
        )
        logger.info(f"Scheduled background task process_prevalidated_data for job {import_job.id}")
        return import_job

    async def process_import_job(self, db: Session, import_job_id: str, file_path: str, column_mapping: Dict[str, str]):
        """
        Processes a file-based import job in the background.
        Reads the file, applies mapping, performs placeholder validation/consumption,
        updates job status, sends webhooks, and cleans up the file.
        """
        logger.info(f"BG Task: Starting processing for job {import_job_id} from file {file_path}")
        import_job: Optional[ImportJob] = None
        importer: Optional[Importer] = None
        processed_df = None # To hold processed data for webhook/consumption

        try:
            job_uuid = uuid.UUID(import_job_id)
            # Use joinedload to fetch importer efficiently
            import_job = db.query(ImportJob).options(joinedload(ImportJob.importer)).filter(ImportJob.id == job_uuid).first()

            if not import_job:
                logger.error(f"Import job {import_job_id} not found in database.")
                # Cannot proceed or clean up file if job is unknown
                return

            importer = import_job.importer # Get importer from loaded relationship
            if not importer:
                logger.error(f"Importer associated with job {import_job_id} not found.")
                import_job.status = ImportStatus.FAILED
                import_job.error_message = "Associated importer configuration not found."
                db.commit()
                # Cannot send webhook without importer details
                return

            logger.info(f"Found job {import_job.id}, associated with importer {importer.id} ({importer.name})")

            # --- Update status to PROCESSING ---
            try:
                import_job.status = ImportStatus.PROCESSING
                db.commit()
                logger.info(f"Job {import_job.id} status updated to PROCESSING")
            except Exception as status_update_err:
                logger.error(f"Failed to update job {import_job.id} status to PROCESSING: {status_update_err}", exc_info=True)
                db.rollback()
                # Attempt to mark as failed if status update fails, but might not be possible
                try:
                    # Fetch again in case session state is weird
                    job_to_fail = db.query(ImportJob).filter(ImportJob.id == job_uuid).first()
                    if job_to_fail:
                        job_to_fail.status = ImportStatus.FAILED
                        job_to_fail.error_message = "Failed to update job status to processing."
                        db.commit()
                except Exception as fail_commit_err:
                    logger.error(f"Further error trying to mark job {import_job_id} as FAILED after status update issue: {fail_commit_err}")
                    db.rollback()
                return # Cannot proceed reliably

            # --- Start Actual File Processing ---
            try:
                # 1. Read the file (Assuming CSV for now)
                logger.debug(f"Attempting to read CSV file: {file_path}")
                # Consider adding dtype='str' or other options if needed
                df = pd.read_csv(file_path)
                total_rows = len(df)
                logger.info(f"Read {total_rows} rows from {file_path}")

                # Handle empty file case explicitly after reading
                if df.empty:
                    logger.warning(f"File {file_path} is empty for job {import_job_id}.")
                    import_job.status = ImportStatus.COMPLETED
                    import_job.row_count = 0
                    import_job.valid_rows = 0
                    import_job.invalid_rows = 0
                    import_job.error_message = "Input file was empty."
                    processed_df = df # Assign empty df
                    # Skip further processing for empty file
                else:
                    # 2. Apply column mapping
                    logger.debug(f"Applying column mapping: {column_mapping}")
                    # Only rename if mapping is provided
                    if column_mapping:
                        df.rename(columns=column_mapping, inplace=True, errors='ignore') # Use errors='ignore' or handle missing columns
                        logger.debug(f"Columns after mapping: {df.columns.tolist()}")
                    else:
                        logger.debug("No column mapping provided, skipping rename.")


                    # 3. TODO: Validate data against importer.schema (Placeholder)
                    # For now, assume all data is valid after mapping
                    valid_df = df # Placeholder for actual valid rows
                    invalid_df = pd.DataFrame() # Placeholder for actual invalid rows

                    valid_rows = len(valid_df)
                    invalid_rows = len(invalid_df)
                    processed_df = valid_df # Use valid data for potential webhook payload/consumption

                    logger.info(f"Data validation placeholder complete: {valid_rows} valid, {invalid_rows} invalid.")

                    # 4. TODO: Implement data consumption/insertion logic
                    if valid_rows > 0:
                        logger.info(f"Placeholder: Consuming {valid_rows} valid rows...")
                        # Add your data consumption logic here (e.g., insert into DB, call API)
                        pass # Placeholder

                    # --- Step 5: Finalize and Update Job Status (Success) ---
                    # Final update before committing completion
                    import_job.status = ImportStatus.COMPLETED
                    import_job.processing_finished_at = datetime.utcnow()
                    import_job.row_count = total_rows       # Assign total rows to row_count
                    import_job.processed_rows = valid_rows   # Assign valid rows to processed_rows
                    import_job.error_count = invalid_rows   # Assign invalid rows to error_count
                    import_job.error_message = None               # Clear error message on success

                    logger.info(f"Finalizing import job update with counts: Total={import_job.row_count}, Processed={import_job.processed_rows}, Errors={import_job.error_count}")

                    db.add(import_job) # Ensure the updated object is added back to the session
                    db.commit()
                    db.refresh(import_job) # Refresh to get the committed state
                    logger.info(f"Import job {import_job.id} completed and committed successfully.")
                    
                    # Send completion webhook
                    await self._send_completion_webhook(db, import_job, importer, file_path, processed_df)

            except FileNotFoundError:
                logger.error(f"File not found at path: {file_path} for job {import_job_id}")
                import_job.status = ImportStatus.FAILED
                import_job.error_message = f"Temporary processing file not found."
                # Ensure counts reflect failure
                import_job.row_count = 0
                import_job.processed_rows = 0
                import_job.error_count = 0
            except pd.errors.EmptyDataError:
                 # This case is handled by the df.empty check after read_csv
                 logger.warning(f"File {file_path} was empty (caught by EmptyDataError) for job {import_job_id}.")
                 import_job.status = ImportStatus.COMPLETED # Treat empty as success with 0 rows
                 import_job.row_count = 0
                 import_job.processed_rows = 0
                 import_job.error_count = 0
                 import_job.error_message = "Input file was empty."
                 processed_df = pd.DataFrame() # Ensure processed_df is an empty DataFrame
            except pd.errors.ParserError as pe:
                logger.error(f"Error parsing CSV file {file_path} for job {import_job_id}: {pe}", exc_info=False) # Less verbose log
                import_job.status = ImportStatus.FAILED
                import_job.error_message = f"Error parsing file. Please check CSV format. Details: {str(pe)}"
                # Attempt to set total_rows to 0 or keep as None if parsing failed early
                import_job.row_count = 0
                import_job.processed_rows = 0
                import_job.error_count = 0
            except Exception as process_exc:
                logger.error(f"Error during file processing stage for job {import_job_id}: {process_exc}", exc_info=True)
                import_job.status = ImportStatus.FAILED
                import_job.error_message = f"Unexpected error during file processing: {str(process_exc)}"
                # Update counts if possible, otherwise default to 0 valid
                import_job.row_count = 0
                import_job.processed_rows = 0
                import_job.error_count = 0

            # --- Commit final state (success or failure from inner try-except) ---
            logger.info(f"BG Task: Preparing final commit for job {import_job_id}. Status: {import_job.status}, Total: {import_job.row_count}, Processed: {import_job.processed_rows}, Errors: {import_job.error_count}")
            db.commit() # <--- THIS COMMIT SHOULD SAVE THE COUNTS
            logger.info(f"BG Task: Job {import_job_id} final state committed.")

            # Refresh the object AFTER commit if needed elsewhere, though webhook might use the session's state
            # db.refresh(import_job)

            # --- Send completion webhook ---
            # Send webhook *after* committing the final state
            if import_job.status == ImportStatus.COMPLETED:
                await self._send_completion_webhook(db, import_job, importer, file_path, processed_df)
            else:
                await self._send_completion_webhook(db, import_job, importer)

        except Exception as outer_exc:
            # Catch errors happening before the main processing block (e.g., job lookup, status update failure)
            logger.error(f"Unexpected outer error during background task for job {import_job_id}: {outer_exc}", exc_info=True)
            if import_job and db.is_active: # Check if import_job was loaded and session is active
                try:
                    # Use query to get potentially updated job state if needed
                    job_to_fail = db.query(ImportJob).filter(ImportJob.id == job_uuid).first()
                    if job_to_fail and job_to_fail.status != ImportStatus.FAILED:
                        job_to_fail.status = ImportStatus.FAILED
                        job_to_fail.error_message = "Internal server error: {str(outer_exc)}"
                        # Reset processed rows on failure? Optional.
                        # job_to_fail.processed_rows = 0
                        db.commit()
                        logger.info(f"Job {import_job_id} marked as FAILED due to outer exception.")
                        # Attempt to send error webhook
                        if importer: # Check if importer is available
                           await self._send_completion_webhook(db, job_to_fail, importer) # Send error webhook for the failed job
                        else: # Try to fetch importer again if not loaded before outer_exc
                            if job_to_fail.importer_id:
                                importer = db.query(Importer).filter(Importer.id == job_to_fail.importer_id).first()
                            if importer:
                                await self._send_completion_webhook(db, job_to_fail, importer)
                            else:
                                logger.error(f"Could not send completion webhook for job {import_job_id} due to missing importer details after outer exception.")

                except Exception as recovery_exc:
                     logger.error(f"Failed during outer exception recovery for job {import_job_id}: {recovery_exc}", exc_info=True)
                     db.rollback() # Rollback on recovery commit failure
            elif not import_job:
                 logger.error(f"Outer error occurred for job ID {import_job_id}, but job object was not loaded.")

        finally:
            # --- Cleanup: Ensure temporary file is deleted ---
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    logger.info(f"Successfully removed temporary file: {file_path} for job {import_job_id}")
                except OSError as e:
                    logger.error(f"Error removing temporary file {file_path} for job {import_job_id}: {e}")
            else:
                logger.warning(f"Temporary file path '{file_path}' not found or not provided for job {import_job_id}, skipping deletion.")

    async def process_prevalidated_data(
        self,
        import_job_id: str,
        valid_data: List[Dict[str, Any]],
        invalid_data: List[Dict[str, Any]],
        column_mapping: Dict[str, str] # Keep for potential consistency/logging
    ):
        """
        Processes an import job using pre-validated data (e.g., from frontend).
        Assumes ImportJob record exists and basic counts are set.
        Focuses on consuming the valid_data.

        Args:
            import_job_id: The UUID string of the import job.
            valid_data: List of dictionaries representing valid rows.
            invalid_data: List of dictionaries representing invalid rows (for logging/reference).
             column_mapping: Original column mapping (for reference/logging).
        """
        logger.info(f"BG Task: Processing pre-validated data for job {import_job_id}. Valid: {len(valid_data)}, Invalid: {len(invalid_data)}")
        db = SessionLocal()
        import_job: Optional[ImportJob] = None
        importer: Optional[Importer] = None
        processed_df = None # Placeholder for potential webhook payload

        try:
            job_uuid = uuid.UUID(import_job_id)
            # Use joinedload to fetch importer efficiently
            import_job = db.query(ImportJob).options(joinedload(ImportJob.importer)).filter(ImportJob.id == job_uuid).first()

            if not import_job:
                logger.error(f"Import job {import_job_id} (from data) not found.")
                return

            importer = import_job.importer
            if not importer:
                 logger.error(f"Importer associated with job {import_job_id} not found.")
                 import_job.status = ImportStatus.FAILED
                 import_job.error_message = "Associated importer configuration not found."
                 db.commit()
                 # No webhook here as we don't have importer details
                 return

            logger.info(f"Found job {import_job.id} (from data), associated with importer {importer.id} ({importer.name})")

            # Data is already validated, status should be PROCESSING (set by start_import_from_data)
            # logger.debug(f"Job {import_job.id} status before consumption: {import_job.status}")

            # TODO: Implement data consumption/insertion logic using valid_data
            logger.info(f"Consuming {len(valid_data)} pre-validated rows for job {import_job.id}...")
            consumption_successful = False
            if valid_data:
                 try:
                    # Convert to DataFrame for consistency or process list directly
                    processed_df = pd.DataFrame(valid_data) # Example conversion
                    # --- Add your data consumption logic here ---
                    # Example: Iterate and insert/update
                    # for record in valid_data:
                    #    # Your logic to save record
                    #    pass
                    logger.info(f"Placeholder: Successfully 'consumed' {len(valid_data)} rows.")
                    # --- End consumption logic ---
                    import_job.processed_rows = len(valid_data) # Update count after successful consumption
                    consumption_successful = True
                 except Exception as consume_exc:
                    logger.error(f"Error during consumption of pre-validated data for job {import_job_id}: {consume_exc}", exc_info=True)
                    import_job.status = ImportStatus.FAILED
                    import_job.error_message = f"Error during data consumption: {str(consume_exc)}"
                    # Reset processed rows on consumption failure
                    import_job.processed_rows = 0
                    # Proceed to commit failure status and send webhook

            # Update status to COMPLETED only if consumption logic didn't fail
            if import_job.status != ImportStatus.FAILED:
                 import_job.status = ImportStatus.COMPLETED
                 import_job.error_message = None # Clear any previous error message if reprocessing
                 logger.info(f"Job {import_job.id} (from data) processing COMPLETED successfully.")


            # Commit final status (COMPLETED or FAILED from consumption error)
            db.commit()
            logger.info(f"Job {import_job.id} (from data) final status committed: {import_job.status}")


            # Send completion/error webhook after commit
            await self._send_completion_webhook(db, import_job, importer, processed_df=processed_df)

        except Exception as e:
            # Catch errors outside the consumption block (e.g., job/importer lookup)
            logger.error(f"Outer error processing pre-validated data for job {import_job_id}: {e}", exc_info=True)
            if import_job and db.is_active:
                 try:
                    # Use query to get potentially updated job state if needed
                    job_to_fail = db.query(ImportJob).filter(ImportJob.id == job_uuid).first()
                    if job_to_fail and job_to_fail.status != ImportStatus.FAILED:
                        job_to_fail.status = ImportStatus.FAILED
                        job_to_fail.error_message = f"Internal server error during pre-validated processing: {str(e)}"
                        # Reset processed rows on failure? Optional.
                        # job_to_fail.processed_rows = 0
                        db.commit()
                        logger.info(f"Job {import_job_id} (from data) marked as FAILED due to outer exception.")
                        # Attempt to send error webhook
                        if importer: # Check if importer is available
                           await self._send_completion_webhook(db, job_to_fail, importer)
                        else: # Fetch importer if needed
                             importer = db.query(Importer).filter(Importer.id == job_to_fail.importer_id).first()
                             if importer:
                                 await self._send_completion_webhook(db, job_to_fail, importer)
                             else:
                                 logger.error(f"Could not send completion webhook for job {import_job_id} due to missing importer details after outer error.")
                 except Exception as recovery_exc:
                    logger.error(f"Failed during outer error recovery for job {import_job_id} (from data): {recovery_exc}", exc_info=True)
                    db.rollback()
            elif not import_job:
                 logger.error(f"Outer error occurred for job ID {import_job_id} (from data), but job object was not loaded.")

        finally:
            if db:
                db.close()
                logger.debug(f"Database session closed for job {import_job_id} (from data)")

    async def _send_completion_webhook(self, db: Session, import_job: ImportJob, importer: Optional[Importer], file_path: Optional[str] = None, processed_df=None):
        """
        Helper method to send completion or error webhooks.
        """
        # Log detailed webhook debugging info
        logger.info(f"DEBUG: _send_completion_webhook called for job {import_job.id}")
        logger.info(f"DEBUG: Importer: {importer.id if importer else 'None'}")
        
        if importer:
            logger.info(f"DEBUG: Webhook URL: {importer.webhook_url}")
            logger.info(f"DEBUG: Webhook enabled: {importer.webhook_enabled}")
            
        # Check if importer object exists first
        if not importer:
            logger.warning(f"Webhook skipped for job {import_job.id}: Importer object is None.")
            return
        # Then check if webhook is enabled and configured
        if not importer.webhook_url or not importer.webhook_enabled:
            logger.debug(f"Webhook skipped for job {import_job.id}: Webhook URL not set or not enabled for importer {importer.id}.")
            return

        logger.info(f"DEBUG: Preparing webhook for job {import_job.id}, status {import_job.status}")
        logger.info(f"DEBUG: Using webhook URL: {importer.webhook_url}")
            
        event_type = WebhookEventType.IMPORT_FINISHED if import_job.status == ImportStatus.COMPLETED else "import.failed"
        payload = {
            "job_id": str(import_job.id),
            "importer_id": str(importer.id),
            "status": import_job.status.value,
            "file_name": import_job.file_name,
            # Use committed values from import_job object
            "total_rows": import_job.row_count,
            "valid_rows": import_job.processed_rows,
            "invalid_rows": import_job.error_count,
            "processed_rows": import_job.processed_rows, # Add processed rows count
            "error_message": import_job.error_message if import_job.status == ImportStatus.FAILED else None,
            "message": f"Import job {import_job.status.value}." + (f" Error: {import_job.error_message}" if import_job.error_message else ""),
            "timestamp": datetime.utcnow().isoformat(),
            "webhook_url": importer.webhook_url  # Include webhook URL in payload for debugging
        }

        # Handle the case where include_data_in_webhook is not in the model yet
        should_include_data = False
        
        # Safe way to check attribute existence and value
        try:
            if hasattr(importer, 'include_data_in_webhook') and importer.include_data_in_webhook is not None:
                should_include_data = importer.include_data_in_webhook
            else:
                # Default to including data
                should_include_data = True
        except:
            # If any error, default to including data
            should_include_data = True
        
        # Always include data sample in webhook if the processed_df exists
        if should_include_data and processed_df is not None and not processed_df.empty:
             # Example: Include first 5 rows as JSON
             try:
                 # Default sample size
                 sample_size = 5
                 
                 # Safe way to check for webhook_data_sample_size
                 try:
                     if hasattr(importer, 'webhook_data_sample_size') and importer.webhook_data_sample_size is not None:
                         sample_size = importer.webhook_data_sample_size
                 except:
                     pass  # Keep default sample size
                 
                 sample_data = processed_df.head(sample_size).to_dict(orient='records')
                 payload['data_sample'] = sample_data
                 logger.info(f"DEBUG: Including data sample (up to {sample_size} rows) in webhook for job {import_job.id}")
             except Exception as e:
                 logger.warning(f"Could not serialize data sample for webhook payload for job {import_job.id}: {e}")
                 logger.warning(f"Error details: {str(e)}")

        # Create webhook event in database and send directly
        try:
            # Create event in database for record-keeping
            await self.webhook_service.create_event(
                db=db,
                user_id=import_job.user_id,
                import_job_id=import_job.id,
                event_type=event_type,
                payload=payload
            )
            logger.info(f"DEBUG: Created '{event_type}' webhook event in database for job {import_job.id}")

            # Double-check URL is valid again
            if not importer.webhook_url or not importer.webhook_url.strip() or not (importer.webhook_url.startswith('http://') or importer.webhook_url.startswith('https://')):
                logger.error(f"DEBUG: Invalid webhook URL: '{importer.webhook_url}' - cannot send webhook")
                return
                
            # Sanitize webhook URL
            webhook_url = importer.webhook_url.strip()
            logger.info(f"DEBUG: Final webhook URL being used: '{webhook_url}'")

            # Send webhook directly using the importer's URL
            try:
                logger.info(f"DEBUG: About to send webhook to {webhook_url}")
                
                success = await self.webhook_service.send_webhook(
                    url=webhook_url,
                    payload=payload,
                    secret=self.webhook_service.webhook_secret
                )
                
                if success:
                    logger.info(f"Successfully sent webhook to {webhook_url} for job {import_job.id}")
                else:
                    logger.warning(f"Failed to send webhook to {webhook_url} for job {import_job.id}")
            except Exception as send_err:
                logger.error(f"DEBUG: Exception when sending webhook: {str(send_err)}")
                import traceback
                logger.error(f"DEBUG: Webhook send traceback: {traceback.format_exc()}")
                
        except Exception as e:
            logger.error(f"Failed to send webhook for job {import_job.id}: {e}", exc_info=True)
            import traceback
            logger.error(f"DEBUG: Webhook outer traceback: {traceback.format_exc()}")

# Instantiate the services needed by ImportProcessor
webhook_service = WebhookService()
# Instantiate the processor service so it can be imported
import_processor = ImportProcessor(webhook_service=webhook_service)
