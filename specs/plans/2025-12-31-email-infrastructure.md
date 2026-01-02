# Email Infrastructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate email templates to Jinja2, add welcome emails to signup flows, and wire usage warning/limit emails.

**Architecture:** Jinja2 templates with shared base layout. Welcome email triggered from OAuth and password signup. Usage emails triggered after import completion with boolean flags preventing duplicates.

**Tech Stack:** Python, Jinja2, FastAPI, SQLAlchemy, Alembic, Resend

---

## Progress

- [x] Task 1: Create email template directory structure
- [x] Task 2: Create base email template
- [x] Task 3: Create welcome email template
- [x] Task 4: Create usage warning email template
- [x] Task 5: Create limit reached email template
- [x] Task 6: Create upgrade confirmation email template
- [x] Task 7: Create grace period reminder email template
- [x] Task 8: Create subscription paused email template
- [x] Task 9: Add Jinja2 environment to EmailService
- [x] Task 10: Migrate send_welcome to use template
- [x] Task 11: Migrate send_usage_warning to use template
- [x] Task 12: Migrate send_limit_reached to use template
- [x] Task 13: Migrate send_upgrade_confirmation to use template
- [x] Task 14: Migrate send_grace_period_reminder to use template
- [x] Task 15: Migrate send_subscription_paused to use template
- [x] Task 16: Remove inline HTML templates from EmailService
- [x] Task 17: Add migration for usage email tracking columns
- [x] Task 18: Add welcome email to password registration
- [x] Task 19: Add welcome email to OAuth signup
- [x] Task 20: Add usage email trigger logic
- [x] Task 21: Wire usage emails into import flow
- [x] Task 22: Run full test suite and fix any issues
- [x] Task 23: Final verification and documentation

---

## Task 1: Create Email Template Directory Structure

**Files:**
- Create: `backend/app/templates/emails/` (directory)

**Step 1: Create the templates directory**

```bash
mkdir -p backend/app/templates/emails
```

**Step 2: Verify directory exists**

Run: `ls -la backend/app/templates/`
Expected: `emails/` directory present

**Step 3: Commit**

```bash
git add backend/app/templates/emails
git commit -m "chore: create email templates directory"
```

---

## Task 2: Create Base Email Template

**Files:**
- Create: `backend/app/templates/emails/base.html`

**Step 1: Write the base template**

Create `backend/app/templates/emails/base.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}ImportCSV{% endblock %}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            margin-bottom: 24px;
        }
        .content {
            margin-bottom: 24px;
        }
        .footer {
            font-size: 14px;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 16px;
            margin-top: 24px;
        }
        a {
            color: #0066cc;
        }
    </style>
</head>
<body>
    <div class="header">
        <strong>ImportCSV</strong>
    </div>
    <div class="content">
        {% block content %}{% endblock %}
    </div>
    <div class="footer">
        {% block footer %}
        <p>— The ImportCSV Team</p>
        {% endblock %}
    </div>
</body>
</html>
```

**Step 2: Commit**

```bash
git add backend/app/templates/emails/base.html
git commit -m "feat: add base email template with shared layout"
```

---

## Task 3: Create Welcome Email Template

**Files:**
- Create: `backend/app/templates/emails/welcome.html`

**Step 1: Write the welcome template**

Create `backend/app/templates/emails/welcome.html`:

```html
{% extends "base.html" %}

{% block title %}Welcome to ImportCSV{% endblock %}

{% block content %}
<h1>Welcome to ImportCSV!</h1>

{% if name %}
<p>Hi {{ name }},</p>
{% else %}
<p>Hi there,</p>
{% endif %}

<p>Thanks for signing up! You're ready to start importing CSV data into your applications.</p>

<p>Here's what you can do:</p>
<ul>
    <li>Create custom importers for your data</li>
    <li>Validate and transform data on import</li>
    <li>Embed importers directly in your app</li>
</ul>

<p>If you have any questions, just reply to this email.</p>
{% endblock %}
```

**Step 2: Commit**

```bash
git add backend/app/templates/emails/welcome.html
git commit -m "feat: add welcome email template"
```

---

## Task 4: Create Usage Warning Email Template

**Files:**
- Create: `backend/app/templates/emails/usage_warning.html`

**Step 1: Write the usage warning template**

Create `backend/app/templates/emails/usage_warning.html`:

```html
{% extends "base.html" %}

{% block title %}Usage Warning{% endblock %}

{% block content %}
<h1>You're approaching your import limit</h1>

<p>You've used <strong>{{ current_usage | int }}</strong> of your <strong>{{ limit | int }}</strong> monthly imports ({{ percentage | int }}%).</p>

<p>To continue importing without interruption, consider upgrading your plan.</p>

<p><a href="{{ app_url }}/settings/billing">View your usage &amp; upgrade options →</a></p>
{% endblock %}
```

