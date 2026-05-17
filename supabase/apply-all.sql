-- Gateworks — consolidated Supabase schema.
-- Idempotent: safe to run repeatedly. Paste into the Supabase SQL editor and run once.


-- ============================================================
-- schema.sql
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  brand_id uuid references public.brands(id) on delete set null,
  title text not null,
  slug text not null unique,
  description text not null default '',
  details jsonb not null default '[]'::jsonb,
  specifications jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  search_document tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(slug, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  price numeric(12, 2) not null check (price >= 0),
  manual_price numeric(12, 2) check (manual_price is null or manual_price >= 0),
  calculated_price numeric(12, 2) check (calculated_price is null or calculated_price >= 0),
  rounded_price numeric(12, 2) check (rounded_price is null or rounded_price >= 0),
  final_price numeric(12, 2) check (final_price is null or final_price >= 0),
  pricing_method text not null default 'manual' check (pricing_method in ('manual', 'cwt_calculated')),
  width_in numeric(12, 4),
  height_in numeric(12, 4),
  wall_thickness_in numeric(12, 4),
  length_ft numeric(12, 4),
  material_density_lb_per_in3 numeric(12, 6),
  steel_cwt_price numeric(12, 2),
  calculated_weight_lb numeric(12, 2),
  inventory_status text not null default 'in_stock' check (inventory_status in ('in_stock', 'out_of_stock')),
  inventory_quantity integer not null default 100 check (inventory_quantity >= 0),
  image_url text,
  length text,
  material text,
  finish text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  url text not null,
  alt text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_images
  add column if not exists thumb_url text,
  add column if not exists card_url text,
  add column if not exists medium_url text,
  add column if not exists full_url text;

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.site_users (
  id text primary key,
  display_name text not null,
  normalized_name text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_id text,
  status text not null default 'active' check (status in ('active', 'converted', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_owner_check check (user_id is not null or anonymous_id is not null)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'inventory_manager' check (
    role in ('owner', 'admin', 'merchandiser', 'inventory_manager', 'content_editor')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  key text primary key,
  value numeric(12, 4) not null,
  label text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products
add column if not exists brand_id uuid references public.brands(id) on delete set null;

alter table public.product_variants
add column if not exists manual_price numeric(12, 2) check (manual_price is null or manual_price >= 0),
add column if not exists calculated_price numeric(12, 2) check (calculated_price is null or calculated_price >= 0),
add column if not exists rounded_price numeric(12, 2) check (rounded_price is null or rounded_price >= 0),
add column if not exists final_price numeric(12, 2) check (final_price is null or final_price >= 0),
add column if not exists pricing_method text not null default 'manual' check (pricing_method in ('manual', 'cwt_calculated')),
add column if not exists width_in numeric(12, 4),
add column if not exists height_in numeric(12, 4),
add column if not exists wall_thickness_in numeric(12, 4),
add column if not exists length_ft numeric(12, 4),
add column if not exists material_density_lb_per_in3 numeric(12, 6),
add column if not exists steel_cwt_price numeric(12, 2),
add column if not exists calculated_weight_lb numeric(12, 2);

insert into public.admin_settings (key, value, label)
values ('steel_cwt_price', 105, 'Steel CWT price')
on conflict (key) do nothing;

insert into public.brands (name, slug)
values ('National Hardware', 'national-hardware')
on conflict (slug) do nothing;

update public.products
set brand_id = (select id from public.brands where slug = 'national-hardware')
where brand_id is null
  and specifications ->> 'Brand' = 'National Hardware';

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_brand_id_idx on public.products(brand_id);
create index if not exists products_search_document_idx on public.products using gin(search_document);
create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
create index if not exists product_variants_sku_idx on public.product_variants(sku);
create index if not exists product_images_product_id_idx on public.product_images(product_id);
create index if not exists site_users_last_used_at_idx on public.site_users(last_used_at desc);
create index if not exists cart_items_cart_id_idx on public.cart_items(cart_id);
create index if not exists admin_audit_logs_entity_idx on public.admin_audit_logs(entity_type, entity_id);
create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

drop trigger if exists carts_set_updated_at on public.carts;
create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

drop trigger if exists admin_profiles_set_updated_at on public.admin_profiles;
create trigger admin_profiles_set_updated_at
before update on public.admin_profiles
for each row execute function public.set_updated_at();

drop trigger if exists admin_settings_set_updated_at on public.admin_settings;
create trigger admin_settings_set_updated_at
before update on public.admin_settings
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
      and role in ('owner', 'admin', 'merchandiser', 'inventory_manager', 'content_editor')
  );
$$;

alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_reviews enable row level security;
alter table public.site_users enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.admin_settings enable row level security;

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories for select
to anon, authenticated
using (true);

drop policy if exists "Public can read brands" on public.brands;
create policy "Public can read brands"
on public.brands for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage brands" on public.brands;
create policy "Admins can manage brands"
on public.brands for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (status = 'active');

drop policy if exists "Public can read product variants" on public.product_variants;
create policy "Public can read product variants"
on public.product_variants for select
to anon, authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_variants.product_id
      and products.status = 'active'
  )
);

drop policy if exists "Public can read product images" on public.product_images;
create policy "Public can read product images"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.status = 'active'
  )
);

