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
