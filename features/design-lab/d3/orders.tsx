"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Package, Search } from "lucide-react";
import { D3Shell, Eyebrow, d3, serif } from "./shared";

/** DESIGN 3 — "Editorial Catalog" — Admin orders dashboard. */

type Status = "New" | "Picking" | "Ready" | "Delivered";

type Order = {
  id: string;
  customer: string;
  account: string;
  placed: string;
  items: number;
  total: number;
  status: Status;
  channel: "Will-call" | "Delivery";
};

const orders: Order[] = [
  { id: "GW-4821", customer: "Marsh Fabrication", account: "Trade B", placed: "May 17, 8:04a", items: 14, total: 1284.5, status: "New", channel: "Delivery" },
  { id: "GW-4820", customer: "Rivera Welding", account: "Trade A", placed: "May 17, 7:41a", items: 6, total: 442.0, status: "Picking", channel: "Will-call" },
  { id: "GW-4819", customer: "Northgate Ranch", account: "Retail", placed: "May 16, 4:22p", items: 9, total: 768.25, status: "Ready", channel: "Will-call" },
  { id: "GW-4818", customer: "Atlas Gate Co.", account: "Trade B", placed: "May 16, 2:10p", items: 22, total: 3110.8, status: "Picking", channel: "Delivery" },
  { id: "GW-4817", customer: "Helena Iron Works", account: "Trade A", placed: "May 16, 11:35a", items: 4, total: 198.6, status: "Delivered", channel: "Delivery" },
  { id: "GW-4816", customer: "B. Coleman", account: "Retail", placed: "May 15, 5:48p", items: 2, total: 86.4, status: "Delivered", channel: "Will-call" },
  { id: "GW-4815", customer: "Summit Builders", account: "Trade B", placed: "May 15, 3:02p", items: 31, total: 4520.0, status: "Ready", channel: "Delivery" }
];

const statusFilters: ("All" | Status)[] = ["All", "New", "Picking", "Ready", "Delivered"];

const statusStyle: Record<Status, { dot: string; label: string }> = {
  New: { dot: "#9a7b3f", label: "Awaiting pick" },
  Picking: { dot: "#b07a4e", label: "On the floor" },
  Ready: { dot: "#2f6f4e", label: "Staged" },
  Delivered: { dot: "#8d887d", label: "Closed" }
};

