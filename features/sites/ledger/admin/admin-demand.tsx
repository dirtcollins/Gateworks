"use client";

import { useMemo, useState } from "react";
import {
  Search,
  TrendingDown,
  TrendingUp,
  TriangleAlert
} from "lucide-react";
import { LEDGER } from "@/features/sites/ledger/kit";
import type {
  DemandLevel,
  DemandMetrics,
  DemandSummary,
  ReorderUrgency
} from "@/features/admin/demand/demand-data";
import {
  AdminCard,
  AdminEmpty,
  AdminHeading,
  StatTile,
  StatusPill,
  formatAdminDate
} from "./admin-kit";

/* ------------------------------------------------------------------ *
 * LEDGER — admin / demand
 * Reorder intelligence. Renders the real demand metrics produced by
 * `buildDemandMetrics` — sales velocity, weeks of supply, stockout
 * dates and recommended reorder quantities — restyled in the Ledger
 * institutional language. Sortable by urgency or demand score.
 * ------------------------------------------------------------------ */

type SortKey = "urgency" | "score" | "stockout";
type Lens = "all" | "reorder" | "high";

const urgencyLabels: Record<ReorderUrgency, string> = {
  none: "No action",
  watch: "Watch",
  soon: "Order soon",
  urgent: "Urgent",
  critical: "Critical"
};

const urgencyTone: Record<ReorderUrgency, "indigo" | "amber" | "mint" | "rose" | "neutral"> = {
  none: "neutral",
  watch: "indigo",
  soon: "amber",
  urgent: "amber",
  critical: "rose"
};

const urgencyRank: Record<ReorderUrgency, number> = {
  critical: 5,
  urgent: 4,
  soon: 3,
  watch: 2,
  none: 1
};

const demandLabels: Record<DemandLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical"
};

const demandTone: Record<DemandLevel, "indigo" | "amber" | "mint" | "rose" | "neutral"> = {
  low: "neutral",
  medium: "indigo",
  high: "amber",
  critical: "rose"
};

function weeksLabel(weeks: number | null) {
  if (weeks === null) return "—";
  return `${weeks.toFixed(1)} wk`;
}