drop policy if exists "Public can read admin settings" on public.admin_settings;
create policy "Public can read admin settings"
on public.admin_settings for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage admin settings" on public.admin_settings;
create policy "Admins can manage admin settings"
on public.admin_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read approved reviews" on public.product_reviews;
create policy "Public can read approved reviews"
on public.product_reviews for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "Public can read site users" on public.site_users;
create policy "Public can read site users"
on public.site_users for select
to anon, authenticated
using (true);

drop policy if exists "Public can create site users" on public.site_users;
create policy "Public can create site users"
on public.site_users for insert
to anon, authenticated
with check (true);

drop policy if exists "Public can update site users" on public.site_users;
create policy "Public can update site users"
on public.site_users for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Users can manage their own carts" on public.carts;
create policy "Users can manage their own carts"
on public.carts for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage items in their own carts" on public.cart_items;
create policy "Users can manage items in their own carts"
on public.cart_items for all
to authenticated
using (
  exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = auth.uid()
  )
);

drop policy if exists "Admins can read their profile" on public.admin_profiles;
create policy "Admins can read their profile"
on public.admin_profiles for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can read audit logs" on public.admin_audit_logs;
create policy "Admins can read audit logs"
on public.admin_audit_logs for select
to authenticated
using (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.brands, public.products, public.product_variants, public.product_images, public.product_reviews, public.admin_settings to anon, authenticated;
grant select, insert, update on public.site_users to anon, authenticated;
grant select, insert, update, delete on public.carts, public.cart_items to authenticated;
grant select on public.admin_profiles, public.admin_audit_logs, public.admin_settings to authenticated;


-- ============================================================
-- operating-system-schema.sql
-- ============================================================

-- Gateworks ornamental metal supply operating system schema.
-- Source: Jessie_Metal_Supply_App_Code_Stack.pdf and Ornamental_Metal_Supply_System_PRD.pdf.
-- This file is migration-ready SQL for the full backend foundation. Review against a
-- target Supabase project before applying, then split into versioned migrations.

create extension if not exists pgcrypto;

do $$
begin
  create type public.account_type as enum ('retail', 'contractor', 'supplier', 'staff');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.staff_role as enum ('admin', 'manager', 'warehouse', 'driver', 'accounting', 'sales_counter', 'purchasing');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.fulfillment_method as enum ('pickup', 'delivery');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_status as enum ('draft', 'submitted', 'confirmed', 'picking', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.document_status as enum ('draft', 'sent', 'accepted', 'converted', 'void');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_status as enum ('unpaid', 'partial', 'paid', 'overpaid', 'refunded', 'failed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.purchase_order_status as enum ('draft', 'sent', 'partially_received', 'received', 'closed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.inventory_event_type as enum ('receive', 'adjust', 'reserve', 'release', 'pick', 'ship', 'return', 'cycle_count');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.delivery_status as enum ('scheduled', 'assigned', 'loaded', 'out_for_delivery', 'delivered', 'failed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_channel as enum ('email', 'sms', 'in_app');
exception when duplicate_object then null;
end $$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_type public.account_type not null default 'retail',
  email text,
  phone text,
  tax_exempt boolean not null default false,
  tax_exempt_certificate_file_id uuid,
  net_terms_days integer not null default 0 check (net_terms_days in (0, 15, 30, 45, 60)),
  credit_limit numeric(12, 2) not null default 0 check (credit_limit >= 0),
  pricing_tier text not null default 'standard',
  stripe_customer_id text,
  quickbooks_customer_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  display_name text,
  role text not null default 'buyer',
  can_place_orders boolean not null default true,
  can_approve_orders boolean not null default false,
  can_view_invoices boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, email)
);

create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.staff_role not null,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  label text not null,
  contact_name text,
  contact_phone text,
  line1 text not null,
  line2 text,
  city text not null,
  region text not null,
  postal_code text not null,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  is_billing boolean not null default false,
  is_jobsite boolean not null default false,
  delivery_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists product_type text;
alter table public.products add column if not exists unit_of_measure text not null default 'each';
alter table public.products add column if not exists dimensions jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists gauge text;
alter table public.products add column if not exists material_type text;
alter table public.products add column if not exists pickup_available boolean not null default true;
alter table public.products add column if not exists delivery_available boolean not null default true;
alter table public.products add column if not exists supplier_id uuid;

alter table public.product_variants add column if not exists supplier_sku text;
alter table public.product_variants add column if not exists barcode text;
alter table public.product_variants add column if not exists cost numeric(12, 2) not null default 0 check (cost >= 0);
alter table public.product_variants add column if not exists reorder_point integer not null default 0 check (reorder_point >= 0);
alter table public.product_variants add column if not exists reorder_quantity integer not null default 0 check (reorder_quantity >= 0);
alter table public.product_variants add column if not exists weight numeric(12, 3);
alter table public.product_variants add column if not exists dimensions jsonb not null default '{}'::jsonb;

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  website text,
  account_number text,
  default_lead_time_days integer not null default 0 check (default_lead_time_days >= 0),
  default_payment_terms text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.products
    add constraint products_supplier_id_fkey
    foreign key (supplier_id) references public.suppliers(id) on delete set null;
exception when duplicate_object then null;
end $$;

create table if not exists public.supplier_products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  supplier_sku text,
  supplier_description text,
  cost numeric(12, 2) not null default 0 check (cost >= 0),
  lead_time_days integer not null default 0 check (lead_time_days >= 0),
  minimum_order_quantity integer not null default 1 check (minimum_order_quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (supplier_id, variant_id)
);

create table if not exists public.inventory_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  type text not null default 'warehouse',
  address_id uuid references public.addresses(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_bins (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.inventory_locations(id) on delete cascade,
  code text not null,
  aisle text,
  rack text,
  shelf text,
  position text,
  barcode text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, code)
);

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  location_id uuid not null references public.inventory_locations(id) on delete restrict,
  bin_id uuid references public.inventory_bins(id) on delete set null,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0),
  reorder_point integer not null default 0 check (reorder_point >= 0),
  updated_at timestamptz not null default now(),
  unique (variant_id, location_id, bin_id),
  constraint inventory_available_check check (quantity_on_hand >= quantity_reserved)
);

