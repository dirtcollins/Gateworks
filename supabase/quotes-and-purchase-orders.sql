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
