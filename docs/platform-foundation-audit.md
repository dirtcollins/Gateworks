# Gateworks Platform Foundation Audit

Date: 2026-05-14

## Current State

Gateworks is a Next.js App Router application with a working storefront catalog, local cart/list/quote stores, Supabase catalog read/write support, and a large product-admin surface. The codebase already has early platform artifacts:

- Shared UI primitives in `components/ui`.
- Shared layout components in `components/layout`.
- Platform module metadata in `lib/platform.ts`.
- A broad SaaS schema planning artifact in `supabase/platform-schema-blueprint.sql`.
- Roadmap and architecture notes in `docs/platform-architecture.md` and `docs/pro-admin-roadmap.md`.

## Architectural Risks

- The app has two visual systems in parallel: legacy `jobsite-*` classes and newer `industrial-*` shared components.
- `industrial-*` tokens were referenced before they were defined in Tailwind, which made the new shared shell unsafe to adopt.
- `components/admin-dashboard.tsx` and `components/product-page-client.tsx` are over 1,000 lines each and mix state, persistence, layout, forms, and product-specific behavior.
- Domain logic is concentrated in `lib/catalog.ts`, including imports, enrichment, special product overrides, search, and merge behavior.
- Prototype local Zustand stores are still the source of truth for cart, list, quote, and user workflows. That is useful for demos, but not sufficient for orders, invoices, approvals, reservations, audit logs, or multi-user contractor accounts.
- Supabase has a solid catalog/admin start, but the platform blueprint is not yet migration-ready. It needs RLS policies, indexes, line-item tables, state transitions, and storage policies before production use.

## Foundation Decisions

- Treat `components/ui` as the only place for primitive buttons, cards, inputs, page shells, stats, tables, modals, form fields, empty states, and badges.
- Treat `components/layout` as the only place for global header/footer and future admin/storefront shells.
- Treat `lib/platform-modules.ts` as the registry for platform module navigation and metadata.
- Keep public ordering and internal operations separate in routing using route groups in the next architecture pass:

```text
app/
  (storefront)/
  (admin)/
features/
  catalog/
  commerce/
  inventory/
  quotes/
  invoices/
  accounts/
  suppliers/
  warehouse/
```

## Next Refactor Slices

1. Move catalog search/filter/data helpers out of `lib/catalog.ts` into `features/catalog`.
2. Split `components/admin-dashboard.tsx` into admin shell, product list, pricing grid, full editor, image editor, and API client modules.
3. Add shared `DataTable`, `Toolbar`, `Badge`, `EmptyState`, `Dialog`, and `FormField` primitives before building orders or inventory screens.
4. Convert cart/quote flows from local-only state to server-backed draft records with optimistic UI.
5. Turn `supabase/platform-schema-blueprint.sql` into versioned migrations only after policy and state-machine review.
6. Add typed repository functions per domain so Server Components and Route Handlers do not duplicate Supabase queries.

## Build Guardrails

- No new large route should fetch and mutate data directly in the page component.
- No new admin module should create its own table, modal, or form styling.
- No customer, contractor, order, invoice, payment, or warehouse feature should rely only on local storage.
- Every production Supabase table in `public` needs RLS enabled and explicit policies.
- Every inventory mutation must write an immutable ledger event, not only update a quantity column.
- Every order, quote, invoice, purchase order, and delivery needs an explicit status model before UI expansion.
