"""add_importers_table

Revision ID: add_importers_table
Revises: 
Create Date: 2025-04-17

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid


# revision identifiers, used by Alembic.
revision = 'add_importers_table'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create importers table
    op.create_table('importers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(), nullable=False, index=True),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('fields', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    )
    
    # Add importer_id column to import_jobs table
    op.add_column('import_jobs', sa.Column('importer_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Create foreign key from import_jobs.importer_id to importers.id
    op.create_foreign_key('fk_import_jobs_importer_id', 'import_jobs', 'importers', ['importer_id'], ['id'])


def downgrade():
    # Drop foreign key
    op.drop_constraint('fk_import_jobs_importer_id', 'import_jobs', type_='foreignkey')
    
    # Drop importer_id column
    op.drop_column('import_jobs', 'importer_id')
    
    # Drop importers table
    op.drop_table('importers')
