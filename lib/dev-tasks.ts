export type DevTaskStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "needs_review"
  | "completed"
  | "skipped";

export type DevTaskPriority = "critical" | "high" | "medium" | "low";

export type DevTask = {
  id: string;
  title: string;
  description: string;
  phase: string;
  status: DevTaskStatus;
  priority: DevTaskPriority;
  progressPercent: number;
  owner: string;
  dependencies: string[];
  backendNotes: string;
  frontendNotes: string;
  databaseNotes: string;
  testingNotes: string;
  acceptanceCriteria: string[];
  codexInstructions: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

type PhaseSeed = {
  phase: string;
  priority: DevTaskPriority;
  backendNotes?: string;
  frontendNotes?: string;
  databaseNotes?: string;
  testingNotes?: string;
  tasks: string[];
};

const createdAt = "2026-05-18";

const phaseSeeds: PhaseSeed[] = [
  {
    phase: "Phase 1 - Order System Foundation",
    priority: "critical",
    backendNotes:
      "Define durable order records, order numbering, relationships, and service boundaries before expanding UI workflows.",
    databaseNotes:
      "Plan orders, order_items, order_payments, order_activity_logs, order_notes, and order_attachments with UUID primary keys and customer-facing order numbers.",
    testingNotes:
      "Verify table relationships, order number uniqueness, and historical snapshots for product/customer data.",
    tasks: [
      "Create orders database table",
      "Create order_items database table",
      "Create order_payments database table",
      "Create order_activity_logs database table",
      "Create order_notes database table",
      "Create order_attachments database table",
      "Add TypeScript types for orders",
      "Add TypeScript types for order items",
      "Add TypeScript types for payments",
      "Add TypeScript types for activity logs",
      "Create order number generation system",
      "Use UUIDs internally",
      "Use customer-facing numbers like ORD-1001",
      "Connect orders to customers",
      "Connect orders to quotes",
      "Connect orders to invoices",
      "Connect orders to products",
      "Connect orders to product variants"
    ]
  },
  {
    phase: "Phase 2 - Order Status System",
    priority: "critical",
    backendNotes:
      "Keep order, payment, fulfillment, and delivery statuses independent and validate every transition server-side.",
    frontendNotes:
      "Use compact status pills and controls that make state changes clear without crowding operational pages.",
    testingNotes:
      "Test status transitions, completed-order edit restrictions, cancellation history, and activity log creation.",
    tasks: [
      "Add main order status field",
      "Add payment status field",
      "Add fulfillment status field",
      "Add delivery status field",
      "Build status pill UI",
      "Add status update controls",
      "Add backend validation for status changes",
      "Prevent completed orders from being edited unless reopened",
      "Preserve cancelled order history",
      "Add activity logs for every status change"
    ]
  },
  {
    phase: "Phase 3 - Orders List Page",
    priority: "high",
    frontendNotes:
      "Build an operations command center with search, saved views, dense filters, bulk actions, and a scannable order table.",
    testingNotes:
      "Verify filters combine correctly and table rows keep financial/status columns readable on desktop and mobile.",
    tasks: [
      "Create /admin/orders page",
      "Build order table",
      "Add search bar",
      "Add status filters",
      "Add date range filter",
      "Add customer filter",
      "Add payment status filter",
      "Add fulfillment status filter",
      "Add delivery / pickup filter",
      "Add assigned employee filter",
      "Add order tags filter",
      "Add new order button",
      "Add saved views",
      "Add bulk actions",
      "Add CSV export placeholder",
      "Add print selected orders placeholder"
    ]
  },
  {
    phase: "Phase 4 - Order Detail Page",
    priority: "high",
    frontendNotes:
      "Make the order detail page the operational workspace with a sticky header, status context, balance visibility, and primary actions.",
    testingNotes:
      "Check sticky header behavior and action availability across normal, completed, cancelled, and unpaid orders.",
    tasks: [
      "Create /admin/orders/[id] page",
      "Add sticky order header",
      "Show order number",
      "Show customer name",
      "Show status pills",
      "Show total",
      "Show paid amount",
      "Show balance due",
      "Add edit order button",
      "Add record payment button",
      "Add add product button",
      "Add print order button",
      "Add email customer button",
      "Add create invoice button",
      "Add create pick ticket button",
      "Add schedule delivery button",
      "Add duplicate order button",
      "Add mark completed button",
      "Add cancel order button"
    ]
  },
  {
    phase: "Phase 5 - Three Column Summary Section",
    priority: "high",
    frontendNotes:
      "Use compact 12px-14px typography for customer, delivery/pickup, and financial summary columns.",
    testingNotes:
      "Verify no overlapping labels, duplicate dividers, or oversized text at mobile and desktop widths.",
    tasks: [
      "Build Customer Info column",
      "Build Delivery / Pickup Details column",
      "Build Order Summary column",
      "Use compact 12px-14px typography",
      "Avoid oversized font sizes",
      "Remove duplicate divider lines",
      "Keep layout clean and professional"
    ]
  },
  {
    phase: "Phase 6 - Order Items System",
    priority: "critical",
    backendNotes:
      "Snapshot product, SKU, pricing, taxability, fulfillment, and metal-specific fields at time of sale.",
    frontendNotes:
      "Show line items with product image, variant details, quantity, pricing, fulfillment state, rack/bin, notes, and item actions.",
    testingNotes:
      "Test line totals, taxable flags, deleted product snapshots, and metal CWT/manual pricing fields.",
    tasks: [
      "Create order item list UI",
      "Add product image",
      "Add product name",
      "Add SKU",
      "Add variant details",
      "Add quantity",
      "Add unit price",
      "Add line total",
      "Add taxable yes/no",
      "Add tax amount",
      "Add discount amount",
      "Add fulfillment status",
      "Add rack/bin location",
      "Add item notes",
      "Add edit item action",
      "Add remove item action",
      "Preserve item snapshot data if product changes later",
      "Add metal length, gauge, finish, pieces, weight, CWT price, and manual override fields"
    ]
  },
  {
    phase: "Phase 7 - Product Variant Support",
    priority: "critical",
    backendNotes:
      "Connect orders to parent products and variants without duplicating product architecture.",
    frontendNotes:
      "Support size, gauge, length, and finish selection with variant-specific SKU, inventory, and dynamic pricing.",
    testingNotes:
      "Test Square Tubing-style variant combinations and inventory/pricing lookup behavior.",
    tasks: [
      "Ensure orders connect to parent products",
      "Ensure orders connect to product variants",
      "Support size dropdown",
      "Support gauge dropdown",
      "Support length dropdown",
      "Support finish dropdown",
      "Support variant-specific SKU",
      "Support variant-specific inventory",
      "Support dynamic pricing",
      "Avoid duplicate product architecture"
    ]
  },
  {
    phase: "Phase 8 - Cut Instructions System",
    priority: "high",
    backendNotes:
      "Model per-item piece instructions and cut fees so warehouse and totals can use the same data.",
    frontendNotes:
      "Show no-cut and piece-by-piece instructions clearly on order details and pick tickets.",
    testingNotes:
      "Verify first-cut-free placeholder logic, additional $8 cut fees, and pick ticket visibility.",
    tasks: [
      "Add cut instructions per order item",
      "Allow piece-by-piece cut instructions",
      "Add no-cut option",
      "Add first-cut-free logic placeholder",
      "Add additional cut fee logic",
      "Add $8 additional cut fee after first cut",
      "Show cut fees as line items",
      "Show cut instructions on order detail page",
      "Show cut instructions on pick tickets",
      "Add warehouse-friendly cut instruction layout"
    ]
  },
  {
    phase: "Phase 9 - Payment Recording System",
    priority: "critical",
    backendNotes:
      "Store each payment as its own immutable record with refund/reversal support and automatic balance recalculation.",
    frontendNotes:
      "Build a record-payment modal and payment history section with method, date, reference, notes, and recorded-by fields.",
    testingNotes:
      "Test partial payments, refunds, reversals, overpayments, balances, and payment status recalculation.",
    tasks: [
      "Create payment recording modal",
      "Store payments as separate records",
      "Never use one single payment field",
      "Add payment amount",
      "Add payment method",
      "Add payment date",
      "Add reference number",
      "Add notes",
      "Add recorded-by user",
      "Link payment to invoice if needed",
      "Support refunds",
      "Support payment reversals",
      "Recalculate balance due automatically",
      "Recalculate payment status automatically",
      "Add payment history section",
      "Add activity log for payment creation",
      "Add activity log for payment edits",
      "Add activity log for refunds"
    ]
  },
  {
    phase: "Phase 10 - Activity Timeline",
    priority: "high",
    backendNotes:
      "Create immutable timeline events for order changes, payments, status changes, pick tickets, delivery scheduling, emails, and completion.",
    frontendNotes:
      "Render a chronological activity timeline with timestamps and user attribution.",
    testingNotes:
      "Verify each critical action writes exactly one clear audit event and older events remain unchanged.",
    tasks: [
      "Create activity timeline component",
      "Log order creation",
      "Log customer changes",
      "Log product changes",
      "Log quantity changes",
      "Log payment records",
      "Log refunds",
      "Log status changes",
      "Log pick ticket creation",
      "Log delivery scheduling",
      "Log email activity",
      "Log order completion",
      "Show timestamp",
      "Show user who performed action",
      "Make activity log chronological",
      "Keep activity log immutable"
    ]
  },
  {
    phase: "Phase 11 - Pick Ticket System",
    priority: "high",
    backendNotes:
      "Generate pick tickets from order items and connect pulled/staged state back to fulfillment status.",
    frontendNotes:
      "Provide print and mobile warehouse views with product, SKU, quantity, rack/bin, cut instructions, assignment, and notes.",
    testingNotes:
      "Test pick ticket generation, item pulled checks, assignment, print view, and cut instruction display.",
    tasks: [
      "Create pick_tickets table",
      "Create pick_ticket_items table",
      "Add create pick ticket button",
      "Generate pick ticket from order items",
      "Show product image",
      "Show product name",
      "Show SKU",
      "Show quantity",
      "Show rack/bin location",
      "Show cut instructions",
      "Add checkbox for pulled",
      "Add employee assigned",
      "Add pulled timestamp",
      "Add warehouse notes",
      "Add print pick ticket view",
      "Add mobile-friendly warehouse view"
    ]
  },
  {
    phase: "Phase 12 - Warehouse Workflow",
    priority: "medium",
    frontendNotes:
      "Optimize warehouse screens for speed, mobile layout, large tap targets, partial picks, staging, and future barcode scanning.",
    testingNotes:
      "Test mobile ergonomics, mark-pulled/staged interactions, and who-pulled tracking.",
    tasks: [
      "Create warehouse-friendly order view",
      "Add mobile layout",
      "Add large tap targets",
      "Add mark item pulled",
      "Add mark item staged",
      "Add fabrication queue placeholder",
      "Add barcode scanning placeholder",
      "Add partial pick support",
      "Add internal warehouse notes",
      "Add who-pulled-this tracking"
    ]
  },
  {
    phase: "Phase 13 - Delivery System",
    priority: "medium",
    backendNotes:
      "Model deliveries and delivery stops so pickup, delivery, partial delivery, and multiple stops can evolve cleanly.",
    frontendNotes:
      "Schedule delivery with address, contact, time window, driver, truck, route order, fees, gate code, notes, proof placeholders, and failure state.",
    testingNotes:
      "Verify delivery scheduling, activity logs, failed delivery status, and delivery fee calculations.",
    tasks: [
      "Create deliveries table",
      "Create delivery_stops table",
      "Add schedule delivery modal",
      "Add delivery address",
      "Add delivery contact",
      "Add delivery phone",
      "Add time window",
      "Add assigned driver",
      "Add assigned truck",
      "Add route order",
      "Add delivery fee",
      "Add gate code",
      "Add delivery notes",
      "Add photo proof placeholder",
      "Add signature proof placeholder",
      "Add failed delivery status",
      "Add delivery activity logs"
    ]
  },
  {
    phase: "Phase 14 - Pickup Workflow",
    priority: "medium",
    frontendNotes:
      "Track pickup contact, pickup date, notes, vehicle info, loaded-by employee, ID verification, and signature placeholder.",
    testingNotes:
      "Verify pickup completion updates delivery/pickup status without corrupting payment or fulfillment status.",
    tasks: [
      "Add pickup status support",
      "Add pickup contact",
      "Add pickup date",
      "Add pickup notes",
      "Add vehicle notes",
      "Add loaded-by employee",
      "Add ID verified field",
      "Add pickup signature placeholder",
      "Add pickup completed action"
    ]
  },
  {
    phase: "Phase 15 - Backend Calculation Rules",
    priority: "critical",
    backendNotes:
      "Centralize subtotal, tax, discounts, fees, amount paid, balance due, payment status, fulfillment rollup, delivery status, and transaction safety.",
    testingNotes:
      "Add tests for every recalculation path and concurrency-sensitive update.",
    tasks: [
      "Recalculate subtotal when items change",
      "Recalculate tax when taxable items change",
      "Recalculate discounts",
      "Recalculate delivery fees",
      "Recalculate misc fees",
      "Recalculate total",
      "Recalculate amount paid",
      "Recalculate balance due",
      "Recalculate payment status",
      "Recalculate fulfillment status from items",
      "Recalculate delivery status independently",
      "Add transaction safety",
      "Add concurrency protection",
      "Prevent broken totals",
      "Add tests for calculations"
    ]
  },
  {
    phase: "Phase 16 - Permissions",
    priority: "critical",
    backendNotes:
      "Enforce permissions in server code and database policies, not just navigation.",
    frontendNotes:
      "Hide restricted controls only after backend enforcement exists; keep future roles visible in task notes.",
    testingNotes:
      "Test admin, sales, warehouse, driver, fabricator, and office staff permissions.",
    tasks: [
      "Restrict Dev Tasks page to admin users",
      "Restrict order delete to admin",
      "Restrict refund payments to admin",
      "Restrict price edits by role",
      "Restrict tax edits by role",
      "Restrict inventory modifications by role",
      "Restrict financial visibility by role"
    ]
  },
  {
    phase: "Phase 17 - UI / Design System Cleanup",
    priority: "medium",
    frontendNotes:
      "Reuse shared buttons, cards, tables, modals, status pills, hover states, compact typography, spacing, and responsive layouts.",
    testingNotes:
      "Visually check admin pages for duplicate CSS, random spacing, nested cards, and oversized typography.",
    tasks: [
      "Reuse shared buttons",
      "Reuse shared cards",
      "Reuse shared tables",
      "Reuse shared modals",
      "Reuse shared status pills",
      "Use consistent hover states",
      "Use compact typography",
      "Use consistent spacing",
      "Make responsive layouts",
      "Avoid duplicate CSS",
      "Avoid random one-off styling"
    ]
  },
  {
    phase: "Phase 18 - Testing",
    priority: "high",
    testingNotes:
      "Build focused coverage for order creation, quote conversion, invoices, payments, refunds, balances, status changes, pick tickets, delivery, mobile warehouse, permissions, activity logs, and deleted product snapshots.",
    tasks: [
      "Test order creation",
      "Test quote to order conversion",
      "Test invoice to order connection",
      "Test payment recording",
      "Test partial payments",
      "Test refunds",
      "Test balance calculations",
      "Test order status changes",
      "Test fulfillment status changes",
      "Test pick ticket creation",
      "Test delivery scheduling",
      "Test mobile warehouse layout",
      "Test permissions",
      "Test activity logs",
      "Test deleted product snapshot behavior"
    ]
  }
];

function taskId(phaseIndex: number, taskIndex: number) {
  return `phase-${String(phaseIndex + 1).padStart(2, "0")}-task-${String(taskIndex + 1).padStart(2, "0")}`;
}

export const devTasks: DevTask[] = phaseSeeds.flatMap((phase, phaseIndex) =>
  phase.tasks.map((title, taskIndex) => ({
    id: taskId(phaseIndex, taskIndex),
    title,
    description: `${title} for the Gateworks Order System build.`,
    phase: phase.phase,
    status: "not_started",
    priority: phase.priority,
    progressPercent: 0,
    owner: phase.priority === "critical" ? "Codex + backend" : "Codex",
    dependencies: taskIndex === 0 ? [] : [taskId(phaseIndex, Math.max(0, taskIndex - 1))],
    backendNotes:
      phase.backendNotes ||
      "Keep business rules in server code or shared domain modules instead of scattering logic through UI components.",
    frontendNotes:
      phase.frontendNotes ||
      "Use the existing Wayfinder admin primitives, compact typography, and responsive operational layouts.",
    databaseNotes:
      phase.databaseNotes ||
      "Add persistence only where the workflow requires durable business behavior and preserve auditability.",
    testingNotes:
      phase.testingNotes || "Run focused TypeScript and behavior checks that prove this task works.",
    acceptanceCriteria: [
      "The implementation matches the Gateworks order-system specification.",
      "The change is scoped to the task and does not break quote, invoice, catalog, or warehouse workflows.",
      "TypeScript checks pass for changed code."
    ],
    codexInstructions:
      "Read this task and its phase notes before implementation. Prefer existing project patterns, keep changes scoped, and update this tracker when work is complete.",
    createdAt,
    updatedAt: createdAt
  }))
);

export const devTaskPhases = phaseSeeds.map((phase) => phase.phase);
