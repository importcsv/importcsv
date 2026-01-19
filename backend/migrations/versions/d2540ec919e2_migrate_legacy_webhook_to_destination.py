"""migrate_legacy_webhook_to_destination

Revision ID: d2540ec919e2
Revises: f672aa83af9a
Create Date: 2026-01-18 21:33:00.947071

"""
import json
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd2540ec919e2'
down_revision: Union[str, None] = 'f672aa83af9a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Migrate legacy webhook_url configurations to destination records."""
    # Get connection for data migration
    conn = op.get_bind()

    # Find importers with webhook_enabled=true AND webhook_url set
    # that don't already have a destination
    result = conn.execute(sa.text("""
        SELECT i.id, i.webhook_url
        FROM importers i
        LEFT JOIN importer_destinations d ON i.id = d.importer_id
        WHERE i.webhook_enabled = true
          AND i.webhook_url IS NOT NULL
          AND i.webhook_url != ''
          AND d.id IS NULL
    """))

    importers_to_migrate = result.fetchall()

    for importer_id, webhook_url in importers_to_migrate:
        destination_id = str(uuid.uuid4())
        config = json.dumps({"webhook_url": webhook_url})

        conn.execute(sa.text("""
            INSERT INTO importer_destinations (id, importer_id, destination_type, config, column_mapping, context_mapping, created_at, updated_at)
            VALUES (:id, :importer_id, 'webhook', :config, :column_mapping, :context_mapping, NOW(), NOW())
        """), {
            "id": destination_id,
            "importer_id": str(importer_id),
            "config": config,
            "column_mapping": "{}",
            "context_mapping": "{}",
        })

    print(f"Migrated {len(importers_to_migrate)} legacy webhook configurations to destination records")


def downgrade() -> None:
    """Cannot safely downgrade - destination records would be orphaned."""
    pass
