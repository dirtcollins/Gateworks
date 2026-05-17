"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  PackageCheck,
  Search,
  Sparkles,
  Truck
} from "lucide-react";
import { useLiveOrders } from "@/features/design-lab/use-live-orders";
import type { OrderRecord } from "@/lib/order-store";
import { D4Shell, brandClasses } from "./shell";

type Status = "New" | "Packing" | "Ready" | "Completed";

// Maps real OrderRecord statuses onto the design's 4-bucket model.
function toDisplayStatus(status: OrderRecord["status"]): Status {
  if (status === "completed") return "Completed";
  if (status === "ready_for_pickup" || status === "out_for_delivery")
    return "Ready";
  if (status === "confirmed" || status === "picking") return "Packing";
  return "New";
}

const STATUS_META: Record<
  Status,
  { tint: string; dot: string; icon: typeof Clock }
> = {
  New: { tint: "bg-orange-100 text-orange-700", dot: "bg-orange-500", icon: Sparkles },
  Packing: { tint: "bg-sky-100 text-sky-700", dot: "bg-sky-500", icon: Package },
  Ready: { tint: "bg-violet-100 text-violet-700", dot: "bg-violet-500", icon: PackageCheck },
  Completed: { tint: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", icon: CheckCircle2 }
};

const TABS: ("All" | Status)[] = ["All", "New", "Packing", "Ready", "Completed"];

function relativeTime(value: string) {
  const created = new Date(value).getTime();
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

type Row = {
  id: string;
  orderNumber: string;
  customer: string;
  company: string;
  itemCount: number;
  total: number;
  status: Status;
  channel: string;
  placed: string;
};

export function D4Orders() {
  const { orders, isLoading } = useLiveOrders();
  const [tab, setTab] = useState<"All" | Status>("All");
  const [query, setQuery] = useState("");

  const rows = useMemo<Row[]>(
    () =>
      orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customerName || "Guest customer",
        company: order.companyName || order.customerName || "—",
        itemCount: order.items.reduce(
          (sum, item) => sum + (item.quantity || 0),
          0
        ),
        total: order.total,
        status: toDisplayStatus(order.status),
        channel: order.isQuoteRequest
          ? "Quote"
          : order.fulfillmentMethod === "pickup"
            ? "Pickup"
            : "Delivery",
        placed: relativeTime(order.createdAt)
      })),
    [orders]
  );

  const filtered = useMemo(
    () =>
      rows.filter(
        (o) =>
          (tab === "All" || o.status === tab) &&
          (o.customer.toLowerCase().includes(query.toLowerCase()) ||
            o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
            o.company.toLowerCase().includes(query.toLowerCase()))
      ),
    [rows, tab, query]
  );

  const counts = useMemo(() => {
    const revenue = rows.reduce((sum, o) => sum + o.total, 0);
    return {
      open: rows.filter((o) => o.status !== "Completed").length,
      ready: rows.filter((o) => o.status === "Ready").length,
      revenue,
      avg: rows.length ? revenue / rows.length : 0
    };
  }, [rows]);

  return (
    <D4Shell active="orders">
      <div className="border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="mx-auto max-w-6xl px-5 py-7">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            Operations
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Orders dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Good morning — {counts.open} order{counts.open === 1 ? "" : "s"}{" "}
            need attention today. Keep them moving.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Open orders", value: String(counts.open), icon: Clock, trend: "Needs attention", tint: "bg-orange-100 text-orange-600" },
            { label: "Ready for pickup", value: String(counts.ready), icon: Truck, trend: "Notify customers", tint: "bg-violet-100 text-violet-600" },
            { label: "Total revenue", value: `$${counts.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: ArrowUpRight, trend: "Across all orders", tint: "bg-emerald-100 text-emerald-600" },
            { label: "Avg. order value", value: `$${counts.avg.toFixed(0)}`, icon: Package, trend: "Healthy", tint: "bg-sky-100 text-sky-600" }
          ].map((s) => (
            <div key={s.label} className={`${brandClasses.card} p-5`}>
              <div
                className={`grid h-10 w-10 place-items-center rounded-xl ${s.tint}`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">
                {s.value}
              </p>
              <p className="text-sm font-semibold text-slate-500">{s.label}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                {s.trend}
              </p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => {
              const n =
                t === "All"
                  ? rows.length
                  : rows.filter((o) => o.status === t).length;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                    tab === t
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-orange-300"
                  }`}
                >
                  {t}
                  <span
                    className={`ml-1.5 text-xs ${
                      tab === t ? "text-orange-100" : "text-slate-400"
                    }`}
                  >
                    {n}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders, customers..."
              className="w-44 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className={`${brandClasses.card} mt-4 overflow-hidden`}>
          {isLoading ? (
            <div className="grid place-items-center py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading live orders…
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="grid place-items-center py-20 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-500">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <p className="mt-4 text-lg font-bold text-slate-900">
                All caught up!
              </p>
              <p className="mt-1 text-sm text-slate-500">
                No orders match this view. Time for a coffee.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3">Order</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Channel</th>
                    <th className="px-5 py-3">Items</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => {
                    const meta = STATUS_META[o.status];
                    return (
                      <tr
                        key={o.id}
                        className="border-b border-slate-50 transition last:border-0 hover:bg-orange-50/40"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-slate-900">
                            {o.orderNumber}
                          </p>
                          <p className="text-xs text-slate-400">{o.placed}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-800">
                            {o.customer}
                          </p>
                          <p className="text-xs text-slate-400">{o.company}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                            {o.channel}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {o.itemCount}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          ${o.total.toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${meta.tint}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
                            />
                            {o.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            className="rounded-lg px-3 py-1.5 text-xs font-bold text-orange-600 hover:bg-orange-50"
                          >
                            {o.status === "New"
                              ? "Start packing"
                              : o.status === "Packing"
                                ? "Mark ready"
                                : o.status === "Ready"
                                  ? "Complete"
                                  : "View"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Showing {filtered.length} of {rows.length} orders
          </p>
          <Link
            href="/design-lab/d4/reports"
            className="flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700"
          >
            View reports <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </D4Shell>
  );
}
