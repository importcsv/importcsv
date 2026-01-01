# Dependabot Security Fixes Plan

**Date:** 2026-01-01
**Goal:** Fix all 18 open Dependabot security alerts, prioritized by severity

## Overview

**Strategy:**
- Fix in order: Critical → High → Medium
- Group by ecosystem (npm vs pip) and location
- Test after each group of changes

**Affected locations:**

| Location | Changes |
|----------|---------|
| `backend/` | Update urllib3, starlette, filelock |
| `frontend/` | Update happy-dom, glob, vite, js-yaml (dev deps) |
| `admin/` | Update next |
| `docs/` | Update next, fumadocs packages |

**Execution order:**
1. Backend (Python) - isolated, easy to test
2. Frontend (dev deps) - run tests to verify
3. Admin (Next.js) - verify build works
4. Docs (Next.js + fumadocs) - verify build works

---

## Section 1: Backend Updates (Python)

**Packages to update in `backend/requirements.txt`:**

| Package | Current | Action |
|---------|---------|--------|
| urllib3 | 2.4.0 | Update to latest 2.x |
| starlette | 0.46.2 | Update to latest 0.46.x or 0.47.x |
| filelock | 3.18.0 | Update to latest 3.x |

**Steps:**
1. Check latest patched versions for each package
2. Update versions in `requirements.txt`
3. Run `uv pip install -r requirements.txt` to verify resolution
4. Run backend tests (`pytest`)
5. Verify the app starts (`uvicorn`)

**Risk assessment:**
- **urllib3** - Low risk, patch updates are stable
- **starlette** - Medium risk, FastAPI depends on it but minor updates usually safe
- **filelock** - Low risk, simple utility package

---

## Section 2: Frontend Dev Dependency Updates

**Packages to update in `frontend/package.json`:**

| Package | Current | Severity | Action |
|---------|---------|----------|--------|
| happy-dom | 19.0.2 | Critical | Update to latest |
| glob | 10.4.5 (transitive) | High | Update via @vitest/coverage-v8 |
| vite | 7.1.3 | Medium | Update to latest 7.x |
| js-yaml | 4.1.0 (transitive) | Medium | Update via eslint or add override |

**Steps:**
1. Update direct dev deps: `npm update happy-dom vite --save-dev`
2. Check if glob/js-yaml are fixed transitively
3. If not, add `overrides` in package.json for remaining transitive deps
4. Run `npm run build` (all three builds: react, preact, bundled)
5. Run `npm test` to verify vitest still works with new happy-dom

**Notes:**
- `glob` comes through `@vitest/coverage-v8` → `test-exclude`
- `js-yaml` comes through `eslint` → `@eslint/eslintrc`
- May need npm overrides if parent packages haven't updated

---

## Section 3: Admin Next.js Update

**Package to update in `admin/package.json`:**

| Package | Current | Action |
|---------|---------|--------|
| next | ^15.3.6 | Update to latest 15.x |

**Steps:**
1. Run `npm update next`
2. Run `npm run build` to verify no breaking changes
3. Briefly test the app locally if possible

---

## Section 4: Docs Updates (Next.js + Fumadocs)

**Packages to update in `docs/package.json`:**

| Package | Current | Action |
|---------|---------|--------|
| next | ^15.5.7 | Update to latest 15.x |
| fumadocs-core | 15.7.1 | Update to latest |
| fumadocs-mdx | 11.8.0 | Update to latest |
| fumadocs-ui | 15.7.1 | Update to latest |

**Steps:**
1. Run `npm update next fumadocs-core fumadocs-mdx fumadocs-ui`
2. Verify mdast-util-to-hast is updated transitively
3. Run `npm run build` to verify docs still build
4. Spot-check a few pages render correctly

---

## Section 5: Verification & Completion

**After all updates, verify alerts are resolved:**

```bash
gh api repos/importcsv/importcsv/dependabot/alerts \
  --jq '[.[] | select(.state == "open")] | length'
```

**Testing checklist:**
- [ ] Backend: `pytest` passes
- [ ] Backend: App starts with `uvicorn`
- [ ] Frontend: `npm run build` succeeds (all 3 builds)
- [ ] Frontend: `npm test` passes
- [ ] Admin: `npm run build` succeeds
- [ ] Docs: `npm run build` succeeds

**Git strategy - one commit per location:**
1. `fix(backend): update urllib3, starlette, filelock for security patches`
2. `fix(frontend): update dev dependencies for security patches`
3. `fix(admin): update next.js for security patches`
4. `fix(docs): update next.js and fumadocs for security patches`

**Expected outcome:** All 18 open alerts resolved.
