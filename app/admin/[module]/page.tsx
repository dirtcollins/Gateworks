import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Clock,
  DollarSign,
  PackageCheck,
  Route,
  Truck
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";
import { platformModules } from "@/lib/platform-modules";
import { formatCurrency } from "@/lib/utils";

type AdminModulePageProps = {
  params: Promise<{
    module: string;
  }>;
};

export const dynamicParams = false;

const dedicatedAdminRoutes = new Set([
  "catalog",
  "customers",
  "demand",
  "inventory",
  "orders",
  "quotes",
  "warehouse"
]);

const moduleRequirements: Record<string, string[]> = {
  orders: [
    "Pending, confirmed, picking, ready for pickup, out for delivery, completed, and cancelled status queues.",
    "Pickup and delivery scheduling attached to order records.",
    "Reserved inventory connection before order confirmation."
  ],
  inventory: [
    "SKU on-hand, reserved, and available inventory.",
    "Location, rack, bin, receiving, adjustment, and low-stock alert workflows.",
    "Immutable audit ledger for every inventory movement."
  ],
  quotes: [
    "Quote requests from customers and counter staff.",
    "Contractor pricing, approval flow, expiration, and quote-to-invoice conversion.",
    "PDF and email/SMS delivery once document state is stable."
  ],
  invoices: [
    "Manual invoice creation and invoice history.",
    "Payment status, partial payments, deposits, refunds, tax, and delivery fees.",
    "Stripe and accounting integration boundaries."
  ],
  customers: [
    "Retail customers and contractor companies.",
    "Multiple users per company, tax exempt status, net terms, permissions, and saved jobsites.",
    "Saved carts, repeat ordering, and invoice history."
  ],
  suppliers: [
    "Supplier profiles, lead times, pricing, and supplier invoice uploads.",
    "Backordered item tracking and supplier cost history.",
    "Receiving workflow connection to inventory events."
  ],
  "purchase-orders": [
    "Purchase order drafts, sent orders, expected receipts, and supplier invoices.",
    "Backorder and landed-cost tracking.",
    "Receiving inventory from purchase orders."
  ],
  warehouse: [
    "Pick tickets and mobile warehouse picking.",
    "Rack/bin lookup, barcode-ready item scanning, and substitute approval.",
    "Staging workflow for pickup and delivery orders."
  ],
  deliveries: [
    "Delivery schedule, route data, driver queue, and Google Maps integration boundary.",
    "Signature capture and delivery photo uploads.",
    "Completed delivery proof linked to orders and invoices."
  ],
  reports: [
    "Sales, inventory, profit margin, tax, customer history, and supplier purchase reports.",
    "Role-aware dashboards for managers, purchasing, warehouse, accounting, and sales counter.",
    "Activity logs and operational audit views."
  ]
};

type ModuleMetric = {
  label: string;
  value: string | number;
};

type QueueItem = {
  label: string;
  detail: string;
  status: string;
  value?: string;
};

type ModuleWorkflow = {
  title: string;
  eyebrow: string;
  metrics: ModuleMetric[];
  primaryQueue: {
    title: string;
    items: QueueItem[];
  };
  secondaryQueue: {
    title: string;
    items: QueueItem[];
  };
};

