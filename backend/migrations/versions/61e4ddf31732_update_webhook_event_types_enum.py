"""Update webhook event types enum

Revision ID: 61e4ddf31732
Revises: 7e89b9190f14
Create Date: 2025-08-18 15:19:38.527622

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '61e4ddf31732'
down_revision: Union[str, None] = '7e89b9190f14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Update webhook event type enum values."""
    
    # Get the current connection and commit after adding the enum value
    connection = op.get_bind()
    
    # First, add the new enum value if it doesn't exist
    # Check if the value already exists to make migration idempotent
    result = connection.execute(sa.text("""
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'IMPORT_COMPLETED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'webhookeventtype')
    """))
    
    if not result.fetchone():
        op.execute("ALTER TYPE webhookeventtype ADD VALUE 'IMPORT_COMPLETED'")
        # Commit the enum addition so it can be used in the UPDATE
        connection.commit()
    
    # Now update existing IMPORT_FINISHED records to use IMPORT_COMPLETED
    # Check if there are any records to update
    result = connection.execute(sa.text("""
        SELECT COUNT(*) FROM webhook_events 
        WHERE event_type = 'IMPORT_FINISHED'::webhookeventtype
    """))
    count = result.scalar()
    
    if count and count > 0:
        op.execute("""
            UPDATE webhook_events 
            SET event_type = 'IMPORT_COMPLETED'::webhookeventtype 
            WHERE event_type = 'IMPORT_FINISHED'::webhookeventtype
        """)
    
    # Note: PostgreSQL doesn't allow removing enum values easily
    # The unused values (IMPORT_VALIDATION_ERROR, IMPORT_PROGRESS, IMPORT_FINISHED) 
    # will remain in the type but won't be used by the application


def downgrade() -> None:
    """Revert webhook event type changes."""
    
    connection = op.get_bind()
    
    # Check if IMPORT_FINISHED exists
    result = connection.execute(sa.text("""
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'IMPORT_FINISHED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'webhookeventtype')
    """))
    
    if not result.fetchone():
        # Add back IMPORT_FINISHED if it doesn't exist
        op.execute("ALTER TYPE webhookeventtype ADD VALUE 'IMPORT_FINISHED'")
        connection.commit()
    
    # Revert IMPORT_COMPLETED back to IMPORT_FINISHED
    result = connection.execute(sa.text("""
        SELECT COUNT(*) FROM webhook_events 
        WHERE event_type = 'IMPORT_COMPLETED'::webhookeventtype
    """))
    count = result.scalar()
    
    if count and count > 0:
        op.execute("""
            UPDATE webhook_events 
            SET event_type = 'IMPORT_FINISHED'::webhookeventtype 
            WHERE event_type = 'IMPORT_COMPLETED'::webhookeventtype
        """)