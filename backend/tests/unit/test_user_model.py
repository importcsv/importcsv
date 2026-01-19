"""Tests for User model."""
from app.models.user import User


class TestUserSvixField:
    """Test svix_app_id field on User model."""

    def test_user_has_svix_app_id_field(self):
        """User model should have svix_app_id field."""
        user = User(
            email="test@example.com",
            svix_app_id="app_123abc"
        )
        assert user.svix_app_id == "app_123abc"

    def test_svix_app_id_defaults_to_none(self):
        """svix_app_id should default to None."""
        user = User(email="test@example.com")
        assert user.svix_app_id is None
