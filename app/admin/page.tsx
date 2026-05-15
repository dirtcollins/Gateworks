import Link from "next/link";
import { ArrowRight, CircleAlert, Clock, PackageCheck } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";
import { platformModules } from "@/lib/platform-modules";

export const metadata = {
  title: "Operations | Gateworks"
};

const phaseOnePriorities = [
  "Inventory dashboard with SKU quantity, reserved stock, bin locations, receiving, adjustments, and audit logs.",
  "Order, pickup, delivery, quote, invoice, and payment status queues for counter staff.",
  "Supplier purchasing workflow with purchase orders, backorders, lead times, and supplier invoice uploads.",
  "Warehouse mobile mode with pick tickets, rack/bin lookup, barcode-ready flow, and delivery proof capture."
];

const operatingQueues = [
  { label: "Pending orders", value: "0", status: "Model next" },
  { label: "Low inventory alerts", value: "0", status: "Needs ledger" },
  { label: "Open invoices", value: "0", status: "Needs billing" },
  { label: "Pending deliveries", value: "0", status: "Needs routes" }
];

export default function AdminPage() {
  return (
    <PageShell
      actions={
        <StatGrid
          stats={[
            { label: "Phase", value: "1" },
            { label: "Modules", value: platformModules.length },
            { label: "Priority", value: "Admin MVP" }
          ]}
        />
      }
      description="Internal operating system for ornamental iron and metal supply teams: catalog, inventory, orders, invoices, suppliers, warehouse, delivery, and reporting."
      eyebrow="Gateworks Operations"
      title="Metal supply admin dashboard"
    >
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            {platformModules.map((module) => {
              const Icon = module.icon;

              return (
                <Link
                  className="group grid min-h-40 border border-industrial-rail bg-white p-4 transition hover:border-industrial-ink hover:shadow-toolbar"
                  href={module.href}
                  key={module.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid size-11 place-items-center border border-industrial-rail bg-industrial-paper text-industrial-ink">
                      <Icon aria-hidden="true" size={20} />
                    </div>
                    <ArrowRight
                      aria-hidden="true"
                      className="text-industrial-muted transition group-hover:translate-x-1 group-hover:text-industrial-ink"
                      size={18}
                    />
                  </div>
                  <div className="mt-5">
                    <h2 className="text-lg font-black text-industrial-ink">
                      {module.label}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-industrial-steel">
                      {module.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <Card>
            <CardHeader>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Operating Queues
                </p>
                <h2 className="text-xl font-black text-industrial-ink">
                  Staff command center
                </h2>
              </div>
              <Clock className="text-industrial-muted" size={20} />
            </CardHeader>
            <CardBody className="grid gap-3">
              {operatingQueues.map((queue) => (
                <div
                  className="grid grid-cols-[1fr_auto] gap-3 border border-industrial-rail p-3"
                  key={queue.label}
                >
                  <div>
                    <p className="text-sm font-black text-industrial-ink">
                      {queue.label}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-industrial-muted">
                      {queue.status}
                    </p>
                  </div>
                  <p className="text-2xl font-black text-industrial-pine">
                    {queue.value}
                  </p>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  PRD Build Order
                </p>
                <h2 className="text-xl font-black text-industrial-ink">
                  Phase 1 internal admin MVP
                </h2>
              </div>
              <PackageCheck className="text-industrial-muted" size={20} />
            </CardHeader>
            <CardBody>
              <ul className="grid gap-3">
                {phaseOnePriorities.map((priority) => (
                  <li
                    className="flex gap-3 text-sm leading-6 text-industrial-steel"
                    key={priority}
                  >
                    <CircleAlert
                      className="mt-1 shrink-0 text-industrial-pine"
                      size={16}
                    />
                    <span>{priority}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
