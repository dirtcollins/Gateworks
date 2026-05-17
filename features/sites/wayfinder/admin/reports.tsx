// Wayfinder admin — financial reports (presentational). Receives a serializable
// ReportData prop from the server route (lib/reports-data.fetchReportData,
// server-only) and renders the warehouse-styled report: revenue KPIs, AR
// summary, aging, payment-status mix, and the recent-orders ledger.
"use client";

import type { ReportData } from "@/features/admin/reports/reports-dashboard";
import { fmt } from "../kit";
import {
  DataTable,
  Kpi,
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
import type { PaymentStatus } from "@/lib/platform-backend";

type RecentRow = ReportData["recentOrders"][number];

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export function WayfinderReports({ data }: { data: ReportData }) {
  const columns: Column<RecentRow>[] = [
    {
      key: "order",
      header: "Order",
      render: (row) => <Mono style={{ fontWeight: 700, fontSize: 12 }}>{row.orderNumber}</Mono>
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
        <Mono style={{ fontWeight: 700, color: row.margin === null ? wf.muted : wf.ink }}>
          {row.margin === null ? "—" : fmt(row.margin)}
        </Mono>
      )
    }
  ];

  return (
    <>
      <PageHead
        eyebrow="Operations"
        title="Financial reports"
        desc="Revenue, order value, accounts receivable, and gross margin aggregated from warehouse orders."
      />

      {!data.configured ? (
        <Notice tone="warn">
          Supabase is not configured, so live financial data is unavailable. Add the
          Supabase keys to .env.local to populate this report.
        </Notice>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))"
        }}
      >
        <Kpi
          label="Revenue · 30d"
          value={fmt(data.revenue30, { cents: false })}
          hint="last 30 days"
        />
        <Kpi label="Orders · 30d" value={data.orders30} hint="placed" />
        <Kpi
          label="Avg order value"
          value={fmt(data.avgOrderValue, { cents: false })}
          hint="per order"
        />
        <Kpi
          label="Gross margin"
          value={data.hasCostData ? `${data.grossMarginPct.toFixed(1)}%` : "—"}
          hint={data.hasCostData ? "from unit costs" : "no cost data"}
          tone="pine"
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"
        }}
      >
        <Panel title="Accounts receivable">
          <div style={{ display: "grid", gap: 9, fontSize: 13 }}>
            <ARRow label="Total billed" value={data.billed} />
            <ARRow label="Collected" value={data.collected} />
            <div style={{ borderTop: `1px solid ${wf.hairline}`, paddingTop: 8 }}>
              <ARRow label="Outstanding" value={data.outstanding} tone="red" strong />
            </div>
          </div>
        </Panel>

        <Panel title="Outstanding by age">
          <div style={{ display: "grid", gap: 9, fontSize: 13 }}>
            {data.aging.map((bucket) => (
              <ARRow
                key={bucket.bucket}
                label={`${bucket.bucket} days`}
                value={bucket.total}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Payment status mix">
          <div style={{ display: "grid", gap: 9, fontSize: 13 }}>
            {data.paymentBreakdown.length ? (
              data.paymentBreakdown.map((row) => (
                <div
                  key={row.status}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12
                  }}
                >
                  <span
                    style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                  >
                    <Pill tone={paymentStatusTone(row.status as PaymentStatus)}>
                      {titleCase(row.status)}
                    </Pill>
                    <span style={{ fontSize: 11, color: wf.muted }}>
                      {row.count} orders
                    </span>
                  </span>
                  <Mono style={{ fontWeight: 700 }}>{fmt(row.total)}</Mono>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, color: wf.muted }}>No orders in range.</p>
            )}
          </div>
        </Panel>
      </div>

      <Notice tone={data.hasCostData ? "good" : "info"}>
        {data.hasCostData
          ? `Gross profit across recent orders: ${fmt(data.grossProfit)}.`
          : "Gross margin is hidden until product unit costs are entered in the catalog."}
      </Notice>

      <Panel
        title="Recent orders"
        meta={`${data.recentOrders.length} most recent`}
        pad={false}
      >
        <DataTable
          columns={columns}
          rows={data.recentOrders}
          getKey={(row) => row.id}
          empty="Orders will appear here once they are placed."
        />
      </Panel>
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
  tone?: "red";
  strong?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: strong ? wf.ink : wf.steel, fontWeight: strong ? 800 : 600 }}>
        {label}
      </span>
      <Mono
        style={{
          fontWeight: strong ? 800 : 700,
          color: tone === "red" ? wf.red : wf.ink
        }}
      >
        {fmt(value)}
      </Mono>
    </div>
  );
}
