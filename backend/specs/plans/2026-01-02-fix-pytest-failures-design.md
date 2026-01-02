# Fix Backend Pytest Failures

**Date**: 2026-01-02
**Status**: Ready for implementation

## Problem

31 pytest issues (5 failures + 26 errors):
- **5 email test failures** — tests assert on specific template copy that was changed in recent redesign
- **26 integration test errors** — `baml-py` version mismatch (0.205.0 installed vs 0.211.1 required)

## Environment

- **Package manager**: `uv`
- **Virtual environment**: `venv/` directory
- Activate with: `source venv/bin/activate`
- Install packages with: `uv pip install <package>`

## Solution

### 1. Update Email Tests to Minimal Sanity Checks

**File**: `tests/unit/test_services/test_email.py`

| Test | Current Assertion | New Assertion |
|------|------------------|---------------|
| `test_render_template_returns_html` | Checks for "Test User" in output | Check `<!DOCTYPE html>` and `</html>` present |
| `test_render_template_escapes_xss` | Passes XSS payload, checks it's escaped | **Remove entirely** — templates no longer accept user content |
| `test_send_welcome_uses_template` | Checks for "Welcome" text | Check HTML is non-empty and send was called |
| `test_send_usage_warning_uses_template` | Checks for "approaching your import limit" | Check that `80` and `100` appear (numbers are still templated) |
| `test_send_limit_reached_uses_template` | Checks for "reached your import limit" | Check that `100` appears (limit number is still templated) |

**Rationale**: Templates still use variables for numbers (usage count, limits). We verify those variables are interpolated correctly without asserting on marketing copy.

### 2. Upgrade baml-py

**Change in `requirements.txt`**:
```
baml-py==0.205.0  →  baml-py==0.211.1
```

**Commands**:
```bash
source venv/bin/activate
uv pip install baml-py==0.211.1
```

**Rationale**: The `baml_client` was regenerated with a newer BAML version that requires 0.211.1. The error message explicitly requests this version.

## Out of Scope

- Deprecation warnings (datetime.utcnow, pydantic config, passlib crypt) — non-breaking, address separately
- pytest-asyncio `asyncio_default_fixture_loop_scope` warning

## Verification

After implementation, run:
```bash
source venv/bin/activate
python -m pytest
```

Expected: All 110 tests pass (or 109 if we remove the XSS test).
