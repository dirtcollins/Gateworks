// Wayfinder admin — financial reports. Receives server-aggregated ReportData
// (lib/reports-data.fetchReportData) and renders a real reporting suite:
// selectable period, revenue trend chart, top products/customers, AR aging,
// payment mix, and an exportable order ledger. Period KPIs are derived from the
// 90-day daily series so the selector is meaningful client-side.
"use client";

import { useMemo, useState } from "react";
import type { ReportData } from "@/lib/reports-data";
import type { PaymentStatus } from "@/lib/platform-backend";
import { fmt } from "../kit";
import {
  AdminBtn,
  DataTable,
  FilterChips,
  Ico,
  Mono,
  Notice,
  Panel,
  PageHead,
  Pill,
  monoFont,
  wf,
  type Column
} from "./admin-kit";
import { formatDate, paymentStatusTone } from "./order-helpers";
import { BarList, Delta, Meter, Sparkline, StackBar, TrendChart, TrendKpi } from "./charts";

type Period = "7d" | "30d" | "90d";
type RecentRow = ReportData["recentOrders"][number];

const PERIODS: { id: Period; label: string; days: number }[] = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 }
];

const PAYMENT_COLORS: Record<string, string> = {
  paid: wf.pine,
  overpaid: wf.pineDeep,
  partial: wf.safety,
  unpaid: wf.red,
  failed: "#8a2a20",
  refunded: wf.steel
};

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function shortDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    date
  );
}

