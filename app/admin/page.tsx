import Link from "next/link";
import {
  Calendar,
  CircleCheckBig,
  ClipboardList,
  CreditCard,
  PackageCheck,
  Plus,
  UserRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";

export const metadata = {
  title: "Operations | Gateworks"
};

const kpiCards = [
  { label: "Today's Orders", value: "0", note: "Awaiting live order feed" },
  { label: "Pending Pick Tickets", value: "0", note: "No queue yet" },
  { label: "Low Stock Items", value: "0", note: "Connect stock service" },
  { label: "Revenue This Month", value: "$0.00", note: "Operational preview" }
];

const moduleCards = [
  {
    title: "Recent Orders",
    description: "Order intake and fulfillment state for operational planning.",
    href: "/admin/orders"
  },
  {
    title: "Pick Tickets Queue",
    description: "Ready, in-pickup, and staging readiness in one line of sight.",
    href: "/admin/pick-tickets"
  },
  {
    title: "Low Stock Alerts",
    description: "SKU-level risk and replenishment signals.",
    href: "/admin/inventory"
  },
  {
    title: "Delivery Schedule",
    description: "Delivery windows and dispatch coordination.",
    href: "/admin/orders"
  },
  {
    title: "Inventory Activity",
    description: "Receiving, transfers, and stock movements.",
    href: "/admin/inventory"
  },
  {
    title: "Sales Summary",
    description: "Operational sales and order trend signals.",
    href: "/admin/orders"
  }
];

const quickActions = [
  { label: "Create Order", href: "/admin/orders/new", icon: Plus },
  { label: "Create Quote", href: "/admin/quotes", icon: ClipboardList },
  { label: "Add Customer", href: "/admin/customers", icon: UserRound },
  { label: "Add Product", href: "/admin/products/new", icon: PackageCheck }
];

export default function AdminPage() {
  return (
    <PageShell
      className="max-w-none px-4 md:px-6"
      title="Dashboard"
      description="Overview of orders, inventory, warehouse activity, and sales."
      eyebrow="Gateworks Operations"
      actions={
        <div className="grid w-full gap-2 md:w-auto md:grid-cols-2">
          <label className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted">
              <ClipboardList size={16} aria-hidden="true" />
            </span>
            <Input
              aria-label="Search operations"
              className="h-9 w-full min-w-[220px] border-industrial-rail pl-9"
              placeholder="Search orders, customers, SKUs"
              type="search"
            />
          </label>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <Button
              className="h-9 normal-case tracking-normal"
              size="sm"
              variant="secondary"
              type="button"
            >
              <Calendar size={14} aria-hidden="true" />
              Date range
            </Button>
            <Link
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-industrial-rail bg-industrial-ink px-3 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:bg-industrial-pine"
              href="/admin/orders/new"
            >
              <Plus size={14} aria-hidden="true" />
              New Order
            </Link>
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        <section className="grid gap-3 xl:grid-cols-4">
          {kpiCards.map((card) => (
            <Card className="p-4" key={card.label}>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-black text-industrial-ink">{card.value}</p>
              <p className="mt-1 text-xs text-industrial-muted">{card.note}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4 xl:grid-cols-3">
            {moduleCards.map((module) => (
              <Link
                className="group rounded-xl border border-industrial-rail bg-white p-4 transition hover:border-industrial-ink hover:bg-industrial-paper"
                href={module.href}
                key={module.title}
              >
                <h2 className="text-base font-black text-industrial-ink">{module.title}</h2>
                <p className="mt-2 text-sm leading-6 text-industrial-steel">{module.description}</p>
                <p className="mt-3 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-industrial-muted">
                  Open
                  <CircleCheckBig size={14} />
                </p>
              </Link>
            ))}
          </div>

          <aside className="grid content-start gap-4">
            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Quick Actions
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">Operations</h2>
                </div>
              </CardHeader>
              <CardBody className="grid gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-industrial-rail px-3 text-xs font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:border-industrial-ink hover:bg-industrial-paper"
                      href={action.href}
                      key={action.label}
                    >
                      <Icon size={14} aria-hidden="true" />
                      {action.label}
                    </Link>
                  );
                })}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Notes
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">Warehouse signals</h2>
                </div>
                <CreditCard className="text-industrial-muted" size={20} />
              </CardHeader>
              <CardBody className="grid gap-2 text-sm text-industrial-steel">
                <p>Live signals and analytics placeholders are shown while data services are wired.</p>
                <p className="rounded-md border border-dashed border-industrial-rail p-3 text-xs text-industrial-muted">
                  Keep this area focused on actionable tasks; no template-style charts.
                </p>
              </CardBody>
            </Card>
          </aside>
        </section>
      </div>
    </PageShell>
  );
}
