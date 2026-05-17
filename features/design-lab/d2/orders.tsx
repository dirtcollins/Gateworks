"use client";

/* DESIGN 2 — "MONO" — Admin orders, wired to live orders. */

import { useMemo, useState } from "react";
import {
  Label,
  MONO,
  MonoPage,
  Pill,
  Section,
  Stat,
  formatUsd
} from "./kit";
import { useLiveOrders } from "@/features/design-lab/use-live-orders";
import type { OrderRecord } from "@/lib/order-store";

type Stage = "New" | "Picking" | "Ready" | "Fulfilled";

const STAGE_FOR_STATUS: Record<OrderRecord["status"], Stage> = {
  draft: "New",
  submitted: "New",
  confirmed: "Picking",
  picking: "Picking",
  ready_for_pickup: "Ready",
  out_for_delivery: "Ready",
  completed: "Fulfilled",
  cancelled: "Fulfilled"
};

const TABS: Array<"All" | Stage> = [
  "All",
  "New",
  "Picking",
  "Ready",
  "Fulfilled"
];

function relativeAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

function itemCount(order: OrderRecord): number {
  return order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

export function D2Orders() {
  const { orders, isLoading } = useLiveOrders();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      orders.map((order) => ({
        record: order,
        number: order.orderNumber,
        customer:
          order.companyName || order.customerName || "Walk-in customer",
        account: order.companyName ? "Trade" : "Retail",
        items: itemCount(order),
        total: order.total,
        channel:
          order.fulfillmentMethod === "delivery" ? "Delivery" : "Will-call",
        age: relativeAge(order.createdAt),
        stage: STAGE_FOR_STATUS[order.status] ?? "New"
      })),
    [orders]
  );

  const visible = useMemo(
    () =>
      rows.filter((row) => {
        const matchesTab = tab === "All" || row.stage === tab;
        const normalized = query.trim().toLowerCase();
        const matchesQuery =
          !normalized ||
          row.customer.toLowerCase().includes(normalized) ||
          row.number.toLowerCase().includes(normalized);
        return matchesTab && matchesQuery;
      }),
    [rows, tab, query]
  );

  const stats = useMemo(() => {
    const open = rows.filter((row) => row.stage !== "Fulfilled").length;
    const ready = rows.filter((row) => row.stage === "Ready").length;
    const fulfilled = rows.filter((row) => row.stage === "Fulfilled").length;
    const openValue = rows
      .filter((row) => row.stage !== "Fulfilled")
      .reduce((sum, row) => sum + row.total, 0);
    return { open, ready, fulfilled, openValue };
  }, [rows]);

  return (
    <MonoPage active="Orders">
      <Section
        className="pt-12 pb-8"
        style={{ borderBottom: `1px solid ${MONO.lineStrong}` }}
      >
        <Label index="OPS">Fulfilment console</Label>
        <h1 className="mt-4 text-[44px] font-semibold leading-[0.98] tracking-[-0.035em] sm:text-[56px]">
          Orders
        </h1>
      </Section>

      {/* Stats */}
      <Section
        className="py-0"
        style={{ borderBottom: `1px solid ${MONO.line}` }}
      >
        <div
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{
            borderLeft: `1px solid ${MONO.line}`,
            borderRight: `1px solid ${MONO.line}`
          }}
        >
          {[
            { label: "Open orders", value: stats.open, note: "Live queue" },
            { label: "Ready for pickup", value: stats.ready, note: "Staged" },
            { label: "Fulfilled", value: stats.fulfilled, note: "Completed" },
            {
              label: "Value in queue",
              value: stats.openValue,
              note: "Open",
              currency: true
            }
          ].map((stat, index) => (
            <div
              key={stat.label}
              style={{
                borderLeft:
                  index === 0 ? undefined : `1px solid ${MONO.line}`
              }}
            >
              <Stat
                label={stat.label}
                note={stat.note}
                value={
                  isLoading
                    ? "—"
                    : stat.currency
                    ? formatUsd(stat.value)
                    : String(stat.value)
                }
              />
            </div>
          ))}
        </div>
      </Section>

      <Section className="pt-10 pb-16">
        {/* Toolbar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 pb-4"
          style={{ borderBottom: `1px solid ${MONO.lineStrong}` }}
        >
          <div className="flex" style={{ border: `1px solid ${MONO.line}` }}>
            {TABS.map((option, index) => {
              const on = option === tab;
              const count =
                option === "All"
                  ? rows.length
                  : rows.filter((row) => row.stage === option).length;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTab(option)}
                  className="px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors"
                  style={{
                    background: on ? MONO.ink : "transparent",
                    color: on ? MONO.paper : MONO.steel,
                    borderLeft:
                      index === 0 ? undefined : `1px solid ${MONO.line}`
                  }}
                >
                  {option}
                  <span
                    className="ml-1.5 tabular-nums"
                    style={{
                      color: on ? "rgba(255,255,255,0.5)" : MONO.muted
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ border: `1px solid ${MONO.line}` }}
          >
            <span
              className="text-[11px] uppercase tracking-[0.16em]"
              style={{ color: MONO.muted }}
            >
              Find
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Order or customer"
              className="w-44 bg-transparent text-[12px] outline-none placeholder:text-[#b5b5b3]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{
                  color: MONO.muted,
                  borderBottom: `1px solid ${MONO.lineStrong}`
                }}
              >
                <th className="py-2.5 pr-4">Order</th>
                <th className="py-2.5 pr-4">Customer</th>
                <th className="py-2.5 pr-4">Channel</th>
                <th className="py-2.5 pr-4 text-center">Items</th>
                <th className="py-2.5 pr-4 text-right">Total</th>
                <th className="py-2.5 pr-4">Placed</th>
                <th className="py-2.5">Stage</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={row.record.id}
                  className="transition-colors hover:bg-[#fafafa]"
                  style={{ borderBottom: `1px solid ${MONO.line}` }}
                >
                  <td className="py-3.5 pr-4">
                    <span className="text-[13px] font-semibold tabular-nums">
                      {row.number}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="block text-[13px] font-medium tracking-[-0.01em]">
                      {row.customer}
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: MONO.muted }}
                    >
                      {row.account}
                    </span>
                  </td>
                  <td
                    className="py-3.5 pr-4 text-[12px]"
                    style={{ color: MONO.steel }}
                  >
                    {row.channel}
                  </td>
                  <td className="py-3.5 pr-4 text-center text-[13px] font-medium tabular-nums">
                    {row.items}
                  </td>
                  <td className="py-3.5 pr-4 text-right text-[13px] font-semibold tabular-nums">
                    {formatUsd(row.total)}
                  </td>
                  <td
                    className="py-3.5 pr-4 text-[12px]"
                    style={{ color: MONO.steel }}
                  >
                    {row.age}
                  </td>
                  <td className="py-3.5">
                    <Pill filled={row.stage === "Fulfilled"}>
                      {row.stage}
                    </Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {isLoading ? (
            <p
              className="py-16 text-center text-[12px] uppercase tracking-[0.18em]"
              style={{ color: MONO.muted }}
            >
              Loading live orders…
            </p>
          ) : visible.length === 0 ? (
            <p
              className="py-16 text-center text-[12px] uppercase tracking-[0.18em]"
              style={{ color: MONO.muted }}
            >
              No orders match this view.
            </p>
          ) : null}
        </div>

        <p
          className="mt-4 text-[11px] uppercase tracking-[0.18em]"
          style={{ color: MONO.muted }}
        >
          Showing {visible.length} of {rows.length} orders
        </p>
      </Section>
    </MonoPage>
  );
}