**Step 2: Commit**

```bash
git add backend/app/templates/emails/usage_warning.html
git commit -m "feat: add usage warning email template"
```

---

## Task 5: Create Limit Reached Email Template

**Files:**
- Create: `backend/app/templates/emails/limit_reached.html`

**Step 1: Write the limit reached template**

Create `backend/app/templates/emails/limit_reached.html`:

```html
{% extends "base.html" %}

{% block title %}Import Limit Reached{% endblock %}

{% block content %}
<h1>You've reached your import limit</h1>

<p>You've used all <strong>{{ limit | int }}</strong> imports included in your plan this month.</p>

<p>To continue importing, you can:</p>
<ul>
    <li>Wait until your limit resets next month</li>
    <li>Upgrade to a higher tier for more imports</li>
</ul>

<p><a href="{{ app_url }}/settings/billing">Upgrade your plan →</a></p>
{% endblock %}
```

**Step 2: Commit**

```bash
git add backend/app/templates/emails/limit_reached.html
git commit -m "feat: add limit reached email template"
```

---

## Task 6: Create Upgrade Confirmation Email Template

**Files:**
- Create: `backend/app/templates/emails/upgrade_confirmation.html`

**Step 1: Write the upgrade confirmation template**

Create `backend/app/templates/emails/upgrade_confirmation.html`:

```html
{% extends "base.html" %}

{% block title %}Upgrade Confirmed{% endblock %}

{% block content %}
<h1>Welcome to {{ tier_name | e }}!</h1>

<p>Your upgrade is complete. Here's what's included in your new plan:</p>

<ul>
    {% if import_limit %}
    <li><strong>{{ import_limit | int }}</strong> imports per month</li>
    {% else %}
    <li><strong>Unlimited</strong> imports per month</li>
    {% endif %}
    {% if row_limit %}
    <li>Up to <strong>{{ row_limit | int }}</strong> rows per import</li>
    {% else %}
    <li><strong>Unlimited</strong> rows per import</li>
    {% endif %}
</ul>

<p>Your new limits are active immediately.</p>

<p><a href="{{ app_url }}/dashboard">Go to your dashboard →</a></p>
{% endblock %}
```

**Step 2: Commit**

```bash
git add backend/app/templates/emails/upgrade_confirmation.html
git commit -m "feat: add upgrade confirmation email template"
```

---

## Task 7: Create Grace Period Reminder Email Template

**Files:**
- Create: `backend/app/templates/emails/grace_period_reminder.html`

**Step 1: Write the grace period reminder template**

Create `backend/app/templates/emails/grace_period_reminder.html`:

```html
{% extends "base.html" %}

{% block title %}Payment Failed{% endblock %}

{% block content %}
<h1>We couldn't process your payment</h1>

<p>Your recent payment failed. You have <strong>{{ days_remaining }} day{% if days_remaining != 1 %}s{% endif %}</strong> to update your payment method before your subscription is paused.</p>

<p>During the grace period, you'll keep full access to your account.</p>

<p><a href="{{ app_url }}/settings/billing">Update payment method →</a></p>

<p>If you need help, just reply to this email.</p>
{% endblock %}
```

**Step 2: Commit**

```bash
git add backend/app/templates/emails/grace_period_reminder.html
git commit -m "feat: add grace period reminder email template"
```

---

## Task 8: Create Subscription Paused Email Template

**Files:**
- Create: `backend/app/templates/emails/subscription_paused.html`

**Step 1: Write the subscription paused template**

Create `backend/app/templates/emails/subscription_paused.html`:

```html
{% extends "base.html" %}

{% block title %}Subscription Paused{% endblock %}

{% block content %}
<h1>Your subscription has been paused</h1>

<p>Your grace period has ended and we couldn't collect payment. Your account has been moved to the Free tier.</p>

<p>You can still use ImportCSV with Free tier limits. To restore your full access, update your payment method.</p>

<p><a href="{{ app_url }}/settings/billing">Reactivate your subscription →</a></p>

<p>Your data is safe and waiting for you.</p>
{% endblock %}
```

**Step 2: Commit**

```bash
git add backend/app/templates/emails/subscription_paused.html
git commit -m "feat: add subscription paused email template"
```

---

## Task 9: Add Jinja2 Environment to Email Service

**Files:**
- Modify: `backend/app/services/email.py`
- Test: `backend/tests/unit/test_services/test_email.py`

**Step 1: Write failing test for Jinja2 rendering**

Create `backend/tests/unit/test_services/test_email.py`:

