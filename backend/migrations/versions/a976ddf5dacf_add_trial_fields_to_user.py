"""add_trial_fields_to_user

Revision ID: a976ddf5dacf
Revises: 8274f580efc9
Create Date: 2026-01-13 10:49:56.480713

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a976ddf5dacf'
down_revision: Union[str, None] = '8274f580efc9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add trial tracking fields to users table."""
    op.add_column('users', sa.Column('trial_started_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('trial_ends_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('has_been_paying_customer', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('trial_warning_sent_at', sa.DateTime(timezone=True), nullable=True))

    # Backfill: Mark existing paying customers
    op.execute("""
        UPDATE users
        SET has_been_paying_customer = true
        WHERE subscription_status = 'active'
           OR subscription_tier IN ('pro', 'business')
    """)


def downgrade() -> None:
    """Remove trial tracking fields from users table."""
    op.drop_column('users', 'trial_warning_sent_at')
    op.drop_column('users', 'has_been_paying_customer')
    op.drop_column('users', 'trial_ends_at')
    op.drop_column('users', 'trial_started_at')
