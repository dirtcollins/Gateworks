"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Package,
  PackageCheck,
  Search,
  Sparkles,
  Truck
} from "lucide-react";
import { D4Shell, brandClasses } from "./shell";

type Status = "New" | "Packing" | "Ready" | "Completed";

type Order = {
  id: string;
  customer: string;
  company: string;
  items: number;
  total: number;
  status: Status;
  channel: "Online" | "Counter" | "Phone";
  placed: string;
};

const ORDERS: Order[] = [
  { id: "GW-4821", customer: "Marcus Tate", company: "Tate Fence Co.", items: 7, total: 642.18, status: "New", channel: "Online", placed: "8 min ago" },
  { id: "GW-4820", customer: "Dana Reyes", company: "Reyes Welding", items: 3, total: 218.5, status: "New", channel: "Phone", placed: "26 min ago" },
  { id: "GW-4819", customer: "Priya Shah", company: "Shah General Contracting", items: 14, total: 1894.0, status: "Packing", channel: "Online", placed: "1 hr ago" },
  { id: "GW-4818", customer: "Cody Lin", company: "Lin Ironworks", items: 5, total: 412.75, status: "Packing", channel: "Counter", placed: "2 hr ago" },
  { id: "GW-4817", customer: "Erin Walsh", company: "Walsh & Sons", items: 9, total: 778.4, status: "Ready", channel: "Online", placed: "3 hr ago" },
  { id: "GW-4816", customer: "Sam Doyle", company: "Doyle Gates LLC", items: 2, total: 96.0, status: "Ready", channel: "Online", placed: "4 hr ago" },
  { id: "GW-4815", customer: "Nina Ortiz", company: "Ortiz Metal Design", items: 11, total: 1340.2, status: "Completed", channel: "Counter", placed: "Yesterday" },
  { id: "GW-4814", customer: "Will Chen", company: "Chen Fabrication", items: 6, total: 503.6, status: "Completed", channel: "Phone", placed: "Yesterday" }
];

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

export function D4Orders() {
  const [tab, setTab] = useState<"All" | Status>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      ORDERS.filter(
        (o) =>
          (tab === "All" || o.status === tab) &&
          (o.customer.toLowerCase().includes(query.toLowerCase()) ||
            o.id.toLowerCase().includes(query.toLowerCase()) ||
            o.company.toLowerCase().includes(query.toLowerCase()))
      ),
    [tab, query]
  );

  const counts = useMemo(
    () => ({
      open: ORDERS.filter((o) => o.status !== "Completed").length,
      ready: ORDERS.filter((o) => o.status === "Ready").length,
      revenue: ORDERS.reduce((s, o) => s + o.total, 0),
      avg:
        ORDERS.reduce((s, o) => s + o.total, 0) / ORDERS.length || 0
    }),
    []
  );

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
            Good morning — {counts.open} orders need attention today. Keep them
            moving.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Open orders", value: String(counts.open), icon: Clock, trend: "+2 vs yesterday", tint: "bg-orange-100 text-orange-600" },
            { label: "Ready for pickup", value: String(counts.ready), icon: Truck, trend: "Notify customers", tint: "bg-violet-100 text-violet-600" },
            { label: "Revenue today", value: `$${counts.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: ArrowUpRight, trend: "+18% week-over-week", tint: "bg-emerald-100 text-emerald-600" },
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
                  ? ORDERS.length
                  : ORDERS.filter((o) => o.status === t).length;
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
          {filtered.length === 0 ? (
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
                          <p className="font-bold text-slate-900">{o.id}</p>
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
                          {o.items}
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
            Showing {filtered.length} of {ORDERS.length} orders
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
