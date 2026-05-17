"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Globe, Search } from "lucide-react";
import { Btn, D5, Dot, H, Kbd, Panel, Shell, Tag } from "./kit";
import { fmt } from "./data";
import { useLiveOrders } from "@/features/design-lab/use-live-orders";
import type { OrderRecord } from "@/lib/order-store";
import type { OrderStatus } from "@/lib/platform-backend";

/* d5 keeps a lean 5-state pipeline; map the real OrderStatus onto it. */
type D5Status = "new" | "picking" | "ready" | "shipped" | "hold";

const STATUS: Record<
  D5Status,
  { label: string; tone: "dim" | "accent" | "amber" | "red" | "blue"; color: string }
> = {
  new: { label: "New", tone: "blue", color: D5.blue },
  picking: { label: "Picking", tone: "amber", color: D5.amber },
  ready: { label: "Ready", tone: "accent", color: D5.accent },
  shipped: { label: "Shipped", tone: "dim", color: D5.faint },
  hold: { label: "Hold", tone: "red", color: D5.red }
};

const PIPE: { key: D5Status; label: string }[] = [
  { key: "new", label: "New" },
  { key: "picking", label: "Picking" },
  { key: "ready", label: "Ready" },
  { key: "shipped", label: "Shipped" }
];

function mapStatus(status: OrderStatus): D5Status {
  switch (status) {
    case "draft":
    case "submitted":
      return "new";
    case "confirmed":
    case "picking":
      return "picking";
    case "ready_for_pickup":
      return "ready";
    case "out_for_delivery":
    case "completed":
      return "shipped";
    case "cancelled":
      return "hold";
    default:
      return "new";
  }
}

function relativeAge(iso: string) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

type Row = {
  order: OrderRecord;
  id: string;
  customer: string;
  items: number;
  total: number;
  status: D5Status;
  age: string;
};

