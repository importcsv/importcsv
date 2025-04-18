"""Merge multiple heads

Revision ID: d84c4d80ac91
Revises: add_importers_table, c55fae69d6b4
Create Date: 2025-04-17 16:18:38.290467

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd84c4d80ac91'
down_revision: Union[str, None] = ('add_importers_table', 'c55fae69d6b4')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
