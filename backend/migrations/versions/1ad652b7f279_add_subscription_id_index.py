"""add subscription_id index

Revision ID: 1ad652b7f279
Revises: 0c6675a4d57b
Create Date: 2025-12-30 15:18:05.683169

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1ad652b7f279'
down_revision: Union[str, None] = '0c6675a4d57b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add index for subscription_id lookups."""
    op.create_index('ix_users_subscription_id', 'users', ['subscription_id'], unique=True)


def downgrade() -> None:
    """Remove subscription_id index."""
    op.drop_index('ix_users_subscription_id', table_name='users')
