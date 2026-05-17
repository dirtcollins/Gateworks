"use client";

/** DESIGN 2 — Warehouse Dark · Admin orders dashboard */

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Circle,
  Clock,
  Search,
  Truck
} from "lucide-react";
import { D2, D2Shell, Panel, PanelHead, StatCell, Tag, mono } from "./kit";
import { useLiveOrders } from "@/features/design-lab/use-live-orders";
import type { OrderRecord } from "@/lib/order-store";

type Status = "NEW" | "PICKING" | "STAGED" | "SHIPPED" | "HOLD";

type Order = {
  id: string;
  recordId: string;
  customer: string;
  account: string;
  lines: number;
  total: number;
  status: Status;
  age: string;
  dock?: string;
  onHold: boolean;
};

const STAGES: Status[] = ["NEW", "PICKING", "STAGED", "SHIPPED"];

const STATUS_META: Record<Status, { tone: "accent" | "muted" | "warn" | "bad"; label: string }> = {
  NEW: { tone: "accent", label: "New" },
  PICKING: { tone: "warn", label: "Picking" },
  STAGED: { tone: "muted", label: "Staged" },
  SHIPPED: { tone: "accent", label: "Shipped" },
  HOLD: { tone: "bad", label: "On hold" }
};

// Map the real OrderStatus union onto the d2 fulfillment-stage vocabulary.
function toStage(order: OrderRecord): Status {
  if (order.paymentStatus === "failed") return "HOLD";
  switch (order.status) {
    case "submitted":
    case "draft":
      return "NEW";
    case "confirmed":
    case "picking":
      return "PICKING";
    case "ready_for_pickup":
      return "STAGED";
    case "out_for_delivery":
    case "completed":
      return "SHIPPED";
    case "cancelled":
      return "HOLD";
    default:
      return "NEW";
  }
}

