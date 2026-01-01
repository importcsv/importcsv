#!/usr/bin/env python
"""
Test script to preview all email templates in console.

Usage:
    cd backend
    python scripts/test_all_emails.py
"""

import sys
import logging
from pathlib import Path

# Setup logging to see output
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s"
)

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Must set these before importing email service
import os
os.environ.setdefault("RESEND_API_KEY", "")  # Empty = dev mode
os.environ.setdefault("CLOUD_MODE", "false")

from app.services.email import EmailService


def main():
    logger = logging.getLogger(__name__)
    email_svc = EmailService()

    logger.info("")
    logger.info("=" * 60)
    logger.info("TESTING ALL EMAIL TEMPLATES")
    logger.info("=" * 60)

    # Test all emails
    logger.info("\n>>> [1/6] Welcome Email")
    email_svc.send_welcome("newuser@example.com", name="John Doe")

    logger.info("\n>>> [2/6] Usage Warning (80%)")
    email_svc.send_usage_warning("user@example.com", current_usage=80, limit=100)

    logger.info("\n>>> [3/6] Limit Reached (100%)")
    email_svc.send_limit_reached("user@example.com", limit=100)

    logger.info("\n>>> [4/6] Upgrade Confirmation")
    email_svc.send_upgrade_confirmation("user@example.com", tier_name="Pro", import_limit=500, row_limit=100000)

    logger.info("\n>>> [5/6] Grace Period Reminder")
    email_svc.send_grace_period_reminder("user@example.com", days_remaining=3)

    logger.info("\n>>> [6/6] Subscription Paused")
    email_svc.send_subscription_paused("user@example.com")

    logger.info("")
    logger.info("=" * 60)
    logger.info("DONE - All 6 email templates tested")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
