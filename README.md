# WonKey

WonKey is a multi-tenant API key management platform with:
- FastAPI backend (projects, keys, auth middleware, rate limiting)
- Next.js dashboard frontend
- Supabase for data + auth
- Redis for rate limiting

## Current Status

- Sprint 0 to Sprint 3: implemented
- Sprint 6A (frontend-first shell): implemented
- Sprint 4, Sprint 5, Sprint 6B: planned next

Sprint plan lives in [sprints.md](/c:/Users/realk/Desktop/WonKey/sprints.md).

## Monorepo Structure

- `apps/backend` - FastAPI API
- `apps/web` - Next.js dashboard
- `infra/docker` - local Redis compose
- `infra/supabase` - SQL migrations, RLS policies, seed files
- `docs` - architecture/security notes (in progress)

## Features Implemented

### Backend
- Project and API key admin endpoints
- API key generation and secure hash storage
- API key auth middleware (`Authorization: Bearer <key>`)
- Redis-based rate limit middleware (`INCR` + `EXPIRE`)
- Request context injection (`org_id`, `project_id`, `key_id`)

### Frontend (Sprint 6A)
- Login/signup scaffold page (Supabase client)
- Projects list + create project
- Project detail tabs: Keys, Limits, Logs, Analytics
- Keys tab wired (create/list/revoke)
- Logs/Analytics placeholder states
- Server-side `/api/admin/*` proxy routes to keep backend/admin secrets off browser client

## Local Setup

Requirements:
- Python 3.11+
- Node.js 20+
- Docker (only needed if using local Redis)
- Supabase project credentials

## 1) Run Backend

From repo root:

```powershell
cd apps/backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Configure `apps/backend/.env` (example keys):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEFAULT_ORG_ID`
- `API_KEY_HMAC_SECRET`
- `REDIS_URL` (example: `redis://localhost:6379/0`)

Health checks:
- `GET http://127.0.0.1:8000/health`
- `GET http://127.0.0.1:8000/health/redis`

## 2) Run Frontend

In a second terminal:

```powershell
cd apps/web
npm install
copy .env.example .env.local
npm run dev
```

Set `apps/web/.env.local`:
- `WONKEY_API_BASE_URL=http://127.0.0.1:8000`
- `WONKEY_ADMIN_API_KEY=<optional/admin key for protected routes>`
- `NEXT_PUBLIC_SUPABASE_URL=<supabase-url>`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>`

Open:
- `http://localhost:3000`

## 3) Is Docker Required?

- `Yes` if your backend points to local Redis (`redis://localhost:6379/0`)
- `No` if you use managed/external Redis

Start local Redis:

```powershell
docker compose -f infra/docker/docker-compose.yml up -d
```

## Security Notes

- Do not expose backend admin keys through `NEXT_PUBLIC_*`.
- Keep backend secrets in server-side env vars only.
- Frontend calls backend admin APIs through server route handlers (`/api/admin/*`).

## API Snapshot (Implemented)

- `POST /v1/projects`
- `GET /v1/projects`
- `POST /v1/projects/{project_id}/keys`
- `GET /v1/projects/{project_id}/keys`
- `POST /v1/keys/{key_id}/revoke`

## Next Milestones

1. Sprint 4: request logger middleware + logs API
2. Sprint 5: analytics endpoints (overview + timeseries)
3. Sprint 6B: wire Logs/Analytics tabs to live backend data
4. Sprint 7: deployment + polish
