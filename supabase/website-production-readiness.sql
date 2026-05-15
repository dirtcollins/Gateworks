-- Gateworks production readiness patch.
-- Apply after the schema files. This keeps public catalog reads exposed,
-- keeps customer workflows service-route only, and creates the storage bucket
-- used by checkout drawing uploads.

create extension if not exists pgcrypto;

create unique index if not exists product_images_product_url_key
on public.product_images(product_id, url);

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
