"""enable row level security

Revision ID: 8274f580efc9
Revises: 0f55805440a7
Create Date: 2026-01-02 17:01:42.106422

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8274f580efc9'
down_revision: Union[str, None] = '0f55805440a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Tables that need RLS enabled
# Note: alembic_version is excluded as it's internal to Alembic
TABLES = [
    'users',
    'importers',
    'import_jobs',
    'webhook_events',
    'usage_records',
    'processed_stripe_events',
]


def upgrade() -> None:
    """Enable Row Level Security on all tables.

    Since all database access goes through the backend using service_role key
    (which bypasses RLS), we enable RLS without any policies. This means:
    - service_role access: Full access (bypasses RLS)
    - anon/authenticated access: No access (RLS enabled, no permissive policies)

    This provides defense-in-depth security.
    """
    for table in TABLES:
        op.execute(f'ALTER TABLE {table} ENABLE ROW LEVEL SECURITY')
        op.execute(f'ALTER TABLE {table} FORCE ROW LEVEL SECURITY')


def downgrade() -> None:
    """Disable Row Level Security on all tables."""
    for table in TABLES:
        op.execute(f'ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY')
        op.execute(f'ALTER TABLE {table} DISABLE ROW LEVEL SECURITY')
