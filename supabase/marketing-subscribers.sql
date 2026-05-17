-- Marketing email subscribers captured from the storefront footer signup.
create table if not exists public.marketing_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'footer',
  created_at timestamptz not null default now()
);

-- Row-level security is enabled with no policies, so only the service-role
-- key (used by the /api/subscribe route) can read or write this table.
alter table public.marketing_subscribers enable row level security;