export default function D5Orders() {
  const { orders, isLoading } = useLiveOrders();
  const [filter, setFilter] = useState<D5Status | "all">("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);

  const allRows = useMemo<Row[]>(
    () =>
      orders
        .filter((o) => !o.isQuoteRequest)
        .map((o) => ({
          order: o,
          id: o.orderNumber,
          customer: o.companyName || o.customerName || "Unknown customer",
          items: o.items.reduce((s, i) => s + i.quantity, 0),
          total: o.total,
          status: mapStatus(o.status),
          age: relativeAge(o.createdAt)
        })),
    [orders]
  );

  const rows = useMemo(
    () =>
      allRows.filter((o) => {
        if (filter !== "all" && o.status !== filter) return false;
        if (q && !`${o.id} ${o.customer}`.toLowerCase().includes(q.toLowerCase()))
          return false;
        return true;
      }),
    [allRows, filter, q]
  );

  const selected =
    allRows.find((o) => o.id === sel) ?? rows[0] ?? allRows[0] ?? null;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: allRows.length };
    for (const o of allRows) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [allRows]);

  const revenue = allRows.reduce((s, o) => s + o.total, 0);

  return (
    <Shell crumb="ops / orders">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <H>Order desk</H>
          <p className="mt-0.5 text-[11px]" style={{ color: D5.faint }}>
            {isLoading
              ? "loading live orders…"
              : `${allRows.length} active · ${fmt(revenue)} in flight · live`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="flex h-7 items-center gap-1.5 rounded border px-2"
            style={{ borderColor: D5.line, background: D5.panel }}
          >
            <Search size={12} style={{ color: D5.faint }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="filter id / customer"
              className="w-44 bg-transparent text-[11px] outline-none"
              style={{ color: D5.ink }}
            />
          </div>
          <Btn variant="primary">New order</Btn>
        </div>
      </div>

      {/* pipeline strip */}
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        {PIPE.map((s) => {
          const st = STATUS[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setFilter(filter === s.key ? "all" : s.key)}
              className="rounded-md border px-3 py-2 text-left"
              style={{
                borderColor: filter === s.key ? D5.lineHi : D5.line,
                background: filter === s.key ? D5.panelHi : D5.panel
              }}
            >
              <div className="flex items-center gap-1.5">
                <Dot color={st.color} />
                <span
                  className="text-[10px] uppercase tracking-[0.14em]"
                  style={{ color: D5.faint }}
                >
                  {s.label}
                </span>
              </div>
              <div className="mt-1 text-[22px] font-bold" style={{ color: D5.ink }}>
                {counts[s.key] ?? 0}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        {/* order table */}
        <Panel
          title="Queue"
          hint={`// ${rows.length} shown`}
          right={
            <div className="flex gap-0.5">
              {(["all", "hold"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className="rounded px-2 py-0.5 text-[10px] font-bold uppercase"
                  style={{
                    background: filter === f ? D5.panelHi : "transparent",
                    color: filter === f ? D5.accent : D5.faint
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          }
        >
          <div
            className="grid grid-cols-[88px_1fr_64px_72px_84px] gap-x-2 border-b px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] md:grid-cols-[92px_1fr_56px_64px_72px_88px]"
            style={{ borderColor: D5.line, color: D5.faint }}
          >
            <span>order</span>
            <span>customer</span>
            <span className="hidden text-center md:block">ch</span>
            <span className="text-center">items</span>
            <span className="text-right">total</span>
            <span className="text-right">status</span>
          </div>
          {isLoading ? (
            <div className="px-3 py-8 text-center text-[12px]" style={{ color: D5.dim }}>
              Loading order desk…
            </div>
          ) : rows.length === 0 ? (
            <div className="px-3 py-8 text-center text-[12px]" style={{ color: D5.dim }}>
              No orders match.
            </div>
          ) : (
            rows.map((o) => {
              const st = STATUS[o.status];
              const on = selected?.id === o.id;
              return (
                <button
                  key={o.order.id}
                  type="button"
                  onClick={() => setSel(o.id)}
                  className="grid w-full grid-cols-[88px_1fr_64px_72px_84px] items-center gap-x-2 border-b px-3 py-2 text-left transition-colors last:border-0 hover:brightness-110 md:grid-cols-[92px_1fr_56px_64px_72px_88px]"
                  style={{
                    borderColor: D5.line,
                    background: on ? D5.panelHi : "transparent",
                    borderLeft: `2px solid ${on ? D5.accent : "transparent"}`
                  }}
                >
                  <span
                    className="truncate text-[11px] font-bold"
                    style={{ color: on ? D5.accent : D5.ink }}
                  >
                    {o.id}
                  </span>
                  <div className="overflow-hidden">
                    <div
                      className="truncate text-[12px] font-semibold"
                      style={{ color: D5.ink }}
                    >
                      {o.customer}
                    </div>
                    <div className="text-[9px]" style={{ color: D5.faint }}>
                      {o.order.fulfillmentMethod === "pickup" ? "Pickup" : "Delivery"} ·{" "}
                      {o.age} ago
                    </div>
                  </div>
                  <span className="hidden justify-center md:flex">
                    <Globe size={13} style={{ color: D5.dim }} />
                  </span>
                  <span
                    className="text-center text-[11px]"
                    style={{ color: D5.dim }}
                  >
                    {o.items}
                  </span>
                  <span
                    className="text-right text-[11px] font-bold"
                    style={{ color: D5.ink }}
                  >
                    {fmt(o.total)}
                  </span>
                  <span className="flex justify-end">
                    <Tag tone={st.tone}>{st.label}</Tag>
                  </span>
                </button>
              );
            })
          )}
        </Panel>

        {/* detail panel */}
        <div className="flex flex-col gap-3">
          <Panel title="Order detail" hint={`// ${selected?.id ?? "—"}`}>
            {selected ? (
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[15px] font-bold"
                    style={{ color: D5.ink }}
                  >
                    {selected.id}
                  </span>
                  <Tag tone={STATUS[selected.status].tone}>
                    {STATUS[selected.status].label}
                  </Tag>
                </div>
                <div className="mt-1 text-[12px] font-semibold" style={{ color: D5.ink }}>
                  {selected.customer}
                </div>
                <div className="text-[10px]" style={{ color: D5.faint }}>
                  {selected.order.fulfillmentMethod === "pickup" ? "Pickup" : "Delivery"} ·
                  placed {selected.age} ago
                </div>

                <div
                  className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded border"
                  style={{ borderColor: D5.line, background: D5.line }}
                >
                  {[
                    ["Items", String(selected.items)],
                    ["Payment", selected.order.paymentStatus],
                    ["Total", fmt(selected.total)]
                  ].map(([k, v]) => (
                    <div key={k} className="px-2 py-1.5" style={{ background: D5.panel }}>
                      <div className="text-[9px] uppercase" style={{ color: D5.faint }}>
                        {k}
                      </div>
                      <div
                        className="truncate text-[11px] font-bold capitalize"
                        style={{ color: D5.ink }}
                      >
                        {v}
                      </div>
                    </div>
                  ))}
                </div>

                {/* progress track */}
                <div className="mt-3">
                  <div
                    className="mb-1.5 text-[9px] uppercase tracking-[0.14em]"
                    style={{ color: D5.faint }}
                  >
                    Fulfillment track
                  </div>
                  <div className="flex items-center gap-1">
                    {PIPE.map((s, i) => {
                      const order = ["new", "picking", "ready", "shipped"];
                      const cur = order.indexOf(selected.status);
                      const done = i <= cur && selected.status !== "hold";
                      return (
                        <div key={s.key} className="flex flex-1 items-center gap-1">
                          <div
                            className="h-1.5 flex-1 rounded-full"
                            style={{ background: done ? D5.accent : D5.line }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div
                    className="mt-1 flex justify-between text-[9px]"
                    style={{ color: D5.faint }}
                  >
                    {PIPE.map((s) => (
                      <span key={s.key}>{s.label}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-1.5">
                  <button
                    type="button"
                    className="flex h-8 items-center justify-center gap-1.5 rounded text-[11px] font-bold"
                    style={{ background: D5.accent, color: D5.bg }}
                  >
                    Advance status <ArrowRight size={12} />
                  </button>
                  <div className="flex gap-1.5">
                    <Btn>Print pick</Btn>
                    <Btn>Message rep</Btn>
                    <Btn variant="danger">Hold</Btn>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="px-3 py-8 text-center text-[12px]"
                style={{ color: D5.dim }}
              >
                {isLoading ? "Loading…" : "No order selected."}
              </div>
            )}
          </Panel>

          <Panel title="Activity" hint="// audit log">
            <div className="p-2">
              {selected && selected.order.activity.length ? (
                selected.order.activity.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex gap-2 px-1 py-1.5">
                    <span
                      className="w-9 shrink-0 text-right text-[9px]"
                      style={{ color: D5.faint }}
                    >
                      {relativeAge(a.createdAt)}
                    </span>
                    <Dot color={D5.accent} />
                    <div className="min-w-0">
                      <div className="text-[10px] font-semibold" style={{ color: D5.ink }}>
                        {a.label}
                      </div>
                      <div className="text-[10px]" style={{ color: D5.dim }}>
                        {a.detail}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-1 py-2 text-[10px]" style={{ color: D5.faint }}>
                  No activity logged.
                </p>
              )}
            </div>
          </Panel>

          <div
            className="flex items-center justify-between rounded-md border px-2.5 py-2 text-[10px]"
            style={{ borderColor: D5.line, background: D5.panel, color: D5.faint }}
          >
            <span>
              <Kbd>J</Kbd> / <Kbd>K</Kbd> move · <Kbd>↵</Kbd> open
            </span>
            <Link href="/design-lab/d5/reports" style={{ color: D5.accent }}>
              reports →
            </Link>
          </div>
        </div>
      </div>
    </Shell>
  );
}
