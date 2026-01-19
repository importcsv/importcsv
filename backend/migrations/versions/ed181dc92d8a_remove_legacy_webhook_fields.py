"""remove_legacy_webhook_fields

Revision ID: ed181dc92d8a
Revises: d2540ec919e2
Create Date: 2026-01-18 21:37:52.872953

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ed181dc92d8a"
down_revision: str | None = "d2540ec919e2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column("importers", "webhook_url")
    op.drop_column("importers", "webhook_enabled")
    op.drop_column("importers", "include_data_in_webhook")
    op.drop_column("importers", "webhook_data_sample_size")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column("importers", sa.Column("webhook_url", sa.String(2048), nullable=True))
    op.add_column("importers", sa.Column("webhook_enabled", sa.Boolean(), server_default="true"))
    op.add_column(
        "importers", sa.Column("include_data_in_webhook", sa.Boolean(), server_default="true")
    )
    op.add_column(
        "importers", sa.Column("webhook_data_sample_size", sa.Integer(), server_default="10")
    )
