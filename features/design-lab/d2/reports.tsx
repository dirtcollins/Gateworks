"use client";

/** DESIGN 2 — Warehouse Dark · Admin reports dashboard */

import { useState } from "react";
import { ArrowUpRight, Download, TrendingUp } from "lucide-react";
import { D2, D2Shell, Panel, PanelHead, StatCell, Tag, mono } from "./kit";

const RANGES = ["7D", "30D", "QTR", "YTD"];

const KPIS = [
  { label: "Revenue (30d)", value: "$486k", delta: "12.4%", good: true },
  { label: "Orders shipped", value: "1,204", delta: "8.1%", good: true },
  { label: "Avg order value", value: "$403", delta: "3.6%", good: true },
  { label: "Return rate", value: "1.2%", delta: "0.4%", good: false }
];

const REVENUE = [
  { d: "Mon", v: 58 },
  { d: "Tue", v: 72 },
  { d: "Wed", v: 64 },
  { d: "Thu", v: 91 },
  { d: "Fri", v: 100 },
  { d: "Sat", v: 47 },
  { d: "Sun", v: 33 }
];

const TOP_SKUS = [
  { id: "GW-7740", name: "Bolt-On Gate Hinge 6\"", units: 1840, rev: 63756, share: 100 },
  { id: "GW-9051", name: "Steel Square Tube 2x2", units: 612, rev: 37791, share: 59 },
  { id: "GW-2208", name: "Drop Rod Latch Assembly", units: 1422, rev: 30715, share: 48 },
  { id: "GW-4417", name: "V-Track Roller — Cast", units: 980, rev: 19551, share: 31 },
  { id: "GW-6602", name: "Cantilever Truck Assembly", units: 188, rev: 27072, share: 42 }
];

const SEGMENTS = [
  { name: "Fencing contractors", pct: 42, color: D2.accent },
  { name: "Steel fabricators", pct: 28, color: "#3da0f5" },
  { name: "General contractors", pct: 18, color: "#f5b53d" },
  { name: "Walk-in / card", pct: 12, color: "#8a6bf5" }
];

const REGIONS = [
  { r: "Front Range", rev: 184, pct: 38 },
  { r: "Western Slope", rev: 121, pct: 25 },
  { r: "Northern CO", rev: 97, pct: 20 },
  { r: "Out-of-state", rev: 84, pct: 17 }
];

const ALERTS = [
  { msg: "GW-9051 — 18 units left, below 50 reorder point", tone: "warn" as const },
  { msg: "Hartman Welding — invoice 14d past due", tone: "bad" as const },
  { msg: "Q2 revenue tracking 9% ahead of target", tone: "accent" as const }
];

