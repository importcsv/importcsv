"""Add importer settings fields

Revision ID: cfc33c49d8e2
Revises: d84c4d80ac91
Create Date: 2025-04-17 16:18:46.821959

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cfc33c49d8e2'
down_revision: Union[str, None] = 'd84c4d80ac91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add webhook settings fields
    op.add_column('importers', sa.Column('webhook_url', sa.String(), nullable=True))
    op.add_column('importers', sa.Column('webhook_enabled', sa.Boolean(), server_default='true', nullable=False))
    
    # Add import settings fields
    op.add_column('importers', sa.Column('include_unmatched_columns', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('importers', sa.Column('filter_invalid_rows', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('importers', sa.Column('disable_on_invalid_rows', sa.Boolean(), server_default='false', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove import settings fields
    op.drop_column('importers', 'disable_on_invalid_rows')
    op.drop_column('importers', 'filter_invalid_rows')
    op.drop_column('importers', 'include_unmatched_columns')
    
    # Remove webhook settings fields
    op.drop_column('importers', 'webhook_enabled')
    op.drop_column('importers', 'webhook_url')
