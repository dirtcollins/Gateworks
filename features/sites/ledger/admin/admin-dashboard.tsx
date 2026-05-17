"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Plus,
  Wallet
} from "lucide-react";
import { LEDGER, formatUsd, formatUsd0 } from "@/features/sites/ledger/kit";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import { useQuoteStore } from "@/lib/quote-store";
import { calculateTax } from "@/lib/tax";
import {
  AdminCard,
  AdminHeading,
  AdminPrimaryButton,
  StatTile,
  StatusPill,
  formatAdminDate,
  orderStatusTone
} from "./admin-kit";

const FULFILLMENT_QUEUE = new Set([
  "submitted",
  "confirmed",
  "picking",
  "ready_for_pickup",
  "out_for_delivery"
]);

const orderStatusLabels: Record<OrderRecord["status"], string> = {
  draft: "Draft",
  submitted: "Pending",
  confirmed: "Processing",
  picking: "Picking",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled"
};

function amountPaid(order: OrderRecord) {
  const recorded = (order.payments || []).reduce((sum, payment) => sum + payment.amount, 0);
  if (recorded > 0) return recorded;
  if (order.paymentStatus === "paid" || order.paymentStatus === "overpaid") return order.total;
  return 0;
}

function amountOwed(order: OrderRecord) {
  if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") return 0;
  return Math.max(order.total - amountPaid(order), 0);
}

function isSameMonth(value: string, ref: Date) {
  const parsed = new Date(value);
  return (
    parsed.getFullYear() === ref.getFullYear() &&
    parsed.getMonth() === ref.getMonth()
  );
}

/* Ledger admin dashboard — a live KPI snapshot. Pulls real orders from
 * the /api/orders backend into the order store and reads the real quote
 * store for pipeline value. */
