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
