-- Gateworks platform schema blueprint.
-- This is a planning artifact for the next migration, not yet applied to production.

create type public.account_type as enum ('retail', 'contractor', 'supplier', 'staff');
create type public.order_status as enum ('draft', 'submitted', 'confirmed', 'picking', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled');
create type public.fulfillment_method as enum ('pickup', 'delivery');
create type public.inventory_event_type as enum ('receive', 'adjust', 'reserve', 'release', 'pick', 'ship', 'return');
create type public.document_status as enum ('draft', 'sent', 'accepted', 'converted', 'void');
create type public.payment_status as enum ('unpaid', 'partial', 'paid', 'refunded');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_type public.account_type not null default 'retail',
  tax_exempt boolean not null default false,
  net_terms_days integer not null default 0 check (net_terms_days >= 0),
  pricing_tier text not null default 'standard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  role text not null default 'buyer',
  can_approve_orders boolean not null default false,
  created_at timestamptz not null default now(),
  unique (company_id, email)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  label text not null,
  line1 text not null,
  line2 text,
  city text not null,
  region text not null,
  postal_code text not null,
  is_jobsite boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.inventory_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  type text not null default 'warehouse',
  created_at timestamptz not null default now()
);

create table public.inventory_bins (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.inventory_locations(id) on delete cascade,
  code text not null,
  aisle text,
  rack text,
  shelf text,
  created_at timestamptz not null default now(),
  unique (location_id, code)
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  location_id uuid not null references public.inventory_locations(id) on delete restrict,
  bin_id uuid references public.inventory_bins(id) on delete set null,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0),
  reorder_point integer not null default 0 check (reorder_point >= 0),
  updated_at timestamptz not null default now(),
  unique (variant_id, location_id, bin_id)
);

create table public.inventory_events (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  location_id uuid references public.inventory_locations(id) on delete set null,
  bin_id uuid references public.inventory_bins(id) on delete set null,
  event_type public.inventory_event_type not null,
  quantity_delta integer not null,
  reference_type text,
  reference_id uuid,
  notes text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  customer_email text,
  status public.order_status not null default 'draft',
  fulfillment_method public.fulfillment_method not null default 'pickup',
  subtotal numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  delivery_fee numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  sku text not null,
  description text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  status public.document_status not null default 'draft',
  subtotal numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  delivery_fee numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  expires_at timestamptz,
  converted_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  status public.document_status not null default 'draft',
  payment_status public.payment_status not null default 'unpaid',
  subtotal numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  amount_paid numeric(12, 2) not null default 0,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  default_lead_time_days integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  status public.document_status not null default 'draft',
  expected_at date,
  total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  driver_id uuid references auth.users(id) on delete set null,
  address_id uuid references public.addresses(id) on delete set null,
  status text not null default 'scheduled',
  proof_photo_file_id uuid,
  signature_file_id uuid,
  scheduled_for timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.uploaded_files (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