create table if not exists public.inventory_events (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  location_id uuid references public.inventory_locations(id) on delete set null,
  bin_id uuid references public.inventory_bins(id) on delete set null,
  event_type public.inventory_event_type not null,
  quantity_delta integer not null,
  quantity_on_hand_after integer,
  quantity_reserved_after integer,
  reference_type text,
  reference_id uuid,
  notes text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create sequence if not exists public.order_number_sequence start with 10027;
create sequence if not exists public.quote_number_sequence start with 10027;
create sequence if not exists public.invoice_number_sequence start with 10027;
create sequence if not exists public.purchase_order_number_sequence start with 10027;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('Order-' || nextval('public.order_number_sequence')),
  company_id uuid references public.companies(id) on delete set null,
  placed_by_user_id uuid references auth.users(id) on delete set null,
  customer_email text,
  status public.order_status not null default 'draft',
  fulfillment_method public.fulfillment_method not null default 'pickup',
  pickup_window_start timestamptz,
  pickup_window_end timestamptz,
  delivery_address_id uuid references public.addresses(id) on delete set null,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  tax_total numeric(12, 2) not null default 0 check (tax_total >= 0),
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  discount_total numeric(12, 2) not null default 0 check (discount_total >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete restrict,
  sku text not null,
  description text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  unit_cost numeric(12, 2) not null default 0 check (unit_cost >= 0),
  tax_rate numeric(6, 5) not null default 0 check (tax_rate >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.saved_carts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  cart_id uuid references public.carts(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  quote_number text not null unique default ('Quote-' || nextval('public.quote_number_sequence')),
  company_id uuid references public.companies(id) on delete set null,
  requested_by_user_id uuid references auth.users(id) on delete set null,
  status public.document_status not null default 'draft',
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  tax_total numeric(12, 2) not null default 0 check (tax_total >= 0),
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  expires_at timestamptz,
  converted_order_id uuid references public.orders(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete restrict,
  sku text not null,
  description text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default ('Invoice-' || nextval('public.invoice_number_sequence')),
  order_id uuid references public.orders(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  status public.document_status not null default 'draft',
  payment_status public.payment_status not null default 'unpaid',
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  tax_total numeric(12, 2) not null default 0 check (tax_total >= 0),
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  amount_paid numeric(12, 2) not null default 0 check (amount_paid >= 0),
  due_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete restrict,
  sku text not null,
  description text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  status public.payment_status not null default 'unpaid',
  provider text not null default 'stripe',
  provider_payment_id text,
  method text,
  amount numeric(12, 2) not null check (amount >= 0),
  refunded_amount numeric(12, 2) not null default 0 check (refunded_amount >= 0),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_date timestamptz not null default now(),
  payment_method text not null check (payment_method in ('Cash', 'Check', 'Credit Card', 'Debit Card', 'ACH', 'Wire Transfer', 'Financing', 'Other')),
  amount numeric(12, 2) not null check (amount > 0),
  reference_number text,
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique default ('PO-' || nextval('public.purchase_order_number_sequence')),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  status public.purchase_order_status not null default 'draft',
  expected_at date,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  tax_total numeric(12, 2) not null default 0 check (tax_total >= 0),
  shipping_total numeric(12, 2) not null default 0 check (shipping_total >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  supplier_sku text,
  description text not null,
  quantity_ordered integer not null check (quantity_ordered > 0),
  quantity_received integer not null default 0 check (quantity_received >= 0),
  unit_cost numeric(12, 2) not null check (unit_cost >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid references public.purchase_orders(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  received_by uuid references auth.users(id) on delete set null,
  received_at timestamptz not null default now(),
  notes text
);

create table if not exists public.pick_tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'picking', 'staged', 'completed', 'cancelled')),
  staged_location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pick_ticket_items (
  id uuid primary key default gen_random_uuid(),
  pick_ticket_id uuid not null references public.pick_tickets(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete restrict,
  bin_id uuid references public.inventory_bins(id) on delete set null,
  quantity_to_pick integer not null check (quantity_to_pick > 0),
  quantity_picked integer not null default 0 check (quantity_picked >= 0),
  substitute_variant_id uuid references public.product_variants(id) on delete set null,
  substitute_approved_by uuid references auth.users(id) on delete set null
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  driver_id uuid references auth.users(id) on delete set null,
  address_id uuid references public.addresses(id) on delete set null,
  status public.delivery_status not null default 'scheduled',
  route_sequence integer,
  distance_miles numeric(10, 2),
  proof_photo_file_id uuid,
  signature_file_id uuid,
  scheduled_for timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  mime_type text,
  size_bytes bigint,
  entity_type text,
  entity_id uuid,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  channel public.notification_channel not null default 'in_app',
  title text not null,
  body text not null,
  entity_type text,
  entity_id uuid,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  provider_event_id text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles
    where user_id = auth.uid()
      and active = true
  )
  or exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
  );
$$;

create or replace function public.has_staff_role(required_role public.staff_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_profiles
    where user_id = auth.uid()
      and active = true
      and (
        role = required_role
        or role in ('admin', 'manager')
      )
  );
$$;

create or replace view public.inventory_availability
with (security_invoker = true)
as
select
  variant_id,
  location_id,
  sum(quantity_on_hand) as quantity_on_hand,
  sum(quantity_reserved) as quantity_reserved,
  sum(quantity_on_hand - quantity_reserved) as quantity_available,
  min(reorder_point) as reorder_point
from public.inventory_items
group by variant_id, location_id;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists company_users_set_updated_at on public.company_users;
create trigger company_users_set_updated_at before update on public.company_users
for each row execute function public.set_updated_at();

drop trigger if exists staff_profiles_set_updated_at on public.staff_profiles;
create trigger staff_profiles_set_updated_at before update on public.staff_profiles
for each row execute function public.set_updated_at();

drop trigger if exists addresses_set_updated_at on public.addresses;
create trigger addresses_set_updated_at before update on public.addresses
for each row execute function public.set_updated_at();

drop trigger if exists suppliers_set_updated_at on public.suppliers;
create trigger suppliers_set_updated_at before update on public.suppliers
for each row execute function public.set_updated_at();

drop trigger if exists supplier_products_set_updated_at on public.supplier_products;
create trigger supplier_products_set_updated_at before update on public.supplier_products
for each row execute function public.set_updated_at();

drop trigger if exists inventory_locations_set_updated_at on public.inventory_locations;
create trigger inventory_locations_set_updated_at before update on public.inventory_locations
for each row execute function public.set_updated_at();

drop trigger if exists inventory_bins_set_updated_at on public.inventory_bins;
create trigger inventory_bins_set_updated_at before update on public.inventory_bins
for each row execute function public.set_updated_at();

drop trigger if exists inventory_items_set_updated_at on public.inventory_items;
create trigger inventory_items_set_updated_at before update on public.inventory_items
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at before update on public.quotes
for each row execute function public.set_updated_at();

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at before update on public.invoices
for each row execute function public.set_updated_at();

drop trigger if exists purchase_orders_set_updated_at on public.purchase_orders;
create trigger purchase_orders_set_updated_at before update on public.purchase_orders
for each row execute function public.set_updated_at();

drop trigger if exists pick_tickets_set_updated_at on public.pick_tickets;
create trigger pick_tickets_set_updated_at before update on public.pick_tickets
for each row execute function public.set_updated_at();

drop trigger if exists deliveries_set_updated_at on public.deliveries;
create trigger deliveries_set_updated_at before update on public.deliveries
for each row execute function public.set_updated_at();

create index if not exists companies_account_type_idx on public.companies(account_type);
create index if not exists company_users_user_id_idx on public.company_users(user_id);
create index if not exists addresses_company_id_idx on public.addresses(company_id);
create index if not exists supplier_products_supplier_id_idx on public.supplier_products(supplier_id);
create index if not exists inventory_items_variant_id_idx on public.inventory_items(variant_id);
create index if not exists inventory_events_variant_created_idx on public.inventory_events(variant_id, created_at desc);
create index if not exists orders_status_created_idx on public.orders(status, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists quotes_status_created_idx on public.quotes(status, created_at desc);
create index if not exists invoices_payment_status_idx on public.invoices(payment_status, created_at desc);
create index if not exists payments_invoice_id_idx on public.payments(invoice_id);
create index if not exists order_payments_order_id_idx on public.order_payments(order_id, payment_date desc);
create index if not exists purchase_orders_supplier_status_idx on public.purchase_orders(supplier_id, status);
create index if not exists deliveries_status_scheduled_idx on public.deliveries(status, scheduled_for);
create index if not exists notifications_user_read_idx on public.notifications(user_id, read_at);
create index if not exists activity_logs_entity_idx on public.activity_logs(entity_type, entity_id, created_at desc);

alter table public.companies enable row level security;
alter table public.company_users enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_products enable row level security;
alter table public.inventory_locations enable row level security;
alter table public.inventory_bins enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_events enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.saved_carts enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.order_payments enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.receipts enable row level security;
alter table public.pick_tickets enable row level security;
alter table public.pick_ticket_items enable row level security;
alter table public.deliveries enable row level security;
alter table public.uploaded_files enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;
alter table public.integration_events enable row level security;

drop policy if exists "Staff can manage companies" on public.companies;
create policy "Staff can manage companies" on public.companies
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Company users can read their company" on public.companies;
create policy "Company users can read their company" on public.companies
for select to authenticated using (
  exists (
    select 1 from public.company_users
    where company_users.company_id = companies.id
      and company_users.user_id = auth.uid()
  )
);

drop policy if exists "Staff can manage operational records" on public.orders;
create policy "Staff can manage operational records" on public.orders
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Company users can read their orders" on public.orders;
create policy "Company users can read their orders" on public.orders
for select to authenticated using (
  exists (
    select 1 from public.company_users
    where company_users.company_id = orders.company_id
      and company_users.user_id = auth.uid()
  )
);

drop policy if exists "Staff can manage inventory" on public.inventory_items;
create policy "Staff can manage inventory" on public.inventory_items
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can read inventory events" on public.inventory_events;
create policy "Staff can read inventory events" on public.inventory_events
for select to authenticated using (public.is_staff());

drop policy if exists "Staff can insert inventory events" on public.inventory_events;
create policy "Staff can insert inventory events" on public.inventory_events
for insert to authenticated with check (public.is_staff());

drop policy if exists "Staff can manage supplier records" on public.suppliers;
create policy "Staff can manage supplier records" on public.suppliers
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage supplier products" on public.supplier_products;
create policy "Staff can manage supplier products" on public.supplier_products
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage inventory locations" on public.inventory_locations;
create policy "Staff can manage inventory locations" on public.inventory_locations
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage inventory bins" on public.inventory_bins;
create policy "Staff can manage inventory bins" on public.inventory_bins
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage purchase orders" on public.purchase_orders;
create policy "Staff can manage purchase orders" on public.purchase_orders
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage purchase order items" on public.purchase_order_items;
create policy "Staff can manage purchase order items" on public.purchase_order_items
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage receipts" on public.receipts;
create policy "Staff can manage receipts" on public.receipts
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage documents" on public.invoices;
create policy "Staff can manage documents" on public.invoices
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage invoice items" on public.invoice_items;
create policy "Staff can manage invoice items" on public.invoice_items
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage quotes" on public.quotes;
create policy "Staff can manage quotes" on public.quotes
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage quote items" on public.quote_items;
create policy "Staff can manage quote items" on public.quote_items
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage payments" on public.payments;
create policy "Staff can manage payments" on public.payments
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage order payments" on public.order_payments;
create policy "Staff can manage order payments" on public.order_payments
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Company users can read their invoices" on public.invoices;
create policy "Company users can read their invoices" on public.invoices
for select to authenticated using (
  exists (
    select 1 from public.company_users
    where company_users.company_id = invoices.company_id
      and company_users.user_id = auth.uid()
  )
);

drop policy if exists "Staff can manage warehouse records" on public.pick_tickets;
create policy "Staff can manage warehouse records" on public.pick_tickets
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage pick ticket items" on public.pick_ticket_items;
create policy "Staff can manage pick ticket items" on public.pick_ticket_items
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage deliveries" on public.deliveries;
create policy "Staff can manage deliveries" on public.deliveries
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage uploaded files" on public.uploaded_files;
create policy "Staff can manage uploaded files" on public.uploaded_files
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Staff can manage integration events" on public.integration_events;
create policy "Staff can manage integration events" on public.integration_events
for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "Users can read their notifications" on public.notifications;
create policy "Users can read their notifications" on public.notifications
for select to authenticated using (user_id = auth.uid() or public.is_staff());

drop policy if exists "Staff can write activity logs" on public.activity_logs;
create policy "Staff can write activity logs" on public.activity_logs
for insert to authenticated with check (public.is_staff());

drop policy if exists "Staff can read activity logs" on public.activity_logs;
create policy "Staff can read activity logs" on public.activity_logs
for select to authenticated using (public.is_staff());

grant usage on schema public to anon, authenticated;
grant select on public.inventory_availability to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;


-- ============================================================
-- phase-1-2-supabase-completion.sql
-- ============================================================

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
drop policy if exists "Checkout orders are read through service routes" on public.orders;
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
drop policy if exists "Checkout order items are read through service routes" on public.order_items;
create policy "Checkout order items are read through service routes"
on public.order_items for select
to anon, authenticated
using (false);

drop policy if exists "Public can manage saved carts" on public.saved_carts;
drop policy if exists "Saved carts are managed through service routes" on public.saved_carts;
create policy "Saved carts are managed through service routes"
on public.saved_carts for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "Public can manage saved cart items" on public.saved_cart_items;
drop policy if exists "Saved cart items are managed through service routes" on public.saved_cart_items;
create policy "Saved cart items are managed through service routes"
on public.saved_cart_items for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "Public can manage saved jobsites" on public.customer_saved_jobsites;
drop policy if exists "Saved jobsites are managed through service routes" on public.customer_saved_jobsites;
create policy "Saved jobsites are managed through service routes"
on public.customer_saved_jobsites for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "Public can manage customer drawings" on public.customer_drawing_uploads;
drop policy if exists "Customer drawings are managed through service routes" on public.customer_drawing_uploads;
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


-- ============================================================
-- document-number-format.sql
-- ============================================================

create sequence if not exists public.order_number_sequence start with 10027;
create sequence if not exists public.quote_number_sequence start with 10027;
create sequence if not exists public.invoice_number_sequence start with 10027;
create sequence if not exists public.purchase_order_number_sequence start with 10027;

alter table if exists public.orders
  alter column order_number set default ('Order-' || nextval('public.order_number_sequence'));

alter table if exists public.quotes
  alter column quote_number set default ('Quote-' || nextval('public.quote_number_sequence'));

alter table if exists public.invoices
  alter column invoice_number set default ('Invoice-' || nextval('public.invoice_number_sequence'));

alter table if exists public.purchase_orders
  alter column po_number set default ('PO-' || nextval('public.purchase_order_number_sequence'));


-- ============================================================
-- order-payments-ledger.sql
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'overpaid'
      and enumtypid = 'public.payment_status'::regtype
  ) then
    alter type public.payment_status add value 'overpaid';
  end if;
end $$;

create table if not exists public.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_date timestamptz not null default now(),
  payment_method text not null check (payment_method in ('Cash', 'Check', 'Credit Card', 'Debit Card', 'ACH', 'Wire Transfer', 'Financing', 'Other')),
  amount numeric(12, 2) not null check (amount > 0),
  reference_number text,
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_payments_order_id_idx
  on public.order_payments(order_id, payment_date desc);

alter table public.order_payments enable row level security;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'is_staff'
  ) then
    drop policy if exists "Staff can manage order payments" on public.order_payments;
    create policy "Staff can manage order payments" on public.order_payments
    for all to authenticated using (public.is_staff()) with check (public.is_staff());
    grant select, insert, update, delete on public.order_payments to authenticated;
  end if;
end $$;


-- ============================================================
-- pick-ticket-line-progress.sql
-- ============================================================

-- Pick ticket line progress for warehouse pulling.
-- Apply after the orders and order_items tables exist.

alter table public.order_items
  add column if not exists quantity_needed numeric not null default 0,
  add column if not exists quantity_pulled numeric not null default 0,
  add column if not exists pulled boolean not null default false,
  add column if not exists pulled_at timestamptz,
  add column if not exists pulled_by uuid references auth.users(id) on delete set null,
  add column if not exists pick_notes text;

update public.order_items
set quantity_needed = quantity
where quantity_needed = 0;

create index if not exists order_items_pulled_order_idx
on public.order_items(order_id, pulled);

create index if not exists order_items_pulled_by_idx
on public.order_items(pulled_by);

create or replace view public.pick_ticket_progress as
select
  orders.id as order_id,
  orders.order_number,
  orders.status,
  orders.fulfillment_method,
  count(order_items.id)::integer as line_count,
  coalesce(sum(order_items.quantity_needed), 0) as quantity_needed,
  coalesce(sum(order_items.quantity_pulled), 0) as quantity_pulled,
  bool_and(order_items.pulled) as fully_pulled
from public.orders
join public.order_items on order_items.order_id = orders.id
where orders.is_quote_request = false
group by orders.id, orders.order_number, orders.status, orders.fulfillment_method;

grant select on public.pick_ticket_progress to anon, authenticated;


-- ============================================================
-- demand-reorder-intelligence.sql
-- ============================================================

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


-- ============================================================
-- website-production-readiness.sql
-- ============================================================

-- Gateworks production readiness patch.
-- Apply after the schema files. This keeps public catalog reads exposed,
-- keeps customer workflows service-route only, and creates the storage bucket
-- used by checkout drawing uploads.

create extension if not exists pgcrypto;

create unique index if not exists product_images_product_url_key
on public.product_images(product_id, url);

alter table public.product_images
  add column if not exists thumb_url text,
  add column if not exists card_url text,
  add column if not exists medium_url text,
  add column if not exists full_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'customer-drawings',
  'customer-drawings',
  true,
  52428800,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/octet-stream'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read customer drawing uploads" on storage.objects;
create policy "Public can read customer drawing uploads"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'customer-drawings');

drop policy if exists "Service role can manage customer drawing uploads" on storage.objects;
create policy "Service role can manage customer drawing uploads"
on storage.objects for all
to service_role
using (bucket_id = 'customer-drawings')
with check (bucket_id = 'customer-drawings');

alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_reviews enable row level security;
alter table public.site_users enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.saved_carts enable row level security;
alter table public.saved_cart_items enable row level security;
alter table public.customer_drawing_uploads enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.brands, public.products, public.product_variants, public.product_images, public.product_reviews to anon, authenticated;
grant select, insert, update on public.site_users to anon, authenticated;
grant select, insert, update on public.orders to anon, authenticated;
grant select, insert on public.order_items to anon, authenticated;
grant select, insert, update, delete on public.saved_carts, public.saved_cart_items to anon, authenticated;
grant select, insert, update, delete on public.customer_saved_jobsites to anon, authenticated;
grant select, insert, update, delete on public.customer_drawing_uploads to anon, authenticated;
grant select on public.pick_ticket_progress to anon, authenticated;


-- ============================================================
-- marketing-subscribers.sql
-- ============================================================

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


-- ============================================================
-- pricing-tiers.sql
-- ============================================================

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


-- ============================================================
-- ar-aging.sql
-- ============================================================

-- Accounts-receivable aging view: outstanding balance per order, bucketed by
-- age. Built on orders LEFT JOIN the summed order_payments ledger.
create or replace view public.ar_aging
with (security_invoker = true) as
select
  o.id as order_id,
  o.order_number,
  o.customer_name,
  o.company_name,
  o.site_user_id,
  o.created_at,
  o.payment_status,
  o.total as billed,
  coalesce(p.collected, 0) as collected,
  greatest(o.total - coalesce(p.collected, 0), 0) as outstanding,
  extract(day from now() - o.created_at)::int as days_outstanding,
  case
    when greatest(o.total - coalesce(p.collected, 0), 0) <= 0 then 'paid'
    when now() - o.created_at <= interval '30 days' then '0-30'
    when now() - o.created_at <= interval '60 days' then '31-60'
    else '60+'
  end as age_bucket
from public.orders o
left join (
  select order_id, sum(amount) as collected
  from public.order_payments
  group by order_id
) p on p.order_id = o.id
where coalesce(o.is_quote_request, false) = false
  and coalesce(o.status::text, '') <> 'cancelled';

-- Per-customer aging summary.
create or replace view public.ar_aging_by_customer
with (security_invoker = true) as
select
  site_user_id,
  coalesce(company_name, customer_name, 'Unknown customer') as customer,
  count(*) as order_count,
  sum(billed) as billed,
  sum(collected) as collected,
  sum(outstanding) as outstanding,
  coalesce(sum(outstanding) filter (where age_bucket = '0-30'), 0) as outstanding_0_30,
  coalesce(sum(outstanding) filter (where age_bucket = '31-60'), 0) as outstanding_31_60,
  coalesce(sum(outstanding) filter (where age_bucket = '60+'), 0) as outstanding_60_plus
from public.ar_aging
group by site_user_id, coalesce(company_name, customer_name, 'Unknown customer')
order by outstanding desc;

revoke all on public.ar_aging from anon, authenticated;
revoke all on public.ar_aging_by_customer from anon, authenticated;


-- ============================================================
-- design-lab-ratings.sql
-- ============================================================

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


-- ============================================================
-- quotes-and-purchase-orders.sql
-- ============================================================

-- Database-backed quotes + purchase-order foundation.
--
-- Quotes previously lived only in browser localStorage; this file gives them
-- (and customer/procurement purchase orders) real Supabase storage. Every
-- statement is idempotent so it can be re-applied on top of the legacy
-- `quotes` / `quote_items` tables defined in operating-system-schema.sql.

-- ---------------------------------------------------------------------------
-- Quotes
-- ---------------------------------------------------------------------------
-- A `quotes` table already exists in the legacy operating-system schema. We
-- create it here only as a fallback for fresh databases, then extend it with
-- the columns the website quote system needs.
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quotes add column if not exists quote_number text;
alter table public.quotes add column if not exists status text not null default 'draft';
alter table public.quotes add column if not exists is_template boolean not null default false;
alter table public.quotes add column if not exists template_name text;
alter table public.quotes add column if not exists site_user_id uuid;
alter table public.quotes add column if not exists customer_id text;
alter table public.quotes add column if not exists customer_name text;
alter table public.quotes add column if not exists customer_email text;
alter table public.quotes add column if not exists billing_address text;
alter table public.quotes add column if not exists jobsite_address text;
alter table public.quotes add column if not exists terms text;
alter table public.quotes add column if not exists notes text;
alter table public.quotes add column if not exists subtotal numeric(12, 2) not null default 0;
alter table public.quotes add column if not exists tax numeric(12, 2) not null default 0;
alter table public.quotes add column if not exists total numeric(12, 2) not null default 0;
alter table public.quotes add column if not exists created_by text;
alter table public.quotes add column if not exists converted_order_id uuid;

-- A legacy `quotes` table can carry extra NOT NULL columns (e.g. public_token,
-- client_name) that the website quote API does not populate. Give those a
-- default so inserts succeed; guarded so fresh databases (no such columns) are
-- unaffected.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quotes'
      and column_name = 'public_token'
  ) then
    alter table public.quotes
      alter column public_token set default gen_random_uuid()::text;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quotes'
      and column_name = 'client_name'
  ) then
    alter table public.quotes alter column client_name set default '';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Quote items
-- ---------------------------------------------------------------------------
create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade
);

alter table public.quote_items add column if not exists product_id text;
alter table public.quote_items add column if not exists variant_id text;
alter table public.quote_items add column if not exists sku text;
alter table public.quote_items add column if not exists title text;
alter table public.quote_items add column if not exists description text;
alter table public.quote_items add column if not exists options jsonb;
alter table public.quote_items add column if not exists quantity numeric(12, 2) not null default 1;
alter table public.quote_items add column if not exists unit_price numeric(12, 2) not null default 0;
alter table public.quote_items add column if not exists line_total numeric(12, 2) not null default 0;

-- ---------------------------------------------------------------------------
-- Orders: customer purchase orders are orders placed on net terms against a
-- PO number, optionally originating from a converted quote.
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists po_number text;
alter table public.orders add column if not exists po_status text not null default 'none';
alter table public.orders add column if not exists source_quote_id uuid;

-- ---------------------------------------------------------------------------
-- Procurement orders: internal POs issued to suppliers to restock inventory.
-- Kept separate from the legacy `purchase_orders` table (which is bound to the
-- normalized suppliers/products schema) so the website can use plain text.
-- ---------------------------------------------------------------------------
create table if not exists public.procurement_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text,
  supplier_name text,
  status text not null default 'draft',
  expected_at timestamptz,
  notes text,
  subtotal numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.procurement_order_items (
  id uuid primary key default gen_random_uuid(),
  procurement_order_id uuid not null references public.procurement_orders(id) on delete cascade,
  product_id text,
  variant_id text,
  sku text,
  title text,
  quantity_ordered numeric(12, 2) not null default 0,
  quantity_received numeric(12, 2) not null default 0,
  unit_cost numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null default 0
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists quote_items_quote_id_idx
  on public.quote_items (quote_id);
create index if not exists quotes_site_user_id_idx
  on public.quotes (site_user_id);
create index if not exists procurement_order_items_order_id_idx
  on public.procurement_order_items (procurement_order_id);

-- ---------------------------------------------------------------------------
-- Row-level security: enabled with no policies, so only the service-role key
-- (used by the /api/quotes and /api/procurement routes) can read or write.
-- ---------------------------------------------------------------------------
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.procurement_orders enable row level security;
alter table public.procurement_order_items enable row level security;
