"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Plus,
  TrendingUp
} from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminCard,
  AdminEmptyState,
  AdminHeader,
  AdminPill,
  AdminStatGrid,
  AdminSection
} from "@/features/sites/industrial/admin/kit";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import type { OrderStatus } from "@/lib/platform-backend";
import type { ReportData } from "@/features/admin/reports/reports-dashboard";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin dashboard. Combines server-fetched Supabase
 * report aggregates with the live client order store for an open-work
 * snapshot. Receives `data: ReportData` from the server page.
 * ------------------------------------------------------------------ */

const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Draft",
  submitted: "Pending",
  confirmed: "Processing",
  picking: "Picking",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled"
};

const OPEN_STATUSES: OrderStatus[] = [
  "draft",
  "submitted",
  "confirmed",
  "picking",
  "ready_for_pickup",
  "out_for_delivery"
];

function statusTone(status: OrderStatus) {
  if (status === "completed") return "ink" as const;
  if (status === "cancelled") return "red" as const;
  if (status === "ready_for_pickup" || status === "out_for_delivery") {
    return "pine" as const;
  }
  if (status === "submitted" || status === "draft") return "amber" as const;
  return "neutral" as const;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

type OrdersResponse = {
  orders?: OrderRecord[];
  persisted?: boolean;
};

export function IndustrialAdminDashboard({ data }: { data: ReportData }) {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/orders?limit=250&includeItems=false", {
          cache: "no-store"
        });
        if (!response.ok) return;
        const payload = (await response.json()) as OrdersResponse;
        if (payload.persisted && payload.orders) {
          setOrders(payload.orders);
        }
      } finally {
        setLoaded(true);
      }
    }

    void loadOrders();
  }, [setOrders]);

  const orders = useMemo(
    () => storedOrders.filter((order) => !order.isQuoteRequest),
    [storedOrders]
  );
  const quoteRequests = useMemo(
    () => storedOrders.filter((order) => order.isQuoteRequest),
    [storedOrders]
  );

  const openOrders = useMemo(
    () => orders.filter((order) => OPEN_STATUSES.includes(order.status)),
    [orders]
  );
  const readyOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status === "ready_for_pickup" ||
          order.status === "out_for_delivery"
      ),
    [orders]
  );

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime()
        )
        .slice(0, 6),
    [orders]
  );

  const stats = [
    {
      label: "Revenue (30d)",
      value: data.configured ? formatUsd(data.revenue30) : "—",
      hint: data.configured
        ? `${data.orders30} orders billed`
        : "Connect Supabase"
    },
    {
      label: "Open orders",
      value: loaded ? String(openOrders.length) : "—",
      hint: "In the active queue"
    },
    {
      label: "Ready to hand off",
      value: loaded ? String(readyOrders.length) : "—",
      hint: "Pickup or delivery staged"
    },
    {
      label: "Outstanding AR",
      value: data.configured ? formatUsd(data.outstanding) : "—",
      hint: data.configured ? `${formatUsd(data.collected)} collected` : "Connect Supabase"
    }
  ];

  return (
    <div className="grid gap-8">
      <AdminHeader
        eyebrow="Operations console"
        title="Dashboard"
        description="A live snapshot of revenue, the open order queue, and quote pipeline pressure."
        action={
          <Link
            className="inline-flex items-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
            href="/industrial/admin/orders/new"
          >
            <Plus className="h-4 w-4" /> New order
          </Link>
        }
      />

      <AdminStatGrid stats={stats} />

      {/* Quick actions */}
      <section className="grid gap-px border border-d1-line bg-d1-line sm:grid-cols-3">
        {[
          {
            label: "Create order",
            href: "/industrial/admin/orders/new",
            Icon: Plus
          },
          {
            label: "Review orders",
            href: "/industrial/admin/orders",
            Icon: ClipboardList
          },
          {
            label: "Quote pipeline",
            href: "/industrial/admin/quotes",
            Icon: FileText
          }
        ].map((action) => (
          <Link
            className="group flex items-center justify-between gap-3 bg-d1-card px-5 py-4 transition hover:bg-d1-paper"
            href={action.href}
            key={action.label}
          >
            <span className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center border border-d1-ink text-d1-ink">
                <action.Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold text-d1-ink">{action.label}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-d1-steel transition group-hover:translate-x-0.5 group-hover:text-d1-pine" />
          </Link>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Recent orders */}
        <div className="lg:col-span-7">
          <AdminSection
            title="Recent orders"
            action={
              <Link
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-pine hover:underline"
                href="/industrial/admin/orders"
              >
                All orders <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            {recentOrders.length ? (
              <AdminCard>
                <div className="divide-y divide-d1-line">
                  {recentOrders.map((order) => (
                    <Link
                      className="flex items-center justify-between gap-4 px-4 py-3.5 transition hover:bg-d1-paper"
                      href={`/industrial/admin/orders/${order.id}`}
                      key={order.id}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-d1-ink">
                          {order.companyName || order.customerName || "Walk-in"}
                        </p>
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                          {order.orderNumber} &middot;{" "}
                          {dateTimeFormatter.format(new Date(order.createdAt))}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <AdminPill tone={statusTone(order.status)}>
                          {STATUS_LABELS[order.status]}
                        </AdminPill>
                        <span className="w-24 text-right text-sm font-extrabold text-d1-ink">
                          {formatUsd(order.total)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </AdminCard>
            ) : (
              <AdminEmptyState
                title={loaded ? "No orders yet" : "Loading orders…"}
                description={
                  loaded
                    ? "Create your first order to populate the queue."
                    : undefined
                }
              />
            )}
          </AdminSection>
        </div>

        {/* Pipeline + AR */}
        <div className="lg:col-span-5 grid gap-8">
          <AdminSection title="Quote pipeline">
            <AdminCard className="p-5">
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-extrabold text-d1-ink">
                  {loaded ? quoteRequests.length : "—"}
                </p>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                  open quote requests
                </span>
              </div>
              <Link
                className="mt-4 flex items-center justify-between border-2 border-d1-ink bg-d1-ink px-4 py-3 text-d1-paper transition hover:bg-d1-pine"
                href="/industrial/admin/quotes"
              >
                <span className="text-sm font-bold">Open quote workspace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </AdminCard>
          </AdminSection>

          <AdminSection title="Accounts receivable">
            <AdminCard className="divide-y divide-d1-line">
              {data.configured ? (
                <>
                  {data.aging.map((bucket) => (
                    <div
                      className="flex items-center justify-between px-4 py-3"
                      key={bucket.bucket}
                    >
                      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                        {bucket.bucket} days
                      </span>
                      <span className="text-sm font-extrabold text-d1-ink">
                        {formatUsd(bucket.total)}
                      </span>
                    </div>
                  ))}
                  <Link
                    className="flex items-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-pine hover:underline"
                    href="/industrial/admin/reports"
                  >
                    <TrendingUp className="h-3.5 w-3.5" /> Full reports
                  </Link>
                </>
              ) : (
                <div className="px-4 py-6 text-center text-sm font-semibold text-d1-steel">
                  Connect Supabase to populate receivable aging.
                </div>
              )}
            </AdminCard>
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
