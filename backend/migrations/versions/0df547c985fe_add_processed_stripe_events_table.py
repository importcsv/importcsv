"""add processed stripe events table

Revision ID: 0df547c985fe
Revises: 1ad652b7f279
Create Date: 2025-12-30 15:29:56.590393

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0df547c985fe'
down_revision: Union[str, None] = '1ad652b7f279'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create processed_stripe_events table for webhook idempotency."""
    op.create_table(
        'processed_stripe_events',
        sa.Column('event_id', sa.String(255), primary_key=True),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    """Drop processed_stripe_events table."""
    op.drop_table('processed_stripe_events')