```python
import pytest
from unittest.mock import patch, MagicMock


class TestEmailServiceTemplates:
    """Tests for Jinja2 template rendering in EmailService."""

    def test_render_template_returns_html(self):
        """_render should return HTML string from template."""
        with patch("app.services.email.is_cloud_mode", return_value=True):
            with patch("app.services.email.settings") as mock_settings:
                mock_settings.RESEND_API_KEY = "test_key"
                mock_settings.RESEND_FROM_EMAIL = "test@example.com"
                mock_settings.APP_URL = "https://app.example.com"

                from app.services.email import EmailService

                service = EmailService()
                html = service._render("welcome.html", name="Test User")

                assert "Welcome to ImportCSV" in html
                assert "Test User" in html
                assert "<html" in html

    def test_render_template_escapes_xss(self):
        """_render should escape HTML in user input."""
        with patch("app.services.email.is_cloud_mode", return_value=True):
            with patch("app.services.email.settings") as mock_settings:
                mock_settings.RESEND_API_KEY = "test_key"
                mock_settings.RESEND_FROM_EMAIL = "test@example.com"
                mock_settings.APP_URL = "https://app.example.com"

                from app.services.email import EmailService

                service = EmailService()
                html = service._render("welcome.html", name="<script>alert('xss')</script>")

                assert "<script>" not in html
                assert "&lt;script&gt;" in html
```

**Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py -v`
Expected: FAIL with import error or method not found

**Step 3: Implement Jinja2 environment in EmailService**

Modify `backend/app/services/email.py` - add imports at top:

```python
from jinja2 import Environment, PackageLoader, select_autoescape
```

Add to `EmailService.__init__`:

```python
        # Initialize Jinja2 environment for email templates
        self.jinja_env = Environment(
            loader=PackageLoader("app", "templates/emails"),
            autoescape=select_autoescape(["html", "xml"])
        )
```

Add `_render` method to `EmailService`:

```python
    def _render(self, template_name: str, **context) -> str:
        """Render an email template with the given context."""
        template = self.jinja_env.get_template(template_name)
        # Add common context variables
        context.setdefault("app_url", settings.APP_URL)
        return template.render(**context)
```

**Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/email.py backend/tests/unit/test_services/test_email.py
git commit -m "feat: add Jinja2 template rendering to EmailService"
```

---

## Task 10: Migrate send_welcome to Use Template

**Files:**
- Modify: `backend/app/services/email.py`
- Modify: `backend/tests/unit/test_services/test_email.py`

**Step 1: Write failing test for send_welcome with template**

Add to `backend/tests/unit/test_services/test_email.py`:

```python
    def test_send_welcome_uses_template(self):
        """send_welcome should use the welcome.html template."""
        with patch("app.services.email.is_cloud_mode", return_value=True):
            with patch("app.services.email.settings") as mock_settings:
                mock_settings.RESEND_API_KEY = "test_key"
                mock_settings.RESEND_FROM_EMAIL = "test@example.com"
                mock_settings.APP_URL = "https://app.example.com"

                with patch("app.services.email.resend") as mock_resend:
                    mock_resend.Emails.send.return_value = {"id": "test"}

                    from app.services.email import EmailService

                    service = EmailService()
                    result = service.send_welcome("user@example.com", "Alice")

                    assert result is True
                    call_args = mock_resend.Emails.send.call_args
                    html = call_args[1]["html"]
                    assert "Welcome to ImportCSV" in html
                    assert "Alice" in html
```

**Step 2: Run test to verify current state**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py::TestEmailServiceTemplates::test_send_welcome_uses_template -v`

**Step 3: Update send_welcome to use template**

Replace the `send_welcome` method in `backend/app/services/email.py`:

```python
    def send_welcome(self, to_email: str, name: str | None = None) -> bool:
        """Send welcome email to new user."""
        html = self._render("welcome.html", name=name)
        return self._send(
            to=to_email,
            subject="Welcome to ImportCSV!",
            html=html
        )
```

**Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py::TestEmailServiceTemplates::test_send_welcome_uses_template -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/email.py backend/tests/unit/test_services/test_email.py
git commit -m "refactor: migrate send_welcome to use Jinja2 template"
```

---

## Task 11: Migrate send_usage_warning to Use Template

**Files:**
- Modify: `backend/app/services/email.py`
- Modify: `backend/tests/unit/test_services/test_email.py`

**Step 1: Write failing test**

Add to `backend/tests/unit/test_services/test_email.py`:

