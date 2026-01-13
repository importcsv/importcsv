"""Tests for trial configuration settings."""


def test_trial_duration_days_setting():
    """Config should have TRIAL_DURATION_DAYS setting."""
    from app.core.config import settings

    assert hasattr(settings, 'TRIAL_DURATION_DAYS')
    assert settings.TRIAL_DURATION_DAYS == 14


def test_trial_warning_days_setting():
    """Config should have TRIAL_WARNING_DAYS setting."""
    from app.core.config import settings

    assert hasattr(settings, 'TRIAL_WARNING_DAYS')
    assert settings.TRIAL_WARNING_DAYS == 3
