"use client";

import { useMemo, useState } from "react";
import { Search, TrendingDown, TrendingUp } from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminCard,
  AdminEmptyState,
  AdminHeader,
  AdminPill,
  AdminStatGrid,
  AdminTabs
} from "@/features/sites/industrial/admin/kit";
import type {
  DemandLevel,
  DemandMetrics,
  ReorderUrgency
} from "@/features/admin/demand/demand-data";
import { getDemandSummary } from "@/features/admin/demand/demand-data";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin demand + reorder intelligence. Reads the
 * real demand metrics built from live inventory, surfaces reorder
 * signals, sales velocity, and a purchasing workbench table.
 * ------------------------------------------------------------------ */

type DemandTab = "all" | "reorder" | "increasing" | "declining";

const TABS: Array<{ id: DemandTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "reorder", label: "Reorder now" },
  { id: "increasing", label: "Increasing" },
  { id: "declining", label: "Declining" }
];

const demandTone: Record<DemandLevel, "neutral" | "pine" | "amber" | "red"> = {
  low: "neutral",
  medium: "pine",
  high: "amber",
  critical: "red"
};

const urgencyTone: Record<ReorderUrgency, "neutral" | "pine" | "amber" | "red"> = {
  none: "neutral",
  watch: "pine",
  soon: "amber",
  urgent: "amber",
  critical: "red"
};

const urgencyLabel: Record<ReorderUrgency, string> = {
  none: "None",
  watch: "Watch",
  soon: "Soon",
  urgent: "Urgent",
  critical: "Critical"
};

function formatWeeks(value: number | null) {
  if (value === null) return "No sales";
  if (value > 99) return "99+ wks";
  return `${value} wks`;
}

function sortByScore(a: DemandMetrics, b: DemandMetrics) {
  return b.demandScore - a.demandScore;
}

