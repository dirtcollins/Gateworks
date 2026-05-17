// d11 "Wayfinder" — Admin reports.
// The prototype has no reports page; this builds one in the d11 visual
// language (black context bar shell, hairline cards, mono technical text,
// tag styling). Renders real ReportData aggregated server-side.
"use client";

import type { ReportData } from "@/features/admin/reports/reports-dashboard";
import {
  Btn,
  Card,
  D11Shell,
  Eyebrow,
  Ico,
  Mono,
  Tag,
  d11,
  fmt,
  monoFont
} from "./kit";

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function D11Reports({ data }: { data: ReportData }) {
  if (!data.configured) {
    return (
      <D11Shell active="reports">
        <div
          style={{
            padding: "20px 24px 12px",
            borderBottom: `1px solid ${d11.rail}`,
            background: d11.paper
          }}
        >
          <Eyebrow>Gateworks Supply · Insights</Eyebrow>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: "-0.01em",
              marginTop: 4
            }}
          >
            Reports &amp; performance
          </h1>
        </div>
        <div style={{ padding: "48px 24px", maxWidth: 720, margin: "0 auto" }}>
          <Card style={{ padding: 40, textAlign: "center" }}>
            <span style={{ display: "inline-flex", color: d11.rail }}>
              <Ico.layers size={36} />
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginTop: 14 }}>
              Supabase not configured.
            </h2>
            <p
              style={{
                fontSize: 13,
                color: d11.steel,
                marginTop: 6,
                maxWidth: 380,
                margin: "6px auto 0"
              }}
            >
              Add Supabase credentials to unlock live revenue, margin, and
              accounts-receivable reporting.
            </p>
            <div style={{ marginTop: 18 }}>
              <Btn href="/design-lab/d11/orders" variant="primary">
                <Ico.arrowRight size={14} /> Back to orders
              </Btn>
            </div>
          </Card>
        </div>
      </D11Shell>
    );
  }

  const series = [...data.recentOrders].reverse().map((order) => order.total);
  const chartSeries = series.length ? series : [0];
  const maxSeries = Math.max(...chartSeries, 1);
  const maxPayment = Math.max(...data.paymentBreakdown.map((b) => b.total), 1);
  const collectionRate = data.billed > 0 ? (data.collected / data.billed) * 100 : 0;

  const kpis = [
    {
      label: "Revenue · 30 days",
      value: fmt(data.revenue30, { cents: false }),
      sub: `${data.orders30} orders`
    },
    {
      label: "Orders · 30 days",
      value: String(data.orders30),
      sub: "Last 30 days"
    },
    {
      label: "Avg. order value",
      value: fmt(data.avgOrderValue, { cents: false }),
      sub: "Per order"
    },
    {
      label: "Gross margin",
      value: data.hasCostData ? `${data.grossMarginPct.toFixed(1)}%` : "—",
      sub: data.hasCostData
        ? `${fmt(data.grossProfit, { cents: false })} profit`
        : "No cost data"
    }
  ];

  return (
    <D11Shell active="reports">
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "end",
          gap: 16,
          padding: "20px 24px 12px",
          borderBottom: `1px solid ${d11.rail}`,
          background: d11.paper
        }}
      >
        <div>
          <Eyebrow>Gateworks Supply · Insights</Eyebrow>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: "-0.01em",
              marginTop: 4
            }}
          >
            Reports &amp; performance
          </h1>
          <p style={{ fontSize: 13, color: d11.steel, marginTop: 6 }}>
            Live performance from the last 30 days of orders.
          </p>
        </div>
        <Btn variant="default" size="sm">
          <Ico.receipt size={14} /> Export report
        </Btn>
      </div>

      <div style={{ padding: "20px 24px 40px" }}>
        {/* KPI grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 1,
            background: d11.rail,
            border: `1px solid ${d11.rail}`
          }}
        >
          {kpis.map((kpi) => (
            <div key={kpi.label} style={{ background: "#fff", padding: 16 }}>
              <Mono
                style={{ fontSize: 10, color: d11.muted, textTransform: "uppercase" }}
              >
                {kpi.label}
              </Mono>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  marginTop: 6,
                  letterSpacing: "-0.01em"
                }}
              >
                {kpi.value}
              </div>
              <div style={{ fontSize: 11, color: d11.steel, marginTop: 2 }}>
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Billing summary */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 1,
            background: d11.rail,
            border: `1px solid ${d11.rail}`,
            marginTop: 16
          }}
        >
          {[
            { label: "Billed", value: data.billed, color: d11.ink },
            { label: "Collected", value: data.collected, color: d11.pine },
            { label: "Outstanding", value: data.outstanding, color: d11.red }
          ].map((row) => (
            <div key={row.label} style={{ background: "#fff", padding: 16 }}>
              <Mono
                style={{ fontSize: 10, color: d11.muted, textTransform: "uppercase" }}
              >
                {row.label}
              </Mono>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  marginTop: 6,
                  color: row.color
                }}
              >
                {fmt(row.value)}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 320px",
            gap: 16,
            marginTop: 16
          }}
        >
          {/* Revenue chart */}
          <Card style={{ padding: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 900 }}>
                  Recent order totals
                </div>
                <Mono style={{ fontSize: 11, color: d11.muted }}>
                  Most recent {chartSeries.length} orders
                </Mono>
              </div>
              <Tag tone="in">{collectionRate.toFixed(0)}% collected</Tag>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 4,
                height: 200,
                marginTop: 20
              }}
            >
              {chartSeries.map((value, index) => (
                <div
                  key={index}
                  title={fmt(value)}
                  style={{
                    flex: 1,
                    background: d11.pine,
                    height: `${Math.max(2, (value / maxSeries) * 100)}%`,
                    minWidth: 4
                  }}
                />
              ))}
            </div>
          </Card>

          {/* Payment breakdown + aging */}
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Orders by payment</div>
            <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
              {data.paymentBreakdown.length ? (
                data.paymentBreakdown.map((bucket) => (
                  <div key={bucket.status}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      <span style={{ color: d11.steel }}>
                        {titleCase(bucket.status)}{" "}
                        <Mono style={{ color: d11.muted, fontSize: 10 }}>
                          ({bucket.count})
                        </Mono>
                      </span>
                      <span style={{ color: d11.ink }}>
                        {fmt(bucket.total, { cents: false })}
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        height: 8,
                        background: d11.hairline,
                        overflow: "hidden"
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background: d11.ink,
                          width: `${(bucket.total / maxPayment) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <Mono style={{ fontSize: 12, color: d11.muted }}>
                  No payment data yet.
                </Mono>
              )}
            </div>

            <div
              style={{
                marginTop: 18,
                padding: 14,
                background: d11.paper,
                borderLeft: `3px solid ${d11.pine}`
              }}
            >
              <Eyebrow style={{ color: d11.pine, marginBottom: 6 }}>
                AR aging
              </Eyebrow>
              <div style={{ display: "grid", gap: 4 }}>
                {data.aging.map((bucket) => (
                  <div
                    key={bucket.bucket}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: d11.steel
                    }}
                  >
                    <span>{bucket.bucket} days</span>
                    <Mono style={{ fontWeight: 700, color: d11.ink }}>
                      {fmt(bucket.total, { cents: false })}
                    </Mono>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Recent orders */}
        <Card style={{ marginTop: 16, padding: 0 }}>
          <div
            style={{
              padding: "14px 18px",
              borderBottom: `1px solid ${d11.rail}`,
              background: d11.paper,
              fontSize: 14,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.04em"
            }}
          >
            Recent orders
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "130px 110px 1fr 110px 130px",
              gap: 0,
              padding: "10px 18px",
              borderBottom: `1px solid ${d11.hairline}`,
              fontFamily: monoFont,
              fontSize: 10,
              textTransform: "uppercase",
              fontWeight: 700,
              color: d11.muted,
              letterSpacing: "0.06em"
            }}
          >
            <span>Order</span>
            <span>Date</span>
            <span>Customer</span>
            <span>Total</span>
            <span style={{ textAlign: "right" }}>Payment</span>
          </div>
          {data.recentOrders.length ? (
            data.recentOrders.slice(0, 12).map((order, index) => (
              <div
                key={order.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "130px 110px 1fr 110px 130px",
                  gap: 0,
                  padding: "11px 18px",
                  alignItems: "center",
                  borderBottom:
                    index < Math.min(data.recentOrders.length, 12) - 1
                      ? `1px solid ${d11.hairline}`
                      : "none",
                  background: index % 2 === 0 ? "#fff" : d11.bone
                }}
              >
                <Mono style={{ fontSize: 12, fontWeight: 700, color: d11.ink }}>
                  {order.orderNumber}
                </Mono>
                <Mono style={{ fontSize: 11, color: d11.steel }}>
                  {formatDate(order.createdAt)}
                </Mono>
                <span style={{ fontSize: 13, fontWeight: 700, color: d11.ink }}>
                  {order.customerName}
                </span>
                <span style={{ fontSize: 13, fontWeight: 900, color: d11.ink }}>
                  {fmt(order.total)}
                </span>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Tag tone={order.paymentStatus === "paid" ? "in" : "steel"}>
                    {titleCase(order.paymentStatus)}
                  </Tag>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: 32, textAlign: "center" }}>
              <Mono style={{ fontSize: 12, color: d11.muted }}>
                No orders yet.
              </Mono>
            </div>
          )}
        </Card>
      </div>
    </D11Shell>
  );
}