const moduleWorkflows: Record<string, ModuleWorkflow> = {
  quotes: {
    title: "Quote desk",
    eyebrow: "Sales counter",
    metrics: [
      { label: "Open requests", value: 4 },
      { label: "Needs pricing", value: 2 },
      { label: "Ready to send", value: 1 },
      { label: "Quoted value", value: formatCurrency(18640) }
    ],
    primaryQueue: {
      title: "Quote requests",
      items: [
        {
          label: "GW-Q-1042 / Anderson Fabrication",
          detail: "Ornamental panels, hinges, latch hardware, and delivery quote.",
          status: "Needs pricing",
          value: formatCurrency(6420)
        },
        {
          label: "GW-Q-1041 / Valley Gate Co.",
          detail: "Repeat order request from saved cart with contractor terms.",
          status: "Ready to send",
          value: formatCurrency(3280)
        },
        {
          label: "GW-Q-1040 / Counter walk-in",
          detail: "Square tubing, flat bar, paint, concrete anchors.",
          status: "Draft",
          value: formatCurrency(890)
        }
      ]
    },
    secondaryQueue: {
      title: "Conversion controls",
      items: [
        {
          label: "Approval required",
          detail: "Quotes over $5,000 should require manager approval before sending.",
          status: "Policy"
        },
        {
          label: "Document status",
          detail: "Draft, sent, accepted, converted, and void states are modeled for PDF handoff.",
          status: "Ready"
        }
      ]
    }
  },
  invoices: {
    title: "Invoice desk",
    eyebrow: "Accounting",
    metrics: [
      { label: "Open invoices", value: 6 },
      { label: "Partial paid", value: 2 },
      { label: "Past due", value: 1 },
      { label: "Receivables", value: formatCurrency(22490) }
    ],
    primaryQueue: {
      title: "Payment queue",
      items: [
        {
          label: "GW-I-7782 / Jessie Metal Supply",
          detail: "Net 30 invoice tied to pickup order GW-2001.",
          status: "Unpaid",
          value: formatCurrency(1991.8)
        },
        {
          label: "GW-I-7781 / Ortega Iron Works",
          detail: "Deposit collected, balance due before delivery release.",
          status: "Partial",
          value: formatCurrency(4260)
        },
        {
          label: "GW-I-7779 / Cash account",
          detail: "Refund review for returned latch hardware.",
          status: "Refund review",
          value: formatCurrency(184)
        }
      ]
    },
    secondaryQueue: {
      title: "Document controls",
      items: [
        {
          label: "PDF invoice generation",
          detail: "Invoice templates should include tax, deposits, delivery, and itemized stock lines.",
          status: "Next"
        },
        {
          label: "Stripe boundary",
          detail: "Credit card, ACH, saved method, partial payment, and refund flows need provider wiring.",
          status: "Integration"
        }
      ]
    }
  },
  suppliers: {
    title: "Supplier directory",
    eyebrow: "Purchasing",
    metrics: [
      { label: "Suppliers", value: 8 },
      { label: "Preferred", value: 3 },
      { label: "Backordered SKUs", value: 12 },
      { label: "Avg lead time", value: "5d" }
    ],
    primaryQueue: {
      title: "Supplier watchlist",
      items: [
        {
          label: "Pacific Ornamental Iron",
          detail: "Scrollwork panels, finials, rosettes, and gate hardware.",
          status: "Preferred",
          value: "3d lead"
        },
        {
          label: "West Coast Steel Tube",
          detail: "Square tubing, flat bar, angle iron, and sheet metal.",
          status: "Cost review",
          value: "5d lead"
        },
        {
          label: "Access Control Supply",
          detail: "Gate motors, operators, remotes, hinges, and safety hardware.",
          status: "Backorders",
          value: "9d lead"
        }
      ]
    },
    secondaryQueue: {
      title: "Supplier records",
      items: [
        {
          label: "Invoice uploads",
          detail: "Supplier invoices belong in Supabase Storage with document status and PO references.",
          status: "Storage"
        },
        {
          label: "Supplier pricing",
          detail: "Vendor cost history should feed margin reports and reorder recommendations.",
          status: "Data model"
        }
      ]
    }
  },
  "purchase-orders": {
    title: "Purchase orders",
    eyebrow: "Replenishment",
    metrics: [
      { label: "Draft POs", value: 3 },
      { label: "Sent", value: 5 },
      { label: "Expected receipts", value: 7 },
      { label: "Open PO value", value: formatCurrency(31860) }
    ],
    primaryQueue: {
      title: "Reorder queue",
      items: [
        {
          label: "PO-6108 / West Coast Steel Tube",
          detail: "2 in square tube, angle iron, flat bar, and sheet metal replenishment.",
          status: "Expected Friday",
          value: formatCurrency(12440)
        },
        {
          label: "PO-6107 / Pacific Ornamental Iron",
          detail: "Finials, baskets, rosettes, decorative panels, and hinges.",
          status: "Sent",
          value: formatCurrency(7820)
        },
        {
          label: "PO-6106 / Access Control Supply",
          detail: "Motor kits and safety loops waiting on supplier confirmation.",
          status: "Backordered",
          value: formatCurrency(11600)
        }
      ]
    },
    secondaryQueue: {
      title: "Receiving controls",
      items: [
        {
          label: "Receive against PO",
          detail: "Every receipt should create inventory ledger entries and update rack/bin quantity.",
          status: "Required"
        },
        {
          label: "Landed cost",
          detail: "Freight and surcharge allocation should feed margin reporting.",
          status: "Next"
        }
      ]
    }
  },
  warehouse: {
    title: "Warehouse picking",
    eyebrow: "Yard operations",
    metrics: [
      { label: "Pick tickets", value: 9 },
      { label: "In picking", value: 4 },
      { label: "Staged", value: 3 },
      { label: "Substitutions", value: 2 }
    ],
    primaryQueue: {
      title: "Pick tickets",
      items: [
        {
          label: "PICK-4421 / GW-2001",
          detail: "Tubing rack A-14, gate hardware bin C-03, paint cage.",
          status: "Picking",
          value: "14 lines"
        },
        {
          label: "PICK-4420 / Counter order",
          detail: "Cane bolts and hinge set staged at counter pickup bay.",
          status: "Staged",
          value: "3 lines"
        },
        {
          label: "PICK-4419 / Delivery route 2",
          detail: "Large material requires forklift staging before driver load.",
          status: "Forklift",
          value: "8 lines"
        }
      ]
    },
    secondaryQueue: {
      title: "Mobile flow",
      items: [
        {
          label: "Barcode-ready scanning",
          detail: "The page structure is ready for scan input against SKU and bin code fields.",
          status: "Ready"
        },
        {
          label: "Substitute approval",
          detail: "Warehouse substitutions should require sales counter or manager approval.",
          status: "Policy"
        }
      ]
    }
  },
  deliveries: {
    title: "Delivery dispatch",
    eyebrow: "Routes",
    metrics: [
      { label: "Pending deliveries", value: 5 },
      { label: "On truck", value: 2 },
      { label: "Proof needed", value: 1 },
      { label: "Route miles", value: 86 }
    ],
    primaryQueue: {
      title: "Driver board",
      items: [
        {
          label: "Route 1 / Downtown shops",
          detail: "Three stops, one signature required, one forklift unload note.",
          status: "On truck",
          value: "32 mi"
        },
        {
          label: "Route 2 / North yard",
          detail: "Steel tube bundle and gate motor kit for morning window.",
          status: "Staging",
          value: "41 mi"
        },
        {
          label: "Will-call overflow",
          detail: "Convert to delivery if customer misses afternoon pickup.",
          status: "Monitor",
          value: "13 mi"
        }
      ]
    },
    secondaryQueue: {
      title: "Proof capture",
      items: [
        {
          label: "Signature required",
          detail: "Completed deliveries need customer signature, timestamp, and staff user.",
          status: "Required"
        },
        {
          label: "Delivery photos",
          detail: "Proof photos should be stored against the delivery and order records.",
          status: "Storage"
        }
      ]
    }
  },
  reports: {
    title: "Reporting",
    eyebrow: "Management",
    metrics: [
      { label: "Sales MTD", value: formatCurrency(68420) },
      { label: "Gross margin", value: "31%" },
      { label: "Inventory turns", value: "4.8" },
      { label: "Low-stock SKUs", value: 18 }
    ],
    primaryQueue: {
      title: "Management views",
      items: [
        {
          label: "Sales by customer",
          detail: "Contractor sales history, repeat order value, and invoice exposure.",
          status: "Ready to model"
        },
        {
          label: "Inventory turns",
          detail: "On-hand value, low-stock risk, dead stock, and reorder velocity.",
          status: "Ready to model"
        },
        {
          label: "Supplier purchasing",
          detail: "PO spend, lead times, backorders, and vendor cost movement.",
          status: "Ready to model"
        }
      ]
    },
    secondaryQueue: {
      title: "Audit views",
      items: [
        {
          label: "Operational activity",
          detail: "Orders, invoices, inventory events, and admin catalog changes need unified logs.",
          status: "Required"
        },
        {
          label: "Tax reporting",
          detail: "Taxable sales, exempt accounts, refunds, and delivery fees need exportable views.",
          status: "Accounting"
        }
      ]
    }
  }
};