export function IndustrialDemand({ metrics }: { metrics: DemandMetrics[] }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<DemandTab>("all");
  const [category, setCategory] = useState("all");

  const summary = useMemo(() => getDemandSummary(metrics), [metrics]);

  const categories = useMemo(
    () =>
      Array.from(
        new Map(metrics.map((item) => [item.categorySlug, item.category])).entries()
      )
        .map(([slug, name]) => ({ slug, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [metrics]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return metrics
      .filter((item) => {
        const matchesQuery =
          !term ||
          item.productTitle.toLowerCase().includes(term) ||
          item.sku.toLowerCase().includes(term) ||
          item.supplier.toLowerCase().includes(term);
        const matchesCategory =
          category === "all" || item.categorySlug === category;
        const matchesTab =
          tab === "all" ||
          (tab === "reorder" &&
            ["urgent", "critical"].includes(item.reorderUrgency)) ||
          (tab === "increasing" && item.trend === "increasing") ||
          (tab === "declining" && item.trend === "declining");
        return matchesQuery && matchesCategory && matchesTab;
      })
      .sort(sortByScore);
  }, [category, metrics, query, tab]);

  const tabsWithCount = TABS.map((entry) => ({
    ...entry,
    count:
      entry.id === "all"
        ? metrics.length
        : entry.id === "reorder"
          ? metrics.filter((item) =>
              ["urgent", "critical"].includes(item.reorderUrgency)
            ).length
          : metrics.filter((item) =>
              entry.id === "increasing"
                ? item.trend === "increasing"
                : item.trend === "declining"
            ).length
  }));

  const reorderNow = useMemo(
    () =>
      metrics
        .filter((item) => ["urgent", "critical"].includes(item.reorderUrgency))
        .sort(sortByScore)
        .slice(0, 6),
    [metrics]
  );

  const stats = [
    { label: "Critical demand", value: String(summary.criticalDemand) },
    { label: "Reorder now", value: String(summary.reorderNow) },
    { label: "Stockout risk", value: String(summary.stockoutRisk) },
    { label: "Avg demand score", value: String(summary.averageDemandScore) }
  ];

  return (
    <div className="grid gap-8">
      <AdminHeader
        eyebrow="Network"
        title="Demand"
        description="Reorder intelligence — sales velocity, stockout risk, and purchasing recommendations from live inventory."
      />

      <AdminStatGrid stats={stats} />

      {reorderNow.length ? (
        <section className="grid gap-3">
          <h2 className="text-xl font-extrabold tracking-tight text-d1-ink">
            Priority reorder signals
          </h2>
          <div className="grid gap-px border border-d1-line bg-d1-line sm:grid-cols-2 lg:grid-cols-3">
            {reorderNow.map((item) => (
              <div className="grid gap-2 bg-d1-card p-4" key={item.id}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-extrabold text-d1-ink">
                    {item.productTitle}
                  </span>
                  <AdminPill tone={urgencyTone[item.reorderUrgency]}>
                    {urgencyLabel[item.reorderUrgency]}
                  </AdminPill>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                  {item.sku} · {item.supplier}
                </p>
                <p className="text-sm font-semibold text-d1-steel">
                  {item.quantityAvailable} available · reorder{" "}
                  <span className="font-extrabold text-d1-pine">
                    {item.recommendedReorderQuantity}
                  </span>{" "}
                  · {formatWeeks(item.weeksOfSupply)} supply
                </p>
                <p className="text-[12px] text-d1-steel">{item.purchasingNote}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-d1-ink pb-3">
        <AdminTabs tabs={tabsWithCount} active={tab} onSelect={setTab} />
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by category"
            className="h-9 border border-d1-line bg-white px-3 text-[12px] font-bold uppercase tracking-[0.06em] text-d1-ink outline-none focus:border-d1-ink"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            <option value="all">All categories</option>
            {categories.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 border border-d1-line bg-white px-3">
            <Search className="h-4 w-4 text-d1-steel" />
            <input
              aria-label="Search demand"
              className="h-9 w-52 bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, SKU, supplier"
              value={query}
            />
          </div>
        </div>
      </section>

      {filtered.length ? (
        <section className="overflow-x-auto border border-d1-line bg-d1-card">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Demand</th>
                <th className="px-4 py-3">Trend</th>
                <th className="px-4 py-3 text-right">Available</th>
                <th className="px-4 py-3 text-right">Weekly sales</th>
                <th className="px-4 py-3">Weeks left</th>
                <th className="px-4 py-3 text-right">Reorder qty</th>
                <th className="px-4 py-3">Urgency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-d1-line">
              {filtered.slice(0, 80).map((item) => (
                <tr className="transition hover:bg-d1-paper" key={item.id}>
                  <td className="px-4 py-3.5">
                    <span className="block text-sm font-extrabold text-d1-ink">
                      {item.productTitle}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                      {item.sku} · {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <AdminPill tone={demandTone[item.demandLevel]}>
                      {item.demandLevel} · {item.demandScore}
                    </AdminPill>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold capitalize text-d1-ink">
                      {item.trend === "declining" ? (
                        <TrendingDown className="h-4 w-4 text-d1-red" />
                      ) : item.trend === "increasing" ? (
                        <TrendingUp className="h-4 w-4 text-d1-pine" />
                      ) : null}
                      {item.trend}
                    </span>
                    <span className="block text-[11px] text-d1-steel">
                      {item.trendPercent > 0 ? "+" : ""}
                      {item.trendPercent}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                    {item.quantityAvailable}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-semibold text-d1-steel">
                    {item.salesVelocityWeekly}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-d1-steel">
                    {formatWeeks(item.weeksOfSupply)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-pine">
                    {item.recommendedReorderQuantity}
                  </td>
                  <td className="px-4 py-3.5">
                    <AdminPill tone={urgencyTone[item.reorderUrgency]}>
                      {urgencyLabel[item.reorderUrgency]}
                    </AdminPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <AdminEmptyState
          title="No products match this view"
          description="Adjust the filters to see demand signals."
        />
      )}

      <AdminCard className="grid gap-2 p-5 text-[12px] leading-5 text-d1-steel sm:grid-cols-2">
        <p>
          <strong className="text-d1-ink">Weeks of supply</strong> — available
          inventory divided by average weekly sales.
        </p>
        <p>
          <strong className="text-d1-ink">Reorder quantity</strong> — target
          stock plus lead-time demand minus current available inventory.
        </p>
        <p>
          <strong className="text-d1-ink">Demand score</strong> — weighted 0-100
          blend of sold units, velocity, trend, interest, and inventory pressure.
        </p>
        <p>
          <strong className="text-d1-ink">Urgency</strong> — escalates as weeks
          of supply approaches the supplier lead time.
        </p>
      </AdminCard>

      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
        Showing {Math.min(filtered.length, 80)} of {metrics.length} tracked SKUs
      </p>
    </div>
  );
}
