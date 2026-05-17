-- B2B volume / contractor pricing tiers. Each rule grants a percentage
-- discount for a pricing tier, optionally scoped to a product category and a
-- minimum line quantity. companies.pricing_tier selects which rules apply.
create table if not exists public.price_tier_rules (
  id uuid primary key default gen_random_uuid(),
  tier text not null,
  category_slug text,
  discount_pct numeric(5, 2) not null default 0
    check (discount_pct >= 0 and discount_pct <= 100),
  min_quantity integer not null default 1 check (min_quantity >= 1),
  created_at timestamptz not null default now()
);

create index if not exists price_tier_rules_tier_idx
  on public.price_tier_rules (tier);

-- Row-level security on; only the service role (used by the order API and
-- admin tooling) reads or writes pricing rules.
alter table public.price_tier_rules enable row level security;

-- Example seed rules (safe to edit or remove):
insert into public.price_tier_rules (tier, category_slug, discount_pct, min_quantity)
values
  ('contractor', null, 5, 1),
  ('contractor', null, 10, 25),
  ('wholesale', null, 12, 1),
  ('wholesale', null, 18, 25)
on conflict do nothing;
