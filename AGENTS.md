# AGENTS.md

Permanent engineering rules and workflows for agents working on Gateworks.

## Project Identity

Gateworks is a construction commerce and operating-system app for ornamental iron suppliers, gate shops, fence companies, welding companies, and metal supply businesses.

The current app is built with Next.js, React, TypeScript, Tailwind CSS, Zustand, and Supabase. Treat the product as a real business platform, not a demo storefront.

## Non-Negotiable Rules

- Do not modify app code unless the user explicitly asks for implementation.
- Keep changes tightly scoped to the requested task.
- Do not rewrite unrelated files, reformat broad areas, or rename modules opportunistically.
- Never commit secrets, `.env.local`, Supabase service-role keys, access tokens, or customer data.
- Do not weaken authentication, authorization, RLS, validation, or audit behavior to make a feature easier.
- Do not revert user changes unless the user explicitly asks.
- Prefer existing project patterns over new abstractions.
- Use TypeScript types and structured data access instead of ad hoc string handling where practical.
- Keep production behavior explicit. Avoid silent fallbacks that hide data, auth, pricing, or persistence failures.

## Repo Orientation

Important project areas:

- `app/`: Next.js routes and route groups.
- `components/`: shared UI and page/client components.
- `components/ui/`: reusable UI primitives.
- `components/layout/`: site layout components.
- `lib/`: domain logic, stores, Supabase access, pricing, platform helpers, and types.
- `data/`: local catalog source data.
- `supabase/`: schema and platform SQL.
- `scripts/`: import, deployment, seeding, and verification scripts.
- `docs/`: architecture and planning documents.

## Domain Boundaries

Organize new work around business domains:

- `catalog`: products, categories, brands, variants, search, contractor pricing.
- `commerce`: carts, checkout, pickup, delivery, order history.
- `inventory`: stock ledger, locations, bins, reservations, receiving, adjustments.
- `quotes`: quote drafts, approvals, conversion, PDF/email workflow.
- `invoicing`: invoices, payments, refunds, taxes, delivery fees.
- `suppliers`: supplier profiles, lead times, purchase orders, backorders.
- `accounts`: customers, contractors, company users, jobsites, permissions.
- `warehouse`: pick tickets, mobile picking, staging, delivery proof, signatures.
- `admin`: internal dashboards, reporting, staff permissions, activity logs.

When adding larger features, prefer a `features/<domain>/` structure if it fits the existing code at that time. Do not move current code just to satisfy this structure unless refactoring is part of the requested task.

## Next.js And React Rules

- Prefer Server Components for data fetching and read-heavy pages.
- Use Client Components for interactive UI, optimistic updates, forms, modals, mobile workflows, and local state.
- Keep Client Component boundaries narrow.
- Avoid duplicating business rules in components. Put shared rules in `lib/` or a domain module.
- Use existing UI primitives from `components/ui/*` and layout components from `components/layout/*` before creating new primitives.
- Use `lucide-react` icons for icon buttons where available.
- Keep large components reviewable by splitting along responsibility, especially admin, product detail, cart, quote, inventory, and warehouse flows.

## Supabase And Data Rules

- Service-role Supabase access belongs only in server-only modules, server actions, route handlers, or scripts.
- Public client code must never import or reference the service-role key.
- Every production table exposed to clients must have RLS enabled and policies reviewed.
- Authorization must be enforced in database policies and server code, not only in navigation, client checks, or middleware.
- Prefer typed repository/helper functions over raw Supabase calls scattered through UI components.
- Preserve auditability for admin, inventory, pricing, order, quote, and customer-account changes.
- Production catalog reads and writes should fail clearly when Supabase configuration is missing.

## State And Persistence

- Zustand/local stores are acceptable for UI state and prototype workflows.
- Before treating any workflow as durable business behavior, define where it persists and how it recovers across sessions/devices.
- Do not create new local-only stores for checkout, accounts, orders, invoices, inventory, or payments without explicitly documenting the persistence limitation.

## UI And UX Rules

- Build operational interfaces for speed, scanning, and repeated use.
- Avoid marketing-page patterns for admin, warehouse, inventory, and commerce workflows.
- Mobile is first-class for contractor ordering, pickup, delivery, warehouse, and pick-ticket flows.
- Tables, filters, modals, forms, cards, and action bars should become shared primitives when repeated.
- Ensure text fits its container across mobile and desktop.
- Do not nest cards inside cards.
- Keep visual changes aligned with the existing Tailwind and component system.

## Testing And Verification

Use the narrowest verification that proves the change, then broaden when risk is higher.

Common commands:

```bash
npm run typecheck
npm run build
npm run supabase:verify
```

Development server:

```bash
npm run dev
```

The dev server runs on `http://127.0.0.1:3001`.

Run `npm run typecheck` for TypeScript changes unless there is a clear reason not to. Run `npm run build` for routing, rendering, or deployment-sensitive changes. Run `npm run supabase:verify` after Supabase schema, deployment, seed, or remote data-access changes.

## Working With Git

- Check the worktree before editing when the task involves code changes.
- Treat uncommitted changes as user work unless clearly created by the agent during the current task.
- Do not use destructive git commands such as `git reset --hard` or `git checkout --` without explicit user approval.
- Keep commits focused when the user asks for commits.
- Do not stage unrelated files.

## Agent Workflow

1. Read the relevant files before changing anything.
2. Identify the smallest safe change that satisfies the request.
3. Announce the files or areas being edited before editing.
4. Make the change.
5. Verify with the appropriate command or explain why verification was not run.
6. Summarize the outcome, changed files, and any residual risk.

## Current Known Debt

- `components/admin-dashboard.tsx` is large and should be split before major admin expansion.
- `components/product-page-client.tsx` is large and should be split before major product-page expansion.
- Admin functionality is currently catalog-centric and needs stronger module navigation over time.
- Some package metadata and visual language still reflect an earlier prototype.
- Local stores need a clearer persistence strategy as checkout, accounts, quotes, invoices, and inventory become production workflows.

