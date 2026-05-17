"use client";

/** DESIGN 2 — Warehouse Dark · Admin reports dashboard */

import { useState } from "react";
import { ArrowUpRight, Download, TrendingUp } from "lucide-react";
import { D2, D2Shell, Panel, PanelHead, StatCell, Tag, mono } from "./kit";
import type { ReportData } from "@/features/admin/reports/reports-dashboard";

const RANGES = ["7D", "30D", "QTR", "YTD"];

const PAYMENT_COLORS: Record<string, string> = {
  paid: D2.accent,
  partial: "#f5b53d",
  unpaid: "#ff6b6b",
  overpaid: "#3da0f5",
  refunded: "#8a6bf5",
  failed: "#ff6b6b"
};

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function D2Reports({ data }: { data: ReportData }) {
  const [range, setRange] = useState("30D");

  const kpis = [
    {
      label: "Revenue (30d)",
      value: currency(data.revenue30),
      delta: "live",
      good: true
    },
    {
      label: "Orders (30d)",
      value: String(data.orders30),
      delta: "live",
      good: true
    },
    {
      label: "Avg order value",
      value: currency(data.avgOrderValue),
      delta: "live",
      good: true
    },
    {
      label: "Gross margin",
      value: data.hasCostData ? `${data.grossMarginPct.toFixed(1)}%` : "No cost data",
      delta: data.hasCostData ? "live" : "n/a",
      good: data.hasCostData
    }
  ];

  const collectedPct =
    data.billed > 0 ? Math.min(100, (data.collected / data.billed) * 100) : 0;
  const maxAging = Math.max(1, ...data.aging.map((bucket) => bucket.total));
  const paymentTotal = data.paymentBreakdown.reduce((sum, row) => sum + row.total, 0);
  const maxRecentTotal = Math.max(
    1,
    ...data.recentOrders.map((order) => order.total)
  );

  return (
    <D2Shell active="reports" kicker="ADMIN // ANALYTICS">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight">Performance Reports</h1>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center rounded-[3px]"
            style={{ border: `1px solid ${D2.line}` }}
          >
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`${mono} px-3 py-1.5 text-[11px] uppercase tracking-wider transition`}
                style={{
                  color: r === range ? D2.bg : D2.muted,
                  background: r === range ? D2.accent : "transparent"
                }}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`${mono} flex items-center gap-1.5 rounded-[3px] px-3 py-1.5 text-[11px] uppercase tracking-wider`}
            style={{ background: D2.panelHi, color: D2.accent, border: `1px solid ${D2.line}` }}
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {!data.configured ? (
        <Panel className="mb-6 flex items-start gap-3 p-4">
          <Tag tone="warn">OFFLINE</Tag>
          <span className={`${mono} text-[12px] leading-relaxed`} style={{ color: D2.muted }}>
            Supabase is not configured — live financial data is unavailable. Add the Supabase
            keys to .env.local to populate this report.
          </span>
        </Panel>
      ) : null}

      {/* KPIs */}
      <Panel className="mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <StatCell key={k.label} {...k} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* accounts receivable */}
        <Panel>
          <PanelHead
            title="Accounts Receivable"
            meta="BILLED vs COLLECTED"
            action={
              <span
                className={`${mono} flex items-center gap-1 text-[11px]`}
                style={{ color: D2.accent }}
              >
                <TrendingUp className="h-3.5 w-3.5" />{" "}
                {collectedPct.toFixed(0)}% collected
              </span>
            }
          />
          <div className="p-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Billed", data.billed, D2.text],
                ["Collected", data.collected, D2.accent],
                ["Outstanding", data.outstanding, "#ff6b6b"]
              ].map(([label, value, color]) => (
                <div
                  key={String(label)}
                  className="rounded-[3px] p-3"
                  style={{ background: D2.panelHi, border: `1px solid ${D2.line}` }}
                >
                  <div
                    className={`${mono} text-[10px] uppercase tracking-[0.16em]`}
                    style={{ color: D2.muted }}
                  >
                    {label}
                  </div>
                  <div
                    className={`${mono} mt-1 text-[20px] font-bold`}
                    style={{ color: color as string }}
                  >
                    {currency(value as number)}
                  </div>
                </div>
              ))}
            </div>
            <div
              className="mt-4 h-2 overflow-hidden rounded-full"
              style={{ background: D2.line }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${collectedPct}%`,
                  background: D2.accent,
                  boxShadow: `0 0 10px ${D2.accent}`
                }}
              />
            </div>
          </div>
          {/* aging */}
          <div className="border-t" style={{ borderColor: D2.line }}>
            <div
              className={`${mono} px-5 py-2.5 text-[10px] uppercase tracking-[0.16em]`}
              style={{ color: D2.muted }}
            >
              Outstanding by age
            </div>
            {data.aging.map((bucket, i) => (
              <div
                key={bucket.bucket}
                className="flex items-center gap-3 px-5 py-2.5"
                style={{ borderTop: i > 0 ? `1px solid ${D2.line}` : undefined }}
              >
                <span className="w-32 text-[12px]">{bucket.bucket} days</span>
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full"
                  style={{ background: D2.line }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(bucket.total / maxAging) * 100}%`,
                      background: D2.accent
                    }}
                  />
                </div>
                <span className={`${mono} w-20 text-right text-[12px] font-bold`}>
                  {currency(bucket.total)}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* payment mix + signals */}
        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHead title="Payment Status" meta="BY REVENUE" />
            <div className="p-5">
              {data.paymentBreakdown.length ? (
                <>
                  <div
                    className="flex h-3 overflow-hidden rounded-full"
                    style={{ border: `1px solid ${D2.line}` }}
                  >
                    {data.paymentBreakdown.map((row) => (
                      <div
                        key={row.status}
                        style={{
                          width: `${
                            paymentTotal > 0 ? (row.total / paymentTotal) * 100 : 0
                          }%`,
                          background: PAYMENT_COLORS[row.status] ?? D2.muted
                        }}
                      />
                    ))}
                  </div>
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {data.paymentBreakdown.map((row) => (
                      <li key={row.status} className="flex items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 rounded-[2px]"
                          style={{ background: PAYMENT_COLORS[row.status] ?? D2.muted }}
                        />
                        <span className="flex-1 text-[12px]">
                          {titleCase(row.status)}{" "}
                          <span style={{ color: D2.muted }}>· {row.count} orders</span>
                        </span>
                        <span className={`${mono} text-[12px] font-bold`}>
                          {currency(row.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className={`${mono} text-[12px]`} style={{ color: D2.muted }}>
                  No orders in range.
                </p>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Signals" meta="MARGIN" />
            <ul>
              {[
                {
                  tone: data.hasCostData ? ("accent" as const) : ("warn" as const),
                  tag: data.hasCostData ? "GP" : "COST",
                  msg: data.hasCostData
                    ? `Gross profit across recent orders: ${currency(data.grossProfit)}`
                    : "Gross margin hidden until product unit costs are entered in the catalog."
                },
                {
                  tone:
                    data.outstanding > 0 ? ("bad" as const) : ("accent" as const),
                  tag: "A/R",
                  msg:
                    data.outstanding > 0
                      ? `${currency(data.outstanding)} outstanding across receivable buckets.`
                      : "All billed revenue has been collected."
                },
                {
                  tone: "accent" as const,
                  tag: "VOL",
                  msg: `${data.orders30} orders in the last 30 days at ${currency(
                    data.avgOrderValue
                  )} average value.`
                }
              ].map((a, i) => (
                <li
                  key={a.tag}
                  className="flex items-start gap-3 px-4 py-3"
                  style={{ borderTop: i > 0 ? `1px solid ${D2.line}` : undefined }}
                >
                  <Tag tone={a.tone}>{a.tag}</Tag>
                  <span className="flex-1 text-[12px] leading-snug">{a.msg}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      {/* recent orders */}
      <Panel className="mt-6">
        <PanelHead
          title="Recent Orders"
          meta={`${data.recentOrders.length} · BY DATE`}
          action={
            <span
              className={`${mono} flex items-center gap-1 text-[11px] uppercase`}
              style={{ color: D2.accent }}
            >
              Full report <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          }
        />
        <div
          className={`${mono} grid grid-cols-[2fr_0.8fr_1fr_1.4fr] gap-2 px-4 py-2 text-[10px] uppercase tracking-wider`}
          style={{ color: D2.muted, borderBottom: `1px solid ${D2.line}` }}
        >
          <span>Order / Customer</span>
          <span className="text-right">Date</span>
          <span className="text-right">Total</span>
          <span>Payment</span>
        </div>
        {data.recentOrders.length ? (
          data.recentOrders.map((order, i) => (
            <div
              key={order.id}
              className="grid grid-cols-[2fr_0.8fr_1fr_1.4fr] items-center gap-2 px-4 py-3"
              style={{ borderTop: i > 0 ? `1px solid ${D2.line}` : undefined }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`${mono} grid h-6 w-6 shrink-0 place-items-center rounded-[3px] text-[11px] font-bold`}
                  style={{
                    background: i === 0 ? D2.accent : D2.panelHi,
                    color: i === 0 ? D2.bg : D2.muted,
                    border: `1px solid ${D2.line}`
                  }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className={`${mono} text-[10px]`} style={{ color: D2.muted }}>
                    {order.orderNumber}
                  </div>
                  <div className="truncate text-[12px] font-medium">
                    {order.customerName}
                  </div>
                </div>
              </div>
              <span className={`${mono} text-right text-[12px]`} style={{ color: D2.muted }}>
                {formatDate(order.createdAt)}
              </span>
              <span
                className={`${mono} text-right text-[12px] font-bold`}
                style={{ color: D2.accent }}
              >
                {currency(order.total)}
              </span>
              <div className="flex items-center gap-2">
                <Tag
                  tone={
                    order.paymentStatus === "paid"
                      ? "accent"
                      : order.paymentStatus === "partial"
                      ? "warn"
                      : "bad"
                  }
                >
                  {titleCase(order.paymentStatus)}
                </Tag>
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full"
                  style={{ background: D2.line }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(order.total / maxRecentTotal) * 100}%`,
                      background: D2.accent
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="grid place-items-center py-12">
            <span className={`${mono} text-[12px]`} style={{ color: D2.muted }}>
              {data.configured
                ? "Orders will appear here once they are placed."
                : "Connect Supabase to load recent orders."}
            </span>
          </div>
        )}
      </Panel>
    </D2Shell>
  );
}
