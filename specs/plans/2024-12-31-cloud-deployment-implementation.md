# ImportCSV Cloud Deployment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up CI/CD for deploying ImportCSV Cloud to Porter and automate NPM publishing.

**Architecture:** GitHub Actions workflows triggered on push to main (Porter deploy) and tag push (NPM publish). Porter pre-deploy job runs migrations automatically.

**Tech Stack:** GitHub Actions, Porter CLI, NPM

---

## Progress Tracker

| Task | Status | Commit | Notes |
|------|--------|--------|-------|
| 1: Porter Backend Workflow | ⬜ Pending | | |
| 2: Porter Admin Workflow | ⬜ Pending | | |
| 3: NPM Publish Workflow | ⬜ Pending | | |
| 4: Docker Compose Cleanup | ⬜ Pending | | |
| 5: Update Design Doc | ⬜ Pending | | |

---

## Task 1: Create Porter Backend Workflow

**Files:**
- Create: `.github/workflows/porter-backend.yml`

**Step 1: Create the workflow file**

Create `.github/workflows/porter-backend.yml`:

```yaml
name: Deploy Backend to Porter

on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'
      - '.github/workflows/porter-backend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set Github tag
        id: vars
        run: echo "sha_short=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT

      - name: Setup Porter
        uses: porter-dev/setup-porter@v0.1.0

      - name: Deploy to Porter
        timeout-minutes: 30
        run: exec porter apply
        env:
          PORTER_APP_NAME: importcsv-backend
          PORTER_CLUSTER: ${{ secrets.PORTER_CLUSTER_ID }}
          PORTER_DEPLOYMENT_TARGET_ID: ${{ secrets.PORTER_DEPLOYMENT_TARGET_ID }}
          PORTER_HOST: https://dashboard.porter.run
          PORTER_PROJECT: ${{ secrets.PORTER_PROJECT_ID }}
          PORTER_TAG: ${{ steps.vars.outputs.sha_short }}
          PORTER_TOKEN: ${{ secrets.PORTER_TOKEN }}
```

**Step 2: Verify syntax**

Run:
```bash
cd /Users/abhishekray/Projects/importcsv/importcsv && cat .github/workflows/porter-backend.yml
```

Expected: File contents displayed without errors.

**Step 3: Commit**

```bash
git add .github/workflows/porter-backend.yml
git commit -m "$(cat <<'EOF'
ci: add Porter backend deployment workflow

Deploys backend to Porter on push to main when backend/ changes.
Uses GitHub secrets for Porter credentials.
EOF
)"
```

---

## Task 2: Create Porter Admin Workflow

**Files:**
- Create: `.github/workflows/porter-admin.yml`

**Step 1: Create the workflow file**

Create `.github/workflows/porter-admin.yml`:

```yaml
name: Deploy Admin to Porter

on:
  push:
    branches:
      - main
    paths:
      - 'admin/**'
      - 'frontend/**'
      - '.github/workflows/porter-admin.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set Github tag
        id: vars
        run: echo "sha_short=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT

      - name: Setup Porter
        uses: porter-dev/setup-porter@v0.1.0

      - name: Deploy to Porter
        timeout-minutes: 30
        run: exec porter apply
        env:
          PORTER_APP_NAME: importcsv-admin
          PORTER_CLUSTER: ${{ secrets.PORTER_CLUSTER_ID }}
          PORTER_DEPLOYMENT_TARGET_ID: ${{ secrets.PORTER_DEPLOYMENT_TARGET_ID }}
          PORTER_HOST: https://dashboard.porter.run
          PORTER_PROJECT: ${{ secrets.PORTER_PROJECT_ID }}
          PORTER_TAG: ${{ steps.vars.outputs.sha_short }}
          PORTER_TOKEN: ${{ secrets.PORTER_TOKEN }}
```

**Step 2: Verify syntax**

Run:
```bash
cat .github/workflows/porter-admin.yml
```

Expected: File contents displayed without errors.

