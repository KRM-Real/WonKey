# WonKey Web (Sprint 6B)

Frontend shell for WonKey with:
- Supabase Login/Signup scaffold (`/login`)
- Projects list + create project (`/projects`)
- Project detail tabs (`/projects/[projectId]?tab=keys|limits|logs|analytics`)
- Keys tab integrated with backend create/list/revoke endpoints
- Logs tab integrated with backend logs endpoint + filters
- Analytics tab integrated with backend overview + hourly timeseries
- Limits tab remains scaffolded

## Run

1. Install dependencies:
```bash
npm install
```
2. Create env file:
```bash
cp .env.example .env.local
```
3. Set values in `.env.local`:
- `WONKEY_API_BASE_URL` -> backend base URL (server-side)
- `WONKEY_ADMIN_API_KEY` -> admin API key sent by server proxy route handlers
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> for login/signup page

4. Start:
```bash
npm run dev
```

## Notes

- Frontend API calls go through Next route handlers under `/api/admin/*`, so backend/admin keys stay server-side.
- Logs and Analytics go through Next route handlers under `/api/admin/projects/[projectId]/*`.
