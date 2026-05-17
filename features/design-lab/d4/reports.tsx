"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Download,
  PiggyBank,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users
} from "lucide-react";
import { D4Shell, brandClasses } from "./shell";

const RANGES = ["7 days", "30 days", "Quarter", "Year"] as const;
type Range = (typeof RANGES)[number];

const REVENUE: Record<Range, number[]> = {
  "7 days": [3.1, 4.0, 3.6, 5.2, 4.4, 6.1, 5.8],
  "30 days": [2.4, 3.0, 3.8, 3.2, 4.1, 4.6, 4.2, 5.0, 5.4, 6.1],
  Quarter: [18, 22, 26, 24, 31, 29, 35, 38, 41, 44, 47, 52],
  Year: [120, 135, 128, 150, 162, 158, 175, 188, 196, 210, 222, 240]
};

const RANGE_LABEL: Record<Range, string[]> = {
  "7 days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  "30 days": ["W1", "", "W2", "", "W3", "", "W4", "", "W5", ""],
  Quarter: ["", "", "M1", "", "", "M2", "", "", "M3", "", "", ""],
  Year: ["Jan", "", "Mar", "", "May", "", "Jul", "", "Sep", "", "Nov", ""]
};

const KPIS: Record<
  Range,
  { revenue: string; orders: string; aov: string; customers: string }
> = {
  "7 days": { revenue: "$32.2k", orders: "118", aov: "$273", customers: "41" },
  "30 days": { revenue: "$141k", orders: "512", aov: "$276", customers: "188" },
  Quarter: { revenue: "$408k", orders: "1,486", aov: "$275", customers: "503" },
  Year: { revenue: "$2.08M", orders: "7,640", aov: "$272", customers: "1,920" }
};

const TOP_PRODUCTS = [
  { name: "Cantilever Gate Roller Kit", units: 312, revenue: 44304, share: 100 },
  { name: "Gravity Gate Hinge Pair", units: 540, revenue: 29694, share: 67 },
  { name: "M18 Impact Driver Kit", units: 118, revenue: 25842, share: 58 },
  { name: "Galvanized Steel Tube 2x2", units: 287, revenue: 22529, share: 51 },
  { name: "Carriage Bolts — 50 ct", units: 910, revenue: 20702, share: 47 }
];

const CHANNELS = [
  { name: "Online storefront", pct: 58, tint: "bg-orange-500" },
  { name: "Counter / walk-in", pct: 27, tint: "bg-sky-500" },
  { name: "Phone & quotes", pct: 15, tint: "bg-violet-500" }
];

export function D4Reports() {
  const [range, setRange] = useState<Range>("7 days");
  const series = REVENUE[range];
  const labels = RANGE_LABEL[range];
  const kpi = KPIS[range];
  const max = Math.max(...series);

  return (
    <D4Shell active="reports">
      <div className="border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
              Insights
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Reports &amp; performance
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Sales are trending up — here&rsquo;s where the growth is coming
              from.
            </p>
          </div>
          <button
            type="button"
            className={`${brandClasses.btn} px-4 py-2.5 text-sm`}
          >
            <Download className="h-4 w-4" /> Export report
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* Range selector */}
        <div className="flex flex-wrap gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-xl px-3.5 py-2 text-sm font-bold transition ${
                range === r
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-orange-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Revenue", value: kpi.revenue, delta: "+18.4%", up: true, icon: PiggyBank, tint: "bg-emerald-100 text-emerald-600" },
            { label: "Orders", value: kpi.orders, delta: "+11.2%", up: true, icon: ShoppingCart, tint: "bg-orange-100 text-orange-600" },
            { label: "Avg. order value", value: kpi.aov, delta: "-1.3%", up: false, icon: TrendingUp, tint: "bg-sky-100 text-sky-600" },
            { label: "New customers", value: kpi.customers, delta: "+24.0%", up: true, icon: Users, tint: "bg-violet-100 text-violet-600" }
          ].map((k) => (
            <div key={k.label} className={`${brandClasses.card} p-5`}>
              <div className="flex items-center justify-between">
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl ${k.tint}`}
                >
                  <k.icon className="h-5 w-5" />
                </div>
                <span
                  className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                    k.up
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {k.up ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {k.delta}
                </span>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">
                {k.value}
              </p>
              <p className="text-sm font-semibold text-slate-500">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Revenue chart */}
          <div className={`${brandClasses.card} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-slate-900">
                  Revenue trend
                </p>
                <p className="text-xs text-slate-400">
                  Sales over the selected {range.toLowerCase()}
                </p>
              </div>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                On pace to beat target
              </span>
            </div>
            <div className="mt-6 flex h-52 items-end gap-2">
              {series.map((v, i) => (
                <div
                  key={i}
                  className="group flex flex-1 flex-col items-center gap-2"
                >
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-orange-400 to-orange-300 transition-all group-hover:from-orange-500 group-hover:to-orange-400"
                      style={{ height: `${(v / max) * 100}%` }}
                    />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                      ${v}k
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {labels[i] ?? ""}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div className={`${brandClasses.card} p-6`}>
            <p className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Boxes className="h-5 w-5 text-orange-500" /> Sales by channel
            </p>
            <div className="mt-5 space-y-4">
              {CHANNELS.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                      {c.name}
                    </span>
                    <span className="font-bold text-slate-900">{c.pct}%</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${c.tint}`}
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-orange-50 p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-orange-700">
                <Sparkles className="h-4 w-4" /> Insight
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Online orders grew fastest this period. Promote same-day pickup
                to convert more counter traffic.
              </p>
            </div>
          </div>
        </div>

        {/* Top products */}
        <div className={`${brandClasses.card} mt-6 p-6`}>
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-slate-900">
              Top products
            </p>
            <Link
              href="/design-lab/d4/category"
              className="text-sm font-bold text-orange-600 hover:text-orange-700"
            >
              View catalog
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={p.name} className="flex items-center gap-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {p.name}
                    </p>
                    <p className="shrink-0 text-sm font-bold text-slate-900">
                      ${p.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-orange-400"
                        style={{ width: `${p.share}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-xs text-slate-400">
                      {p.units} sold
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Link
            href="/design-lab/d4/orders"
            className="flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700"
          >
            Back to orders <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </D4Shell>
  );
}
