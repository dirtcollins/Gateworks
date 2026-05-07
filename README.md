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

Copy `.env.example` to `.env.local` and add the Supabase keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ijxnzqxxgmprcwdfsihh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_REQUIRE_AUTH=false
```

Do not commit `.env.local`.

## Development

```bash
npm install
npm run dev
```

Then open `http://127.0.0.1:3000`.

## Verification

```bash
npm run typecheck
```
