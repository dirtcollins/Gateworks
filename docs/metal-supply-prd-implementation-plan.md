# Metal Supply PRD Implementation Plan

Source documents:

- `/Users/brendan-macpro/Desktop/Jessie_Metal_Supply_App_Code_Stack.pdf`
- `/Users/brendan-macpro/Desktop/Ornamental_Metal_Supply_System_PRD.pdf`

## Product Target

Gateworks is a complete operating system for ornamental iron suppliers, metal distributors, welders, gate companies, fence companies, contractors, and metal supply businesses.

The platform combines:

- Home Depot-style product ordering.
- Internal inventory management.
- Quotes and invoices.
- Supplier purchasing.
- Contractor accounts.
- Warehouse picking.
- Pickup and delivery operations.
- Reporting.

## Phase 1: Internal Admin MVP

Build this before customer checkout.

- Operations dashboard with pending orders, low stock, open invoices, supplier orders, and delivery queues.
- Catalog admin for products, photos, SKU data, dimensions, gauge, material, price, and availability.
- Inventory foundation with on-hand, reserved, available, locations, rack/bin, receiving, adjustments, low-stock alerts, and audit logs.
- Staff roles: admin, manager, warehouse, driver, accounting, sales counter, purchasing.
- Supplier foundation: profiles, purchase orders, supplier pricing, backorders, invoice uploads.

## Phase 2: Customer Ordering

- Public catalog by sheet metal, tubing, angle iron, flat bar, ornamental iron, gate hardware, motors, welding supplies, fasteners, paint, concrete, and anchors.
- Search and filtering.
- Cart and checkout.
- Pickup scheduling.
- Delivery scheduling.
- Quote requests.
- Saved carts and repeat ordering.
- Customer drawing uploads.

## Phase 3: Documents, Payments, Notifications

- Quote-to-invoice conversion.
- PDF quotes, invoices, purchase orders, and pick tickets.
- Stripe credit card, ACH, deposits, partial payments, saved methods, and refunds.
- Resend or SendGrid transactional email.
- Twilio pickup, delivery, order, and invoice notifications.

## Phase 4: Warehouse, Delivery, Reporting

- Pick tickets.
- Mobile warehouse picking.
- Barcode-ready inventory flow.
- Substitute approval.
- Google Maps route management.
- Driver delivery app.
- Signature capture.
- Delivery photo uploads.
- Sales, tax, inventory, profit margin, customer history, and supplier purchase reports.

## Engineering Constraints

- Use Next.js, React, TypeScript, Tailwind CSS, Supabase, Vercel, and GitHub.
- Supabase is the system of record for operational workflows.
- Local storage is acceptable only for prototype UX, not for real orders, invoices, inventory, payments, files, or permissions.
- Every production table exposed through Supabase needs RLS.
- Every inventory mutation needs an immutable audit/event record.
- Every operational document needs an explicit status model.
- Build shared UI systems before expanding route count.
