import pytest
from sqlalchemy.orm import Session

from app.models.importer import Importer


class TestDynamicFieldsColumn:
    """Tests for dynamic_fields column on Importer model."""

    @pytest.mark.unit
    def test_importer_has_dynamic_fields_column(self):
        """Importer model should have dynamic_fields JSON column."""
        importer = Importer(
            name="Test",
            fields=[{"name": "field1", "type": "text"}],
            dynamic_fields=[{"name": "custom1", "type": "text"}],
        )
        assert importer.dynamic_fields == [{"name": "custom1", "type": "text"}]

    @pytest.mark.unit
    def test_importer_dynamic_fields_defaults_to_empty_list(self, db_session: Session, test_user):
        """dynamic_fields should default to empty list when persisted."""
        importer = Importer(
            user_id=test_user.id,
            name="Test",
            fields=[{"name": "field1", "type": "text"}],
        )
        db_session.add(importer)
        db_session.commit()
        db_session.refresh(importer)

        assert importer.dynamic_fields == []