```python
    def test_send_usage_warning_uses_template(self):
        """send_usage_warning should use the usage_warning.html template."""
        with patch("app.services.email.is_cloud_mode", return_value=True):
            with patch("app.services.email.settings") as mock_settings:
                mock_settings.RESEND_API_KEY = "test_key"
                mock_settings.RESEND_FROM_EMAIL = "test@example.com"
                mock_settings.APP_URL = "https://app.example.com"

                with patch("app.services.email.resend") as mock_resend:
                    mock_resend.Emails.send.return_value = {"id": "test"}

                    from app.services.email import EmailService

                    service = EmailService()
                    result = service.send_usage_warning("user@example.com", 80, 100)

                    assert result is True
                    call_args = mock_resend.Emails.send.call_args
                    html = call_args[1]["html"]
                    assert "80" in html
                    assert "100" in html
                    assert "approaching your import limit" in html
```

**Step 2: Run test**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py::TestEmailServiceTemplates::test_send_usage_warning_uses_template -v`

**Step 3: Update send_usage_warning to use template**

Replace `send_usage_warning` in `backend/app/services/email.py`:

```python
    def send_usage_warning(self, to_email: str, current_usage: int, limit: int) -> bool:
        """Send usage warning email when approaching limit."""
        percentage = (current_usage / limit) * 100 if limit > 0 else 0
        html = self._render(
            "usage_warning.html",
            current_usage=current_usage,
            limit=limit,
            percentage=percentage
        )
        return self._send(
            to=to_email,
            subject="You're approaching your import limit",
            html=html
        )
```

**Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py::TestEmailServiceTemplates::test_send_usage_warning_uses_template -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/email.py backend/tests/unit/test_services/test_email.py
git commit -m "refactor: migrate send_usage_warning to use Jinja2 template"
```

---

## Task 12: Migrate send_limit_reached to Use Template

**Files:**
- Modify: `backend/app/services/email.py`
- Modify: `backend/tests/unit/test_services/test_email.py`

**Step 1: Write failing test**

Add to `backend/tests/unit/test_services/test_email.py`:

```python
    def test_send_limit_reached_uses_template(self):
        """send_limit_reached should use the limit_reached.html template."""
        with patch("app.services.email.is_cloud_mode", return_value=True):
            with patch("app.services.email.settings") as mock_settings:
                mock_settings.RESEND_API_KEY = "test_key"
                mock_settings.RESEND_FROM_EMAIL = "test@example.com"
                mock_settings.APP_URL = "https://app.example.com"

                with patch("app.services.email.resend") as mock_resend:
                    mock_resend.Emails.send.return_value = {"id": "test"}

                    from app.services.email import EmailService

                    service = EmailService()
                    result = service.send_limit_reached("user@example.com", 100)

                    assert result is True
                    call_args = mock_resend.Emails.send.call_args
                    html = call_args[1]["html"]
                    assert "100" in html
                    assert "reached your import limit" in html
```

**Step 2: Run test**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py::TestEmailServiceTemplates::test_send_limit_reached_uses_template -v`

**Step 3: Update send_limit_reached to use template**

Replace `send_limit_reached` in `backend/app/services/email.py`:

```python
    def send_limit_reached(self, to_email: str, limit: int) -> bool:
        """Send limit reached email when user hits their import limit."""
        html = self._render("limit_reached.html", limit=limit)
        return self._send(
            to=to_email,
            subject="You've reached your import limit",
            html=html
        )
```

**Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py::TestEmailServiceTemplates::test_send_limit_reached_uses_template -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/email.py backend/tests/unit/test_services/test_email.py
git commit -m "refactor: migrate send_limit_reached to use Jinja2 template"
```

---

## Task 13: Migrate send_upgrade_confirmation to Use Template

**Files:**
- Modify: `backend/app/services/email.py`
- Modify: `backend/tests/unit/test_services/test_email.py`

**Step 1: Write failing test**

Add to `backend/tests/unit/test_services/test_email.py`:

```python
    def test_send_upgrade_confirmation_uses_template(self):
        """send_upgrade_confirmation should use the upgrade_confirmation.html template."""
        with patch("app.services.email.is_cloud_mode", return_value=True):
            with patch("app.services.email.settings") as mock_settings:
                mock_settings.RESEND_API_KEY = "test_key"
                mock_settings.RESEND_FROM_EMAIL = "test@example.com"
                mock_settings.APP_URL = "https://app.example.com"

                with patch("app.services.email.resend") as mock_resend:
                    mock_resend.Emails.send.return_value = {"id": "test"}

                    from app.services.email import EmailService

                    service = EmailService()
                    result = service.send_upgrade_confirmation(
                        "user@example.com",
                        tier_name="Pro",
                        import_limit=500,
                        row_limit=100000
                    )

                    assert result is True
                    call_args = mock_resend.Emails.send.call_args
                    html = call_args[1]["html"]
                    assert "Pro" in html
                    assert "500" in html
```

