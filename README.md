# Gateworks

Modern construction ecommerce product-page system built with Next.js, React, TypeScript, Tailwind, Zustand, and Supabase.

## Current Scope

- 50-product catalog foundation.
- Product detail pages with image galleries, variants, pricing, SKU updates, recommendations, accordions, and mobile sticky add-to-cart.
- Cart add, remove, and quantity updates.
- Basic search by title, SKU, and category.
- Admin dashboard with quick pricing/quantity editing and full product editing.
- Supabase schema for products, variants, categories, images, carts, brands, admin profiles, and audit logs.

## Environment

The deployed website must have these Supabase variables set. Without them,
production catalog reads and writes fail instead of silently saving locally:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ijxnzqxxgmprcwdfsihh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_REQUIRE_AUTH=true
```

Do not commit `.env.local`.

## Supabase Deployment

Apply the database/storage schema and seed the full catalog:

```bash
SUPABASE_ACCESS_TOKEN=... npm run supabase:deploy
```

Then verify the remote project:

```bash
npm run supabase:verify
```

## First Admin User

Admin access uses Supabase Auth cookie sessions plus the `admin_profiles` table.
Create the first admin before using `/admin` in a preview or production
deployment:

1. In the Supabase dashboard, create or invite a user under Authentication.
2. Copy that user's Auth `id`.
3. Insert an admin profile for that user:

```sql
insert into public.admin_profiles (user_id, role)
values ('00000000-0000-0000-0000-000000000000', 'owner')
on conflict (user_id) do update
set role = excluded.role;
```

Allowed admin roles are `owner`, `admin`, `merchandiser`,
`inventory_manager`, and `content_editor`.

The deployed app must keep `ADMIN_REQUIRE_AUTH=true`. Admin pages redirect to
`/admin/login`; signed-in users without an allowed `admin_profiles` role are
sent to `/admin/access-denied`.

## Development

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:3001`.

## Verification

```bash
npm run typecheck
```
