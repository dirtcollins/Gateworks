create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
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
  inventory_status text not null default 'in_stock' check (inventory_status in ('in_stock', 'out_of_stock')),
  inventory_quantity integer not null default 0 check (inventory_quantity >= 0),
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

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_search_document_idx on public.products using gin(search_document);
create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
create index if not exists product_variants_sku_idx on public.product_variants(sku);
create index if not exists product_images_product_id_idx on public.product_images(product_id);
create index if not exists cart_items_cart_id_idx on public.cart_items(cart_id);

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

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_reviews enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

create policy "Public can read active categories"
on public.categories for select
to anon, authenticated
using (true);

create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (status = 'active');

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

create policy "Public can read approved reviews"
on public.product_reviews for select
to anon, authenticated
using (status = 'approved');

create policy "Users can manage their own carts"
on public.carts for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.product_variants, public.product_images, public.product_reviews to anon, authenticated;
grant select, insert, update, delete on public.carts, public.cart_items to authenticated;