**Step 2: Run test**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py::TestEmailServiceTemplates::test_send_upgrade_confirmation_uses_template -v`

**Step 3: Update send_upgrade_confirmation to use template**

Replace `send_upgrade_confirmation` in `backend/app/services/email.py`:

```python
    def send_upgrade_confirmation(
        self,
        to_email: str,
        tier_name: str,
        import_limit: int | None = None,
        row_limit: int | None = None
    ) -> bool:
        """Send upgrade confirmation email."""
        html = self._render(
            "upgrade_confirmation.html",
            tier_name=tier_name,
            import_limit=import_limit,
            row_limit=row_limit
        )
        return self._send(
            to=to_email,
            subject=f"Welcome to {tier_name}!",
            html=html
        )
```

**Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py::TestEmailServiceTemplates::test_send_upgrade_confirmation_uses_template -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/email.py backend/tests/unit/test_services/test_email.py
git commit -m "refactor: migrate send_upgrade_confirmation to use Jinja2 template"
```

---

## Task 14: Migrate send_grace_period_reminder to Use Template

**Files:**
- Modify: `backend/app/services/email.py`
- Modify: `backend/tests/unit/test_services/test_email.py`

**Step 1: Write failing test**

Add to `backend/tests/unit/test_services/test_email.py`:

```python
    def test_send_grace_period_reminder_uses_template(self):
        """send_grace_period_reminder should use the grace_period_reminder.html template."""
        with patch("app.services.email.is_cloud_mode", return_value=True):
            with patch("app.services.email.settings") as mock_settings:
                mock_settings.RESEND_API_KEY = "test_key"
                mock_settings.RESEND_FROM_EMAIL = "test@example.com"
                mock_settings.APP_URL = "https://app.example.com"

                with patch("app.services.email.resend") as mock_resend:
                    mock_resend.Emails.send.return_value = {"id": "test"}

                    from app.services.email import EmailService

                    service = EmailService()
                    result = service.send_grace_period_reminder("user@example.com", 3)

                    assert result is True
                    call_args = mock_resend.Emails.send.call_args
                    html = call_args[1]["html"]
                    assert "3" in html
                    assert "payment" in html.lower()
```

**Step 2: Run test**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py::TestEmailServiceTemplates::test_send_grace_period_reminder_uses_template -v`

**Step 3: Update send_grace_period_reminder to use template**

Replace `send_grace_period_reminder` in `backend/app/services/email.py`:

```python
    def send_grace_period_reminder(self, to_email: str, days_remaining: int) -> bool:
        """Send grace period reminder when payment fails."""
        html = self._render("grace_period_reminder.html", days_remaining=days_remaining)
        return self._send(
            to=to_email,
            subject="Action required: Update your payment method",
            html=html
        )
```

**Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py::TestEmailServiceTemplates::test_send_grace_period_reminder_uses_template -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/email.py backend/tests/unit/test_services/test_email.py
git commit -m "refactor: migrate send_grace_period_reminder to use Jinja2 template"
```

---

## Task 15: Migrate send_subscription_paused to Use Template

**Files:**
- Modify: `backend/app/services/email.py`
- Modify: `backend/tests/unit/test_services/test_email.py`

**Step 1: Write failing test**

Add to `backend/tests/unit/test_services/test_email.py`:

```python
    def test_send_subscription_paused_uses_template(self):
        """send_subscription_paused should use the subscription_paused.html template."""
        with patch("app.services.email.is_cloud_mode", return_value=True):
            with patch("app.services.email.settings") as mock_settings:
                mock_settings.RESEND_API_KEY = "test_key"
                mock_settings.RESEND_FROM_EMAIL = "test@example.com"
                mock_settings.APP_URL = "https://app.example.com"

                with patch("app.services.email.resend") as mock_resend:
                    mock_resend.Emails.send.return_value = {"id": "test"}

                    from app.services.email import EmailService

                    service = EmailService()
                    result = service.send_subscription_paused("user@example.com")

                    assert result is True
                    call_args = mock_resend.Emails.send.call_args
                    html = call_args[1]["html"]
                    assert "paused" in html.lower()
```

**Step 2: Run test**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py::TestEmailServiceTemplates::test_send_subscription_paused_uses_template -v`

**Step 3: Update send_subscription_paused to use template**

Replace `send_subscription_paused` in `backend/app/services/email.py`:

```python
    def send_subscription_paused(self, to_email: str) -> bool:
        """Send subscription paused email when grace period expires."""
        html = self._render("subscription_paused.html")
        return self._send(
            to=to_email,
            subject="Your subscription has been paused",
            html=html
        )
```

**Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py::TestEmailServiceTemplates::test_send_subscription_paused_uses_template -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/email.py backend/tests/unit/test_services/test_email.py
git commit -m "refactor: migrate send_subscription_paused to use Jinja2 template"
```

---

## Task 16: Remove Inline HTML Templates from EmailService