const moduleIcons: Record<string, typeof ClipboardList> = {
  quotes: ClipboardList,
  invoices: DollarSign,
  suppliers: Truck,
  "purchase-orders": PackageCheck,
  warehouse: PackageCheck,
  deliveries: Route,
  reports: CalendarDays
};

export function generateStaticParams() {
  return platformModules
    .map((module) => module.href.split("/").pop())
    .filter(
      (module): module is string =>
        typeof module === "string" && !dedicatedAdminRoutes.has(module)
    )
    .map((module) => ({ module }));
}

export async function generateMetadata({ params }: AdminModulePageProps) {
  const { module: moduleSlug } = await params;
  const adminModule = platformModules.find(
    (item) => item.href.split("/").pop() === moduleSlug
  );

  return {
    title: adminModule
      ? `${adminModule.label} | Gateworks Operations`
      : "Admin | Gateworks"
  };
}

export default async function AdminModulePage({ params }: AdminModulePageProps) {
  const { module: moduleSlug } = await params;
  const adminModule = platformModules.find(
    (item) => item.href.split("/").pop() === moduleSlug
  );

  if (!adminModule || dedicatedAdminRoutes.has(moduleSlug)) {
    notFound();
  }

  const Icon = adminModule.icon;
  const requirements = moduleRequirements[moduleSlug] || [];
  const workflow = moduleWorkflows[moduleSlug];
  const WorkflowIcon = moduleIcons[moduleSlug] || Icon;

  return (
    <PageShell
      actions={
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 border border-industrial-rail bg-white px-4 text-sm font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:border-industrial-ink"
          href="/admin"
        >
          <ArrowLeft size={16} />
          Operations
        </Link>
      }
      description={adminModule.description}
      eyebrow="Gateworks Operations"
      title={adminModule.label}
    >
      {workflow ? (
        <div className="grid gap-5">
          <StatGrid
            className="grid-cols-2 overflow-hidden bg-white lg:grid-cols-4"
            stats={workflow.metrics}
          />

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    {workflow.eyebrow}
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">
                    {workflow.primaryQueue.title}
                  </h2>
                </div>
                <WorkflowIcon className="text-industrial-muted" size={20} />
              </CardHeader>
              <CardBody className="grid gap-3">
                {workflow.primaryQueue.items.map((item) => (
                  <div
                    className="grid gap-3 border border-industrial-rail p-4 md:grid-cols-[1fr_auto]"
                    key={item.label}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-industrial-ink">{item.label}</p>
                        <span className="border border-industrial-rail bg-industrial-paper px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-industrial-steel">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-industrial-steel">
                        {item.detail}
                      </p>
                    </div>
                    {item.value ? (
                      <p className="text-right text-lg font-black text-industrial-pine">
                        {item.value}
                      </p>
                    ) : null}
                  </div>
                ))}
              </CardBody>
            </Card>

            <div className="grid content-start gap-5">
              <Card>
                <CardHeader>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                      Controls
                    </p>
                    <h2 className="text-xl font-black text-industrial-ink">
                      {workflow.secondaryQueue.title}
                    </h2>
                  </div>
                  <Clock className="text-industrial-muted" size={20} />
                </CardHeader>
                <CardBody className="grid gap-3">
                  {workflow.secondaryQueue.items.map((item) => (
                    <div className="border border-industrial-rail p-3" key={item.label}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-black text-industrial-ink">{item.label}</p>
                        <span className="shrink-0 border border-industrial-rail bg-white px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-industrial-steel">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-industrial-steel">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      ) : null}

      <div className={`grid gap-5 ${workflow ? "mt-5" : ""} lg:grid-cols-[0.9fr_1.1fr]`}>
        <Card>
          <CardHeader>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                Module Status
              </p>
              <h2 className="text-xl font-black text-industrial-ink">
                Foundation screen
              </h2>
            </div>
            <div className="grid size-11 place-items-center border border-industrial-rail bg-industrial-paper text-industrial-ink">
              <Icon aria-hidden="true" size={20} />
            </div>
          </CardHeader>
          <CardBody className="grid gap-4">
            <p className="text-sm leading-6 text-industrial-steel">
              {workflow
                ? "This module now has a Phase 1 operating surface for staff review. The next implementation step is durable Supabase persistence, RLS policies, and role-specific mutations."
                : "This route exists so the admin system can grow module by module without random pages. The next implementation step is to connect this screen to Supabase tables, RLS policies, and shared data-table/form primitives."}
            </p>
            <div className="border border-industrial-rail bg-industrial-paper p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                Build phase
              </p>
              <p className="mt-1 text-2xl font-black text-industrial-ink">
                Phase 1 Admin MVP
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                PRD Requirements
              </p>
              <h2 className="text-xl font-black text-industrial-ink">
                What this module must support
              </h2>
            </div>
          </CardHeader>
          <CardBody>
            <ul className="grid gap-3">
              {requirements.map((requirement, index) => (
                <li
                  className="flex gap-3 border border-industrial-rail p-3 text-sm leading-6 text-industrial-steel"
                  key={requirement}
                >
                  {index === 0 ? (
                    <CheckCircle2
                      className="mt-1 shrink-0 text-industrial-pine"
                      size={16}
                    />
                  ) : (
                    <CircleDashed
                      className="mt-1 shrink-0 text-industrial-muted"
                      size={16}
                    />
                  )}
                  <span>{requirement}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </PageShell>
  );
}
