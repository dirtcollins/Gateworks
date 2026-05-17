"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Package,
  TrendingUp
} from "lucide-react";
import { Btn, D5, Dot, H, Panel, Shell, Tag, mono } from "./kit";
import { fmt } from "./data";

const RANGES = ["7D", "30D", "QTD", "YTD"] as const;

const KPI = [
  { label: "Revenue", value: "$214.8k", delta: 8.4, up: true },
  { label: "Orders", value: "486", delta: 5.1, up: true },
  { label: "Avg ticket", value: "$442", delta: 3.2, up: true },
  { label: "Fill rate", value: "97.6%", delta: 1.1, up: true },
  { label: "Backorders", value: "3 SKU", delta: 25.0, up: false },
  { label: "Gross margin", value: "31.4%", delta: 0.6, up: true }
];

const REVENUE = [
  62, 71, 58, 80, 74, 88, 92, 79, 101, 96, 110, 118
];

const TOP_SKU = [
  { sku: "STL-SQT-2014", name: 'Square Tube 2"×14ga', rev: 38240, units: 996, share: 100 },
  { sku: "FNC-PKT-6FT", name: "Ornamental Picket 6ft", rev: 27110, units: 568, share: 71 },
  { sku: "GAT-HNG-BRL4", name: "Barrel Hinge 4in", rev: 19840, units: 1368, share: 52 },
  { sku: "STL-PLT-3163", name: 'Steel Plate 3/16"', rev: 16420, units: 89, share: 43 },
  { sku: "WLD-ER70-035", name: "ER70S-6 MIG Wire", rev: 12960, units: 135, share: 34 }
];

const HUBS = [
  { hub: "DEN-01 Denver", rev: 148200, orders: 322, util: 84 },
  { hub: "COS-02 Colorado Springs", rev: 66600, orders: 164, util: 61 }
];

const CHANNEL = [
  { name: "Web storefront", pct: 54, color: D5.accent },
  { name: "Counter", pct: 29, color: D5.blue },
  { name: "Phone / rep", pct: 17, color: D5.amber }
];

const ALERTS = [
  { sku: "STL-ANG-2018", msg: 'Angle Iron 2"×2" — 0 on hand, 4 orders waiting', tone: "red" as const },
  { sku: "GAT-LCH-DLX", msg: "Locking Latch — below reorder point (88/120)", tone: "amber" as const },
  { sku: "WLD-ER70-035", msg: "MIG Wire — supplier price up 6% next PO", tone: "amber" as const }
];

