"""Add token blacklist table

Revision ID: add_token_blacklist
Revises: 
Create Date: 2025-04-24

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


# revision identifiers, used by Alembic.
revision = 'add_token_blacklist'
down_revision = '98f92bc3f715'  # Updated to depend on the previous migration
branch_labels = None
depends_on = None


def upgrade():
    # Check if token_blacklist table exists
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'token_blacklist' not in tables:
        # Create token_blacklist table
        op.create_table('token_blacklist',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            sa.Column('token_id', sa.String(), nullable=False, index=True, unique=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
        )
        
        # Check if index exists before creating it
        indexes = inspector.get_indexes('token_blacklist')
        index_names = [index['name'] for index in indexes]
        
        if 'ix_token_blacklist_token_id' not in index_names:
            # Create index on token_id for faster lookups
            op.create_index(op.f('ix_token_blacklist_token_id'), 'token_blacklist', ['token_id'], unique=True)
    else:
        print("Table 'token_blacklist' already exists, skipping creation")


def downgrade():
    # Check if token_blacklist table exists before dropping
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'token_blacklist' in tables:
        # Check if index exists before dropping it
        indexes = inspector.get_indexes('token_blacklist')
        index_names = [index['name'] for index in indexes]
        
        if 'ix_token_blacklist_token_id' in index_names:
            # Drop index
            op.drop_index(op.f('ix_token_blacklist_token_id'), table_name='token_blacklist')
        
        # Drop table
        op.drop_table('token_blacklist')
