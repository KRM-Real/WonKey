# WonKey — Sprints (API Key Management)

## Sprint 0 — Repo + Local Dev Setup
**Goal:** Get local dev working end-to-end.

**Backend**
- Create Python venv
- Install FastAPI + Uvicorn + pydantic-settings
- Add basic `GET /health`

**Infra**
- Add docker-compose with Redis (local)
- Add `.env.example` for backend

**Deliverables**
- `apps/backend/app/main.py` runs locally
- `GET /health` returns `{ "status": "ok" }`
- Redis container runs

**Acceptance**
- `uvicorn app.main:app --reload` works
- `docker compose up redis` works


## Sprint 1 — Supabase Schema + RLS
**Goal:** Multi-tenant data model in Supabase with RLS.

**DB (Supabase)**
- Tables:
  - `orgs`
  - `org_members`
  - `projects`
  - `api_keys`
  - `rate_limit_rules`
  - `request_logs`
  - `usage_rollups_hourly` (optional in this sprint)
- RLS:
  - Users can only access rows in orgs they belong to
  - Projects/keys/logs restricted by org membership

**Deliverables**
- SQL migrations in `infra/supabase/migrations/`
- `infra/supabase/rls_policies.sql`

**Acceptance**
- A signed-in user can’t read another org’s rows (verified in SQL editor)


## Sprint 2 — Admin API (Projects + Keys)
**Goal:** Let logged-in users manage projects and keys.

**Backend routes**
- `POST /v1/projects`
- `GET /v1/projects`
- `GET /v1/projects/{project_id}`
- `POST /v1/projects/{project_id}/keys`
- `GET /v1/projects/{project_id}/keys`
- `POST /v1/keys/{key_id}/revoke`

**Key rules**
- Generate raw key once
- Store only:
  - `key_prefix`
  - `key_hash` (hashed, not raw)
  - `status`
  - `scopes` (optional)
- Return raw key only on creation

**Deliverables**
- `services/key_service.py` handles generation + hashing
- Supabase client wired in `db/supabase.py`

**Acceptance**
- You can create a project
- You can create a key and see raw key once
- You can revoke a key and it stops working later


## Sprint 3 — Middleware: API Key Auth + Rate Limiting
**Goal:** Protect endpoints using API keys and enforce limits.

**Middleware**
- `api_key_auth.py`
  - Read `Authorization: Bearer <key>`
  - Validate key (hash + lookup)
  - Attach context to request: org_id, project_id, key_id
- `rate_limit.py`
  - Redis counter per key per time window
  - Configurable default limit (ex: 60 req/min)

**Deliverables**
- Middleware order:
  1) API key auth
  2) rate limit
  3) request logger (next sprint)
- `services/rate_limit_service.py` uses Redis INCR + EXPIRE

**Acceptance**
- Requests without key fail
- Revoked keys fail
- Rate limit triggers at the expected threshold


## Sprint 4 — Request Logging + Logs API
**Goal:** Store request logs and show them in the dashboard later.

**Logging**
- Capture:
  - ts, project_id, key_id
  - method, path
  - status_code, latency_ms
  - ip/user_agent (optional)
- Consider sampling if needed (ex: log 1 out of N)

**Backend routes**
- `GET /v1/projects/{project_id}/logs?status=&path=&from=&to=`

**Deliverables**
- `middleware/request_logger.py`
- `services/log_service.py`

**Acceptance**
- Every allowed request writes a log row
- Logs endpoint returns filtered results


## Sprint 5 — Analytics (Usage Charts)
**Goal:** Usage metrics that load fast.

**Approach**
- Start with simple queries on `request_logs` (MVP)
- Then add rollups for speed:
  - hourly buckets: requests, errors, p95 latency

**Backend routes**
- `GET /v1/projects/{project_id}/analytics/overview?from=&to=`
- `GET /v1/projects/{project_id}/analytics/timeseries?bucket=hour`

**Deliverables**
- `services/analytics_service.py`
- Optional table `usage_rollups_hourly`

**Acceptance**
- You can fetch requests-over-time and error rate
- Queries return in reasonable time for test data


## Sprint 6 — Frontend Dashboard (Next.js)
**Goal:** A usable dashboard for WonKey.

**Pages**
- Login / Signup (Supabase Auth)
- Projects list
- Project details tabs:
  - Keys
  - Limits
  - Logs
  - Analytics

**UI components**
- Keys table + create/revoke dialog
- Logs table with filters
- Charts for usage (timeseries + error rate)

**Acceptance**
- You can do the full flow from UI:
  - create project → create key → copy key → see logs + charts


## Sprint 7 — Deployment + Polishing
**Goal:** Public demo and production-style setup.

**Deploy**
- Vercel: Next.js
- Railway/Render: FastAPI
- Managed Redis (or Railway add-on)
- Supabase: prod project

**Polish**
- CORS rules
- API docs (OpenAPI tags + examples)
- Basic tests (middleware + key service)
- README: setup steps + architecture diagram

**Acceptance**
- Live URL works
- Demo flow works reliably
- README lets someone run it locally in < 10 minutes