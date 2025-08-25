"""add_dark_mode_to_importer

Revision ID: 570a0729b2ea
Revises: 61e4ddf31732
Create Date: 2025-08-25 10:49:34.471926

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '570a0729b2ea'
down_revision: Union[str, None] = '61e4ddf31732'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add dark_mode column to importers table
    op.add_column('importers', sa.Column('dark_mode', sa.Boolean(), nullable=True))
    
    # Set default value for existing rows
    op.execute("UPDATE importers SET dark_mode = false WHERE dark_mode IS NULL")
    
    # Make the column non-nullable after setting defaults
    op.alter_column('importers', 'dark_mode', nullable=False, server_default='false')


def downgrade() -> None:
    """Downgrade schema."""
    # Remove dark_mode column from importers table
    op.drop_column('importers', 'dark_mode')
