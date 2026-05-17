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
