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
