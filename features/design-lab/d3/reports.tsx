"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { D3Shell, Eyebrow, MaterialBlock, d3, serif } from "./shared";

/** DESIGN 3 — "Editorial Catalog" — Admin reports dashboard. */

const ranges = ["7 days", "30 days", "Quarter"];

const revenueByDay = [
  { d: "Mon", v: 4.2 },
  { d: "Tue", v: 5.8 },
  { d: "Wed", v: 5.1 },
  { d: "Thu", v: 7.4 },
  { d: "Fri", v: 8.9 },
  { d: "Sat", v: 6.0 },
  { d: "Sun", v: 2.7 }
];

const headline = [
  { k: "Revenue", v: "$40.1k", delta: 12.4, n: "vs. prior 7 days" },
  { k: "Orders", v: "286", delta: 6.1, n: "Across all channels" },
  { k: "Avg. order", v: "$140", delta: -2.3, n: "Trade mix steady" },
  { k: "Quote → order", v: "63%", delta: 4.8, n: "Conversion rate" }
];

const departments = [
  { name: "Structural Steel", share: 46, tone: "steel" as const, rev: "$18.4k" },
  { name: "Gate Hardware", share: 27, tone: "brass" as const, rev: "$10.8k" },
  { name: "Fasteners", share: 16, tone: "rust" as const, rev: "$6.4k" },
  { name: "Jobsite Tools", share: 11, tone: "ink" as const, rev: "$4.5k" }
];

const topItems = [
  { rank: "01", name: "2 × 2 Square Tube — 11ga", units: 412, rev: "$15.8k" },
  { rank: "02", name: "Heavy Bolt-On Gate Hinge", units: 318, rev: "$7.9k" },
  { rank: "03", name: "Self-Drilling Tek Screw", units: 264, rev: "$4.9k" },
  { rank: "04", name: "C4 × 5.4 Steel Channel", units: 88, rev: "$6.3k" }
];

