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
