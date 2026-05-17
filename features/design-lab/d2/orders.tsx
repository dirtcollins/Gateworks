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

type Status = "NEW" | "PICKING" | "STAGED" | "SHIPPED" | "HOLD";

type Order = {
  id: string;
  customer: string;
  account: string;
  lines: number;
  total: number;
  status: Status;
  age: string;
  dock?: string;
};

const ORDERS: Order[] = [
  { id: "PO-5519", customer: "Ridgeline Fencing", account: "Net-30", lines: 8, total: 2104.5, status: "NEW", age: "6m" },
  { id: "PO-5518", customer: "Apex Steel Fab", account: "Net-30", lines: 14, total: 8890.0, status: "PICKING", age: "31m", dock: "A2" },
  { id: "PO-5517", customer: "Two Rivers GC", account: "Card", lines: 3, total: 612.25, status: "STAGED", age: "1h 04m", dock: "D3" },
  { id: "PO-5515", customer: "Hartman Welding", account: "Net-30", lines: 22, total: 14420.8, status: "HOLD", age: "2h 12m" },
  { id: "PO-5512", customer: "Frontier Gate Co.", account: "Net-30", lines: 6, total: 1740.0, status: "SHIPPED", age: "3h 40m", dock: "D3" },
  { id: "PO-5509", customer: "Cedar Park Ranch", account: "Card", lines: 2, total: 288.5, status: "SHIPPED", age: "5h 18m" },
  { id: "PO-5508", customer: "Vanguard Builders", account: "Net-30", lines: 11, total: 5302.75, status: "PICKING", age: "5h 55m", dock: "A1" },
  { id: "PO-5505", customer: "Lone Star Access", account: "Net-30", lines: 4, total: 944.0, status: "STAGED", age: "7h 02m", dock: "D1" }
];

const STAGES: Status[] = ["NEW", "PICKING", "STAGED", "SHIPPED"];

const STATUS_META: Record<Status, { tone: "accent" | "muted" | "warn" | "bad"; label: string }> = {
  NEW: { tone: "accent", label: "New" },
  PICKING: { tone: "warn", label: "Picking" },
  STAGED: { tone: "muted", label: "Staged" },
  SHIPPED: { tone: "accent", label: "Shipped" },
  HOLD: { tone: "bad", label: "On hold" }
};

const STATS = [
  { label: "Open orders", value: "37", delta: "4 today", good: true },
  { label: "In fulfillment", value: "19", delta: "2 staged", good: true },
  { label: "On hold", value: "3", delta: "1 credit", good: false },
  { label: "Value in queue", value: "$214k", delta: "$31k", good: true }
];

export function D2Orders() {
  const [filter, setFilter] = useState<"ALL" | Status>("ALL");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string>("PO-5518");

  const rows = useMemo(() => {
    let r = ORDERS.filter((o) => filter === "ALL" || o.status === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(
        (o) => o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q)
      );
    }
    return r;
  }, [filter, query]);

  const active = ORDERS.find((o) => o.id === selected) ?? ORDERS[0];

  return (
    <D2Shell active="orders" kicker="ADMIN // FULFILLMENT QUEUE">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight">Orders Console</h1>
        <Tag tone="accent">SHIFT A · 08:42 MT</Tag>
      </div>

      <Panel className="mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <StatCell key={s.label} {...s} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* queue */}
        <Panel>
          <PanelHead
            title="Fulfillment Queue"
            meta={`${rows.length} ORDERS`}
            action={
              <div
                className="flex items-center gap-2 rounded-[3px] px-2.5 py-1.5"
                style={{ background: D2.bg, border: `1px solid ${D2.line}` }}
              >
                <Search className="h-3.5 w-3.5" style={{ color: D2.muted }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="PO / customer…"
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
                f === "ALL" ? ORDERS.length : ORDERS.filter((o) => o.status === f).length;
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

          {rows.map((o) => {
            const on = o.id === selected;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelected(o.id)}
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
          })}
        </Panel>

        {/* detail */}
        <aside className="flex flex-col gap-4">
          <Panel glow>
            <PanelHead title="Order Detail" meta={active.id} />
            <div className="p-4">
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
                      stage === "SHIPPED" ? Truck : stage === "STAGED" ? Box : i === 0 ? Circle : Clock;
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
                          style={{ color: current ? D2.accent : reached ? D2.text : D2.muted }}
                        >
                          {STATUS_META[stage].label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {active.status === "HOLD" ? (
                <div
                  className="mt-4 flex items-start gap-2 rounded-[3px] p-3"
                  style={{ background: "#3a1717", border: "1px solid #6b2424" }}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#ff6b6b" }} />
                  <span className={`${mono} text-[11px] leading-relaxed`} style={{ color: "#ff9b9b" }}>
                    Credit review required — account over Net-30 limit. Notify A/R.
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
                  style={{ background: "transparent", color: D2.text, border: `1px solid ${D2.line}` }}
                >
                  Print pick list
                </button>
              </div>
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
