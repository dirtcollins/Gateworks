"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Globe,
  Phone,
  Search,
  Store,
  type LucideIcon
} from "lucide-react";
import { Btn, D5, Dot, H, Kbd, Panel, Shell, Tag, mono } from "./kit";
import { ORDERS, type Order, fmt } from "./data";

const STATUS: Record<
  Order["status"],
  { label: string; tone: "dim" | "accent" | "amber" | "red" | "blue"; color: string }
> = {
  new: { label: "New", tone: "blue", color: D5.blue },
  picking: { label: "Picking", tone: "amber", color: D5.amber },
  ready: { label: "Ready", tone: "accent", color: D5.accent },
  shipped: { label: "Shipped", tone: "dim", color: D5.faint },
  hold: { label: "Hold", tone: "red", color: D5.red }
};

const CHANNEL: Record<Order["channel"], LucideIcon> = {
  web: Globe,
  counter: Store,
  phone: Phone
};

const PIPE: { key: Order["status"]; label: string }[] = [
  { key: "new", label: "New" },
  { key: "picking", label: "Picking" },
  { key: "ready", label: "Ready" },
  { key: "shipped", label: "Shipped" }
];

export default function D5Orders() {
  const [filter, setFilter] = useState<Order["status"] | "all">("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(ORDERS[0].id);

  const rows = useMemo(
    () =>
      ORDERS.filter((o) => {
        if (filter !== "all" && o.status !== filter) return false;
        if (q && !`${o.id} ${o.customer} ${o.rep}`.toLowerCase().includes(q.toLowerCase()))
          return false;
        return true;
      }),
    [filter, q]
  );

  const selected = ORDERS.find((o) => o.id === sel) ?? rows[0] ?? ORDERS[0];

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: ORDERS.length };
    for (const o of ORDERS) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, []);

  const revenue = ORDERS.reduce((s, o) => s + o.total, 0);

  return (
    <Shell crumb="ops / orders">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <H>Order desk</H>
          <p className="mt-0.5 text-[11px]" style={{ color: D5.faint }}>
            {ORDERS.length} active · {fmt(revenue)} in flight · 2 hubs · live
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
              placeholder="filter id / customer / rep"
              className="w-44 bg-transparent text-[11px] outline-none"
              style={{ color: D5.ink }}
            />
          </div>
          <Btn variant="primary">
            New order
          </Btn>
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
          {rows.map((o) => {
            const st = STATUS[o.status];
            const Ch = CHANNEL[o.channel];
            const on = sel === o.id;
            return (
              <button
                key={o.id}
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
                  className="text-[11px] font-bold"
                  style={{ color: on ? D5.accent : D5.ink, fontFamily: mono }}
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
                    {o.hub} · {o.rep} · {o.age} ago
                  </div>
                </div>
                <span className="hidden justify-center md:flex">
                  <Ch size={13} style={{ color: D5.dim }} />
                </span>
                <span
                  className="text-center text-[11px]"
                  style={{ color: D5.dim, fontFamily: mono }}
                >
                  {o.items}
                </span>
                <span
                  className="text-right text-[11px] font-bold"
                  style={{ color: D5.ink, fontFamily: mono }}
                >
                  {fmt(o.total)}
                </span>
                <span className="flex justify-end">
                  <Tag tone={st.tone}>{st.label}</Tag>
                </span>
              </button>
            );
          })}
        </Panel>

        {/* detail panel */}
        <div className="flex flex-col gap-3">
          <Panel title="Order detail" hint={`// ${selected.id}`}>
            <div className="p-3">
              <div className="flex items-center justify-between">
                <span
                  className="text-[15px] font-bold"
                  style={{ color: D5.ink, fontFamily: mono }}
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
                {selected.hub} · placed {selected.age} ago via {selected.channel}
              </div>

              <div
                className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded border"
                style={{ borderColor: D5.line, background: D5.line }}
              >
                {[
                  ["Items", String(selected.items)],
                  ["Rep", selected.rep],
                  ["Total", fmt(selected.total)]
                ].map(([k, v]) => (
                  <div key={k} className="px-2 py-1.5" style={{ background: D5.panel }}>
                    <div className="text-[9px] uppercase" style={{ color: D5.faint }}>
                      {k}
                    </div>
                    <div className="text-[11px] font-bold" style={{ color: D5.ink }}>
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
                        {i < PIPE.length - 1 ? null : null}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1 flex justify-between text-[9px]" style={{ color: D5.faint }}>
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
          </Panel>

          <Panel title="Activity" hint="// audit log">
            <div className="p-2">
              {[
                ["now", "Order opened in desk", D5.accent],
                ["12m", "Credit check passed — NET-30", D5.blue],
                ["18m", "Allocated from DEN-01 stock", D5.dim],
                ["22m", "Confirmation emailed to buyer", D5.dim]
              ].map(([t, msg, c]) => (
                <div key={msg} className="flex gap-2 px-1 py-1.5">
                  <span
                    className="w-9 shrink-0 text-right text-[9px]"
                    style={{ color: D5.faint }}
                  >
                    {t}
                  </span>
                  <Dot color={c} />
                  <span className="text-[10px]" style={{ color: D5.dim }}>
                    {msg}
                  </span>
                </div>
              ))}
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
