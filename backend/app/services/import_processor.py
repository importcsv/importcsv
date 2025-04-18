import uuid
from typing import Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.base import SessionLocal
from app.models.import_job import ImportJob, ImportStatus
from app.models.importer import Importer
from app.services.file_processor import file_processor
from app.services.webhook import webhook_service, WebhookEventType

class ImportProcessor:
    async def process_import_job(self, import_job_id: str, importer_id: str, file_path: str, column_mapping: Dict[str, str]):
        """Process an import job in the background"""
        # Create a new database session for this background task
        db = SessionLocal()
        try:
            # Get the import job
            import_job = db.query(ImportJob).filter(ImportJob.id == uuid.UUID(import_job_id)).first()
            if not import_job:
                print(f"Error: Import job {import_job_id} not found")
                return
            
            # Update status to processing
            import_job.status = ImportStatus.PROCESSING
            db.add(import_job)
            db.commit()
            
            # Get the importer
            importer = db.query(Importer).filter(Importer.id == uuid.UUID(importer_id)).first()
            if not importer:
                print(f"Error: Importer {importer_id} not found")
                import_job.status = ImportStatus.FAILED
                import_job.error_message = "Importer not found"
                db.add(import_job)
                db.commit()
                return
            
            print(f"Processing import job {import_job_id}...")
            
            # Process the import job
            try:
                # Validate data against schema
                import_job.status = ImportStatus.VALIDATING
                db.add(import_job)
                db.commit()
                
                # Convert importer.fields from JSON to ImporterField objects
                from app.schemas.importer import ImporterField
                importer_fields = [ImporterField(**field) for field in importer.fields]
                
                is_valid, validation_errors, processed_df = await file_processor.validate_data(
                    file_path,
                    importer_fields,
                    column_mapping
                )
                
                # Update import job with results
                import_job.status = ImportStatus.COMPLETED
                import_job.completed_at = datetime.utcnow()
                
                # Update metadata only - don't store the actual data
                valid_count = len(processed_df) - len(validation_errors) if processed_df is not None else 0
                import_job.row_count = len(processed_df) if processed_df is not None else 0
                import_job.processed_rows = valid_count
                import_job.error_count = len(validation_errors)
                
                db.add(import_job)
                db.commit()
                
                # Send CSV data to webhook
                metadata = {
                    "import_job_id": str(import_job.id),
                    "importer_id": str(importer.id),
                    "file_name": import_job.file_name,
                    "row_count": import_job.row_count,
                    "processed_rows": import_job.processed_rows,
                    "error_count": import_job.error_count,
                    "completed_at": import_job.completed_at.isoformat() if import_job.completed_at else None
                }
                
                # Send the CSV data to webhook in the background
                try:
                    await webhook_service.send_csv_data(file_path, metadata)
                    print(f"Sent CSV data to webhook for import job {import_job_id}")
                except Exception as e:
                    print(f"Error sending CSV data to webhook: {e}")
                
                # Create webhook event for completed import
                await webhook_service.create_event(
                    db,
                    import_job.user_id,
                    import_job.id,
                    WebhookEventType.IMPORT_FINISHED,
                    {
                        "event_type": WebhookEventType.IMPORT_FINISHED,
                        "status": "completed",
                        "import_job_id": str(import_job.id),
                        "importer_id": str(importer.id),
                        "file_name": import_job.file_name,
                        "row_count": import_job.row_count,
                        "processed_rows": import_job.processed_rows,
                        "error_count": import_job.error_count,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
                
                print(f"Import job {import_job_id} processed successfully")
                
            except Exception as e:
                import_job.status = ImportStatus.FAILED
                import_job.error_message = str(e)
                db.add(import_job)
                db.commit()
                
                # Create webhook event for failed import
                await webhook_service.create_event(
                    db,
                    import_job.user_id,
                    import_job.id,
                    WebhookEventType.IMPORT_FINISHED,
                    {
                        "event_type": WebhookEventType.IMPORT_FINISHED,
                        "status": "failed",
                        "import_job_id": str(import_job.id),
                        "importer_id": str(importer.id),
                        "file_name": import_job.file_name,
                        "error": str(e),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
                
                print(f"Error processing import job {import_job_id}: {str(e)}")
        
        finally:
            db.close()

# Create a singleton instance
import_processor = ImportProcessor()
