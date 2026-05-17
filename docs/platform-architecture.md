# Gateworks Platform Architecture

Gateworks is evolving from a product-page prototype into a SaaS operating system for ornamental iron suppliers, gate shops, fence companies, welding companies, and metal supply businesses.

## Product Boundaries

The platform should be organized around reusable business domains, not random pages:

- `catalog`: products, categories, brands, variants, search, contractor pricing.
- `commerce`: carts, checkout, pickup scheduling, delivery scheduling, order history.
- `inventory`: stock ledger, locations, bins, reservations, receiving, adjustments, audit trail.
- `quotes`: quote drafts, approvals, conversion to invoices, PDF/email workflow.
- `invoicing`: invoices, payments, partial payments, refunds, tax, delivery fees.
- `suppliers`: supplier profiles, lead times, purchase orders, backorders, supplier invoices.
- `accounts`: customers, contractors, company users, jobsite addresses, permissions, terms.
- `warehouse`: pick tickets, mobile picking, staging, delivery proof, signatures, route data.
- `admin`: internal dashboard, reporting, staff permissions, activity logs.

## Recommended Code Organization

Current app routes can stay in `app/`, but new work should use shared modules:

```text
app/
  (storefront)/
  (admin)/
components/
  layout/
  ui/
features/
  catalog/
  commerce/
  inventory/
  quotes/
  invoices/
  suppliers/
  accounts/
  warehouse/
lib/
  data/
  supabase/
  platform.ts
supabase/
  migrations/
  schema.sql
```

## Data Access Rules

- Server Components should fetch catalog and admin data whenever possible.
- Client Components should be reserved for interactive controls, optimistic carts, modals, and mobile warehouse workflows.
- Supabase service-role access belongs only in server-only modules and route handlers.
- Public client code must never import the service-role key.
- Every exposed Supabase table needs RLS enabled before production use.
- Authorization must be checked in database policies and server code, not only navigation or middleware.

## UI System Rules

- Build from `components/ui/*` primitives first.
- Use shared layout components from `components/layout/*`.
- Keep feature components small enough to review. Large components should be split by responsibility.
- Tables, filters, modals, forms, cards, and action bars should become shared primitives before each module grows.
- Mobile views are first-class for warehouse, pickup, delivery, and contractor ordering.

## Current Technical Debt

- `components/admin-dashboard.tsx` and `components/product-page-client.tsx` are too large for long-term maintenance.
- Admin functionality is catalog-specific today; it needs module navigation and shared table/form primitives.
- The app still has prototype naming in package metadata and some legacy visual language from the original product-page demo.
- Database schema covers catalog and carts, but not the full platform operating model.
- Local stores are useful for prototypes but need a clear persistence strategy as checkout, accounts, quotes, and invoices become real workflows.

## Implementation Sequence

1. Establish shared UI primitives and layout shells.
2. Split admin dashboard into feature modules.
3. Add platform schema migrations for accounts, inventory, orders, quotes, invoices, suppliers, purchase orders, deliveries, files, notifications, and activity logs.
4. Add typed data access functions per feature domain.
5. Build order and inventory foundations before advanced dashboards.
6. Add warehouse mobile flows after inventory reservations and pick tickets exist.
7. Add PDF, email, and payment workflows only after quote/invoice state machines are stable.

