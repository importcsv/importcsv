"""remove_clerk_user_id_add_nextauth

Revision ID: dccd0fb1bf6b
Revises: 570a0729b2ea
Create Date: 2025-08-25 15:49:01.589243

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dccd0fb1bf6b'
down_revision: Union[str, None] = '570a0729b2ea'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove clerk_user_id column from users table."""
    # Drop the column and its index
    op.drop_index('ix_users_clerk_user_id', table_name='users')
    op.drop_column('users', 'clerk_user_id')


def downgrade() -> None:
    """Add clerk_user_id column back to users table."""
    # Re-add the column
    op.add_column('users', sa.Column('clerk_user_id', sa.String(), nullable=True))
    op.create_index('ix_users_clerk_user_id', 'users', ['clerk_user_id'], unique=True)
