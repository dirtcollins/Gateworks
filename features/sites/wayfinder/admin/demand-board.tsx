// Wayfinder admin — demand + reorder intelligence. Renders the real demand
// model (features/admin/demand/demand-data) computed server-side from the live
// inventory rows: demand scores, sales velocity/trend, weeks of supply,
// stockout dates, and recommended reorder quantities. Filters narrow the
// purchasing workbench; the reorder lane surfaces what to put on the next PO.
"use client";

import { useMemo, useState } from "react";
import type {
  DemandLevel,
  DemandMetrics,
  ReorderUrgency
} from "@/features/admin/demand/demand-data";
import { getDemandSummary } from "@/features/admin/demand/demand-data";
import {
  DataTable,
  FilterChips,
  Kpi,
  Mono,
  Panel,
  PageHead,
  Pill,
  SelectInput,
  TextInput,
  monoFont,
  wf,
  type Column
} from "./admin-kit";

const DEMAND_LABELS: Record<DemandLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical"
};

const DEMAND_TONE: Record<DemandLevel, "neutral" | "open" | "warn" | "stop"> = {
  low: "neutral",
  medium: "open",
  high: "warn",
  critical: "stop"
};

const URGENCY_LABELS: Record<ReorderUrgency, string> = {
  none: "Hold",
  watch: "Watch",
  soon: "Soon",
  urgent: "Urgent",
  critical: "Critical"
};

const URGENCY_TONE: Record<ReorderUrgency, "neutral" | "open" | "warn" | "stop"> =
  {
    none: "neutral",
    watch: "open",
    soon: "warn",
    urgent: "warn",
    critical: "stop"
  };

function weeksLabel(value: number | null) {
  if (value === null) return "No sales";
  if (value > 99) return "99+ wk";
  return `${value} wk`;
}

