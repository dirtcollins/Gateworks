# Pro Admin Readiness Roadmap

This project is moving from a visual prototype to an operating product system for contractor ecommerce.

## Now in Scope

- Durable product, variant, image, price, and inventory edits through a server-side Supabase admin API.
- Two admin workflows:
  - Quick pricing and quantity editing.
  - Full product editing for content, specs, images, variants, price, and quantity.
- Keyboard-friendly inventory editing for fast catalog operations.
- Brand and category values sourced from the current catalog instead of free-text guesses.
- Admin audit table support for tracking product changes.

## Required Before Production

- Supabase Auth login for admin users.
- Role-based admin permissions:
  - Owner
  - Admin
  - Merchandiser
  - Inventory manager
  - Content editor
- Real image uploads to Supabase Storage with generated thumbnails.
- Admin change history UI.
- Product publish states with draft review before storefront changes go live.
- Bulk import/export for pricing, quantity, and catalog updates.
- Validation rules for SKU uniqueness, required images, prices, and variant option completeness.
- Order management and inventory decrementing after checkout.
- Monitoring for failed admin saves and storefront data fetch failures.

## Database Foundation

The schema includes public catalog tables, first-class brands, admin profiles, and admin audit logs. Public read access is explicit because new Supabase tables are not automatically exposed to API clients without the right grants.
