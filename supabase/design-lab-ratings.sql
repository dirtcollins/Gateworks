-- Star ratings for the Design Lab concepts. Each row is one reviewer's score
-- for one concept at one scope ('overall' for the concept, or a page slug).
-- Multiple reviewers can score every concept and page and see each other's
-- votes.
create table if not exists public.design_lab_ratings (
  id uuid primary key default gen_random_uuid(),
  reviewer text not null,
  design_id text not null,
  scope text not null default 'overall',
  stars int not null check (stars between 1 and 5),
  updated_at timestamptz not null default now(),
  unique (reviewer, design_id, scope)
);

-- Row-level security is enabled with no policies, so only the service-role
-- key (used by the /api/design-lab/ratings route) can read or write.
alter table public.design_lab_ratings enable row level security;
