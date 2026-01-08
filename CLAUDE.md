# ImportCSV

AI-powered CSV importer for React apps. Two modes:
- **Local Mode**: Frontend-only, runs in browser
- **Backend Mode**: Adds AI column mapping, natural language transforms, background processing

Monorepo: `frontend/` (npm package) → `backend/` (FastAPI API) → `admin/` (Next.js dashboard)

## Architecture

```
frontend/    → @importcsv/react npm package (React/Preact component)
backend/     → FastAPI + PostgreSQL + Redis (AI features, background jobs)
admin/       → Next.js dashboard (importer configuration UI)
docs/        → Documentation site (Fumadocs)
```

**Data flow**: User's app loads frontend component → (optional) calls backend API → admin configures importers

**Key insight**: Frontend is a *library* published to npm, not a standalone app. The admin dashboard consumes it for previews.

## Development

```bash
docker-compose up -d          # Start all services (postgres, redis, backend, worker, admin)
docker-compose logs -f admin  # Follow logs for specific service
```

| Service | URL | Purpose |
|---------|-----|---------|
| admin | localhost:3000 | Dashboard UI |
| backend | localhost:8000 | API (Swagger at /docs) |
| postgres | localhost:5432 | Database |
| redis | localhost:6379 | Queue & cache |

## Verification

**Frontend** (`cd frontend/`):
```bash
npm run typecheck && npm test
```

**Backend** (`cd backend/`):
```bash
uv run ruff check . && uv run ruff format --check . && uv run pytest
```

**Admin** (`cd admin/`):
```bash
npm run lint && npm run build
```

Note: Backend uses `uv` for Python environment management. Run `uv sync` after pulling to update dependencies.

## Gotchas

**After model changes** → Run migrations:
```bash
cd backend && uv run alembic upgrade head
```

**After changing BAML prompts** → Regenerate client:
```bash
cd backend && uv run baml-cli generate
```

**After frontend changes** → Rebuild and push to admin:
```bash
cd frontend && npm run yalc:publish
cd admin && npm run yalc:update
```

## Context Management Rules

NEVER auto-compact. I will manage context manually.
When context exceeds 70%, warn me immediately.
Include a "Context: XX%" note in your responses when above 50%.