**Files:**
- Modify: `backend/app/services/email.py`

**Step 1: Run all email tests to ensure templates work**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py -v`
Expected: All tests PASS

**Step 2: Remove old inline HTML code**

Remove any remaining inline HTML template strings from the `send_*` methods. The methods should now only call `_render()`.

Also remove the `import html` if it's no longer used (XSS protection is now handled by Jinja2's autoescape).

**Step 3: Verify tests still pass**

Run: `cd backend && python -m pytest tests/unit/test_services/test_email.py -v`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add backend/app/services/email.py
git commit -m "refactor: remove inline HTML templates, now using Jinja2"
```

---

## Task 17: Add Migration for Usage Email Tracking Columns

**Files:**
- Create: `backend/alembic/versions/XXXX_add_usage_email_tracking.py`
- Modify: `backend/app/models/usage.py`

**Step 1: Update UsageRecord model with new columns**

Add to `UsageRecord` class in `backend/app/models/usage.py`:

```python
    # Email tracking to prevent duplicate emails per period
    warning_email_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    limit_email_sent: Mapped[bool] = mapped_column(Boolean, default=False)
```

**Step 2: Generate the migration**

Run: `cd backend && alembic revision --autogenerate -m "add usage email tracking columns"`

**Step 3: Review the generated migration**

Check the migration file in `backend/alembic/versions/` - it should add two boolean columns:
- `warning_email_sent` with default `False`
- `limit_email_sent` with default `False`

**Step 4: Run the migration**

Run: `cd backend && alembic upgrade head`
Expected: Migration applies successfully

**Step 5: Commit**

```bash
git add backend/app/models/usage.py backend/alembic/versions/
git commit -m "feat: add usage email tracking columns to UsageRecord"
```

---

## Task 18: Add Welcome Email to Password Registration

**Files:**
- Modify: `backend/app/api/v1/auth.py`
- Test: `backend/tests/unit/test_auth/test_registration.py`

**Step 1: Write failing test**

Create or update `backend/tests/unit/test_auth/test_registration.py`:

```python
import pytest
from unittest.mock import patch, MagicMock


class TestRegistrationWelcomeEmail:
    """Tests for welcome email on registration."""

    def test_register_sends_welcome_email(self):
        """Registration should send welcome email to new user."""
        with patch("app.api.v1.auth.email_service") as mock_email:
            mock_email.send_welcome.return_value = True

            # Create test user via registration endpoint
            # (Adjust based on your actual test setup)
            from fastapi.testclient import TestClient
            from app.main import app

            client = TestClient(app)
            response = client.post("/api/v1/auth/register", json={
                "email": "newuser@example.com",
                "password": "securepassword123",
                "full_name": "New User"
            })

            # Verify welcome email was called
            mock_email.send_welcome.assert_called_once_with(
                "newuser@example.com",
                "New User"
            )
```

**Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/unit/test_auth/test_registration.py -v`
Expected: FAIL (email not being sent)

**Step 3: Add welcome email to registration endpoint**

In `backend/app/api/v1/auth.py`, import the email service and add the send call:

Add import at top:
```python
from app.services.email import email_service
```

In the `register` endpoint, after creating and committing the user:
```python
    # Send welcome email
    email_service.send_welcome(user.email, user.full_name)
```

**Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/unit/test_auth/test_registration.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/v1/auth.py backend/tests/unit/test_auth/
git commit -m "feat: send welcome email on password registration"
```

---

## Task 19: Add Welcome Email to OAuth Signup

**Files:**
- Modify: `backend/app/api/v1/auth_oauth.py`
- Test: `backend/tests/unit/test_auth/test_oauth.py`

**Step 1: Write failing test**

Create or update `backend/tests/unit/test_auth/test_oauth.py`:

```python
import pytest
from unittest.mock import patch, MagicMock


class TestOAuthWelcomeEmail:
    """Tests for welcome email on OAuth signup."""

    def test_oauth_signup_sends_welcome_email(self):
        """New OAuth user should receive welcome email."""
        with patch("app.api.v1.auth_oauth.email_service") as mock_email:
            mock_email.send_welcome.return_value = True

            # Mock database to simulate new user creation
            mock_db = MagicMock()
            mock_db.query.return_value.filter.return_value.first.return_value = None  # No existing user

            from app.api.v1.auth_oauth import get_or_create_oauth_user

            user = get_or_create_oauth_user(
                db=mock_db,
                email="newuser@example.com",
                name="OAuth User",
                provider="google"
            )

            mock_email.send_welcome.assert_called_once_with(
                "newuser@example.com",
                "OAuth User"
            )

    def test_oauth_login_does_not_send_welcome_email(self):
        """Existing OAuth user should not receive welcome email."""
        with patch("app.api.v1.auth_oauth.email_service") as mock_email:
            mock_db = MagicMock()
            existing_user = MagicMock()
            existing_user.email = "existing@example.com"
            mock_db.query.return_value.filter.return_value.first.return_value = existing_user

            from app.api.v1.auth_oauth import get_or_create_oauth_user

            user = get_or_create_oauth_user(
                db=mock_db,
                email="existing@example.com",
                name="Existing User",
                provider="google"
            )

            mock_email.send_welcome.assert_not_called()
```

**Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/unit/test_auth/test_oauth.py -v`
Expected: FAIL

**Step 3: Add welcome email to OAuth signup**

In `backend/app/api/v1/auth_oauth.py`:

Add import at top:
```python
from app.services.email import email_service
```

Modify `get_or_create_oauth_user` to track new users and send welcome email:

```python
def get_or_create_oauth_user(db: Session, email: str, name: str | None, provider: str) -> User:
    user = db.query(User).filter(User.email == email).first()

    is_new_user = user is None

    if not user:
        user = User(
            email=email,
            full_name=name,
            # ... other fields
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Send welcome email for new users only
    if is_new_user:
        email_service.send_welcome(user.email, user.full_name)

    return user
```

**Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/unit/test_auth/test_oauth.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/api/v1/auth_oauth.py backend/tests/unit/test_auth/
git commit -m "feat: send welcome email on OAuth signup"
```

---

## Task 20: Add Usage Email Trigger Logic

**Files:**
- Modify: `backend/app/services/usage.py`
- Test: `backend/tests/unit/test_services/test_usage.py`

**Step 1: Write failing test for usage warning email**

Create or update `backend/tests/unit/test_services/test_usage.py`:

```python
import pytest
from unittest.mock import patch, MagicMock


class TestUsageEmailTriggers:
    """Tests for usage-based email triggers."""

    def test_usage_warning_sent_at_80_percent(self):
        """Warning email should be sent when usage hits 80%."""
        with patch("app.services.usage.email_service") as mock_email:
            mock_email.send_usage_warning.return_value = True

            mock_db = MagicMock()
            mock_user = MagicMock()
            mock_user.email = "user@example.com"
            mock_user.id = "user-123"

            mock_record = MagicMock()
            mock_record.import_count = 79  # Will become 80 after increment
            mock_record.warning_email_sent = False
            mock_record.limit_email_sent = False

            # Simulate 80% of 100 limit
            from app.services.usage import check_and_send_usage_emails

            check_and_send_usage_emails(
                db=mock_db,
                user=mock_user,
                record=mock_record,
                new_count=80,
                limit=100
            )

            mock_email.send_usage_warning.assert_called_once_with(
                "user@example.com", 80, 100
            )
            assert mock_record.warning_email_sent is True

    def test_limit_reached_email_sent_at_100_percent(self):
        """Limit reached email should be sent when usage hits 100%."""
        with patch("app.services.usage.email_service") as mock_email:
            mock_email.send_limit_reached.return_value = True

            mock_db = MagicMock()
            mock_user = MagicMock()
            mock_user.email = "user@example.com"

            mock_record = MagicMock()
            mock_record.import_count = 99
            mock_record.warning_email_sent = True  # Already sent warning
            mock_record.limit_email_sent = False

            from app.services.usage import check_and_send_usage_emails

            check_and_send_usage_emails(
                db=mock_db,
                user=mock_user,
                record=mock_record,
                new_count=100,
                limit=100
            )

            mock_email.send_limit_reached.assert_called_once_with(
                "user@example.com", 100
            )
            assert mock_record.limit_email_sent is True

    def test_no_duplicate_warning_email(self):
        """Warning email should not be sent twice."""
        with patch("app.services.usage.email_service") as mock_email:
            mock_db = MagicMock()
            mock_user = MagicMock()
            mock_user.email = "user@example.com"

            mock_record = MagicMock()
            mock_record.warning_email_sent = True  # Already sent
            mock_record.limit_email_sent = False

            from app.services.usage import check_and_send_usage_emails

            check_and_send_usage_emails(
                db=mock_db,
                user=mock_user,
                record=mock_record,
                new_count=85,
                limit=100
            )

            mock_email.send_usage_warning.assert_not_called()
```

**Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/unit/test_services/test_usage.py -v`
Expected: FAIL (function doesn't exist)

**Step 3: Implement check_and_send_usage_emails**

Add to `backend/app/services/usage.py`:

```python
from app.services.email import email_service


def check_and_send_usage_emails(
    db: Session,
    user: User,
    record: UsageRecord,
    new_count: int,
    limit: int | None
) -> None:
    """Check usage thresholds and send appropriate emails.

    Args:
        db: Database session
        user: User who performed the import
        record: The usage record for current period
        new_count: Updated usage count after increment
        limit: User's import limit (None for unlimited)
    """
    if limit is None:
        return  # No limit, no emails needed

    percentage = (new_count / limit) * 100

    # Send warning at 80% (once per period)
    if percentage >= 80 and not record.warning_email_sent:
        email_service.send_usage_warning(user.email, new_count, limit)
        record.warning_email_sent = True
        db.commit()

    # Send limit reached at 100% (once per period)
    if new_count >= limit and not record.limit_email_sent:
        email_service.send_limit_reached(user.email, limit)
        record.limit_email_sent = True
        db.commit()
```

**Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/unit/test_services/test_usage.py -v`
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/usage.py backend/tests/unit/test_services/test_usage.py
git commit -m "feat: add usage email trigger logic"
```

---

## Task 21: Wire Usage Emails into Import Flow

**Files:**
- Modify: `backend/app/services/usage.py`

**Step 1: Find where usage is incremented after imports**

Look at `check_and_increment_usage_for_user` function in `backend/app/services/usage.py`.

**Step 2: Add email trigger after increment**

Modify `check_and_increment_usage_for_user` to call `check_and_send_usage_emails`:

```python
def check_and_increment_usage_for_user(
    db: Session,
    user: User,
    rows: int
) -> tuple[bool, int, int | None]:
    """Check and increment usage for a user, sending emails at thresholds."""
    # ... existing logic to get record and increment ...

    record = get_or_create_usage_record(db, user.id)
    # ... increment logic ...

    limit_exceeded, new_count, limit = # ... existing return values

    # Send usage emails if approaching or at limit
    if not limit_exceeded:
        check_and_send_usage_emails(db, user, record, new_count, limit)

    return limit_exceeded, new_count, limit
```

**Step 3: Run usage tests**

Run: `cd backend && python -m pytest tests/unit/test_services/test_usage.py -v`
Expected: PASS

**Step 4: Commit**

```bash
git add backend/app/services/usage.py
git commit -m "feat: wire usage emails into import increment flow"
```

---

## Task 22: Run Full Test Suite and Fix Any Issues

**Files:**
- Various test files

**Step 1: Run all backend tests**

Run: `cd backend && python -m pytest -v`

**Step 2: Fix any failing tests**

If tests fail, investigate and fix. Common issues:
- Missing imports
- Mock setup issues
- Database state issues

**Step 3: Run type check**

Run: `cd backend && mypy app/`

**Step 4: Commit any fixes**

```bash
git add .
git commit -m "fix: address test failures from email infrastructure changes"
```

---

## Task 23: Final Verification and Documentation

**Files:**
- None (verification only)

**Step 1: Verify all templates render correctly**

Run a quick sanity check:
```bash
cd backend && python -c "
from app.services.email import EmailService
from unittest.mock import patch

with patch('app.services.email.is_cloud_mode', return_value=True):
    with patch('app.services.email.settings') as s:
        s.RESEND_API_KEY = 'test'
        s.RESEND_FROM_EMAIL = 'test@example.com'
        s.APP_URL = 'https://app.example.com'

        svc = EmailService()
        print('welcome:', 'OK' if 'Welcome' in svc._render('welcome.html', name='Test') else 'FAIL')
        print('warning:', 'OK' if 'approaching' in svc._render('usage_warning.html', current_usage=80, limit=100, percentage=80) else 'FAIL')
        print('limit:', 'OK' if 'reached' in svc._render('limit_reached.html', limit=100) else 'FAIL')
        print('upgrade:', 'OK' if 'Welcome to' in svc._render('upgrade_confirmation.html', tier_name='Pro', import_limit=500, row_limit=100000) else 'FAIL')
        print('grace:', 'OK' if 'payment' in svc._render('grace_period_reminder.html', days_remaining=3).lower() else 'FAIL')
        print('paused:', 'OK' if 'paused' in svc._render('subscription_paused.html').lower() else 'FAIL')
"
```

**Step 2: Run full test suite one more time**

Run: `cd backend && python -m pytest -v`
Expected: All tests PASS

**Step 3: Create final commit**

```bash
git add .
git commit -m "feat: complete email infrastructure migration to Jinja2 templates"
```

---

## Summary

This plan implements:

1. **Tasks 1-8**: Create Jinja2 email templates (base + 6 specific templates)
2. **Tasks 9-16**: Migrate EmailService to use Jinja2 with TDD
3. **Task 17**: Add database migration for email tracking columns
4. **Tasks 18-19**: Add welcome emails to signup flows
5. **Tasks 20-21**: Add usage warning/limit emails with trigger logic
6. **Tasks 22-23**: Full verification and cleanup

Each task follows TDD: write failing test → implement → verify pass → commit.
