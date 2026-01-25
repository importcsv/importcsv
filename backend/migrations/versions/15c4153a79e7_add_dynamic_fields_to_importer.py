"""add dynamic_fields to importer

Revision ID: 15c4153a79e7
Revises: ed181dc92d8a
Create Date: 2026-01-24 16:04:48.348387

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "15c4153a79e7"
down_revision: str | None = "ed181dc92d8a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "importers", sa.Column("dynamic_fields", sa.JSON(), nullable=False, server_default="[]")
    )
    # Remove server_default after column is created
    op.alter_column("importers", "dynamic_fields", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("importers", "dynamic_fields")
