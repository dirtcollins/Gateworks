"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  PackageCheck,
  Search,
  Truck
} from "lucide-react";
import { D1DesignBadge, D1Page, Eyebrow, formatUsd } from "./kit";
import { useLiveOrders } from "@/features/design-lab/use-live-orders";
import type { OrderRecord } from "@/lib/order-store";

/* Display buckets mapped from the real OrderStatus enum. */
type Status = "New" | "Picking" | "Ready" | "Fulfilled";

const STATUS_LABEL: Record<OrderRecord["status"], Status> = {
  draft: "New",
  submitted: "New",
  confirmed: "Picking",
  picking: "Picking",
  ready_for_pickup: "Ready",
  out_for_delivery: "Ready",
  completed: "Fulfilled",
  cancelled: "Fulfilled"
};

const STATUS_META: Record<Status, { bg: string; text: string }> = {
  New: { bg: "#d6a93f", text: "#16150f" },
  Picking: { bg: "#6c685c", text: "#f6f3ec" },
  Ready: { bg: "#2f6f4e", text: "#f6f3ec" },
  Fulfilled: { bg: "#16150f", text: "#f6f3ec" }
};

const TABS: ("All" | Status)[] = ["All", "New", "Picking", "Ready", "Fulfilled"];

function timeAgo(iso: string): string {
  const created = new Date(iso).getTime();
  if (!Number.isFinite(created)) return "—";
  const diffMs = Date.now() - created;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function itemCount(order: OrderRecord): number {
  return order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

export function D1Orders() {
  const { orders, isLoading } = useLiveOrders();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      orders.map((order) => ({
        order,
        id: order.orderNumber,
        customer: order.companyName || order.customerName || "Walk-in customer",
        account: order.companyName ? "Trade" : "Retail",
        items: itemCount(order),
        total: order.total,
        channel:
          order.fulfillmentMethod === "delivery"
            ? ("Delivery" as const)
            : ("Will-Call" as const),
        placed: timeAgo(order.createdAt),
        status: STATUS_LABEL[order.status] ?? "New"
      })),
    [orders]
  );

  const visible = useMemo(
    () =>
      rows.filter(
        (row) =>
          (tab === "All" || row.status === tab) &&
          (query === "" ||
            row.customer.toLowerCase().includes(query.toLowerCase()) ||
            row.id.toLowerCase().includes(query.toLowerCase()))
      ),
    [rows, tab, query]
  );

  const stats = useMemo(() => {
    const open = rows.filter((row) => row.status !== "Fulfilled").length;
    const awaiting = rows.filter((row) => row.status === "Ready").length;
    const delivery = rows.filter(
      (row) => row.channel === "Delivery" && row.status !== "Fulfilled"
    ).length;
    const fulfilled = rows.filter((row) => row.status === "Fulfilled").length;
    return [
      { label: "Open orders", value: String(open), delta: "Live queue", icon: PackageCheck },
      { label: "Awaiting pickup", value: String(awaiting), delta: "Ready now", icon: Clock },
      { label: "Out for delivery", value: String(delivery), delta: "In transit", icon: Truck },
      { label: "Fulfilled", value: String(fulfilled), delta: "Completed", icon: CheckCircle2 }
    ];
  }, [rows]);

  return (
    <D1Page wide>
      <div className="pt-5">
        <D1DesignBadge />
      </div>

      <header className="border-y-2 border-d1-ink py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Operations console</Eyebrow>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-d1-ink sm:text-5xl">
              Orders
            </h1>
          </div>
          <Link
            className="inline-flex items-center gap-2 border border-d1-ink px-5 py-3 text-sm font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
            href="/design-lab/d1/reports"
          >
            View reports <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Stats */}
      <section className="grid gap-px border border-d1-line bg-d1-line py-0 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-d1-card p-5">
            <div className="flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center border border-d1-ink text-d1-ink">
                <stat.icon className="h-4.5 w-4.5" />
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-pine">
                {stat.delta}
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-d1-ink">
              {isLoading ? "—" : stat.value}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-d1-steel">
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      {/* Toolbar */}
      <section className="mt-8 flex flex-wrap items-center justify-between gap-3 border-b-2 border-d1-ink pb-3">
        <div className="flex flex-wrap gap-1">
          {TABS.map((option) => (
            <button
              key={option}
              className={`px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.1em] transition ${
                tab === option
                  ? "bg-d1-ink text-d1-paper"
                  : "text-d1-steel hover:text-d1-ink"
              }`}
              onClick={() => setTab(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 border border-d1-ink bg-white px-3 py-2">
          <Search className="h-4 w-4 text-d1-steel" />
          <input
            className="w-48 bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order or customer"
            value={query}
          />
        </div>
      </section>

      {/* Table */}
      <section className="mt-5 overflow-x-auto border border-d1-line bg-d1-card">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3 text-center">Items</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Placed</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-d1-line">
            {visible.map((row) => {
              const meta = STATUS_META[row.status];
              return (
                <tr key={row.order.id} className="transition hover:bg-white">
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-extrabold text-d1-ink">
                      {row.id}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="block text-sm font-bold text-d1-ink">
                      {row.customer}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                      {row.account}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-d1-steel">
                      {row.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm font-bold text-d1-ink">
                    {row.items}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                    {formatUsd(row.total)}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-d1-steel">
                    {row.placed}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ backgroundColor: meta.bg, color: meta.text }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-pine transition hover:underline"
                      type="button"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {isLoading ? (
          <p className="px-4 py-12 text-center text-sm font-bold text-d1-steel">
            Loading live orders…
          </p>
        ) : visible.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm font-bold text-d1-steel">
            No orders match this view.
          </p>
        ) : null}
      </section>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
        Showing {visible.length} of {rows.length} orders &middot; Live
        will-call queue
      </p>
    </D1Page>
  );
}
