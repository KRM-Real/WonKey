-- 002_rls.sql

-- Enable RLS
alter table public.orgs enable row level security;
alter table public.org_members enable row level security;
alter table public.projects enable row level security;
alter table public.api_keys enable row level security;
alter table public.rate_limit_rules enable row level security;
alter table public.request_logs enable row level security;

-- Helper: check membership
create or replace function public.is_org_member(_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = _org_id and m.user_id = auth.uid()
  );
$$;

-- orgs: user can read orgs they belong to
create policy "orgs_select_member"
on public.orgs
for select
using (public.is_org_member(id));

-- org_members: user can read their org memberships
create policy "org_members_select_self"
on public.org_members
for select
using (user_id = auth.uid());

-- projects: member can CRUD within org
create policy "projects_select_member"
on public.projects
for select
using (public.is_org_member(org_id));

create policy "projects_insert_member"
on public.projects
for insert
with check (public.is_org_member(org_id));

create policy "projects_update_member"
on public.projects
for update
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

create policy "projects_delete_member"
on public.projects
for delete
using (public.is_org_member(org_id));

-- api_keys: access via project -> org
create policy "keys_select_member"
on public.api_keys
for select
using (
  exists (
    select 1
    from public.projects p
    where p.id = api_keys.project_id
      and public.is_org_member(p.org_id)
  )
);

create policy "keys_insert_member"
on public.api_keys
for insert
with check (
  exists (
    select 1
    from public.projects p
    where p.id = api_keys.project_id
      and public.is_org_member(p.org_id)
  )
);

create policy "keys_update_member"
on public.api_keys
for update
using (
  exists (
    select 1
    from public.projects p
    where p.id = api_keys.project_id
      and public.is_org_member(p.org_id)
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = api_keys.project_id
      and public.is_org_member(p.org_id)
  )
);

create policy "keys_delete_member"
on public.api_keys
for delete
using (
  exists (
    select 1
    from public.projects p
    where p.id = api_keys.project_id
      and public.is_org_member(p.org_id)
  )
);

-- rate_limit_rules: access via project -> org
create policy "limits_select_member"
on public.rate_limit_rules
for select
using (
  exists (
    select 1
    from public.projects p
    where p.id = rate_limit_rules.project_id
      and public.is_org_member(p.org_id)
  )
);

create policy "limits_upsert_member"
on public.rate_limit_rules
for all
using (
  exists (
    select 1
    from public.projects p
    where p.id = rate_limit_rules.project_id
      and public.is_org_member(p.org_id)
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = rate_limit_rules.project_id
      and public.is_org_member(p.org_id)
  )
);

-- request_logs: read via project -> org
create policy "logs_select_member"
on public.request_logs
for select
using (
  exists (
    select 1
    from public.projects p
    where p.id = request_logs.project_id
      and public.is_org_member(p.org_id)
  )
);

-- logs insert will be done by backend service role (bypasses RLS),
-- so we don't need an insert policy for anon/auth users.