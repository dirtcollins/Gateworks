"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  FileText,
  Search,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  TriangleAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";
import type { DemandLevel, DemandMetrics, ReorderUrgency } from "@/features/admin/demand/demand-data";
import { getDemandSummary } from "@/features/admin/demand/demand-data";

type DemandDashboardProps = {
  metrics: DemandMetrics[];
};

const demandLabels: Record<DemandLevel, string> = {
  low: "Low Demand",
  medium: "Medium Demand",
  high: "High Demand",
  critical: "Critical Demand"
};

const demandClasses: Record<DemandLevel, string> = {
  low: "border-slate-200 bg-slate-50 text-slate-700",
  medium: "border-blue-200 bg-blue-50 text-blue-800",
  high: "border-amber-200 bg-amber-50 text-amber-900",
  critical: "border-red-200 bg-red-50 text-red-800"
};

const urgencyLabels: Record<ReorderUrgency, string> = {
  none: "No reorder",
  watch: "Watch",
  soon: "Order soon",
  urgent: "Urgent",
  critical: "Critical"
};

const urgencyClasses: Record<ReorderUrgency, string> = {
  none: "border-slate-200 bg-slate-50 text-slate-700",
  watch: "border-blue-200 bg-blue-50 text-blue-800",
  soon: "border-amber-200 bg-amber-50 text-amber-900",
  urgent: "border-orange-200 bg-orange-50 text-orange-900",
  critical: "border-red-200 bg-red-50 text-red-800"
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatWeeks(value: number | null) {
  if (value === null) return "No sales";
  if (value > 99) return "99+ weeks";
  return `${value} weeks`;
}

function formatDate(value: string | null) {
  if (!value) return "No stockout";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

function sortByScore(first: DemandMetrics, second: DemandMetrics) {
  return second.demandScore - first.demandScore;
}

export function DemandDashboard({ metrics }: DemandDashboardProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [supplier, setSupplier] = useState("all");
  const [demandLevel, setDemandLevel] = useState<"all" | DemandLevel>("all");
  const [urgency, setUrgency] = useState<"all" | ReorderUrgency>("all");
  const [stockStatus, setStockStatus] = useState("all");
  const [dateRange, setDateRange] = useState("30");

  const summary = useMemo(() => getDemandSummary(metrics), [metrics]);
  const categories = useMemo(
    () =>
      Array.from(new Map(metrics.map((item) => [item.categorySlug, item.category])).entries())
        .map(([slug, name]) => ({ slug, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [metrics]
  );
  const suppliers = useMemo(
    () => Array.from(new Set(metrics.map((item) => item.supplier))).sort(),
    [metrics]
  );

  const filteredMetrics = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return metrics.filter((item) => {
      const matchesSearch =
        !normalized ||
        item.productTitle.toLowerCase().includes(normalized) ||
        item.sku.toLowerCase().includes(normalized) ||
        item.category.toLowerCase().includes(normalized) ||
        item.supplier.toLowerCase().includes(normalized);
      const matchesCategory = category === "all" || item.categorySlug === category;
      const matchesSupplier = supplier === "all" || item.supplier === supplier;
      const matchesDemand = demandLevel === "all" || item.demandLevel === demandLevel;
      const matchesUrgency = urgency === "all" || item.reorderUrgency === urgency;
      const matchesStock =
        stockStatus === "all" ||
        (stockStatus === "low" && item.quantityAvailable <= item.minimumStock) ||
        (stockStatus === "out" && item.quantityAvailable <= 0) ||
        (stockStatus === "healthy" && item.quantityAvailable > item.minimumStock);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSupplier &&
        matchesDemand &&
        matchesUrgency &&
        matchesStock
      );
    });
  }, [category, demandLevel, metrics, query, stockStatus, supplier, urgency]);

  const topSelling = useMemo(
    () => [...filteredMetrics].sort((a, b) => b.totalUnitsSold - a.totalUnitsSold).slice(0, 8),
    [filteredMetrics]
  );
  const fastestMoving = useMemo(
    () => [...filteredMetrics].sort((a, b) => b.salesVelocityWeekly - a.salesVelocityWeekly).slice(0, 8),
    [filteredMetrics]
  );
  const reorderNow = useMemo(
    () =>
      [...filteredMetrics]
        .filter((item) => ["urgent", "critical"].includes(item.reorderUrgency))
        .sort(sortByScore)
        .slice(0, 12),
    [filteredMetrics]
  );
  const increasingDemand = useMemo(
    () => [...filteredMetrics].filter((item) => item.trend === "increasing").sort(sortByScore).slice(0, 8),
    [filteredMetrics]
  );
  const decliningDemand = useMemo(
    () =>
      [...filteredMetrics]
        .filter((item) => item.trend === "declining")
        .sort((a, b) => a.trendPercent - b.trendPercent)
        .slice(0, 8),
    [filteredMetrics]
  );
  const highInterestLowInventory = useMemo(
    () =>
      [...filteredMetrics]
        .filter(
          (item) =>
            item.searches + item.pageViews + item.quoteAdds + item.abandonedCarts > 70 &&
            item.quantityAvailable <= item.minimumStock
        )
        .sort(sortByScore)
        .slice(0, 8),
    [filteredMetrics]
  );
  const slowMoving = useMemo(
    () => filteredMetrics.filter((item) => item.demandLevel === "low" && item.quantityAvailable > item.targetStock).slice(0, 8),
    [filteredMetrics]
  );

  function MiniReport({
    icon,
    title,
    rows
  }: {
    icon: ReactNode;
    title: string;
    rows: DemandMetrics[];
  }) {
    return (
      <Card>
        <CardHeader>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
              Report
            </p>
            <h2 className="text-lg font-black text-industrial-ink">{title}</h2>
          </div>
          {icon}
        </CardHeader>
        <CardBody className="grid gap-3">
          {rows.length ? (
            rows.map((item) => (
              <Link
                className="grid gap-2 border border-industrial-rail p-3 transition hover:border-industrial-ink hover:bg-industrial-paper"
                href={`/products/${item.productSlug}`}
                key={`${title}-${item.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-industrial-ink">{item.productTitle}</p>
                    <p className="mt-1 text-xs font-semibold text-industrial-muted">
                      {item.sku} / {item.category}
                    </p>
                  </div>
                  <span className={`shrink-0 border px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${demandClasses[item.demandLevel]}`}>
                    {item.demandScore}
                  </span>
                </div>
                <p className="text-xs font-semibold text-industrial-steel">
                  {item.salesVelocityWeekly}/wk / {formatWeeks(item.weeksOfSupply)} supply / reorder {item.recommendedReorderQuantity}
                </p>
              </Link>
            ))
          ) : (
            <p className="border border-industrial-rail p-3 text-sm text-industrial-steel">
              No products match this report with the current filters.
            </p>
          )}
        </CardBody>
      </Card>
    );
  }

  return (
    <PageShell
      actions={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary">
            <ShoppingCart size={15} />
            Draft PO
          </Button>
          <Button size="sm">
            <FileText size={15} />
            Export report
          </Button>
        </div>
      }
      description="Demand tracking, sales velocity, customer interest, stockout risk, and reorder recommendations for smarter purchasing decisions."
      eyebrow="Gateworks Operations"
      title="Demand + reorder intelligence"
    >
      <div className="grid gap-5">
        <StatGrid
          className="grid-cols-2 overflow-hidden bg-white lg:grid-cols-6"
          stats={[
            { label: "High demand", value: summary.highDemand },
            { label: "Critical", value: summary.criticalDemand },
            { label: "Reorder now", value: summary.reorderNow },
            { label: "Stockout risk", value: summary.stockoutRisk },
            { label: "Interest gap", value: summary.highInterestLowInventory },
            { label: "Avg score", value: summary.averageDemandScore }
          ]}
        />

        <Card>
          <CardHeader>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                Filters
              </p>
              <h2 className="text-xl font-black text-industrial-ink">Demand lens</h2>
            </div>
            <CalendarRange size={20} />
          </CardHeader>
          <CardBody className="grid gap-3 lg:grid-cols-[1.2fr_repeat(6,minmax(140px,1fr))]">
            <label className="relative">
              <span className="sr-only">Search demand</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted" size={16} />
              <Input
                className="pl-9"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search product, SKU, supplier"
                value={query}
              />
            </label>
            <Select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select value={supplier} onChange={(event) => setSupplier(event.target.value)}>
              <option value="all">All suppliers</option>
              {suppliers.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Select value={demandLevel} onChange={(event) => setDemandLevel(event.target.value as "all" | DemandLevel)}>
              <option value="all">All demand</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
            <Select value={stockStatus} onChange={(event) => setStockStatus(event.target.value)}>
              <option value="all">All stock</option>
              <option value="healthy">Healthy</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </Select>
            <Select value={urgency} onChange={(event) => setUrgency(event.target.value as "all" | ReorderUrgency)}>
              <option value="all">All urgency</option>
              <option value="watch">Watch</option>
              <option value="soon">Soon</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
            </Select>
            <Select value={dateRange} onChange={(event) => setDateRange(event.target.value)}>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </Select>
          </CardBody>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          <MiniReport icon={<BarChart3 size={20} />} title={`Best sellers (${dateRange} days)`} rows={topSelling} />
          <MiniReport icon={<TrendingUp size={20} />} title="Fastest moving products" rows={fastestMoving} />
          <MiniReport icon={<TriangleAlert className="text-red-700" size={20} />} title="Products to order now" rows={reorderNow} />
          <MiniReport icon={<ArrowUpRight size={20} />} title="Increasing demand" rows={increasingDemand} />
          <MiniReport icon={<ArrowDownRight size={20} />} title="High interest / low inventory" rows={highInterestLowInventory} />
          <MiniReport icon={<TrendingDown size={20} />} title="Declining or slow-moving inventory" rows={[...decliningDemand, ...slowMoving].slice(0, 8)} />
        </div>

        <Card>
          <CardHeader>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                Reorder Recommendations
              </p>
              <h2 className="text-xl font-black text-industrial-ink">Purchasing workbench</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto border border-industrial-rail">
              <table className="min-w-[1380px] w-full text-left text-sm">
                <thead className="bg-industrial-paper text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                  <tr>
                    <th className="px-3 py-3">Product / SKU</th>
                    <th className="px-3 py-3">Demand</th>
                    <th className="px-3 py-3">Trend</th>
                    <th className="px-3 py-3 text-right">Available</th>
                    <th className="px-3 py-3 text-right">Avg weekly sales</th>
                    <th className="px-3 py-3">Weeks left</th>
                    <th className="px-3 py-3">Lead time</th>
                    <th className="px-3 py-3">Stockout</th>
                    <th className="px-3 py-3">Min / Target</th>
                    <th className="px-3 py-3">Reorder qty</th>
                    <th className="px-3 py-3">Urgency</th>
                    <th className="px-3 py-3">Purchasing note</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMetrics.sort(sortByScore).slice(0, 80).map((item) => (
                    <tr className="border-t border-industrial-rail align-top" key={item.id}>
                      <td className="px-3 py-3">
                        <Link className="font-black text-industrial-ink hover:underline" href={`/products/${item.productSlug}`}>
                          {item.productTitle}
                        </Link>
                        <p className="mt-1 text-xs font-semibold text-industrial-muted">
                          {item.sku} / {item.category} / {item.supplier}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex border px-2 py-1 text-xs font-black uppercase tracking-[0.08em] ${demandClasses[item.demandLevel]}`}>
                          {demandLabels[item.demandLevel]}
                        </span>
                        <p className="mt-2 text-xs font-black text-industrial-ink">Score {item.demandScore}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-black capitalize text-industrial-ink">{item.trend}</span>
                        <p className="mt-1 text-xs text-industrial-steel">
                          {item.trendPercent > 0 ? "+" : ""}{item.trendPercent}%
                        </p>
                      </td>
                      <td className="px-3 py-3 text-right font-black">{formatNumber(item.quantityAvailable)}</td>
                      <td className="px-3 py-3 text-right font-black">{item.salesVelocityWeekly}</td>
                      <td className="px-3 py-3">{formatWeeks(item.weeksOfSupply)}</td>
                      <td className="px-3 py-3">{item.supplierLeadTimeDays} days</td>
                      <td className="px-3 py-3">{formatDate(item.expectedStockoutDate)}</td>
                      <td className="px-3 py-3">{item.minimumStock} / {item.targetStock}</td>
                      <td className="px-3 py-3 font-black text-industrial-pine">{formatNumber(item.recommendedReorderQuantity)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex border px-2 py-1 text-xs font-black uppercase tracking-[0.08em] ${urgencyClasses[item.reorderUrgency]}`}>
                          {urgencyLabels[item.reorderUrgency]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs leading-5 text-industrial-steel">{item.purchasingNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-black text-industrial-ink">Calculation formulas</h2>
          </CardHeader>
          <CardBody className="grid gap-3 text-sm leading-6 text-industrial-steel lg:grid-cols-2">
            <p><strong className="text-industrial-ink">Sales velocity:</strong> recent units sold divided by the selected 4-week analysis window.</p>
            <p><strong className="text-industrial-ink">Trend:</strong> recent weekly velocity compared with the prior equivalent period.</p>
            <p><strong className="text-industrial-ink">Weeks of supply:</strong> available inventory divided by average weekly sales.</p>
            <p><strong className="text-industrial-ink">Stockout date:</strong> today plus weeks of supply multiplied by seven days.</p>
            <p><strong className="text-industrial-ink">Reorder quantity:</strong> target stock plus lead-time demand minus current available inventory.</p>
            <p><strong className="text-industrial-ink">Demand score:</strong> weighted 0-100 blend of sold units, velocity, trend, quote/order interest, searches, views, abandoned carts, restock requests, inventory pressure, lead time, and seasonality.</p>
          </CardBody>
        </Card>
      </div>
    </PageShell>
  );
}