export function D2Reports() {
  const [range, setRange] = useState("30D");
  const maxRev = Math.max(...REVENUE.map((r) => r.v));

  return (
    <D2Shell active="reports" kicker="ADMIN // ANALYTICS">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight">Performance Reports</h1>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center rounded-[3px]"
            style={{ border: `1px solid ${D2.line}` }}
          >
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`${mono} px-3 py-1.5 text-[11px] uppercase tracking-wider transition`}
                style={{
                  color: r === range ? D2.bg : D2.muted,
                  background: r === range ? D2.accent : "transparent"
                }}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`${mono} flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[11px] uppercase tracking-wider`}
            style={{ background: D2.panelHi, color: D2.accent, border: `1px solid ${D2.line}` }}
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* KPIs */}
      <Panel className="mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {KPIS.map((k) => (
            <StatCell key={k.label} {...k} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* revenue chart */}
        <Panel>
          <PanelHead
            title="Revenue Trend"
            meta={`${range} · $K / DAY`}
            action={
              <span
                className={`${mono} flex items-center gap-1 text-[11px]`}
                style={{ color: D2.accent }}
              >
                <TrendingUp className="h-3.5 w-3.5" /> +12.4%
              </span>
            }
          />
          <div className="p-5">
            <div className="flex h-52 items-end gap-3">
              {REVENUE.map((r) => (
                <div key={r.d} className="flex flex-1 flex-col items-center gap-2">
                  <span className={`${mono} text-[10px]`} style={{ color: D2.muted }}>
                    ${r.v}k
                  </span>
                  <div
                    className="w-full rounded-t-[3px] transition-all"
                    style={{
                      height: `${(r.v / maxRev) * 150}px`,
                      background:
                        r.v === maxRev
                          ? D2.accent
                          : `linear-gradient(180deg, ${D2.accent}88, ${D2.accent}22)`,
                      boxShadow: r.v === maxRev ? `0 0 18px ${D2.accent}66` : undefined
                    }}
                  />
                  <span className={`${mono} text-[10px] uppercase`} style={{ color: D2.muted }}>
                    {r.d}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* regions */}
          <div className="border-t" style={{ borderColor: D2.line }}>
            <div
              className={`${mono} px-5 py-2.5 text-[10px] uppercase tracking-[0.16em]`}
              style={{ color: D2.muted }}
            >
              Revenue by region
            </div>
            {REGIONS.map((rg, i) => (
              <div
                key={rg.r}
                className="flex items-center gap-3 px-5 py-2.5"
                style={{ borderTop: i > 0 ? `1px solid ${D2.line}` : undefined }}
              >
                <span className="w-32 text-[12px]">{rg.r}</span>
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full"
                  style={{ background: D2.line }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${rg.pct}%`, background: D2.accent }}
                  />
                </div>
                <span className={`${mono} w-16 text-right text-[12px] font-bold`}>
                  ${rg.rev}k
                </span>
                <span className={`${mono} w-10 text-right text-[11px]`} style={{ color: D2.muted }}>
                  {rg.pct}%
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* segments + alerts */}
        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHead title="Customer Mix" meta="BY REVENUE" />
            <div className="p-5">
              {/* stacked bar */}
              <div
                className="flex h-3 overflow-hidden rounded-full"
                style={{ border: `1px solid ${D2.line}` }}
              >
                {SEGMENTS.map((s) => (
                  <div key={s.name} style={{ width: `${s.pct}%`, background: s.color }} />
                ))}
              </div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {SEGMENTS.map((s) => (
                  <li key={s.name} className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-[2px]"
                      style={{ background: s.color }}
                    />
                    <span className="flex-1 text-[12px]">{s.name}</span>
                    <span className={`${mono} text-[12px] font-bold`}>{s.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Signals" meta="3 ITEMS" />
            <ul>
              {ALERTS.map((a, i) => (
                <li
                  key={a.msg}
                  className="flex items-start gap-3 px-4 py-3"
                  style={{ borderTop: i > 0 ? `1px solid ${D2.line}` : undefined }}
                >
                  <Tag tone={a.tone}>
                    {a.tone === "bad" ? "A/R" : a.tone === "warn" ? "STOCK" : "GOAL"}
                  </Tag>
                  <span className="flex-1 text-[12px] leading-snug">{a.msg}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      {/* top SKUs */}
      <Panel className="mt-6">
        <PanelHead
          title="Top SKUs"
          meta="BY REVENUE · 30D"
          action={
            <span
              className={`${mono} flex items-center gap-1 text-[11px] uppercase`}
              style={{ color: D2.accent }}
            >
              Full report <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          }
        />
        <div
          className={`${mono} grid grid-cols-[2fr_0.8fr_1fr_1.4fr] gap-2 px-4 py-2 text-[10px] uppercase tracking-wider`}
          style={{ color: D2.muted, borderBottom: `1px solid ${D2.line}` }}
        >
          <span>SKU</span>
          <span className="text-right">Units</span>
          <span className="text-right">Revenue</span>
          <span>Share</span>
        </div>
        {TOP_SKUS.map((s, i) => (
          <div
            key={s.id}
            className="grid grid-cols-[2fr_0.8fr_1fr_1.4fr] items-center gap-2 px-4 py-3"
            style={{ borderTop: i > 0 ? `1px solid ${D2.line}` : undefined }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`${mono} grid h-6 w-6 shrink-0 place-items-center rounded-[3px] text-[11px] font-bold`}
                style={{
                  background: i === 0 ? D2.accent : D2.panelHi,
                  color: i === 0 ? D2.bg : D2.muted,
                  border: `1px solid ${D2.line}`
                }}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className={`${mono} text-[10px]`} style={{ color: D2.muted }}>
                  {s.id}
                </div>
                <div className="truncate text-[12px] font-medium">{s.name}</div>
              </div>
            </div>
            <span className={`${mono} text-right text-[12px]`}>
              {s.units.toLocaleString()}
            </span>
            <span className={`${mono} text-right text-[12px] font-bold`} style={{ color: D2.accent }}>
              ${s.rev.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full"
                style={{ background: D2.line }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${s.share}%`, background: D2.accent }}
                />
              </div>
            </div>
          </div>
        ))}
      </Panel>
    </D2Shell>
  );
}
