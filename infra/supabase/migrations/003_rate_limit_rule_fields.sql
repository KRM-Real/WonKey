alter table public.rate_limit_rules
  add column if not exists window_seconds int not null default 60,
  add column if not exists burst int not null default 0,
  add column if not exists updated_at timestamptz not null default now();