export function LedgerAdminDemand({
  metrics,
  summary
}: {
  metrics: DemandMetrics[];
  summary: DemandSummary;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("urgency");
  const [lens, setLens] = useState<Lens>("reorder");

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let next = metrics.filter((metric) => {
      const matchesQuery =
        !normalized ||
        metric.productTitle.toLowerCase().includes(normalized) ||
        metric.sku.toLowerCase().includes(normalized) ||
        metric.category.toLowerCase().includes(normalized) ||
        metric.supplier.toLowerCase().includes(normalized);
      if (!matchesQuery) return false;
      if (lens === "reorder") {
        return ["urgent", "critical", "soon"].includes(metric.reorderUrgency);
      }
      if (lens === "high") {
        return metric.demandLevel === "high" || metric.demandLevel === "critical";
      }
      return true;
    });

    next = next.slice().sort((a, b) => {
      if (sort === "score") return b.demandScore - a.demandScore;
      if (sort === "stockout") {
        const aw = a.weeksOfSupply ?? Number.POSITIVE_INFINITY;
        const bw = b.weeksOfSupply ?? Number.POSITIVE_INFINITY;
        return aw - bw;
      }
      const rank = urgencyRank[b.reorderUrgency] - urgencyRank[a.reorderUrgency];
      return rank !== 0 ? rank : b.demandScore - a.demandScore;
    });
    return next;
  }, [lens, metrics, query, sort]);

  const reorderUnits = useMemo(
    () =>
      rows
        .filter((row) => ["urgent", "critical"].includes(row.reorderUrgency))
        .reduce((sum, row) => sum + row.recommendedReorderQuantity, 0),
    [rows]
  );

  return (
    <div className="grid gap-6">
      <AdminHeading
        eyebrow="Operations"
        title="Demand"
        description="Reorder intelligence — sales velocity, weeks of supply, and recommended purchase quantities across the catalog."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Reorder now"
          value={String(summary.reorderNow)}
          sub="Urgent or critical"
          accent={summary.reorderNow > 0 ? LEDGER.rose : LEDGER.mint}
        />
        <StatTile
          label="Stockout risk"
          value={String(summary.stockoutRisk)}
          sub="Within supplier lead time"
          accent={summary.stockoutRisk > 0 ? LEDGER.amber : LEDGER.mint}
        />
        <StatTile
          label="High demand"
          value={String(summary.highDemand + summary.criticalDemand)}
          sub="High or critical signal"
        />
        <StatTile
          label="Avg demand score"
          value={String(summary.averageDemandScore)}
          sub="Across the catalog"
        />
      </section>

      <AdminCard>
        <div
          className="flex flex-wrap items-center justify-between gap-3 p-4"
          style={{ borderBottom: `1px solid ${LEDGER.line}` }}
        >
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "reorder", label: "Needs reorder" },
                { id: "high", label: "High demand" },
                { id: "all", label: "All products" }
              ] as Array<{ id: Lens; label: string }>
            ).map((option) => {
              const active = lens === option.id;
              return (
                <button
                  key={option.id}
                  className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
                  onClick={() => setLens(option.id)}
                  style={{
                    backgroundColor: active ? LEDGER.indigo : LEDGER.canvas,
                    color: active ? "#ffffff" : LEDGER.body
                  }}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Sort demand rows"
              className="rounded-xl px-3 py-2 text-[12px] font-semibold outline-none"
              onChange={(event) => setSort(event.target.value as SortKey)}
              style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
              value={sort}
            >
              <option value="urgency">Sort: Reorder urgency</option>
              <option value="score">Sort: Demand score</option>
              <option value="stockout">Sort: Weeks of supply</option>
            </select>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ border: `1px solid ${LEDGER.line}` }}
            >
              <Search className="h-4 w-4" style={{ color: LEDGER.muted }} />
              <input
                aria-label="Search demand"
                className="w-40 bg-transparent text-[13px] outline-none sm:w-52"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search product, SKU, supplier"
                style={{ color: LEDGER.ink }}
                value={query}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead>
              <tr
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: LEDGER.muted, borderBottom: `1px solid ${LEDGER.line}` }}
              >
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Demand</th>
                <th className="px-5 py-3 text-right">Velocity</th>
                <th className="px-5 py-3 text-right">Available</th>
                <th className="px-5 py-3 text-right">Supply</th>
                <th className="px-5 py-3">Stockout</th>
                <th className="px-5 py-3 text-right">Reorder</th>
                <th className="px-5 py-3">Urgency</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  style={{
                    borderTop: index === 0 ? "none" : `1px solid ${LEDGER.line}`
                  }}
                >
                  <td className="px-5 py-3.5">
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {row.productTitle}
                    </p>
                    <p
                      className="text-[11px] font-medium uppercase tracking-[0.06em]"
                      style={{ color: LEDGER.muted }}
                    >
                      {row.sku} · {row.category}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <StatusPill tone={demandTone[row.demandLevel]}>
                        {demandLabels[row.demandLevel]}
                      </StatusPill>
                      <span
                        className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
                        style={{
                          color:
                            row.trend === "increasing"
                              ? LEDGER.mint
                              : row.trend === "declining"
                                ? LEDGER.rose
                                : LEDGER.muted
                        }}
                      >
                        {row.trend === "increasing" ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : row.trend === "declining" ? (
                          <TrendingDown className="h-3.5 w-3.5" />
                        ) : null}
                        {row.trendPercent > 0 ? "+" : ""}
                        {row.trendPercent}%
                      </span>
                    </div>
                    <p
                      className="mt-0.5 text-[11px]"
                      style={{ color: LEDGER.muted }}
                    >
                      Score {row.demandScore}/100
                    </p>
                  </td>
                  <td
                    className="px-5 py-3.5 text-right text-[13px] font-medium"
                    style={{ color: LEDGER.body }}
                  >
                    {row.salesVelocityWeekly}/wk
                  </td>
                  <td
                    className="px-5 py-3.5 text-right text-[13px] font-semibold"
                    style={{
                      color:
                        row.quantityAvailable <= row.minimumStock
                          ? LEDGER.rose
                          : LEDGER.ink
                    }}
                  >
                    {row.quantityAvailable}
                  </td>
                  <td
                    className="px-5 py-3.5 text-right text-[13px] font-medium"
                    style={{ color: LEDGER.body }}
                  >
                    {weeksLabel(row.weeksOfSupply)}
                  </td>
                  <td
                    className="px-5 py-3.5 text-[12px] font-medium"
                    style={{ color: LEDGER.body }}
                  >
                    {row.expectedStockoutDate
                      ? formatAdminDate(row.expectedStockoutDate)
                      : "Stable"}
                  </td>
                  <td
                    className="px-5 py-3.5 text-right text-[13px] font-semibold"
                    style={{ color: LEDGER.ink }}
                  >
                    {row.recommendedReorderQuantity > 0
                      ? `${row.recommendedReorderQuantity} u`
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusPill tone={urgencyTone[row.reorderUrgency]}>
                      {urgencyLabels[row.reorderUrgency]}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 ? (
          <AdminEmpty
            icon={<TriangleAlert className="h-9 w-9" />}
            title="No products in this view"
            description="Adjust the lens or search to surface demand signals."
          />
        ) : null}
      </AdminCard>

      {rows.length ? (
        <p className="text-[12px] font-medium" style={{ color: LEDGER.muted }}>
          {rows.length} products shown · {reorderUnits} units recommended for the
          next purchase order.
        </p>
      ) : null}
    </div>
  );
}
