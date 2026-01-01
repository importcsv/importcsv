"""add usage email tracking columns

Revision ID: 0f55805440a7
Revises: 0df547c985fe
Create Date: 2025-12-31 22:04:34.993642

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0f55805440a7'
down_revision: Union[str, None] = '0df547c985fe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add email tracking columns to usage_records."""
    op.add_column(
        'usage_records',
        sa.Column('warning_email_sent', sa.Boolean(), nullable=False, server_default=sa.false())
    )
    op.add_column(
        'usage_records',
        sa.Column('limit_email_sent', sa.Boolean(), nullable=False, server_default=sa.false())
    )


def downgrade() -> None:
    """Remove email tracking columns from usage_records."""
    op.drop_column('usage_records', 'limit_email_sent')
    op.drop_column('usage_records', 'warning_email_sent')
