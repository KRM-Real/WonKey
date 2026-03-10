# WonKey

WonKey is a multi-tenant API key management platform for issuing keys, enforcing usage limits, and monitoring traffic through logs and analytics.

## Project Status

As of **March 6, 2026**, sprint implementation is complete (`Sprint 0-7` scope), and the project is in the **testing and polishing** phase.

- Implementation: complete
- Current focus: QA, bug fixes, UX cleanup, deployment hardening
- Next checkpoint: release/demo readiness

Full sprint breakdown: [sprints.md](./sprints.md)

## Tech Stack

- Backend: FastAPI, Supabase Python client, Redis
- Frontend: Next.js (App Router), React, TypeScript
- Data/Auth: Supabase (Postgres + Auth + RLS)
- Infra: Docker Compose (local Redis), Supabase SQL migrations

## Architecture Overview

- `apps/backend`: Admin API + API key auth + rate limiting + logging + analytics
- `apps/web`: Admin dashboard + server-side proxy routes (`/api/admin/*`)
- `infra/supabase`: schema migrations, RLS policies, seed files
- `infra/docker`: local Redis compose
- `docs`: architecture and security notes

Request flow (typical protected path):

1. Admin request hits backend route.
2. Middleware chain runs in order:
   - `AdminAuthMiddleware`
   - `ApiKeyAuthMiddleware`
   - `RateLimitMiddleware`
   - `RequestLoggerMiddleware`
3. Route handler executes service logic against Supabase/Redis.

## Implemented Features

### Backend

- Project management (`create`, `list`)
- API key lifecycle (`create`, `list`, `revoke`)
- API key verification via `Authorization: Bearer <key>`
- Redis-backed rate limiting (`INCR` + `EXPIRE`)
- Per-request logging with filterable logs endpoint
- Analytics endpoints (overview + hourly timeseries)
- Project limit configuration endpoints (`GET/PUT /limits`)

### Frontend

- Supabase auth (signup/login with session enforcement)
- Projects listing and project creation
- Project detail workspace tabs: Keys, Limits, Logs, Analytics
- Keys tab integrated with backend create/list/revoke
- Limits tab integrated with backend get/update limits
- Logs tab integrated with backend logs API + filters
- Analytics tab integrated with overview + timeseries APIs
- Server-side proxy handlers to avoid exposing admin secrets to browser clients

## Monorepo Structure

```text
.
|- apps/
|  |- backend/   # FastAPI service
|  `- web/       # Next.js dashboard
|- docs/         # Architecture and security notes
|- infra/
|  |- docker/    # Local Redis compose
|  `- supabase/  # SQL migrations, RLS, seed
`- sprints.md
```

## Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker (only if using local Redis)
- Supabase project credentials

### 1) Start Redis (optional but common in local dev)

```powershell
docker compose -f infra/docker/docker-compose.yml up -d
```

Use this when backend `REDIS_URL` points to `redis://localhost:6379/0`.

### 2) Run Backend

```powershell
cd apps/backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Create `apps/backend/.env` from `apps/backend/.env.example` and set at least:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `API_KEY_PEPPER`
- `DEFAULT_ORG_ID`
- `API_KEY_HMAC_SECRET`
- `REDIS_URL`
- `CORS_ORIGINS`
- `ADMIN_API_KEY`

Health checks:

- `GET http://127.0.0.1:8000/health`
- `GET http://127.0.0.1:8000/health/redis`

### 3) Run Frontend

```powershell
cd apps/web
npm install
copy .env.example .env.local
npm run dev
```

Set `apps/web/.env.local`:

- `WONKEY_API_BASE_URL=http://127.0.0.1:8000`
- `WONKEY_ADMIN_API_KEY=<admin key used by Next server routes>`
- `NEXT_PUBLIC_SUPABASE_URL=<supabase-url>`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>`

Open `http://localhost:3000`.

## API Reference (Current)

### Projects

- `POST /v1/projects`
- `GET /v1/projects`

### Keys

- `POST /v1/projects/{project_id}/keys`
- `GET /v1/projects/{project_id}/keys`
- `POST /v1/keys/{key_id}/revoke`

### Limits

- `GET /v1/projects/{project_id}/limits`
- `PUT /v1/projects/{project_id}/limits`

### Logs

- `GET /v1/projects/{project_id}/logs?status=&path=&from=&to=&limit=`

### Analytics

- `GET /v1/projects/{project_id}/analytics/overview?from=&to=`
- `GET /v1/projects/{project_id}/analytics/timeseries?bucket=hour&from=&to=`

## Testing

Current backend tests are under `apps/backend/tests` and use `unittest`.

```powershell
cd apps/backend
python -m unittest discover -s tests -p "test_*.py"
```

Web route/client checks are under `apps/web/tests`.

```powershell
cd apps/web
npm test
npx tsc --noEmit
```

Covered areas now include:

- Backend middleware: admin auth, API key auth, rate limiting, request logging
- Backend routes/services: projects, keys, limits, logs, analytics
- Backend config validation for non-dev secrets and unsafe dev overrides
- Web admin proxy routing and API client retry/error handling

## Security Notes

- Never place admin secrets in `NEXT_PUBLIC_*` variables.
- Keep backend secrets server-side only.
- Use Next server route handlers (`/api/admin/*`) as the browser-to-backend bridge.
- Keep RLS policies and org membership checks enabled outside local development shortcuts.

## Documentation

- Sprint plan: [sprints.md](./sprints.md)
- Release checklist: [docs/release-checklist.md](./docs/release-checklist.md)
- Backend app: [apps/backend](./apps/backend)
- Frontend app: [apps/web](./apps/web)
- Infra and SQL: [infra](./infra)
- Architecture notes: [docs](./docs)

## Current Priorities

1. Execute the release checklist against the target deployment environments.
2. Finish remaining UI polish around loading, fallback, and empty states.
3. Verify production env setup across frontend hosting, backend hosting, Redis, and Supabase.
4. Add higher-level end-to-end coverage once deployment targets are fixed.