// Compact relative age, e.g. "31m" / "2h 12m" / "3d".
function relativeAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d`;
}

function mapOrder(record: OrderRecord): Order {
  const stage = toStage(record);
  return {
    id: record.orderNumber,
    recordId: record.id,
    customer: record.companyName || record.customerName || "Unknown customer",
    account: record.paymentStatus === "paid" ? "Card" : "Net-30",
    lines: record.items.length,
    total: record.total,
    status: stage,
    age: relativeAge(record.createdAt),
    dock: record.fulfillmentMethod === "pickup" ? "D1" : "A2",
    onHold: stage === "HOLD"
  };
}

export function D2Orders() {
  const { orders: liveOrders, isLoading } = useLiveOrders();
  const [filter, setFilter] = useState<"ALL" | Status>("ALL");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const orders = useMemo(() => liveOrders.map(mapOrder), [liveOrders]);

  const rows = useMemo(() => {
    let r = orders.filter((o) => filter === "ALL" || o.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(
        (o) => o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)
      );
    }
    return r;
  }, [orders, filter, query]);

  const active =
    orders.find((o) => o.recordId === selectedId) ?? rows[0] ?? orders[0];

  const stats = useMemo(() => {
    const open = orders.filter((o) => o.status !== "SHIPPED").length;
    const inFulfillment = orders.filter(
      (o) => o.status === "PICKING" || o.status === "STAGED"
    ).length;
    const onHold = orders.filter((o) => o.status === "HOLD").length;
    const queueValue = orders
      .filter((o) => o.status !== "SHIPPED")
      .reduce((sum, o) => sum + o.total, 0);
    return [
      { label: "Open orders", value: String(open), delta: "live", good: true },
      { label: "In fulfillment", value: String(inFulfillment), delta: "staged", good: true },
      { label: "On hold", value: String(onHold), delta: "review", good: onHold === 0 },
      {
        label: "Value in queue",
        value: `$${Math.round(queueValue / 1000)}k`,
        delta: "open",
        good: true
      }
    ];
  }, [orders]);

  return (
    <D2Shell active="orders" kicker="ADMIN // FULFILLMENT QUEUE">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight">Orders Console</h1>
        <Tag tone="accent">SHIFT A · 08:42 MT</Tag>
      </div>

      <Panel className="mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCell key={s.label} {...s} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* queue */}
        <Panel>
          <PanelHead
            title="Fulfillment Queue"
            meta={isLoading ? "LOADING…" : `${rows.length} ORDERS`}
            action={
              <div
                className="flex items-center gap-2 rounded-[3px] px-2.5 py-1.5"
                style={{ background: D2.bg, border: `1px solid ${D2.line}` }}
              >
                <Search className="h-3.5 w-3.5" style={{ color: D2.muted }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Order / customer…"
                  className={`${mono} w-32 bg-transparent text-[11px] outline-none placeholder:text-[#3f4a52]`}
                />
              </div>
            }
          />

          {/* filter row */}
          <div
            className="flex flex-wrap items-center gap-1 border-b px-3 py-2"
            style={{ borderColor: D2.line }}
          >
            {(["ALL", ...STAGES, "HOLD"] as const).map((f) => {
              const on = f === filter;
              const count =
                f === "ALL"
                  ? orders.length
                  : orders.filter((o) => o.status === f).length;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`${mono} rounded-[3px] px-2.5 py-1.5 text-[10px] uppercase tracking-wider transition`}
                  style={{
                    color: on ? D2.bg : D2.muted,
                    background: on ? D2.accent : D2.panelHi,
                    border: `1px solid ${on ? D2.accent : D2.line}`
                  }}
                >
                  {f} · {count}
                </button>
              );
            })}
          </div>

          {/* table header */}
          <div
            className={`${mono} grid grid-cols-[1.6fr_0.7fr_0.7fr_0.9fr] gap-2 px-4 py-2 text-[10px] uppercase tracking-wider`}
            style={{ color: D2.muted, borderBottom: `1px solid ${D2.line}` }}
          >
            <span>Order / Customer</span>
            <span className="text-center">Lines</span>
            <span className="text-right">Total</span>
            <span className="text-right">Status</span>
          </div>

          {isLoading ? (
            <div className="grid place-items-center py-20">
              <span className={`${mono} text-[12px]`} style={{ color: D2.muted }}>
                Syncing fulfillment queue…
              </span>
            </div>
          ) : rows.length === 0 ? (
            <div className="grid place-items-center py-20">
              <span className={`${mono} text-[12px]`} style={{ color: D2.muted }}>
                No orders match — adjust filters.
              </span>
            </div>
          ) : (
            rows.map((o) => {
              const on = o.recordId === (active?.recordId ?? null);
              return (
                <button
                  key={o.recordId}
                  type="button"
                  onClick={() => setSelectedId(o.recordId)}
                  className="grid w-full grid-cols-[1.6fr_0.7fr_0.7fr_0.9fr] items-center gap-2 px-4 py-3 text-left transition"
                  style={{
                    borderBottom: `1px solid ${D2.line}`,
                    background: on ? `${D2.accent}10` : undefined,
                    borderLeft: `2px solid ${on ? D2.accent : "transparent"}`
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`${mono} text-[12px] font-bold`} style={{ color: D2.accent }}>
                        {o.id}
                      </span>
                      <span className={`${mono} text-[10px]`} style={{ color: D2.muted }}>
                        {o.age}
                      </span>
                    </div>
                    <div className="truncate text-[12px]">{o.customer}</div>
                  </div>
                  <span className={`${mono} text-center text-[12px]`}>{o.lines}</span>
                  <span className={`${mono} text-right text-[12px] font-bold`}>
                    ${o.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <span className="flex justify-end">
                    <Tag tone={STATUS_META[o.status].tone}>{STATUS_META[o.status].label}</Tag>
                  </span>
                </button>
              );
            })
          )}
        </Panel>

        {/* detail */}
        <aside className="flex flex-col gap-4">
          <Panel glow>
            <PanelHead title="Order Detail" meta={active?.id ?? "—"} />
            <div className="p-4">
              {active ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[15px] font-bold">{active.customer}</div>
                      <div className={`${mono} text-[11px]`} style={{ color: D2.muted }}>
                        {active.account} · {active.lines} lines
                      </div>
                    </div>
                    <Tag tone={STATUS_META[active.status].tone}>
                      {STATUS_META[active.status].label}
                    </Tag>
                  </div>

                  <div
                    className="mt-4 flex items-baseline justify-between rounded-[3px] px-3 py-3"
                    style={{ background: D2.panelHi, border: `1px solid ${D2.line}` }}
                  >
                    <span className={`${mono} text-[11px] uppercase`} style={{ color: D2.muted }}>
                      Order value
                    </span>
                    <span className={`${mono} text-[22px] font-bold`} style={{ color: D2.accent }}>
                      ${active.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* pipeline */}
                  <div className="mt-5">
                    <div
                      className={`${mono} mb-3 text-[10px] uppercase tracking-[0.16em]`}
                      style={{ color: D2.muted }}
                    >
                      Pipeline
                    </div>
                    <ol className="flex flex-col gap-0">
                      {STAGES.map((stage, i) => {
                        const reached =
                          STAGES.indexOf(active.status as Status) >= i ||
                          active.status === "SHIPPED";
                        const current = active.status === stage;
                        const Icon =
                          stage === "SHIPPED"
                            ? Truck
                            : stage === "STAGED"
                            ? Box
                            : i === 0
                            ? Circle
                            : Clock;
                        return (
                          <li key={stage} className="flex items-center gap-3 py-1.5">
                            <span
                              className="grid h-7 w-7 place-items-center rounded-[3px]"
                              style={{
                                background: reached ? D2.accent : D2.panelHi,
                                color: reached ? D2.bg : D2.muted,
                                border: `1px solid ${reached ? D2.accent : D2.line}`,
                                boxShadow: current ? `0 0 12px ${D2.accent}66` : undefined
                              }}
                            >
                              {reached ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <Icon className="h-3.5 w-3.5" />
                              )}
                            </span>
                            <span
                              className={`${mono} text-[12px] uppercase tracking-wider`}
                              style={{
                                color: current ? D2.accent : reached ? D2.text : D2.muted
                              }}
                            >
                              {STATUS_META[stage].label}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>

                  {active.onHold ? (
                    <div
                      className="mt-4 flex items-start gap-2 rounded-[3px] p-3"
                      style={{ background: "#3a1717", border: "1px solid #6b2424" }}
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#ff6b6b" }} />
                      <span
                        className={`${mono} text-[11px] leading-relaxed`}
                        style={{ color: "#ff9b9b" }}
                      >
                        Credit review required — payment failed or order cancelled. Notify A/R.
                      </span>
                    </div>
                  ) : active.dock ? (
                    <div
                      className={`${mono} mt-4 flex items-center justify-between rounded-[3px] px-3 py-2.5 text-[11px]`}
                      style={{ background: D2.bg, border: `1px solid ${D2.line}`, color: D2.muted }}
                    >
                      <span>Assigned dock</span>
                      <span className="font-bold" style={{ color: D2.accent }}>
                        {active.dock}
                      </span>
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`${mono} rounded-[3px] px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider`}
                      style={{ background: D2.accent, color: D2.bg }}
                    >
                      Advance
                    </button>
                    <button
                      type="button"
                      className={`${mono} rounded-[3px] px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider`}
                      style={{
                        background: "transparent",
                        color: D2.text,
                        border: `1px solid ${D2.line}`
                      }}
                    >
                      Print pick list
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid place-items-center py-12">
                  <span className={`${mono} text-[12px]`} style={{ color: D2.muted }}>
                    {isLoading ? "Loading order…" : "No orders in queue."}
                  </span>
                </div>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Dock Load" meta="3 BAYS" />
            <div>
              {[
                { bay: "A1 / A2", label: "Picking", pct: 64 },
                { bay: "D1 / D3", label: "Staging", pct: 88 },
                { bay: "Yard out", label: "Shipped today", pct: 41 }
              ].map((d, i) => (
                <div
                  key={d.bay}
                  className="px-4 py-3"
                  style={{ borderTop: i > 0 ? `1px solid ${D2.line}` : undefined }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`${mono} text-[11px]`}>{d.bay}</span>
                    <span className={`${mono} text-[11px]`} style={{ color: D2.muted }}>
                      {d.label} · {d.pct}%
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                    style={{ background: D2.line }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${d.pct}%`,
                        background: d.pct > 80 ? "#f5b53d" : D2.accent
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </D2Shell>
  );
}