export default function D5Reports() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("30D");

  return (
    <Shell crumb="ops / reports">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <H>Reports</H>
          <p className="mt-0.5 text-[11px]" style={{ color: D5.faint }}>
            Sales &amp; inventory analytics · {range} window · updated 4m ago
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="flex rounded border p-0.5"
            style={{ borderColor: D5.line, background: D5.panel }}
          >
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className="rounded px-2.5 py-1 text-[10px] font-bold"
                style={{
                  background: range === r ? D5.accent : "transparent",
                  color: range === r ? D5.bg : D5.dim
                }}
              >
                {r}
              </button>
            ))}
          </div>
          <Btn>
            <Download size={12} /> Export CSV
          </Btn>
        </div>
      </div>

      {/* KPI grid */}
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {KPI.map((k) => (
          <div
            key={k.label}
            className="rounded-md border px-3 py-2.5"
            style={{ borderColor: D5.line, background: D5.panel }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ color: D5.faint }}
            >
              {k.label}
            </div>
            <div className="mt-1 text-[19px] font-bold" style={{ color: D5.ink }}>
              {k.value}
            </div>
            <div
              className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: k.up ? D5.accent : D5.red }}
            >
              {k.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              {k.delta}% vs prev
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          {/* revenue chart */}
          <Panel
            title="Revenue"
            hint="// $k per period"
            right={
              <span
                className="flex items-center gap-1 text-[10px] font-semibold"
                style={{ color: D5.accent }}
              >
                <TrendingUp size={11} /> +8.4%
              </span>
            }
          >
            <div className="flex h-44 items-end gap-1.5 px-3 pb-3 pt-4">
              {REVENUE.map((v, i) => {
                const max = Math.max(...REVENUE);
                return (
                  <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                    <span
                      className="text-[8px] opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: D5.dim, fontFamily: mono }}
                    >
                      {v}
                    </span>
                    <div
                      className="w-full rounded-sm transition-colors"
                      style={{
                        height: `${(v / max) * 100}%`,
                        background: i === REVENUE.length - 1 ? D5.accent : D5.accentDim
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div
              className="flex justify-between border-t px-3 py-1.5 text-[9px]"
              style={{ borderColor: D5.line, color: D5.faint }}
            >
              <span>12 periods ago</span>
              <span>now</span>
            </div>
          </Panel>

          {/* top SKUs */}
          <Panel title="Top SKUs" hint="// by revenue">
            <div
              className="grid grid-cols-[1fr_84px_84px] gap-x-3 border-b px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] md:grid-cols-[1fr_120px_84px_84px]"
              style={{ borderColor: D5.line, color: D5.faint }}
            >
              <span>item</span>
              <span className="hidden md:block">share</span>
              <span className="text-right">units</span>
              <span className="text-right">revenue</span>
            </div>
            {TOP_SKU.map((s) => (
              <div
                key={s.sku}
                className="grid grid-cols-[1fr_84px_84px] items-center gap-x-3 border-b px-3 py-2 last:border-0 md:grid-cols-[1fr_120px_84px_84px]"
                style={{ borderColor: D5.line }}
              >
                <div className="overflow-hidden">
                  <div className="truncate text-[12px] font-semibold" style={{ color: D5.ink }}>
                    {s.name}
                  </div>
                  <div className="text-[9px]" style={{ color: D5.faint }}>
                    {s.sku}
                  </div>
                </div>
                <div className="hidden md:block">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ background: D5.line }}
                  >
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${s.share}%`, background: D5.accent }}
                    />
                  </div>
                </div>
                <span
                  className="text-right text-[11px]"
                  style={{ color: D5.dim, fontFamily: mono }}
                >
                  {s.units}
                </span>
                <span
                  className="text-right text-[12px] font-bold"
                  style={{ color: D5.ink, fontFamily: mono }}
                >
                  {fmt(s.rev)}
                </span>
              </div>
            ))}
          </Panel>

          {/* hub performance */}
          <Panel title="Hub performance" hint="// 2 locations">
            <div className="grid gap-px md:grid-cols-2" style={{ background: D5.line }}>
              {HUBS.map((h) => (
                <div key={h.hub} className="p-3" style={{ background: D5.panel }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold" style={{ color: D5.ink }}>
                      {h.hub}
                    </span>
                    <Tag tone={h.util > 75 ? "accent" : "amber"}>{h.util}% util</Tag>
                  </div>
                  <div className="mt-2 flex items-baseline gap-3">
                    <div>
                      <div className="text-[9px] uppercase" style={{ color: D5.faint }}>
                        revenue
                      </div>
                      <div className="text-[16px] font-bold" style={{ color: D5.ink }}>
                        {fmt(h.rev)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase" style={{ color: D5.faint }}>
                        orders
                      </div>
                      <div className="text-[16px] font-bold" style={{ color: D5.ink }}>
                        {h.orders}
                      </div>
                    </div>
                  </div>
                  <div
                    className="mt-2 h-1.5 rounded-full"
                    style={{ background: D5.line }}
                  >
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${h.util}%`,
                        background: h.util > 75 ? D5.accent : D5.amber
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* side column */}
        <div className="flex flex-col gap-3">
          <Panel title="Channel mix" hint="// orders">
            <div className="p-3">
              <div className="flex h-3 overflow-hidden rounded-full">
                {CHANNEL.map((c) => (
                  <div
                    key={c.name}
                    style={{ width: `${c.pct}%`, background: c.color }}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                {CHANNEL.map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span
                      className="flex items-center gap-2 text-[11px]"
                      style={{ color: D5.dim }}
                    >
                      <Dot color={c.color} /> {c.name}
                    </span>
                    <span
                      className="text-[12px] font-bold"
                      style={{ color: D5.ink, fontFamily: mono }}
                    >
                      {c.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel
            title="Inventory alerts"
            hint={`// ${ALERTS.length}`}
            right={<AlertTriangle size={12} style={{ color: D5.amber }} />}
          >
            <div className="p-1.5">
              {ALERTS.map((a) => (
                <div
                  key={a.sku}
                  className="flex gap-2 rounded px-1.5 py-1.5"
                >
                  <Dot color={a.tone === "red" ? D5.red : D5.amber} />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold" style={{ color: D5.ink }}>
                      {a.sku}
                    </div>
                    <div className="text-[10px] leading-snug" style={{ color: D5.dim }}>
                      {a.msg}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div
              className="border-t px-3 py-1.5"
              style={{ borderColor: D5.line }}
            >
              <Link
                href="/design-lab/d5/category"
                className="flex items-center gap-1 text-[10px] font-semibold"
                style={{ color: D5.accent }}
              >
                <Package size={11} /> open replenishment →
              </Link>
            </div>
          </Panel>

          <Panel title="Quick stats">
            <div className="grid grid-cols-2 gap-px" style={{ background: D5.line }}>
              {[
                ["New customers", "31"],
                ["Quotes issued", "74"],
                ["Quote → order", "42%"],
                ["Avg pick time", "11m"],
                ["On-time ship", "96%"],
                ["Returns", "0.8%"]
              ].map(([k, v]) => (
                <div key={k} className="px-3 py-2" style={{ background: D5.panel }}>
                  <div className="text-[9px] uppercase" style={{ color: D5.faint }}>
                    {k}
                  </div>
                  <div className="text-[14px] font-bold" style={{ color: D5.ink }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Link
            href="/design-lab/d5/orders"
            className="flex items-center justify-between rounded-md border px-3 py-2.5 text-[11px] font-semibold transition-colors hover:brightness-110"
            style={{ borderColor: D5.line, background: D5.panel, color: D5.ink }}
          >
            <span>Jump to live order desk</span>
            <ArrowUpRight size={13} style={{ color: D5.accent }} />
          </Link>
        </div>
      </div>
    </Shell>
  );
}
