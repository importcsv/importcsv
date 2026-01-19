"""add_webhook_destinations

Revision ID: d284a29c464c
Revises: e30e05645eec
Create Date: 2026-01-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd284a29c464c'
down_revision: Union[str, None] = 'e30e05645eec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add webhook destination support.

    Adds:
    - destination_type column to importer_destinations (default 'supabase' for existing)
    - config JSON column to importer_destinations (default {} for existing)
    - svix_app_id column to users table for Svix webhook integration
    - Makes integration_id nullable (webhooks don't need an integration)
    """
    # Add destination_type with default for existing rows
    op.add_column(
        'importer_destinations',
        sa.Column('destination_type', sa.String(50), nullable=False, server_default='supabase')
    )

    # Add config JSON column
    op.add_column(
        'importer_destinations',
        sa.Column('config', sa.JSON(), nullable=False, server_default='{}')
    )

    # Make integration_id nullable (webhooks don't need an integration)
    op.alter_column(
        'importer_destinations',
        'integration_id',
        existing_type=sa.UUID(),
        nullable=True
    )

    # Add svix_app_id to users for webhook delivery
    op.add_column(
        'users',
        sa.Column('svix_app_id', sa.String(255), nullable=True)
    )
    op.create_index('ix_users_svix_app_id', 'users', ['svix_app_id'])


def downgrade() -> None:
    """Remove webhook destination support."""
    # Remove svix_app_id from users
    op.drop_index('ix_users_svix_app_id', table_name='users')
    op.drop_column('users', 'svix_app_id')

    # Make integration_id NOT NULL again (need to handle existing NULL values)
    # Note: This will fail if there are webhook destinations with NULL integration_id
    op.alter_column(
        'importer_destinations',
        'integration_id',
        existing_type=sa.UUID(),
        nullable=False
    )

    # Remove config column
    op.drop_column('importer_destinations', 'config')

    # Remove destination_type column
    op.drop_column('importer_destinations', 'destination_type')
