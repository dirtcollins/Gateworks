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
  create type public.payment_status as enum ('unpaid', 'partial', 'paid', 'refunded', 'failed');
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