**Step 3: Commit**

```bash
git add .github/workflows/porter-admin.yml
git commit -m "$(cat <<'EOF'
ci: add Porter admin deployment workflow

Deploys admin dashboard to Porter on push to main when admin/ or frontend/ changes.
EOF
)"
```

---

## Task 3: Create NPM Publish Workflow

**Files:**
- Create: `.github/workflows/npm-publish.yml`

**Step 1: Create the workflow file**

Create `.github/workflows/npm-publish.yml`:

```yaml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Build React package
        working-directory: frontend
        run: npm run build:react

      - name: Build Preact package
        working-directory: frontend
        run: npm run build:preact

      - name: Publish to NPM
        working-directory: frontend
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Step 2: Verify syntax**

Run:
```bash
cat .github/workflows/npm-publish.yml
```

Expected: File contents displayed without errors.

**Step 3: Commit**

```bash
git add .github/workflows/npm-publish.yml
git commit -m "$(cat <<'EOF'
ci: add NPM publish workflow

Publishes csv-import-react to NPM on version tag push.
Usage: npm version patch && git push && git push --tags
EOF
)"
```

---

## Task 4: Clean Up Docker Compose

**Files:**
- Modify: `docker-compose.yml`

**Step 1: Remove NEXTAUTH environment variables**

In `docker-compose.yml`, find the admin service environment section (around lines 86-92) and remove:

```yaml
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-key-at-least-32-characters-long
```

The admin environment section should become:

```yaml
    environment:
      - NODE_ENV=development
      - FRONTEND_WATCH=true
      - BACKEND_URL=http://backend:8000
      - NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

**Step 2: Verify docker-compose is valid**

Run:
```bash
docker-compose config > /dev/null && echo "Valid"
```

Expected: `Valid`

**Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "$(cat <<'EOF'
chore: remove deprecated NEXTAUTH env vars from docker-compose

Auth now uses backend-driven cookies, NEXTAUTH not needed.
EOF
)"
```

---

## Task 5: Update Design Doc

**Files:**
- Modify: `specs/plans/2024-12-31-cloud-deployment-design.md`

**Step 1: Update the Clerk Cleanup section**

Replace the Clerk Cleanup section with:

```markdown
## Clerk Cleanup

**Status: Already complete in main repo**

The auth migration has been fully implemented. No Clerk code exists in `admin/src/` or `backend/app/`.

Remaining Clerk references (documentation only, no action needed):
- `docs/` - Historical mentions in comparison docs
- `backend/migrations/` - Historical migration files (keep for DB compatibility)
- `specs/` - Design documentation
```

**Step 2: Commit**

```bash
git add specs/plans/2024-12-31-cloud-deployment-design.md
git commit -m "$(cat <<'EOF'
docs: update deployment design to reflect completed auth migration
EOF
)"
```

---

## Post-Implementation: GitHub Secrets Setup

After merging, add these secrets to GitHub repo settings:

| Secret | Description | Where to get |
|--------|-------------|--------------|
| `PORTER_TOKEN` | Porter API token | Porter Dashboard → Settings → API Tokens |
| `PORTER_PROJECT_ID` | Porter project ID | Porter Dashboard URL (e.g., `/p/13628`) |
| `PORTER_CLUSTER_ID` | Porter cluster ID | Porter Dashboard → Infrastructure |
| `PORTER_DEPLOYMENT_TARGET_ID` | Deployment target | Porter Dashboard → App → Settings |
| `NPM_TOKEN` | NPM automation token | npmjs.com → Access Tokens → Generate |

---

## Summary

This plan creates:
1. **Porter backend workflow** - Deploys on backend/ changes
2. **Porter admin workflow** - Deploys on admin/ or frontend/ changes
3. **NPM publish workflow** - Publishes on version tags
4. **Docker compose cleanup** - Removes deprecated NEXTAUTH vars
5. **Design doc update** - Reflects actual repo state

Total: 5 tasks, ~15 minutes implementation time.