function Delta({ value }: { value: number }) {
  const flat = value === 0;
  const up = value > 0;
  const color = flat ? d3.haze : up ? "#2f6f4e" : "#b42318";
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className="inline-flex items-center gap-1 text-[0.74rem] font-semibold"
      style={{ color }}
    >
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function D3Reports() {
  const [range, setRange] = useState(ranges[0]);
  const peak = Math.max(...revenueByDay.map((r) => r.v));

  return (
    <D3Shell active="Reports" variant="admin">
      <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8 sm:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>The Studio — Editorial Review</Eyebrow>
            <h1
              className={`${serif} mt-3 text-[2.6rem] font-semibold leading-none tracking-[-0.02em] sm:text-[3.4rem]`}
            >
              The week in figures
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: d3.graphite }}>
              A standing column on how the catalog is performing — revenue,
              departments, and the items earning their cover spot.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {ranges.map((r) => {
              const sel = r === range;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className="rounded-full px-4 py-2 text-[0.74rem] font-semibold uppercase tracking-[0.12em] transition-colors"
                  style={{
                    background: sel ? d3.ink : "transparent",
                    color: sel ? d3.paper : d3.graphite,
                    border: `1px solid ${sel ? d3.ink : d3.rule}`
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* headline figures */}
        <div
          className="mt-9 grid grid-cols-2 divide-y border lg:grid-cols-4 lg:divide-x lg:divide-y-0"
          style={{ borderColor: d3.rule, background: d3.card }}
        >
          {headline.map((h) => (
            <div key={h.k} className="p-6">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]" style={{ color: d3.haze }}>
                {h.k}
              </p>
              <p className={`${serif} mt-2 text-4xl font-semibold`}>{h.v}</p>
              <div className="mt-2 flex items-center gap-2">
                <Delta value={h.delta} />
                <span className="text-[0.7rem]" style={{ color: d3.haze }}>
                  {h.n}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* revenue chart — editorial feature */}
      <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div
            className="border p-7 sm:p-9"
            style={{ borderColor: d3.rule, background: d3.card }}
          >
            <div className="flex items-end justify-between">
              <div>
                <Eyebrow>Figure 1</Eyebrow>
                <h2 className={`${serif} mt-2 text-2xl font-semibold`}>
                  Revenue, by the day
                </h2>
              </div>
              <span className="text-[0.72rem] uppercase tracking-[0.14em]" style={{ color: d3.haze }}>
                Thousands, USD
              </span>
            </div>

            <div className="mt-9 flex items-end gap-3 sm:gap-5" style={{ height: 220 }}>
              {revenueByDay.map((r) => (
                <div key={r.d} className="flex flex-1 flex-col items-center gap-3">
                  <span className={`${serif} text-sm font-semibold`}>
                    {r.v.toFixed(1)}
                  </span>
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full transition-all"
                      style={{
                        height: `${(r.v / peak) * 100}%`,
                        background:
                          r.v === peak
                            ? `linear-gradient(180deg,${d3.brass},${d3.brassDeep})`
                            : "linear-gradient(180deg,#3a3631,#1a1814)"
                      }}
                    />
                  </div>
                  <span
                    className="text-[0.7rem] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: d3.haze }}
                  >
                    {r.d}
                  </span>
                </div>
              ))}
            </div>
            <p
              className="mt-7 border-t pt-5 text-sm leading-relaxed"
              style={{ borderColor: d3.rule, color: d3.graphite }}
            >
              <span className="font-semibold" style={{ color: d3.ink }}>
                Friday set the pace
              </span>{" "}
              — an $8.9k day driven by two Trade B fabrication orders. Weekend
              will-call held steady against a quiet Sunday.
            </p>
          </div>

          {/* department mix */}
          <div
            className="border p-7"
            style={{ borderColor: d3.rule, background: d3.card }}
          >
            <Eyebrow>Figure 2</Eyebrow>
            <h2 className={`${serif} mt-2 text-2xl font-semibold`}>
              Department mix
            </h2>
            <ul className="mt-6 space-y-5">
              {departments.map((dpt) => (
                <li key={dpt.name}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MaterialBlock tone={dpt.tone} className="h-7 w-7" />
                      <span className="text-sm font-semibold">{dpt.name}</span>
                    </div>
                    <span className={`${serif} text-base font-semibold`}>
                      {dpt.rev}
                    </span>
                  </div>
                  <div
                    className="mt-2 h-2 w-full overflow-hidden rounded-full"
                    style={{ background: d3.rule }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${dpt.share}%`, background: d3.ink }}
                    />
                  </div>
                  <span
                    className="mt-1 block text-[0.7rem] uppercase tracking-[0.12em]"
                    style={{ color: d3.haze }}
                  >
                    {dpt.share}% of revenue
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* top items — editorial list */}
      <section className="mx-auto max-w-[1280px] px-5 pt-10 sm:px-8">
        <div
          className="border p-7 sm:p-9"
          style={{ borderColor: d3.rule, background: d3.card }}
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <Eyebrow>Figure 3</Eyebrow>
              <h2 className={`${serif} mt-2 text-2xl font-semibold`}>
                The bestsellers list
              </h2>
            </div>
            <Link
              href="/design-lab/d3/category"
              className="hidden text-[0.76rem] font-semibold uppercase tracking-[0.14em] underline underline-offset-[6px] sm:inline"
            >
              Open catalog
            </Link>
          </div>

          <ul className="mt-6">
            {topItems.map((t) => (
              <li
                key={t.rank}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-5 border-t py-5 sm:grid-cols-[auto_1fr_auto_auto]"
                style={{ borderColor: d3.rule }}
              >
                <span className={`${serif} text-3xl`} style={{ color: d3.brass }}>
                  {t.rank}
                </span>
                <span className={`${serif} text-lg font-semibold`}>{t.name}</span>
                <span className="hidden text-right text-sm sm:block" style={{ color: d3.graphite }}>
                  {t.units} units
                </span>
                <span className={`${serif} text-right text-xl font-semibold`}>
                  {t.rev}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* closing note */}
      <section className="mx-auto mt-10 max-w-[1280px] px-5 sm:px-8">
        <div
          className="grid items-center gap-6 p-8 sm:p-12 md:grid-cols-[0.65fr_0.35fr]"
          style={{ background: d3.ink, color: d3.paper }}
        >
          <div>
            <span
              className="text-[0.7rem] font-semibold uppercase tracking-[0.3em]"
              style={{ color: d3.brass }}
            >
              Editor's note
            </span>
            <h2 className={`${serif} mt-3 text-3xl font-semibold leading-tight`}>
              Steel carries the issue, but hardware is climbing the column.
            </h2>
          </div>
          <Link
            href="/design-lab/d3/orders"
            className="inline-flex items-center justify-center gap-2 self-start rounded-full px-7 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.16em]"
            style={{ background: d3.brass, color: "#fff" }}
          >
            Back to orders desk <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </D3Shell>
  );
}
