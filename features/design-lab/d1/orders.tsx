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

type Status = "New" | "Picking" | "Ready" | "Fulfilled";

type Order = {
  id: string;
  customer: string;
  account: string;
  items: number;
  total: number;
  channel: "Will-Call" | "Delivery";
  placed: string;
  status: Status;
};

const ORDERS: Order[] = [
  { id: "GW-10428", customer: "Ridgeline Fence Co.", account: "Trade", items: 6, total: 1284.5, channel: "Delivery", placed: "8 min ago", status: "New" },
  { id: "GW-10427", customer: "Marcus Trujillo", account: "Retail", items: 2, total: 178.0, channel: "Will-Call", placed: "31 min ago", status: "New" },
  { id: "GW-10426", customer: "Foothill Welding LLC", account: "Trade", items: 14, total: 3940.0, channel: "Delivery", placed: "1 hr ago", status: "Picking" },
  { id: "GW-10425", customer: "Anvil Gate & Door", account: "Trade", items: 9, total: 2210.75, channel: "Will-Call", placed: "2 hr ago", status: "Picking" },
  { id: "GW-10424", customer: "Sandra Okafor", account: "Retail", items: 3, total: 96.25, channel: "Will-Call", placed: "3 hr ago", status: "Ready" },
  { id: "GW-10423", customer: "Cascade Iron Works", account: "Trade", items: 22, total: 5612.0, channel: "Delivery", placed: "4 hr ago", status: "Ready" },
  { id: "GW-10422", customer: "Pinnacle Builders", account: "Trade", items: 5, total: 884.0, channel: "Will-Call", placed: "Yesterday", status: "Fulfilled" },
  { id: "GW-10421", customer: "Dale Hutchins", account: "Retail", items: 1, total: 52.0, channel: "Will-Call", placed: "Yesterday", status: "Fulfilled" }
];

const STATUS_META: Record<Status, { bg: string; text: string }> = {
  New: { bg: "#d6a93f", text: "#16150f" },
  Picking: { bg: "#6c685c", text: "#f6f3ec" },
  Ready: { bg: "#2f6f4e", text: "#f6f3ec" },
  Fulfilled: { bg: "#16150f", text: "#f6f3ec" }
};

const TABS: ("All" | Status)[] = ["All", "New", "Picking", "Ready", "Fulfilled"];

const STATS = [
  { label: "Open orders", value: "18", delta: "+4 today", icon: PackageCheck },
  { label: "Awaiting pickup", value: "7", delta: "2 over 24h", icon: Clock },
  { label: "Out for delivery", value: "5", delta: "3 routes", icon: Truck },
  { label: "Fulfilled today", value: "23", delta: "+12% vs avg", icon: CheckCircle2 }
];

export function D1Orders() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () =>
      ORDERS.filter(
        (order) =>
          (tab === "All" || order.status === tab) &&
          (query === "" ||
            order.customer.toLowerCase().includes(query.toLowerCase()) ||
            order.id.toLowerCase().includes(query.toLowerCase()))
      ),
    [tab, query]
  );

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
        {STATS.map((stat) => (
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
              {stat.value}
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
            {visible.map((order) => {
              const meta = STATUS_META[order.status];
              return (
                <tr key={order.id} className="transition hover:bg-white">
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-extrabold text-d1-ink">
                      {order.id}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="block text-sm font-bold text-d1-ink">
                      {order.customer}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                      {order.account}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-d1-steel">
                      {order.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm font-bold text-d1-ink">
                    {order.items}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                    {formatUsd(order.total)}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-d1-steel">
                    {order.placed}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ backgroundColor: meta.bg, color: meta.text }}
                    >
                      {order.status}
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
        {visible.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm font-bold text-d1-steel">
            No orders match this view.
          </p>
        ) : null}
      </section>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
        Showing {visible.length} of {ORDERS.length} orders &middot; Live
        will-call queue
      </p>
    </D1Page>
  );
}