function dateLabel(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

export function WayfinderDemandBoard({ metrics }: { metrics: DemandMetrics[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [urgency, setUrgency] = useState<"all" | ReorderUrgency>("all");
  const [demand, setDemand] = useState<"all" | DemandLevel>("all");

  const summary = useMemo(() => getDemandSummary(metrics), [metrics]);

  const categories = useMemo(
    () =>
      Array.from(
        new Map(metrics.map((item) => [item.categorySlug, item.category]))
      )
        .map(([slug, name]) => ({ slug, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [metrics]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return metrics
      .filter((item) => {
        const hit =
          !q ||
          item.productTitle.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.supplier.toLowerCase().includes(q);
        const matchCategory =
          category === "all" || item.categorySlug === category;
        const matchUrgency =
          urgency === "all" || item.reorderUrgency === urgency;
        const matchDemand = demand === "all" || item.demandLevel === demand;
        return hit && matchCategory && matchUrgency && matchDemand;
      })
      .sort((a, b) => b.demandScore - a.demandScore);
  }, [metrics, query, category, urgency, demand]);

  const reorderNow = useMemo(
    () =>
      [...filtered]
        .filter((item) => ["urgent", "critical"].includes(item.reorderUrgency))
        .slice(0, 6),
    [filtered]
  );

  const reorderUnits = useMemo(
    () =>
      filtered
        .filter((item) => ["urgent", "critical"].includes(item.reorderUrgency))
        .reduce((sum, item) => sum + item.recommendedReorderQuantity, 0),
    [filtered]
  );

  const columns: Column<DemandMetrics>[] = [
    {
      key: "product",
      header: "Product",
      render: (item) => (
        <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 800, color: wf.ink }}>
            {item.productTitle}
          </span>
          <span
            style={{ fontFamily: monoFont, fontSize: 11, color: wf.muted }}
          >
            {item.sku} · {item.category}
          </span>
        </div>
      )
    },
    {
      key: "demand",
      header: "Demand",
      render: (item) => (
        <div style={{ display: "grid", gap: 4 }}>
          <Pill tone={DEMAND_TONE[item.demandLevel]}>
            {DEMAND_LABELS[item.demandLevel]}
          </Pill>
          <Mono style={{ fontSize: 11, color: wf.muted }}>
            score {item.demandScore}
          </Mono>
        </div>
      )
    },
    {
      key: "trend",
      header: "Trend",
      render: (item) => (
        <div style={{ display: "grid", gap: 2 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              textTransform: "capitalize",
              color:
                item.trend === "increasing"
                  ? wf.pineDeep
                  : item.trend === "declining"
                    ? wf.red
                    : wf.steel
            }}
          >
            {item.trend}
          </span>
          <Mono style={{ fontSize: 11, color: wf.muted }}>
            {item.trendPercent > 0 ? "+" : ""}
            {item.trendPercent}%
          </Mono>
        </div>
      )
    },
    {
      key: "available",
      header: "Available",
      align: "right",
      render: (item) => (
        <Mono style={{ fontWeight: 700 }}>{item.quantityAvailable}</Mono>
      )
    },
    {
      key: "velocity",
      header: "Wk sales",
      align: "right",
      render: (item) => <Mono>{item.salesVelocityWeekly}</Mono>
    },
    {
      key: "supply",
      header: "Supply",
      render: (item) => (
        <span style={{ fontSize: 12, color: wf.steel }}>
          {weeksLabel(item.weeksOfSupply)}
        </span>
      )
    },
    {
      key: "stockout",
      header: "Stockout",
      render: (item) => (
        <span
          style={{
            fontFamily: monoFont,
            fontSize: 11,
            color:
              item.reorderUrgency === "critical" ||
              item.reorderUrgency === "urgent"
                ? wf.red
                : wf.muted
          }}
        >
          {dateLabel(item.expectedStockoutDate)}
        </span>
      )
    },
    {
      key: "reorder",
      header: "Reorder qty",
      align: "right",
      render: (item) => (
        <Mono style={{ fontWeight: 700, color: wf.pineDeep }}>
          {item.recommendedReorderQuantity || "—"}
        </Mono>
      )
    },
    {
      key: "urgency",
      header: "Urgency",
      render: (item) => (
        <Pill tone={URGENCY_TONE[item.reorderUrgency]}>
          {URGENCY_LABELS[item.reorderUrgency]}
        </Pill>
      )
    }
  ];

  return (
    <>
      <PageHead
        eyebrow="Floor"
        title="Demand"
        desc="Reorder intelligence — sales velocity, demand scoring, weeks of supply, and stockout risk turn the stock floor into a purchasing plan."
      />

      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))"
        }}
      >
        <Kpi label="High demand" value={summary.highDemand} tone="safety" />
        <Kpi label="Critical" value={summary.criticalDemand} tone="red" />
        <Kpi label="Reorder now" value={summary.reorderNow} tone="red" />
        <Kpi label="Stockout risk" value={summary.stockoutRisk} />
        <Kpi
          label="Interest gap"
          value={summary.highInterestLowInventory}
        />
        <Kpi label="Avg score" value={summary.averageDemandScore} tone="pine" />
      </div>

      <Panel
        title="Reorder now"
        meta={
          reorderNow.length
            ? `${reorderNow.length} SKUs · ${reorderUnits} units recommended`
            : "Nothing urgent in this lens"
        }
        pad
      >
        {reorderNow.length ? (
          <div
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
            }}
          >
            {reorderNow.map((item) => (
              <div
                key={item.id}
                style={{
                  border: `1px solid ${wf.rail}`,
                  borderLeft: `3px solid ${wf.red}`,
                  background: wf.bone,
                  padding: 12,
                  display: "grid",
                  gap: 6
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "flex-start"
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: wf.ink,
                      minWidth: 0
                    }}
                  >
                    {item.productTitle}
                  </span>
                  <Pill tone={URGENCY_TONE[item.reorderUrgency]}>
                    {URGENCY_LABELS[item.reorderUrgency]}
                  </Pill>
                </div>
                <Mono style={{ fontSize: 11, color: wf.muted }}>
                  {item.sku} · {item.supplier}
                </Mono>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: wf.steel
                  }}
                >
                  <span>
                    {item.quantityAvailable} avail ·{" "}
                    {weeksLabel(item.weeksOfSupply)}
                  </span>
                  <Mono style={{ fontWeight: 700, color: wf.pineDeep }}>
                    +{item.recommendedReorderQuantity}
                  </Mono>
                </div>
                <span style={{ fontSize: 11, color: wf.muted }}>
                  {item.purchasingNote}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: wf.muted }}>
            No urgent reorders for the current filter — the floor is healthy.
          </p>
        )}
      </Panel>

      <Panel
        title="Purchasing workbench"
        meta={`${filtered.length} of ${metrics.length} SKUs`}
        action={
          <div style={{ width: 240, maxWidth: "100%" }}>
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, SKU, supplier…"
              style={{ height: 34, fontSize: 12 }}
            />
          </div>
        }
        pad={false}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "flex-end",
            padding: "12px 16px",
            borderBottom: `1px solid ${wf.hairline}`
          }}
        >
          <div style={{ minWidth: 180 }}>
            <span style={fieldLabel}>Category</span>
            <SelectInput
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              style={{ height: 34, fontSize: 12 }}
            >
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </SelectInput>
          </div>
          <div>
            <span style={fieldLabel}>Demand</span>
            <FilterChips
              value={demand}
              onChange={setDemand}
              options={[
                { id: "all", label: "All" },
                { id: "high", label: "High" },
                { id: "critical", label: "Critical" }
              ]}
            />
          </div>
          <div>
            <span style={fieldLabel}>Urgency</span>
            <FilterChips
              value={urgency}
              onChange={setUrgency}
              options={[
                { id: "all", label: "All" },
                { id: "soon", label: "Soon" },
                { id: "urgent", label: "Urgent" },
                { id: "critical", label: "Critical" }
              ]}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={filtered.slice(0, 80)}
          getKey={(item) => item.id}
          empty="No SKUs match the current demand lens."
        />
      </Panel>

      <Panel title="How these signals are computed" pad>
        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            fontSize: 12,
            color: wf.steel,
            lineHeight: 1.5
          }}
        >
          <p style={{ margin: 0 }}>
            <strong style={{ color: wf.ink }}>Sales velocity</strong> — recent
            units sold over a rolling 4-week window.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: wf.ink }}>Weeks of supply</strong> —
            available stock divided by weekly velocity.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: wf.ink }}>Reorder qty</strong> — target
            stock plus lead-time demand minus current available.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: wf.ink }}>Demand score</strong> — a 0-100
            blend of sales, trend, interest, inventory pressure, and lead time.
          </p>
        </div>
      </Panel>
    </>
  );
}

const fieldLabel: React.CSSProperties = {
  display: "block",
  marginBottom: 5,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: wf.steel
};