export function D3Orders() {
  const [filter, setFilter] = useState<"All" | Status>("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(orders[0].id);

  const visible = useMemo(
    () =>
      orders.filter(
        (o) =>
          (filter === "All" || o.status === filter) &&
          (query === "" ||
            o.customer.toLowerCase().includes(query.toLowerCase()) ||
            o.id.toLowerCase().includes(query.toLowerCase()))
      ),
    [filter, query]
  );

  const detail = orders.find((o) => o.id === selected) ?? orders[0];

  const stats = [
    { k: "Open orders", v: orders.filter((o) => o.status !== "Delivered").length, n: "Across the floor" },
    { k: "Ready for pickup", v: orders.filter((o) => o.status === "Ready").length, n: "Staged at will-call" },
    { k: "Day's revenue", v: "$6.0k", n: "Booked since open" },
    { k: "Avg. lines / order", v: 13, n: "Trailing 7 days" }
  ];

  return (
    <D3Shell active="Orders" variant="admin">
      <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8 sm:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>The Studio — Operations</Eyebrow>
            <h1
              className={`${serif} mt-3 text-[2.6rem] font-semibold leading-none tracking-[-0.02em] sm:text-[3.4rem]`}
            >
              Orders desk
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: d3.graphite }}>
              Every order on the floor, composed like a contents page — date,
              account, status, and what's left to pick.
            </p>
          </div>
          <Link
            href="/design-lab/d3/reports"
            className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.14em]"
            style={{ borderColor: d3.ink }}
          >
            View reports <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* stat strip */}
        <div
          className="mt-9 grid grid-cols-2 divide-y border sm:grid-cols-4 sm:divide-x sm:divide-y-0"
          style={{ borderColor: d3.rule, background: d3.card }}
        >
          {stats.map((s) => (
            <div key={s.k} className="p-5" style={{ borderColor: d3.rule }}>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]" style={{ color: d3.haze }}>
                {s.k}
              </p>
              <p className={`${serif} mt-2 text-4xl font-semibold`}>{s.v}</p>
              <p className="mt-1 text-[0.72rem]" style={{ color: d3.haze }}>
                {s.n}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* toolbar */}
      <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8">
        <div
          className="flex flex-col gap-4 border-y py-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: d3.rule }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {statusFilters.map((s) => {
              const sel = s === filter;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(s)}
                  className="rounded-full px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.14em] transition-colors"
                  style={{
                    background: sel ? d3.ink : "transparent",
                    color: sel ? d3.paper : d3.graphite,
                    border: `1px solid ${sel ? d3.ink : d3.rule}`
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <div
            className="flex items-center gap-2 rounded-full border px-4 py-2 sm:w-72"
            style={{ borderColor: d3.rule }}
          >
            <Search className="h-4 w-4" style={{ color: d3.haze }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order or customer"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>
      </section>

      {/* split — list + detail */}
      <section className="mx-auto max-w-[1280px] px-5 pt-8 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* list */}
          <div>
            <div
              className="hidden grid-cols-[auto_1fr_auto_auto] gap-5 border-b pb-3 text-[0.66rem] font-semibold uppercase tracking-[0.2em] sm:grid"
              style={{ borderColor: d3.rule, color: d3.haze }}
            >
              <span>Order</span>
              <span>Customer</span>
              <span className="text-right">Total</span>
              <span className="text-right">Status</span>
            </div>
            <ul>
              {visible.map((o) => {
                const sel = o.id === selected;
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(o.id)}
                      className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-5 border-b py-4 text-left sm:grid-cols-[auto_1fr_auto_auto]"
                      style={{
                        borderColor: d3.rule,
                        background: sel ? d3.card : "transparent"
                      }}
                    >
                      <span
                        className={`${serif} text-lg font-semibold`}
                        style={{ color: sel ? d3.brass : d3.ink }}
                      >
                        {o.id}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{o.customer}</span>
                        <span className="text-[0.72rem]" style={{ color: d3.haze }}>
                          {o.placed} · {o.account} · {o.channel}
                        </span>
                      </span>
                      <span className={`${serif} hidden text-right text-lg font-semibold sm:block`}>
                        ${o.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="flex items-center justify-end gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: statusStyle[o.status].dot }}
                        />
                        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]">
                          {o.status}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {visible.length === 0 ? (
              <p className="py-12 text-center text-sm" style={{ color: d3.haze }}>
                No orders match that filter.
              </p>
            ) : null}
          </div>

          {/* detail panel */}
          <aside>
            <div
              className="border p-7"
              style={{ borderColor: d3.rule, background: d3.card }}
            >
              <div className="flex items-center justify-between">
                <Eyebrow>Order file</Eyebrow>
                <span
                  className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em]"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: statusStyle[detail.status].dot }}
                  />
                  {statusStyle[detail.status].label}
                </span>
              </div>
              <h2 className={`${serif} mt-3 text-3xl font-semibold`}>{detail.id}</h2>
              <p className="text-sm" style={{ color: d3.graphite }}>
                {detail.customer} — {detail.account}
              </p>

              <dl
                className="mt-6 space-y-3 border-t pt-5 text-sm"
                style={{ borderColor: d3.rule }}
              >
                {[
                  ["Placed", detail.placed],
                  ["Fulfilment", detail.channel],
                  ["Line items", `${detail.items} lines`],
                  ["Order total", `$${detail.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt style={{ color: d3.haze }}>{k}</dt>
                    <dd className="font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>

              {/* pick progress */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-[0.72rem] uppercase tracking-[0.14em]" style={{ color: d3.haze }}>
                  <span>Pick progress</span>
                  <span>
                    {detail.status === "New"
                      ? "0%"
                      : detail.status === "Picking"
                        ? "60%"
                        : "100%"}
                  </span>
                </div>
                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                  style={{ background: d3.rule }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width:
                        detail.status === "New"
                          ? "8%"
                          : detail.status === "Picking"
                            ? "60%"
                            : "100%",
                      background: d3.brass
                    }}
                  />
                </div>
              </div>

              <div
                className="mt-6 flex items-center gap-3 border-t pt-5 text-[0.78rem] leading-relaxed"
                style={{ borderColor: d3.rule, color: d3.graphite }}
              >
                <Package className="h-4 w-4 shrink-0" style={{ color: d3.brass }} />
                <span>
                  {detail.channel === "Will-call"
                    ? "Bundle to the will-call rack once picked."
                    : "Route to the next delivery run."}
                </span>
              </div>

              <button
                type="button"
                className="mt-6 w-full rounded-full px-6 py-3.5 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-white"
                style={{ background: d3.ink }}
              >
                Advance status
              </button>
              <button
                type="button"
                className="mt-3 w-full rounded-full border px-6 py-3 text-[0.76rem] font-semibold uppercase tracking-[0.14em]"
                style={{ borderColor: d3.ink }}
              >
                Print pick ticket
              </button>
            </div>
          </aside>
        </div>
      </section>
    </D3Shell>
  );
}
