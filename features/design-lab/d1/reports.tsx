"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Download,
  Users
} from "lucide-react";
import { D1DesignBadge, D1Page, Eyebrow, formatUsd } from "./kit";

const RANGES = ["7 days", "30 days", "Quarter", "Year"];

const KPIS = [
  { label: "Revenue", value: "$248,910", delta: "+12.4%", up: true },
  { label: "Orders", value: "1,284", delta: "+8.1%", up: true },
  { label: "Avg. order value", value: "$193.85", delta: "+3.9%", up: true },
  { label: "Return rate", value: "1.7%", delta: "-0.4%", up: false }
];

const REVENUE = [
  { label: "Mon", value: 62 },
  { label: "Tue", value: 78 },
  { label: "Wed", value: 54 },
  { label: "Thu", value: 91 },
  { label: "Fri", value: 100 },
  { label: "Sat", value: 47 },
  { label: "Sun", value: 33 }
];

const CATEGORIES = [
  { name: "Structural Steel", share: 38, revenue: 94586 },
  { name: "Gate Hardware", share: 29, revenue: 72184 },
  { name: "Ornamental Iron", share: 21, revenue: 52271 },
  { name: "Welding Supply", share: 12, revenue: 29869 }
];

const TOP_PRODUCTS = [
  { name: "Heavy-Duty Cantilever Roller Kit", sku: "GW-CR-2400", units: 312, revenue: 90168 },
  { name: '2" x 2" x 11ga Square Steel Tube', sku: "ST-SQ-2211", units: 1840, revenue: 78200 },
  { name: "Welded Box Hinge Set — Bolt-On", sku: "GW-BH-880", units: 488, revenue: 31232 },
  { name: "Forged Scroll Picket — 36 in", sku: "OI-SCR-36", units: 1024, revenue: 19200 },
  { name: "Slide Gate Latch — Lockable", sku: "GW-SL-440", units: 372, revenue: 19344 }
];

const ACCOUNTS = [
  { name: "Cascade Iron Works", orders: 47, spend: 58210 },
  { name: "Foothill Welding LLC", orders: 39, spend: 41980 },
  { name: "Ridgeline Fence Co.", orders: 33, spend: 36740 },
  { name: "Anvil Gate & Door", orders: 28, spend: 24115 }
];

const CAT_TONES = ["#16150f", "#2f6f4e", "#6c685c", "#d6a93f"];

export function D1Reports() {
  const [range, setRange] = useState(RANGES[1]);

  return (
    <D1Page wide>
      <div className="pt-5">
        <D1DesignBadge />
      </div>

      <header className="border-y-2 border-d1-ink py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Business intelligence</Eyebrow>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-d1-ink sm:text-5xl">
              Reports
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-d1-ink">
              {RANGES.map((option) => (
                <button
                  key={option}
                  className={`px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] transition ${
                    range === option
                      ? "bg-d1-ink text-d1-paper"
                      : "text-d1-steel hover:text-d1-ink"
                  }`}
                  onClick={() => setRange(option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              className="inline-flex items-center gap-2 border border-d1-ink px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
              type="button"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid gap-px border border-d1-line bg-d1-line sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="bg-d1-card p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-d1-steel">
              {kpi.label}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-d1-ink">
              {kpi.value}
            </p>
            <p
              className={`mt-1.5 flex items-center gap-1 text-[12px] font-bold ${
                kpi.up ? "text-d1-pine" : "text-d1-red"
              }`}
            >
              {kpi.up ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {kpi.delta}
              <span className="font-semibold text-d1-steel">vs prior</span>
            </p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Revenue chart */}
        <section className="lg:col-span-7">
          <div className="flex items-end justify-between border-b-2 border-d1-ink pb-3">
            <h2 className="text-xl font-extrabold tracking-tight text-d1-ink">
              Revenue by day
            </h2>
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
              {range}
            </span>
          </div>
          <div className="mt-6 border border-d1-line bg-d1-card p-6">
            <div className="flex h-56 items-end gap-3">
              {REVENUE.map((bar) => (
                <div
                  key={bar.label}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <span className="text-[11px] font-bold text-d1-steel">
                    {Math.round(bar.value * 0.42)}k
                  </span>
                  <div
                    className="w-full bg-d1-ink transition-all"
                    style={{
                      height: `${bar.value}%`,
                      backgroundColor:
                        bar.value === 100 ? "#2f6f4e" : "#16150f"
                    }}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Category mix */}
        <section className="lg:col-span-5">
          <div className="flex items-end justify-between border-b-2 border-d1-ink pb-3">
            <h2 className="text-xl font-extrabold tracking-tight text-d1-ink">
              Category mix
            </h2>
          </div>
          <div className="mt-6 border border-d1-line bg-d1-card p-6">
            <div className="flex h-3 w-full overflow-hidden">
              {CATEGORIES.map((cat, index) => (
                <div
                  key={cat.name}
                  style={{
                    width: `${cat.share}%`,
                    backgroundColor: CAT_TONES[index]
                  }}
                />
              ))}
            </div>
            <ul className="mt-5 space-y-3.5">
              {CATEGORIES.map((cat, index) => (
                <li
                  key={cat.name}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3"
                      style={{ backgroundColor: CAT_TONES[index] }}
                    />
                    <span className="text-sm font-bold text-d1-ink">
                      {cat.name}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-d1-steel">
                      {formatUsd(cat.revenue)}
                    </span>
                    <span className="w-9 text-right text-sm font-extrabold text-d1-ink">
                      {cat.share}%
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Top products */}
        <section className="lg:col-span-7">
          <div className="flex items-end justify-between border-b-2 border-d1-ink pb-3">
            <h2 className="text-xl font-extrabold tracking-tight text-d1-ink">
              Top products
            </h2>
            <Link
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-pine hover:underline"
              href="/design-lab/d1/category"
            >
              Full catalog <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-5 overflow-x-auto border border-d1-line bg-d1-card">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3 text-right">Units</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-d1-line">
                {TOP_PRODUCTS.map((product) => (
                  <tr key={product.sku} className="transition hover:bg-white">
                    <td className="px-4 py-3.5">
                      <span className="block text-sm font-bold text-d1-ink">
                        {product.name}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                        {product.sku}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-bold text-d1-ink">
                      {product.units.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                      {formatUsd(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top accounts */}
        <section className="lg:col-span-5">
          <div className="flex items-end justify-between border-b-2 border-d1-ink pb-3">
            <h2 className="text-xl font-extrabold tracking-tight text-d1-ink">
              Top trade accounts
            </h2>
          </div>
          <div className="mt-5 divide-y divide-d1-line border border-d1-line bg-d1-card">
            {ACCOUNTS.map((account, index) => (
              <div
                key={account.name}
                className="flex items-center gap-4 px-4 py-3.5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center bg-d1-ink text-sm font-extrabold text-d1-paper">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-d1-ink">
                    {account.name}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                    {account.orders} orders
                  </p>
                </div>
                <span className="text-sm font-extrabold text-d1-ink">
                  {formatUsd(account.spend)}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-pine">
              <Users className="h-3.5 w-3.5" />
              142 active trade accounts
            </div>
          </div>

          <Link
            className="mt-5 flex items-center justify-between border-2 border-d1-ink bg-d1-ink px-5 py-4 text-d1-paper transition hover:bg-d1-pine"
            href="/design-lab/d1/orders"
          >
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-d1-amber">
                Operations
              </span>
              <span className="text-sm font-bold">Jump to live orders</span>
            </span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </div>
    </D1Page>
  );
}
