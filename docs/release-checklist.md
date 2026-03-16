# Release Checklist

Use this checklist before a demo deployment or production-style release.

## 1. Environment

### Backend required settings

Set these in the backend host environment:

- `ENV=prod` or `ENV=staging`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `API_KEY_HMAC_SECRET`
- `API_KEY_PEPPER`
- `ADMIN_API_KEY`
- `REDIS_URL`
- `CORS_ORIGINS`

Notes:

- `API_KEY_PEPPER` must not be the default placeholder value.
- `DEV_DISABLE_ORG_MEMBERSHIP_CHECKS` must remain `false` outside local dev.
- `DEFAULT_ORG_ID` is only for local/dev shortcuts.

### Frontend required settings

Set these in the frontend host environment:

- `WONKEY_API_BASE_URL`
- `WONKEY_ADMIN_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Notes:

- `WONKEY_ADMIN_API_KEY` must match backend `ADMIN_API_KEY`.
- Never expose backend secrets via `NEXT_PUBLIC_*`.

## 2. Infrastructure

- Supabase project is reachable and the expected migrations are applied.
- Redis is reachable from the backend runtime.
- Backend CORS allows the deployed frontend origin.
- Frontend and backend point to the same Supabase project and intended backend base URL.

## 3. Automated Verification

Run these before deploy:

```powershell
cd apps/web
npx tsc --noEmit
```

Expected result:

- TypeScript check passes without errors.

## 4. Backend Smoke Tests

After backend deploy, verify:

- `GET /health` returns `200`.
- `GET /health/redis` returns `200`.
- Admin routes reject missing or invalid admin auth.
- Admin routes accept valid `ADMIN_API_KEY` plus `X-User-Id`.

Suggested checks:

- Create a project.
- Create an API key for that project.
- Revoke the key and confirm future protected requests fail.
- Fetch limits, update limits, and re-fetch to confirm persistence.
- Fetch logs and analytics for a project with known traffic.

## 5. Frontend Smoke Tests

After frontend deploy, verify this exact flow:

1. Sign in through `/login`.
2. Open `/projects`.
3. Create a project.
4. Open the project detail page.
5. Create an API key and copy the raw key.
6. Open Limits and save a changed limit.
7. Open Logs and apply filters.
8. Open Analytics and refresh the charts.
9. Revoke the created key.

Expected result:

- No admin secret appears in browser-visible config.
- Failed API actions show a visible error state.
- Proxy routes return data for the signed-in user session.

## 6. Demo Readiness

- Seed/demo data exists or a clean demo org is prepared.
- One scripted demo path is written down and timed.
- Fallback/demo-mode states are acceptable for the presentation.
- Known limitations are listed so they are not discovered live.

## 7. Rollback

Before release, define:

- How to revert frontend deployment.
- How to revert backend deployment.
- Which environment variables changed.
- Whether any Supabase migration needs a manual rollback plan.
