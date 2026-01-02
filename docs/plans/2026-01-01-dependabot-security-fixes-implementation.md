# Dependabot Security Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 18 open Dependabot security alerts across backend, frontend, admin, and docs.

**Architecture:** Sequential updates by location, testing after each change. Backend first (isolated), then frontend dev deps, then admin/docs Next.js updates.

**Tech Stack:** Python (pip/uv), Node.js (npm), Next.js, Vite, Vitest

---

## Task 1: Backend - Update urllib3

**Files:**
- Modify: `backend/requirements.txt:110`

**Step 1: Update urllib3 version**

Change line 110 from:
```
urllib3==2.4.0
```
to:
```
urllib3==2.6.2
```

**Step 2: Verify pip resolution**

Run: `cd backend && uv pip install -r requirements.txt --dry-run`
Expected: No conflicts, urllib3 2.6.2 resolves

**Step 3: Commit**

```bash
git add backend/requirements.txt
git commit -m "fix(backend): update urllib3 to 2.6.2 for CVE fixes"
```

---

## Task 2: Backend - Update starlette

**Files:**
- Modify: `backend/requirements.txt:99`

**Step 1: Update starlette version**

Change line 99 from:
```
starlette==0.46.2
```
to:
```
starlette==0.50.0
```

**Step 2: Verify pip resolution**

Run: `cd backend && uv pip install -r requirements.txt --dry-run`
Expected: No conflicts, starlette 0.50.0 resolves

**Step 3: Commit**

```bash
git add backend/requirements.txt
git commit -m "fix(backend): update starlette to 0.50.0 for CVE-2025-DoS fix"
```

---

## Task 3: Backend - Update filelock

**Files:**
- Modify: `backend/requirements.txt:31`

**Step 1: Update filelock version**

Change line 31 from:
```
filelock==3.18.0
```
to:
```
filelock==3.20.1
```

**Step 2: Verify pip resolution**

Run: `cd backend && uv pip install -r requirements.txt --dry-run`
Expected: No conflicts, filelock 3.20.1 resolves

**Step 3: Commit**

```bash
git add backend/requirements.txt
git commit -m "fix(backend): update filelock to 3.20.1 for TOCTOU race fix"
```

---

## Task 4: Backend - Install and Test

**Step 1: Install updated dependencies**

Run: `cd backend && uv pip install -r requirements.txt`
Expected: All packages install successfully

**Step 2: Run backend tests**

Run: `cd backend && uv run pytest -x -q`
Expected: All tests pass

**Step 3: Verify app starts**

Run: `cd backend && timeout 5 uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 || true`
Expected: App starts without import errors (will timeout after 5s, that's OK)

---

## Task 5: Frontend - Update happy-dom

**Files:**
- Modify: `frontend/package.json:132`

**Step 1: Update happy-dom version**

Change line 132 from:
```json
    "happy-dom": "^19.0.2",
```
to:
```json
    "happy-dom": "^20.0.11",
```

**Step 2: Commit**

```bash
git add frontend/package.json
git commit -m "fix(frontend): update happy-dom to 20.0.11 for RCE fix"
```

---

## Task 6: Frontend - Update vite

**Files:**
- Modify: `frontend/package.json:151`

**Step 1: Update vite version**

Change line 151 from:
```json
    "vite": "^7.1.3",
```
to:
```json
    "vite": "^7.3.0",
```

**Step 2: Commit**

```bash
git add frontend/package.json
git commit -m "fix(frontend): update vite to 7.3.0 for path bypass fix"
```

---

## Task 7: Frontend - Add npm overrides for transitive deps

**Files:**
- Modify: `frontend/package.json` (add after line 169, before closing brace)

**Step 1: Add overrides section**

Add before the final `}`:
```json
  "overrides": {
    "glob": "^11.0.0",
    "js-yaml": "^4.1.1"
  }
```

The file should end with:
```json
  },
  "overrides": {
    "glob": "^11.0.0",
    "js-yaml": "^4.1.1"
  }
}
```

**Step 2: Commit**

```bash
git add frontend/package.json
git commit -m "fix(frontend): add overrides for glob and js-yaml security fixes"
```

---

## Task 8: Frontend - Install and Test

**Step 1: Install updated dependencies**

Run: `cd frontend && rm -rf node_modules package-lock.json && npm install`
Expected: All packages install, no errors

**Step 2: Run frontend build**

Run: `cd frontend && npm run build`
Expected: All 3 builds succeed (react, preact, bundled)

**Step 3: Run frontend tests**

Run: `cd frontend && npm test`
Expected: All vitest tests pass

**Step 4: Commit lock file**

```bash
git add frontend/package-lock.json
git commit -m "chore(frontend): update package-lock.json after security updates"
```

---

## Task 9: Admin - Update Next.js

**Files:**
- Modify: `admin/package.json:37`

**Step 1: Update next version**

Change line 37 from:
```json
    "next": "^15.3.6",
```
to:
```json
    "next": "^15.5.9",
```

**Step 2: Commit**

```bash
git add admin/package.json
git commit -m "fix(admin): update next.js to 15.5.9 for security fixes"
```

---

## Task 10: Admin - Install and Build

**Step 1: Install updated dependencies**

Run: `cd admin && npm install`
Expected: All packages install, no errors

**Step 2: Run admin build**

Run: `cd admin && npm run build`
Expected: Next.js build succeeds

**Step 3: Commit lock file**

```bash
git add admin/package-lock.json
git commit -m "chore(admin): update package-lock.json after next.js update"
```

---

## Task 11: Docs - Update Next.js and Fumadocs

**Files:**
- Modify: `docs/package.json:15-17,19`

**Step 1: Update package versions**

Change lines 15-17 and 19 from:
```json
    "fumadocs-core": "15.7.1",
    "fumadocs-mdx": "11.8.0",
    "fumadocs-ui": "15.7.1",
    "geist": "^1.4.2",
    "next": "^15.5.7",
```
to:
```json
    "fumadocs-core": "^16.4.2",
    "fumadocs-mdx": "^14.2.4",
    "fumadocs-ui": "^16.4.2",
    "geist": "^1.4.2",
    "next": "^15.5.9",
```

**Step 2: Commit**

```bash
git add docs/package.json
git commit -m "fix(docs): update next.js and fumadocs for security fixes"
```

---

## Task 12: Docs - Install and Build

**Step 1: Install updated dependencies**

Run: `cd docs && npm install`
Expected: All packages install, no errors

**Step 2: Run docs build**

Run: `cd docs && npm run build`
Expected: Next.js/Fumadocs build succeeds

**Step 3: Commit lock file**

```bash
git add docs/package-lock.json
git commit -m "chore(docs): update package-lock.json after security updates"
```

---

## Task 13: Verify Dependabot Alerts Resolved

**Step 1: Push changes**

Run: `git push origin main`
Expected: Push succeeds

**Step 2: Check remaining alerts (after ~5 min)**

Run: `gh api repos/importcsv/importcsv/dependabot/alerts --jq '[.[] | select(.state == "open")] | length'`
Expected: 0 (or significantly reduced)

**Step 3: List any remaining alerts**

Run: `gh api repos/importcsv/importcsv/dependabot/alerts --jq '.[] | select(.state == "open") | {package: .security_vulnerability.package.name, severity: .security_advisory.severity}'`
Expected: Empty or only low-priority items
