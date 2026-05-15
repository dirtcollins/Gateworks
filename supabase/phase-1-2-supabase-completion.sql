-- Gateworks Phase 1 + Phase 2 Supabase completion.
-- Apply this after supabase/schema.sql and supabase/operating-system-schema.sql.
-- It adds the fields/tables required by the local-first Phase 2 checkout, order,
-- saved cart, account, catalog, and inventory UI so those workflows can persist.

create extension if not exists pgcrypto;

alter table public.orders add column if not exists site_user_id text references public.site_users(id) on delete set null;
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists company_name text;
alter table public.orders add column if not exists email text;
alter table public.orders add column if not exists phone text;
alter table public.orders add column if not exists requested_date date;
alter table public.orders add column if not exists requested_window text;
alter table public.orders add column if not exists job_name text;
alter table public.orders add column if not exists jobsite_address jsonb not null default '{}'::jsonb;
alter table public.orders add column if not exists payment_status public.payment_status not null default 'unpaid';
alter table public.orders add column if not exists is_quote_request boolean not null default false;

alter table public.order_items add column if not exists item_payload jsonb not null default '{}'::jsonb;

alter table public.saved_carts add column if not exists site_user_id text references public.site_users(id) on delete cascade;
alter table public.saved_carts add column if not exists job_name text;
alter table public.saved_carts add column if not exists updated_at timestamptz not null default now();

create table if not exists public.saved_cart_items (
  id uuid primary key default gen_random_uuid(),
  saved_cart_id uuid not null references public.saved_carts(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  sku text not null,
  title text not null,
  image_url text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  item_options jsonb not null default '{}'::jsonb,
  item_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_saved_jobsites (
  id uuid primary key default gen_random_uuid(),
  site_user_id text references public.site_users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  label text not null,
  contact_name text,
  contact_phone text,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  delivery_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_drawing_uploads (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  site_user_id text references public.site_users(id) on delete set null,
  file_name text not null,
  file_size integer not null check (file_size >= 0),
  file_type text not null,
  storage_path text,
  public_url text,
  created_at timestamptz not null default now()
);

drop trigger if exists saved_carts_set_updated_at on public.saved_carts;
create trigger saved_carts_set_updated_at
before update on public.saved_carts
for each row execute function public.set_updated_at();

drop trigger if exists customer_saved_jobsites_set_updated_at on public.customer_saved_jobsites;
create trigger customer_saved_jobsites_set_updated_at
before update on public.customer_saved_jobsites
for each row execute function public.set_updated_at();

create index if not exists orders_site_user_created_idx on public.orders(site_user_id, created_at desc);
create index if not exists orders_payment_status_idx on public.orders(payment_status, created_at desc);
create index if not exists saved_carts_site_user_idx on public.saved_carts(site_user_id, updated_at desc);
create index if not exists saved_cart_items_saved_cart_idx on public.saved_cart_items(saved_cart_id);
create index if not exists customer_saved_jobsites_site_user_idx on public.customer_saved_jobsites(site_user_id);
create index if not exists customer_drawing_uploads_order_idx on public.customer_drawing_uploads(order_id);
create index if not exists customer_drawing_uploads_site_user_idx on public.customer_drawing_uploads(site_user_id, created_at desc);

alter table public.saved_cart_items enable row level security;
alter table public.customer_saved_jobsites enable row level security;
alter table public.customer_drawing_uploads enable row level security;

drop policy if exists "Public can create checkout orders" on public.orders;
create policy "Public can create checkout orders"
on public.orders for insert
to anon, authenticated
with check (true);

drop policy if exists "Site users can read their checkout orders" on public.orders;
create policy "Checkout orders are read through service routes"
on public.orders for select
to anon, authenticated
using (false);

drop policy if exists "Public can create checkout order items" on public.order_items;
create policy "Public can create checkout order items"
on public.order_items for insert
to anon, authenticated
with check (true);

drop policy if exists "Public can read checkout order items" on public.order_items;
create policy "Checkout order items are read through service routes"
on public.order_items for select
to anon, authenticated
using (false);

drop policy if exists "Public can manage saved carts" on public.saved_carts;
create policy "Saved carts are managed through service routes"
on public.saved_carts for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "Public can manage saved cart items" on public.saved_cart_items;
create policy "Saved cart items are managed through service routes"
on public.saved_cart_items for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "Public can manage saved jobsites" on public.customer_saved_jobsites;
create policy "Saved jobsites are managed through service routes"
on public.customer_saved_jobsites for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "Public can manage customer drawings" on public.customer_drawing_uploads;
create policy "Customer drawings are managed through service routes"
on public.customer_drawing_uploads for all
to anon, authenticated
using (false)
with check (false);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.orders to anon, authenticated;
grant select, insert on public.order_items to anon, authenticated;
grant select, insert, update, delete on public.saved_carts, public.saved_cart_items to anon, authenticated;
grant select, insert, update, delete on public.customer_saved_jobsites to anon, authenticated;
grant select, insert, update, delete on public.customer_drawing_uploads to anon, authenticated;
