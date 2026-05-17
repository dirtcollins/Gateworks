"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Package, Search } from "lucide-react";
import { useLiveOrders } from "@/features/design-lab/use-live-orders";
import type { OrderRecord } from "@/lib/order-store";
import type { OrderStatus } from "@/lib/platform-backend";
import { formatCurrency } from "@/lib/utils";
import { D3Shell, Eyebrow, d3, serif } from "./shared";

/** DESIGN 3 — "Editorial Catalog" — Admin orders dashboard. Live orders. */

// Editorial status presentation for each real OrderStatus.
const statusStyle: Record<
  OrderStatus,
  { dot: string; label: string; short: string; progress: number }
> = {
  draft: { dot: "#8d887d", label: "Draft", short: "Draft", progress: 4 },
  submitted: { dot: "#9a7b3f", label: "Awaiting pick", short: "New", progress: 12 },
  confirmed: { dot: "#9a7b3f", label: "Confirmed", short: "Confirmed", progress: 24 },
  picking: { dot: "#b07a4e", label: "On the floor", short: "Picking", progress: 60 },
  ready_for_pickup: { dot: "#2f6f4e", label: "Staged at will-call", short: "Ready", progress: 100 },
  out_for_delivery: { dot: "#2f6f4e", label: "On the route", short: "Out", progress: 92 },
  completed: { dot: "#8d887d", label: "Closed", short: "Done", progress: 100 },
  cancelled: { dot: "#b42318", label: "Cancelled", short: "Void", progress: 0 }
};

const filterChips: Array<{ label: string; match: (status: OrderStatus) => boolean }> = [
  { label: "All", match: () => true },
  { label: "New", match: (s) => s === "submitted" || s === "confirmed" },
  { label: "Picking", match: (s) => s === "picking" },
  { label: "Ready", match: (s) => s === "ready_for_pickup" || s === "out_for_delivery" },
  { label: "Delivered", match: (s) => s === "completed" }
];

function formatPlaced(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function customerOf(order: OrderRecord) {
  return order.companyName || order.customerName || "Unknown customer";
}

export function D3Orders() {
  const { orders, isLoading } = useLiveOrders();
  const [filterIndex, setFilterIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const chip = filterChips[filterIndex];
    const normalizedQuery = query.trim().toLowerCase();
    return orders.filter(
      (order) =>
        chip.match(order.status) &&
        (normalizedQuery === "" ||
          customerOf(order).toLowerCase().includes(normalizedQuery) ||
          order.orderNumber.toLowerCase().includes(normalizedQuery))
    );
  }, [orders, filterIndex, query]);

  useEffect(() => {
    if (!selectedId && visible.length) {
      setSelectedId(visible[0].id);
    }
  }, [visible, selectedId]);

  const detail =
    visible.find((order) => order.id === selectedId) ?? visible[0] ?? orders[0];

  const dayCutoff = Date.now() - 24 * 60 * 60 * 1000;
  const stats = [
    {
      k: "Open orders",
      v: orders.filter((o) => o.status !== "completed" && o.status !== "cancelled").length,
      n: "Across the floor"
    },
    {
      k: "Ready for pickup",
      v: orders.filter((o) => o.status === "ready_for_pickup").length,
      n: "Staged at will-call"
    },
    {
      k: "Day's revenue",
      v: formatCurrency(
        orders
          .filter((o) => new Date(o.createdAt).getTime() >= dayCutoff)
          .reduce((sum, o) => sum + o.total, 0)
      ),
      n: "Booked since open"
    },
    {
      k: "Avg. lines / order",
      v: orders.length
        ? Math.round(
            orders.reduce((sum, o) => sum + o.items.length, 0) / orders.length
          )
        : 0,
      n: "Trailing window"
    }
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
              <p className={`${serif} mt-2 text-4xl font-semibold`}>
                {isLoading ? "—" : s.v}
              </p>
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
            {filterChips.map((chip, index) => {
              const sel = index === filterIndex;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setFilterIndex(index)}
                  className="rounded-full px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.14em] transition-colors"
                  style={{
                    background: sel ? d3.ink : "transparent",
                    color: sel ? d3.paper : d3.graphite,
                    border: `1px solid ${sel ? d3.ink : d3.rule}`
                  }}
                >
                  {chip.label}
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
        {isLoading ? (
          <p className="py-20 text-center text-sm" style={{ color: d3.haze }}>
            Loading the orders desk…
          </p>
        ) : (
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
                {visible.map((order) => {
                  const sel = order.id === detail?.id;
                  const style = statusStyle[order.status];
                  return (
                    <li key={order.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(order.id)}
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
                          {order.orderNumber}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold">
                            {customerOf(order)}
                          </span>
                          <span className="text-[0.72rem]" style={{ color: d3.haze }}>
                            {formatPlaced(order.createdAt)} ·{" "}
                            {order.fulfillmentMethod === "pickup" ? "Will-call" : "Delivery"}
                          </span>
                        </span>
                        <span className={`${serif} hidden text-right text-lg font-semibold sm:block`}>
                          {formatCurrency(order.total)}
                        </span>
                        <span className="flex items-center justify-end gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: style.dot }}
                          />
                          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]">
                            {style.short}
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
            {detail ? (
              <aside>
                <div
                  className="border p-7"
                  style={{ borderColor: d3.rule, background: d3.card }}
                >
                  <div className="flex items-center justify-between">
                    <Eyebrow>Order file</Eyebrow>
                    <span className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em]">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: statusStyle[detail.status].dot }}
                      />
                      {statusStyle[detail.status].label}
                    </span>
                  </div>
                  <h2 className={`${serif} mt-3 text-3xl font-semibold`}>
                    {detail.orderNumber}
                  </h2>
                  <p className="text-sm" style={{ color: d3.graphite }}>
                    {customerOf(detail)}
                  </p>

                  <dl
                    className="mt-6 space-y-3 border-t pt-5 text-sm"
                    style={{ borderColor: d3.rule }}
                  >
                    {[
                      ["Placed", formatPlaced(detail.createdAt)],
                      [
                        "Fulfilment",
                        detail.fulfillmentMethod === "pickup" ? "Will-call" : "Delivery"
                      ],
                      ["Line items", `${detail.items.length} lines`],
                      ["Order total", formatCurrency(detail.total)]
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
                      <span>{statusStyle[detail.status].progress}%</span>
                    </div>
                    <div
                      className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                      style={{ background: d3.rule }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${statusStyle[detail.status].progress}%`,
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
                      {detail.fulfillmentMethod === "pickup"
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
            ) : null}
          </div>
        )}
      </section>
    </D3Shell>
  );
}