function csvCell(value: string | number) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function WayfinderReports({ data }: { data: ReportData }) {
  const [period, setPeriod] = useState<Period>("30d");
  const days = PERIODS.find((p) => p.id === period)?.days ?? 30;

  // Period figures derived from the 90-day daily series.
  const range = useMemo(() => {
    const series = data.daily.slice(-days);
    const prev = data.daily.slice(-days * 2, -days);
    const sum = (rows: typeof series, key: "revenue" | "orders") =>
      rows.reduce((total, row) => total + row[key], 0);
    const revenue = sum(series, "revenue");
    const orders = sum(series, "orders");
    const prevRevenue = sum(prev, "revenue");
    const prevOrders = sum(prev, "orders");
    return {
      series,
      revenue,
      orders,
      prevRevenue,
      prevOrders,
      aov: orders > 0 ? revenue / orders : 0,
      prevAov: prevOrders > 0 ? prevRevenue / prevOrders : 0,
      hasPrev: prev.length === days && prev.some((row) => row.orders > 0)
    };
  }, [data.daily, days]);

  function exportCsv() {
    const header = ["Order", "Date", "Customer", "Total", "Payment", "Gross margin"];
    const rows = data.recentOrders.map((order) => [
      order.orderNumber,
      formatDate(order.createdAt),
      order.customerName,
      order.total.toFixed(2),
      titleCase(order.paymentStatus),
      order.margin === null ? "" : order.margin.toFixed(2)
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wayfinder-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const columns: Column<RecentRow>[] = [
    {
      key: "order",
      header: "Order",
      render: (row) => (
        <Mono style={{ fontWeight: 700, fontSize: 12 }}>{row.orderNumber}</Mono>
      )
    },
    {
      key: "date",
      header: "Date",
      render: (row) => (
        <span style={{ fontFamily: monoFont, fontSize: 11, color: wf.steel }}>
          {formatDate(row.createdAt)}
        </span>
      )
    },
    {
      key: "customer",
      header: "Customer",
      render: (row) => <span style={{ fontWeight: 700 }}>{row.customerName}</span>
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (row) => <Mono style={{ fontWeight: 700 }}>{fmt(row.total)}</Mono>
    },
    {
      key: "payment",
      header: "Payment",
      render: (row) => (
        <Pill tone={paymentStatusTone(row.paymentStatus as PaymentStatus)}>
          {titleCase(row.paymentStatus)}
        </Pill>
      )
    },
    {
      key: "margin",
      header: "Gross margin",
      align: "right",
      render: (row) => (
        <Mono
          style={{ fontWeight: 700, color: row.margin === null ? wf.muted : wf.ink }}
        >
          {row.margin === null ? "—" : fmt(row.margin)}
        </Mono>
      )
    }
  ];

  const paymentTotal =
    data.paymentBreakdown.reduce((sum, row) => sum + row.total, 0) || 1;

  return (
    <>
      <PageHead
        eyebrow="Operations"
        title="Financial reports"
        desc="Revenue trend, top sellers, receivables, and gross margin aggregated from warehouse orders."
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <FilterChips
              value={period}
              options={PERIODS.map((p) => ({ id: p.id, label: p.label }))}
              onChange={setPeriod}
            />
            <AdminBtn onClick={exportCsv} disabled={!data.recentOrders.length}>
              <Ico.clipboard size={14} /> Export CSV
            </AdminBtn>
          </div>
        }
      />

      {!data.configured ? (
        <Notice tone="warn">
          Supabase is not configured, so live financial data is unavailable. Add the
          Supabase keys to .env.local to populate this report.
        </Notice>
      ) : null}

      {/* Period KPIs */}
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))"
        }}
      >
        <TrendKpi
          label={`Revenue · ${days}d`}
          value={fmt(range.revenue, { cents: false })}
          accent={wf.pine}
          delta={
            range.hasPrev ? (
              <Delta current={range.revenue} previous={range.prevRevenue} />
            ) : undefined
          }
          hint={range.hasPrev ? undefined : "booked in period"}
          spark={
            <Sparkline values={range.series.map((d) => d.revenue)} color={wf.pine} />
          }
        />
        <TrendKpi
          label={`Orders · ${days}d`}
          value={range.orders}
          accent={wf.ink}
          delta={
            range.hasPrev ? (
              <Delta current={range.orders} previous={range.prevOrders} />
            ) : undefined
          }
          hint={range.hasPrev ? undefined : "placed in period"}
          spark={
            <Sparkline values={range.series.map((d) => d.orders)} color={wf.ink} />
          }
        />
        <TrendKpi
          label="Avg order value"
          value={fmt(range.aov, { cents: false })}
          accent={wf.ink}
          delta={
            range.hasPrev ? (
              <Delta current={range.aov} previous={range.prevAov} />
            ) : undefined
          }
          hint={range.hasPrev ? undefined : "per order"}
        />
        <TrendKpi
          label="Gross margin"
          value={data.hasCostData ? `${data.grossMarginPct.toFixed(1)}%` : "—"}
          accent={wf.pine}
          hint={data.hasCostData ? "all orders · from unit costs" : "no cost data"}
        />
      </div>

      {/* Revenue trend */}
      <Panel title={`Revenue trend · ${days} days`} meta="Daily booked revenue">
        <TrendChart
          points={range.series.map((d) => ({
            label: shortDate(d.date),
            value: d.revenue,
            caption: `${d.orders} ${d.orders === 1 ? "order" : "orders"}`
          }))}
          accent={wf.pine}
          height={224}
          format={(n) => fmt(n, { cents: false })}
        />
      </Panel>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 0.85fr)"
        }}
        className="wf-admin-report-grid"
      >
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel title="Top products" meta="By revenue · all orders in range">
            <BarList
              accent={wf.pine}
              empty="No order line items yet."
              items={data.topProducts.map((product) => ({
                key: product.sku,
                label: product.title,
                sub: `${product.sku} · ${product.units.toLocaleString()} units`,
                value: product.revenue,
                display: fmt(product.revenue, { cents: false })
              }))}
            />
          </Panel>
          <Panel title="Top customers" meta="By revenue · all orders in range">
            <BarList
              accent={wf.ink}
              empty="No customer orders yet."
              items={data.topCustomers.map((customer) => ({
                key: customer.name,
                label: customer.name,
                sub: `${customer.orders} ${customer.orders === 1 ? "order" : "orders"}`,
                value: customer.revenue,
                display: fmt(customer.revenue, { cents: false })
              }))}
            />
          </Panel>
        </div>

        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel title="Accounts receivable">
            <div style={{ display: "grid", gap: 9, fontSize: 13 }}>
              <ARRow label="Total billed" value={data.billed} />
              <ARRow label="Collected" value={data.collected} tone="pine" />
              <div style={{ borderTop: `1px solid ${wf.hairline}`, paddingTop: 8 }}>
                <ARRow label="Outstanding" value={data.outstanding} tone="red" strong />
              </div>
              <div style={{ marginTop: 4, display: "grid", gap: 5 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: monoFont,
                    fontSize: 10,
                    color: wf.muted
                  }}
                >
                  <span>Collection rate</span>
                  <span style={{ fontWeight: 700, color: wf.ink }}>
                    {data.collectionRatePct.toFixed(1)}%
                  </span>
                </div>
                <Meter
                  pct={data.collectionRatePct}
                  accent={data.collectionRatePct >= 85 ? wf.pine : wf.safety}
                />
              </div>
            </div>
          </Panel>

          <Panel title="Outstanding by age">
            <BarList
              accent={wf.red}
              empty="Nothing outstanding."
              items={data.aging
                .filter((bucket) => bucket.total > 0)
                .map((bucket) => ({
                  key: bucket.bucket,
                  label: `${bucket.bucket} days`,
                  value: bucket.total,
                  display: fmt(bucket.total, { cents: false })
                }))}
            />
          </Panel>

          <Panel title="Payment status mix">
            {data.paymentBreakdown.length ? (
              <div style={{ display: "grid", gap: 12 }}>
                <StackBar
                  segments={data.paymentBreakdown.map((row) => ({
                    key: row.status,
                    value: row.total,
                    color: PAYMENT_COLORS[row.status] || wf.rail
                  }))}
                />
                <div style={{ display: "grid", gap: 7, fontSize: 12 }}>
                  {data.paymentBreakdown.map((row) => (
                    <div
                      key={row.status}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            background: PAYMENT_COLORS[row.status] || wf.rail
                          }}
                        />
                        <span style={{ fontWeight: 700 }}>{titleCase(row.status)}</span>
                        <span style={{ fontSize: 11, color: wf.muted }}>
                          {row.count} {row.count === 1 ? "order" : "orders"} ·{" "}
                          {((row.total / paymentTotal) * 100).toFixed(0)}%
                        </span>
                      </span>
                      <Mono style={{ fontWeight: 700 }}>
                        {fmt(row.total, { cents: false })}
                      </Mono>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, color: wf.muted }}>No orders in range.</p>
            )}
          </Panel>
        </div>
      </div>

      <Notice tone={data.hasCostData ? "good" : "info"}>
        {data.hasCostData
          ? `Gross profit across all orders: ${fmt(data.grossProfit)} at a ${data.grossMarginPct.toFixed(1)}% margin.`
          : "Gross margin is hidden until product unit costs are entered in the catalog."}
      </Notice>

      <Panel
        title="Order ledger"
        meta={`${data.recentOrders.length} most recent`}
        action={
          <AdminBtn onClick={exportCsv} size="sm" disabled={!data.recentOrders.length}>
            <Ico.clipboard size={13} /> Export
          </AdminBtn>
        }
        pad={false}
      >
        <DataTable
          columns={columns}
          rows={data.recentOrders}
          getKey={(row) => row.id}
          empty="Orders will appear here once they are placed."
        />
      </Panel>
      <style>{`
        @media (max-width: 880px) {
          .wf-admin-report-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

function ARRow({
  label,
  value,
  tone,
  strong
}: {
  label: string;
  value: number;
  tone?: "red" | "pine";
  strong?: boolean;
}) {
  const color = tone === "red" ? wf.red : tone === "pine" ? wf.pine : wf.ink;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: strong ? wf.ink : wf.steel, fontWeight: strong ? 800 : 600 }}>
        {label}
      </span>
      <Mono style={{ fontWeight: strong ? 800 : 700, color }}>{fmt(value)}</Mono>
    </div>
  );
}