export function LedgerAdminDashboard() {
  const storeOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const quotes = useQuoteStore((state) => state.quotes);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "local">("loading");

  useEffect(() => {
    let mounted = true;
    void useQuoteStore.persist.rehydrate();

    async function load() {
      try {
        const response = await fetch("/api/orders?limit=200&includeItems=false", {
          cache: "no-store"
        });
        const payload = (await response.json().catch(() => null)) as {
          orders?: OrderRecord[];
          persisted?: boolean;
        } | null;

        if (!mounted) return;

        if (response.ok && payload?.persisted && payload.orders) {
          setOrders(payload.orders);
          setLoadState("loaded");
        } else {
          setLoadState("local");
        }
      } catch {
        if (mounted) setLoadState("local");
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [setOrders]);

  const liveOrders = useMemo(
    () => storeOrders.filter((order) => !order.isQuoteRequest),
    [storeOrders]
  );

  const stats = useMemo(() => {
    const now = new Date();
    const active = liveOrders.filter((order) => order.status !== "cancelled");
    const monthRevenue = active
      .filter((order) => isSameMonth(order.createdAt, now))
      .reduce((sum, order) => sum + order.total, 0);
    const outstanding = liveOrders.reduce((sum, order) => sum + amountOwed(order), 0);
    const queue = liveOrders.filter((order) => FULFILLMENT_QUEUE.has(order.status));
    const pipeline = quotes
      .filter((quote) => quote.status !== "invoiced")
      .reduce((sum, quote) => {
        const subtotal = quote.items.reduce(
          (lineSum, item) => lineSum + item.price * item.quantity,
          0
        );
        return sum + subtotal + calculateTax(subtotal);
      }, 0);

    return {
      monthRevenue,
      activeCount: active.length,
      queueCount: queue.length,
      outstanding,
      pipeline,
      openQuotes: quotes.filter((quote) => quote.status !== "invoiced").length
    };
  }, [liveOrders, quotes]);

  const fulfillmentQueue = useMemo(
    () =>
      liveOrders
        .filter((order) => FULFILLMENT_QUEUE.has(order.status))
        .slice(0, 6),
    [liveOrders]
  );

  const recentOrders = useMemo(
    () =>
      [...liveOrders]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 6),
    [liveOrders]
  );

  return (
    <div className="grid gap-6">
      <AdminHeading
        eyebrow="Operations"
        title="Dashboard"
        description="A live snapshot of revenue, the fulfillment queue, accounts receivable, and quote pipeline."
        action={
          <Link href="/ledger/admin/orders/new">
            <AdminPrimaryButton>
              <Plus className="h-4 w-4" /> New order
            </AdminPrimaryButton>
          </Link>
        }
      />

      {loadState === "local" ? (
        <div
          className="rounded-2xl p-4 text-[13px] font-medium"
          style={{ backgroundColor: LEDGER.amberSoft, color: LEDGER.amber }}
        >
          Live order data is unavailable. The dashboard is showing orders saved
          in this browser only.
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Revenue this month"
          value={formatUsd0(stats.monthRevenue)}
          sub={`${stats.activeCount} active orders`}
        />
        <StatTile
          label="Fulfillment queue"
          value={String(stats.queueCount)}
          sub="Orders awaiting action"
          accent={stats.queueCount > 0 ? LEDGER.indigo : undefined}
        />
        <StatTile
          label="Outstanding AR"
          value={formatUsd0(stats.outstanding)}
          sub="Unpaid order balance"
          accent={stats.outstanding > 0 ? LEDGER.amber : LEDGER.mint}
        />
        <StatTile
          label="Quote pipeline"
          value={formatUsd0(stats.pipeline)}
          sub={`${stats.openQuotes} open quotes`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {/* Fulfillment queue */}
        <AdminCard>
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${LEDGER.line}` }}
          >
            <p className="text-[13px] font-semibold" style={{ color: LEDGER.ink }}>
              Fulfillment queue
            </p>
            <Link
              className="inline-flex items-center gap-1 text-[12px] font-semibold transition hover:underline"
              href="/ledger/admin/orders"
              style={{ color: LEDGER.indigo }}
            >
              All orders <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {fulfillmentQueue.length ? (
            <div>
              {fulfillmentQueue.map((order) => (
                <Link
                  key={order.id}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-[#fafbfc]"
                  href={`/ledger/admin/orders/${order.id}`}
                  style={{ borderBottom: `1px solid ${LEDGER.line}` }}
                >
                  <div className="min-w-0">
                    <p
                      className="truncate text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {order.orderNumber}
                    </p>
                    <p className="truncate text-[12px]" style={{ color: LEDGER.body }}>
                      {order.companyName || order.customerName || "Unassigned"}
                    </p>
                  </div>
                  <StatusPill tone={orderStatusTone(order.status)}>
                    {orderStatusLabels[order.status]}
                  </StatusPill>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-5 py-8">
              <ClipboardList className="h-5 w-5" style={{ color: LEDGER.muted }} />
              <p className="text-[13px]" style={{ color: LEDGER.body }}>
                Nothing in the queue. Every order is fulfilled.
              </p>
            </div>
          )}
        </AdminCard>

        {/* Recent orders */}
        <AdminCard>
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${LEDGER.line}` }}
          >
            <p className="text-[13px] font-semibold" style={{ color: LEDGER.ink }}>
              Recent orders
            </p>
            <Link
              className="inline-flex items-center gap-1 text-[12px] font-semibold transition hover:underline"
              href="/ledger/admin/reports"
              style={{ color: LEDGER.indigo }}
            >
              Reports <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentOrders.length ? (
            <div>
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-[#fafbfc]"
                  href={`/ledger/admin/orders/${order.id}`}
                  style={{ borderBottom: `1px solid ${LEDGER.line}` }}
                >
                  <div className="min-w-0">
                    <p
                      className="truncate text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {order.orderNumber}
                    </p>
                    <p className="truncate text-[12px]" style={{ color: LEDGER.body }}>
                      {formatAdminDate(order.createdAt)} ·{" "}
                      {order.companyName || order.customerName || "Unassigned"}
                    </p>
                  </div>
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: LEDGER.ink }}
                  >
                    {formatUsd(order.total)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 px-5 py-8">
              <Wallet className="h-5 w-5" style={{ color: LEDGER.muted }} />
              <p className="text-[13px]" style={{ color: LEDGER.body }}>
                No orders recorded yet.
              </p>
            </div>
          )}
        </AdminCard>
      </section>

      {/* Quick links */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            href: "/ledger/admin/orders/new",
            label: "Create order",
            detail: "Build a new purchase order",
            Icon: Plus
          },
          {
            href: "/ledger/admin/quotes",
            label: "Quotes",
            detail: "Price and send estimates",
            Icon: FileText
          },
          {
            href: "/ledger/admin/reports",
            label: "Financial reports",
            detail: "Revenue, margin, and AR",
            Icon: Wallet
          }
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <AdminCard className="flex items-center gap-3 p-4 transition hover:bg-[#fafbfc]">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                style={{ backgroundColor: LEDGER.indigoSoft, color: LEDGER.indigo }}
              >
                <link.Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: LEDGER.ink }}
                >
                  {link.label}
                </p>
                <p className="text-[12px]" style={{ color: LEDGER.body }}>
                  {link.detail}
                </p>
              </div>
            </AdminCard>
          </Link>
        ))}
      </section>
    </div>
  );
}
