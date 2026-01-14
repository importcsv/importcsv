"""add_context_mapping_to_destinations

Revision ID: e30e05645eec
Revises: 84983636c78c
Create Date: 2026-01-14 08:42:44.191186

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e30e05645eec'
down_revision: Union[str, None] = '84983636c78c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('importer_destinations', sa.Column('context_mapping', sa.JSON(), nullable=False, server_default='{}'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('importer_destinations', 'context_mapping')
