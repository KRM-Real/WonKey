-- 001_init.sql

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Orgs (workspaces)
create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Org members (user <-> org)
create table if not exists public.org_members (
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

-- API keys (store only hash + prefix)
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  key_prefix text not null,
  key_hash text not null,
  status text not null default 'active', -- active | revoked
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- Rate limit rules (simple MVP: per project)
create table if not exists public.rate_limit_rules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  requests_per_minute int not null default 60,
  created_at timestamptz not null default now()
);

-- Request logs
create table if not exists public.request_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  key_id uuid references public.api_keys(id) on delete set null,
  method text not null,
  path text not null,
  status_code int not null,
  latency_ms int not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_projects_org_id on public.projects(org_id);
create index if not exists idx_keys_project_id on public.api_keys(project_id);
create index if not exists idx_logs_project_created on public.request_logs(project_id, created_at desc);