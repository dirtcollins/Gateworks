-- Gateworks Demand Tracking + Reorder Intelligence.
-- Apply after the Phase 1/2 schema files.

do $$
begin
  create type public.product_demand_event_type as enum (
    'viewed',
    'searched',
    'added_to_cart',
    'added_to_quote',
    'added_to_invoice',
    'ordered',
    'cancelled',
    'refunded',
    'restock_requested',
    'marked_unavailable'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.demand_level as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.reorder_urgency as enum ('none', 'watch', 'soon', 'urgent', 'critical');
exception when duplicate_object then null;
end $$;

create table if not exists public.product_demand_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_slug text,
  sku text,
  event_type public.product_demand_event_type not null,
  quantity integer not null default 1 check (quantity >= 0),
  unit_price numeric(12, 2),
  site_user_id text references public.site_users(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.reorder_rules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  product_slug text,
  sku text,
  supplier_id uuid references public.suppliers(id) on delete set null,
  minimum_stock integer not null default 0 check (minimum_stock >= 0),
  target_stock integer not null default 0 check (target_stock >= 0),
  supplier_lead_time_days integer not null default 7 check (supplier_lead_time_days >= 0),
  seasonal_multiplier numeric(6, 3) not null default 1 check (seasonal_multiplier > 0),
  is_seasonal boolean not null default false,
  discontinued boolean not null default false,
  override_recommendation boolean not null default false,
  override_quantity integer check (override_quantity is null or override_quantity >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (variant_id),
  unique (sku)
);

create table if not exists public.reorder_recommendations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  product_slug text,
  sku text,
  demand_score integer not null check (demand_score between 0 and 100),
  demand_level public.demand_level not null,
  reorder_urgency public.reorder_urgency not null,
  current_stock integer not null default 0,
  quantity_available integer not null default 0,
  average_weekly_sales numeric(12, 2) not null default 0,
  weeks_of_supply numeric(12, 2),
  supplier_lead_time_days integer not null default 0,
  recommended_reorder_quantity integer not null default 0,
  expected_stockout_date date,
  minimum_stock integer not null default 0,
  target_stock integer not null default 0,
  formula_inputs jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  unique (variant_id),
  unique (sku)
);

create table if not exists public.purchasing_notes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  product_slug text,
  sku text,
  note text not null,
  decision text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

drop trigger if exists reorder_rules_set_updated_at on public.reorder_rules;
create trigger reorder_rules_set_updated_at
before update on public.reorder_rules
for each row execute function public.set_updated_at();

create index if not exists product_demand_events_variant_time_idx
  on public.product_demand_events(variant_id, occurred_at desc);

create index if not exists product_demand_events_slug_time_idx
  on public.product_demand_events(product_slug, occurred_at desc);

create index if not exists product_demand_events_type_time_idx
  on public.product_demand_events(event_type, occurred_at desc);

create index if not exists reorder_recommendations_urgency_idx
  on public.reorder_recommendations(reorder_urgency, demand_score desc);

create index if not exists purchasing_notes_sku_created_idx
  on public.purchasing_notes(sku, created_at desc);

alter table public.product_demand_events enable row level security;
alter table public.reorder_rules enable row level security;
alter table public.reorder_recommendations enable row level security;
alter table public.purchasing_notes enable row level security;

drop policy if exists "Public can insert demand events" on public.product_demand_events;
create policy "Public can insert demand events"
on public.product_demand_events for insert
to anon, authenticated
with check (true);

drop policy if exists "Staff can read demand events" on public.product_demand_events;
create policy "Staff can read demand events"
on public.product_demand_events for select
to authenticated
using (public.is_staff() or public.is_admin());

drop policy if exists "Staff can manage reorder rules" on public.reorder_rules;
create policy "Staff can manage reorder rules"
on public.reorder_rules for all
to authenticated
using (public.is_staff() or public.is_admin())
with check (public.is_staff() or public.is_admin());

drop policy if exists "Staff can read reorder recommendations" on public.reorder_recommendations;
create policy "Staff can read reorder recommendations"
on public.reorder_recommendations for select
to authenticated
using (public.is_staff() or public.is_admin());

drop policy if exists "Staff can manage reorder recommendations" on public.reorder_recommendations;
create policy "Staff can manage reorder recommendations"
on public.reorder_recommendations for all
to authenticated
using (public.is_staff() or public.is_admin())
with check (public.is_staff() or public.is_admin());

drop policy if exists "Staff can manage purchasing notes" on public.purchasing_notes;
create policy "Staff can manage purchasing notes"
on public.purchasing_notes for all
to authenticated
using (public.is_staff() or public.is_admin())
with check (public.is_staff() or public.is_admin());

grant insert on public.product_demand_events to anon, authenticated;
grant select on public.product_demand_events to authenticated;
grant select, insert, update, delete on public.reorder_rules, public.reorder_recommendations, public.purchasing_notes to authenticated;
