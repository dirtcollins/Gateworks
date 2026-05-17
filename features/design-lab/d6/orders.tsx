"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock,
  PackageCheck,
  Search,
  Truck
} from "lucide-react";
import {
  D6DesignBadge,
  D6Page,
  Eyebrow,
  Mono,
  Panel,
  apex,
  formatUsd
} from "./kit";
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

const STATUS_COLOR: Record<Status, string> = {
  New: "#5b9dff",
  Picking: "#e0b341",
  Ready: "#3ecf8e",
  Fulfilled: "#7a7d8c"
};

const TABS: ("All" | Status)[] = [
  "All",
  "New",
  "Picking",
  "Ready",
  "Fulfilled"
];

function timeAgo(iso: string): string {
  const created = new Date(iso).getTime();
  if (!Number.isFinite(created)) return "—";
  const diffMs = Date.now() - created;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function itemCount(order: OrderRecord): number {
  return order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

export function D6Orders() {
  const { orders, isLoading } = useLiveOrders();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      orders.map((order) => ({
        order,
        id: order.orderNumber,
        customer:
          order.companyName || order.customerName || "Walk-in customer",
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

  const metrics = useMemo(() => {
    const open = rows.filter((row) => row.status !== "Fulfilled").length;
    const awaiting = rows.filter((row) => row.status === "Ready").length;
    const delivery = rows.filter(
      (row) => row.channel === "Delivery" && row.status !== "Fulfilled"
    ).length;
    const fulfilled = rows.filter((row) => row.status === "Fulfilled").length;
    const queueValue = rows
      .filter((row) => row.status !== "Fulfilled")
      .reduce((sum, row) => sum + row.total, 0);
    return { open, awaiting, delivery, fulfilled, queueValue };
  }, [rows]);

  return (
    <D6Page wide>
      <div className="pt-6">
        <D6DesignBadge />
      </div>

      <header
        className="border-y py-12"
        style={{ borderColor: apex.line }}
      >
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>Operations · Mission Control</Eyebrow>
            <h1
              className="mt-5 text-[2.8rem] font-medium leading-[1.02] tracking-[-0.04em] sm:text-[4rem]"
              style={{ color: apex.text }}
            >
              Order Console
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span
              className="flex items-center gap-2 rounded-full border px-4 py-2"
              style={{ borderColor: apex.line }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: apex.accent,
                  boxShadow: `0 0 10px ${apex.accentGlow}`
                }}
              />
              <Mono style={{ color: apex.mute }}>
                {isLoading ? "Syncing" : "Live feed"}
              </Mono>
            </span>
            <Link
              className="flex items-center gap-2 rounded-full border px-5 py-2.5 transition-colors hover:bg-white/5"
              href="/design-lab/d6/reports"
              style={{ borderColor: apex.line, color: apex.text }}
            >
              <Mono style={{ color: apex.text }}>Reports</Mono>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Metrics */}
      <section className="grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Open orders",
            value: metrics.open,
            note: "Live queue",
            icon: PackageCheck,
            primary: true
          },
          {
            label: "Awaiting pickup",
            value: metrics.awaiting,
            note: "Ready now",
            icon: Clock
          },
          {
            label: "Out for delivery",
            value: metrics.delivery,
            note: "In transit",
            icon: Truck
          },
          {
            label: "Fulfilled",
            value: metrics.fulfilled,
            note: "Completed",
            icon: CheckCircle2
          }
        ].map((metric) => (
          <Panel
            key={metric.label}
            className="p-6"
            glow={metric.primary}
            style={
              metric.primary
                ? { borderColor: "rgba(91,157,255,0.35)" }
                : undefined
            }
          >
            <div className="flex items-start justify-between">
              <span
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={{
                  background: metric.primary
                    ? "rgba(91,157,255,0.14)"
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${apex.line}`,
                  color: metric.primary ? apex.accent : apex.mute
                }}
              >
                <metric.icon className="h-4.5 w-4.5" />
              </span>
              <Mono style={{ color: apex.faint }}>{metric.note}</Mono>
            </div>
            <p
              className="mt-6 text-[2.6rem] font-medium leading-none tracking-[-0.04em]"
              style={{
                color: metric.primary ? apex.accent : apex.text,
                textShadow: metric.primary
                  ? `0 0 30px ${apex.accentGlow}`
                  : "none"
              }}
            >
              {isLoading ? "—" : metric.value}
            </p>
            <p className="mt-2">
              <Mono style={{ color: apex.faint }}>{metric.label}</Mono>
            </p>
          </Panel>
        ))}
      </section>

      {/* Queue value strip */}
      <Panel className="mb-8 flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <span className="flex items-center gap-3">
          <Activity className="h-4 w-4" style={{ color: apex.accent }} />
          <Mono style={{ color: apex.faint }}>Open queue value</Mono>
        </span>
        <span
          className="text-[1.6rem] font-medium tracking-[-0.03em]"
          style={{ color: apex.text }}
        >
          {isLoading ? "—" : formatUsd(metrics.queueValue)}
        </span>
      </Panel>

      {/* Toolbar */}
      <section className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap gap-1 rounded-full border p-1"
          style={{ borderColor: apex.line }}
        >
          {TABS.map((option) => {
            const active = tab === option;
            return (
              <button
                key={option}
                className="rounded-full px-4 py-2 text-[12px] font-medium tracking-[0.04em] transition-all"
                onClick={() => setTab(option)}
                style={{
                  color: active ? apex.void : apex.mute,
                  background: active
                    ? `linear-gradient(135deg, ${apex.accent}, ${apex.accentDeep})`
                    : "transparent"
                }}
                type="button"
              >
                {option}
              </button>
            );
          })}
        </div>
        <div
          className="flex items-center gap-2.5 rounded-full border px-4 py-2.5"
          style={{ borderColor: apex.line, background: apex.surface }}
        >
          <Search className="h-4 w-4" style={{ color: apex.faint }} />
          <input
            className="w-52 bg-transparent text-[13px] outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order or customer"
            style={{ color: apex.text }}
            value={query}
          />
        </div>
      </section>

      {/* Table */}
      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr style={{ borderBottom: `1px solid ${apex.line}` }}>
                {[
                  "Order",
                  "Customer",
                  "Channel",
                  "Items",
                  "Total",
                  "Placed",
                  "Status",
                  ""
                ].map((head, index) => (
                  <th
                    key={head || index}
                    className={`px-5 py-4 ${
                      head === "Items" ? "text-center" : ""
                    } ${head === "Total" ? "text-right" : ""}`}
                  >
                    <Mono style={{ color: apex.faint }}>{head}</Mono>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const color = STATUS_COLOR[row.status];
                return (
                  <tr
                    key={row.order.id}
                    className="transition-colors hover:bg-white/[0.025]"
                    style={{ borderBottom: `1px solid ${apex.lineSoft}` }}
                  >
                    <td className="px-5 py-4">
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: apex.text }}
                      >
                        {row.id}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="block text-[13px] font-medium"
                        style={{ color: apex.text }}
                      >
                        {row.customer}
                      </span>
                      <Mono style={{ color: apex.faint }}>{row.account}</Mono>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="text-[13px]"
                        style={{ color: apex.mute }}
                      >
                        {row.channel}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-center text-[13px] font-medium"
                      style={{ color: apex.text }}
                    >
                      {row.items}
                    </td>
                    <td
                      className="px-5 py-4 text-right text-[13px] font-medium"
                      style={{ color: apex.text }}
                    >
                      {formatUsd(row.total)}
                    </td>
                    <td
                      className="px-5 py-4 text-[13px]"
                      style={{ color: apex.mute }}
                    >
                      {row.placed}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1"
                        style={{
                          background: `${color}1a`,
                          border: `1px solid ${color}40`
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            background: color,
                            boxShadow: `0 0 8px ${color}`
                          }}
                        />
                        <Mono style={{ color }}>{row.status}</Mono>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        className="transition-colors hover:opacity-80"
                        type="button"
                      >
                        <Mono style={{ color: apex.accent }}>Open</Mono>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {isLoading ? (
          <p className="px-5 py-16 text-center">
            <Mono style={{ color: apex.mute }}>Loading live orders…</Mono>
          </p>
        ) : visible.length === 0 ? (
          <p className="px-5 py-16 text-center">
            <Mono style={{ color: apex.mute }}>
              No orders match this view
            </Mono>
          </p>
        ) : null}
      </Panel>

      <p className="mt-5">
        <Mono style={{ color: apex.faint }}>
          Showing {visible.length} of {rows.length} orders · Live will-call
          queue
        </Mono>
      </p>
    </D6Page>
  );
}
