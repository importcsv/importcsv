"""add billing fields to user

Revision ID: 0c6675a4d57b
Revises: 27b7808262f1
Create Date: 2025-12-30 15:08:59.895023

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0c6675a4d57b'
down_revision: Union[str, None] = '27b7808262f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add billing fields to users table."""
    op.add_column('users', sa.Column('stripe_customer_id', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('subscription_id', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('subscription_tier', sa.String(20), server_default='free', nullable=False))
    op.add_column('users', sa.Column('subscription_status', sa.String(20), server_default='active', nullable=False))
    op.add_column('users', sa.Column('grace_period_ends_at', sa.DateTime(timezone=True), nullable=True))

    # Add index for Stripe customer lookup
    op.create_index('ix_users_stripe_customer_id', 'users', ['stripe_customer_id'], unique=True)


def downgrade() -> None:
    """Remove billing fields from users table."""
    op.drop_index('ix_users_stripe_customer_id', table_name='users')
    op.drop_column('users', 'grace_period_ends_at')
    op.drop_column('users', 'subscription_status')
    op.drop_column('users', 'subscription_tier')
    op.drop_column('users', 'subscription_id')
    op.drop_column('users', 'stripe_customer_id')
