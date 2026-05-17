"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { D9DesignBadge, D9Page, Eyebrow, d9, formatUsd, serif } from "./kit";
import { useLiveOrders } from "@/features/design-lab/use-live-orders";
import type { OrderRecord } from "@/lib/order-store";
import type { OrderStatus } from "@/lib/platform-backend";

/* DESIGN 9 — "Showroom" — Orders desk. Live orders from the API. */

const statusPresentation: Record<
  OrderStatus,
  { label: string; dot: string }
> = {
  draft: { label: "Draft", dot: "#8c8068" },
  submitted: { label: "Received", dot: "#9c6f3a" },
  confirmed: { label: "Confirmed", dot: "#9c6f3a" },
  picking: { label: "In preparation", dot: "#bd9259" },
  ready_for_pickup: { label: "Ready at showroom", dot: "#2f6f4e" },
  out_for_delivery: { label: "White-glove en route", dot: "#2f6f4e" },
  completed: { label: "Delivered", dot: "#5b5040" },
  cancelled: { label: "Cancelled", dot: "#b42318" }
};

const FILTERS: Array<{ label: string; match: (status: OrderStatus) => boolean }> = [
  { label: "All", match: () => true },
  { label: "New", match: (s) => s === "submitted" || s === "confirmed" },
  { label: "In preparation", match: (s) => s === "picking" },
  { label: "Ready & en route", match: (s) => s === "ready_for_pickup" || s === "out_for_delivery" },
  { label: "Delivered", match: (s) => s === "completed" }
];

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function itemCount(order: OrderRecord): number {
  return order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

export function D9Orders() {
  const { orders, isLoading } = useLiveOrders();
  const [filter, setFilter] = useState(0);
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const matcher = FILTERS[filter].match;
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (!matcher(order.status)) return false;
      if (!q) return true;
      const customer = (order.companyName || order.customerName || "").toLowerCase();
      return customer.includes(q) || order.orderNumber.toLowerCase().includes(q);
    });
  }, [orders, filter, query]);

  const stats = useMemo(() => {
    const open = orders.filter((o) => o.status !== "completed" && o.status !== "cancelled");
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    const ready = orders.filter(
      (o) => o.status === "ready_for_pickup" || o.status === "out_for_delivery"
    ).length;
    const avg = orders.length ? revenue / orders.length : 0;
    return [
      { label: "Open orders", value: String(open.length) },
      { label: "Ready & en route", value: String(ready) },
      { label: "Order book value", value: formatUsd(revenue) },
      { label: "Average order", value: formatUsd(avg) }
    ];
  }, [orders]);

  return (
    <D9Page>
      <D9DesignBadge />

      {/* Masthead */}
      <section className="mx-auto max-w-[1240px] px-6 pb-10 pt-16 sm:px-8 sm:pt-20">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>The Atelier · Operations</Eyebrow>
            <h1
              className="mt-6 text-[2.8rem] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[3.8rem]"
              style={{ ...serif, color: d9.ink }}
            >
              Orders desk
            </h1>
          </div>
          <Link
            className="inline-flex items-center gap-2 px-6 py-3.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
            href="/design-lab/d9/reports"
            style={{ border: `1px solid ${d9.ink}`, color: d9.ink }}
          >
            View financial reports <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Stats */}
        <div
          className="mt-10 grid grid-cols-2 gap-px lg:grid-cols-4"
          style={{ background: d9.rule, border: `1px solid ${d9.rule}` }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="px-6 py-7" style={{ background: d9.card }}>
              <p
                className="text-[0.58rem] font-semibold uppercase tracking-[0.2em]"
                style={{ color: d9.haze }}
              >
                {stat.label}
              </p>
              <p className="mt-2.5 text-3xl" style={{ ...serif, color: d9.ink }}>
                {isLoading ? "—" : stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Toolbar */}
      <section className="mx-auto max-w-[1240px] px-6 pb-20 sm:px-8">
        <div
          className="flex flex-wrap items-center justify-between gap-4 pb-5"
          style={{ borderBottom: `1px solid ${d9.rule}` }}
        >
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((option, index) => {
              const active = filter === index;
              return (
                <button
                  key={option.label}
                  className="px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] transition-colors"
                  onClick={() => setFilter(index)}
                  style={{
                    background: active ? d9.ink : "transparent",
                    border: `1px solid ${active ? d9.ink : d9.rule}`,
                    color: active ? d9.bone : d9.graphite
                  }}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2.5"
            style={{ background: d9.card, border: `1px solid ${d9.rule}` }}
          >
            <Search className="h-3.5 w-3.5" style={{ color: d9.haze }} />
            <input
              className="w-52 bg-transparent text-sm outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search client or order"
              style={{ color: d9.ink }}
              value={query}
            />
          </div>
        </div>

        {/* Orders list */}
        {isLoading ? (
          <p
            className="px-8 py-24 text-center text-sm"
            style={{ color: d9.haze }}
          >
            Retrieving the order book…
          </p>
        ) : visible.length ? (
          <div
            className="mt-8 grid gap-px"
            style={{ background: d9.rule, border: `1px solid ${d9.rule}` }}
          >
            <div
              className="hidden grid-cols-[1.6rem_1fr_auto_auto_auto_auto] items-center gap-6 px-7 py-4 text-[0.58rem] font-semibold uppercase tracking-[0.18em] sm:grid"
              style={{ background: d9.linen, color: d9.haze }}
            >
              <span />
              <span>Client</span>
              <span>Placed</span>
              <span className="text-center">Pieces</span>
              <span className="text-right">Total</span>
              <span className="text-right">Status</span>
            </div>
            {visible.map((order, index) => {
              const presentation = statusPresentation[order.status];
              return (
                <div
                  key={order.id}
                  className="grid items-center gap-6 px-7 py-6 sm:grid-cols-[1.6rem_1fr_auto_auto_auto_auto]"
                  style={{ background: d9.card }}
                >
                  <span
                    className="text-2xl"
                    style={{ ...serif, color: d9.bronze }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-lg leading-snug" style={{ ...serif, color: d9.ink }}>
                      {order.companyName || order.customerName || "Walk-in client"}
                    </p>
                    <p
                      className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: d9.haze }}
                    >
                      {order.orderNumber}
                      {order.isQuoteRequest ? " · Quote" : ""}
                      {" · "}
                      {order.fulfillmentMethod === "delivery" ? "Delivery" : "Showroom pickup"}
                    </p>
                  </div>
                  <span className="text-sm" style={{ color: d9.graphite }}>
                    {formatDate(order.createdAt)}
                  </span>
                  <span
                    className="text-sm sm:text-center"
                    style={{ color: d9.graphite }}
                  >
                    {itemCount(order)}
                  </span>
                  <span
                    className="text-lg sm:text-right"
                    style={{ ...serif, color: d9.ink }}
                  >
                    {formatUsd(order.total)}
                  </span>
                  <span className="flex items-center gap-2 sm:justify-end">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: presentation.dot }}
                    />
                    <span
                      className="text-[0.66rem] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: d9.graphite }}
                    >
                      {presentation.label}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="mt-8 px-8 py-24 text-center"
            style={{ background: d9.card, border: `1px solid ${d9.rule}` }}
          >
            <p className="text-xl" style={{ ...serif, color: d9.ink }}>
              {orders.length === 0
                ? "The order book is open and waiting."
                : "No orders match this view."}
            </p>
            <p className="mt-2 text-sm" style={{ color: d9.graphite }}>
              Orders placed through the showroom will appear here.
            </p>
          </div>
        )}

        {!isLoading ? (
          <p
            className="mt-5 text-[0.62rem] font-semibold uppercase tracking-[0.16em]"
            style={{ color: d9.haze }}
          >
            Showing {visible.length} of {orders.length} orders · Live order book
          </p>
        ) : null}
      </section>
    </D9Page>
  );
}
