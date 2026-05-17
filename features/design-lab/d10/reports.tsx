"use client";

import Link from "next/link";
import type {
  ReportData,
  ReportOrderRow,
  ReportPaymentBreakdown
} from "@/features/admin/reports/reports-dashboard";
import { Card, Pill, SIGNAL, SectionHead, SignalShell, formatUsd } from "./kit";

// d10 "Signal" — reports. Financial dashboard rendered from real Supabase
// aggregates (ReportData). Built with finance rigor: revenue velocity,
// margin, AR aging, collections health.

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function titleCase(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function paymentTone(
  status: string
): "good" | "warn" | "neutral" | "accent" {
  if (status === "paid" || status === "overpaid") return "good";
  if (status === "partial") return "accent";
  if (status === "unpaid" || status === "failed") return "warn";
  return "neutral";
}

function Metric({
  label,
  value,
  sub,
  accent = false
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: SIGNAL.sub }}
      >
        {label}
      </p>
      <p
        className="mt-1.5 text-[24px] font-semibold tracking-tight tabular-nums"
        style={{ color: accent ? SIGNAL.accent : SIGNAL.ink }}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-[11px]" style={{ color: SIGNAL.sub }}>
          {sub}
        </p>
      ) : null}
    </Card>
  );
}

export function D10Reports({ data }: { data: ReportData }) {
  if (!data.configured) {
    return (
      <SignalShell active="reports">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <div
            className="mx-auto grid h-12 w-12 place-items-center rounded-[10px]"
            style={{ background: SIGNAL.accentSoft }}
          >
            <span style={{ color: SIGNAL.accent }} className="text-[20px]">
              ▦
            </span>
          </div>
          <h1
            className="mt-4 text-[22px] font-semibold tracking-tight"
            style={{ color: SIGNAL.ink }}
          >
            Supabase not configured
          </h1>
          <p
            className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed"
            style={{ color: SIGNAL.sub }}
          >
            The reports workspace reads live revenue, margin and AR data from
            Supabase. Add the service credentials to populate this dashboard.
          </p>
          <Link
            href="/design-lab/d10/orders"
            className="mt-5 inline-block rounded-[8px] border px-4 py-2 text-[13px] font-semibold transition-colors hover:bg-[#fafbfc]"
            style={{ borderColor: SIGNAL.line, color: SIGNAL.ink }}
          >
            Back to orders
          </Link>
        </div>
      </SignalShell>
    );
  }

  const collectionRate =
    data.billed > 0 ? (data.collected / data.billed) * 100 : 0;
  const agingMax = Math.max(
    1,
    ...data.aging.map((bucket) => bucket.total)
  );
  const breakdownMax = Math.max(
    1,
    ...data.paymentBreakdown.map((row) => row.total)
  );

  return (
    <SignalShell active="reports">
      <div className="mx-auto max-w-6xl px-5 py-7">
        <div className="flex items-center gap-2">
          <Pill tone="accent">Reports</Pill>
          <span className="text-[12px]" style={{ color: SIGNAL.sub }}>
            Live Supabase aggregates · trailing 30 days
          </span>
        </div>
        <h1
          className="mt-3 text-[26px] font-semibold tracking-tight"
          style={{ color: SIGNAL.ink }}
        >
          Financial signal
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: SIGNAL.sub }}>
          Faster reorder cycles and recommendation-driven attach raise revenue
          per visit. This is where that shows up.
        </p>

        {/* primary KPIs */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric
            label="Revenue · 30d"
            value={formatUsd(data.revenue30)}
            sub={`${data.orders30} orders`}
            accent
          />
          <Metric
            label="Avg order value"
            value={formatUsd(data.avgOrderValue)}
            sub="Per completed order"
          />
          <Metric
            label="Gross profit"
            value={
              data.hasCostData ? formatUsd(data.grossProfit) : "No cost data"
            }
            sub={
              data.hasCostData
                ? `${data.grossMarginPct.toFixed(1)}% margin`
                : "Add unit costs to track margin"
            }
          />
          <Metric
            label="Outstanding AR"
            value={formatUsd(data.outstanding)}
            sub={`${collectionRate.toFixed(0)}% collected`}
          />
        </div>

        {/* collections + aging */}
        <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_1fr]">
          {/* collections health */}
          <Card className="p-5">
            <SectionHead
              eyebrow="Cash flow"
              title="Collections health"
              hint="Billed vs. collected across all active orders."
            />
            <div className="space-y-3">
              {[
                { label: "Billed", value: data.billed, tone: SIGNAL.ink },
                {
                  label: "Collected",
                  value: data.collected,
                  tone: "#1a7f3c"
                },
                {
                  label: "Outstanding",
                  value: data.outstanding,
                  tone: SIGNAL.accent
                }
              ].map((row) => {
                const pct =
                  data.billed > 0 ? (row.value / data.billed) * 100 : 0;
                return (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-[12px]">
                      <span style={{ color: SIGNAL.sub }}>{row.label}</span>
                      <span
                        className="font-semibold tabular-nums"
                        style={{ color: SIGNAL.ink }}
                      >
                        {formatUsd(row.value)}
                      </span>
                    </div>
                    <div
                      className="mt-1.5 h-2 overflow-hidden rounded-full"
                      style={{ background: SIGNAL.canvas }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          background: row.tone
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* AR aging */}
          <Card className="p-5">
            <SectionHead
              eyebrow="Receivables"
              title="AR aging"
              hint="Outstanding balance by days since order."
            />
            <div className="flex items-end gap-3" style={{ height: 140 }}>
              {data.aging.map((bucket) => {
                const height = (bucket.total / agingMax) * 110;
                const stale = bucket.bucket === "60+";
                return (
                  <div
                    key={bucket.bucket}
                    className="flex flex-1 flex-col items-center justify-end"
                  >
                    <span
                      className="mb-1 text-[11px] font-semibold tabular-nums"
                      style={{ color: SIGNAL.ink }}
                    >
                      {formatUsd(bucket.total)}
                    </span>
                    <div
                      className="w-full rounded-[6px]"
                      style={{
                        height: Math.max(4, height),
                        background: stale ? "#b5651d" : SIGNAL.accent,
                        opacity: bucket.total > 0 ? 1 : 0.25
                      }}
                    />
                    <span
                      className="mt-1.5 text-[11px]"
                      style={{ color: SIGNAL.sub }}
                    >
                      {bucket.bucket} days
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* payment breakdown */}
        {data.paymentBreakdown.length ? (
          <section className="mt-5">
            <SectionHead
              eyebrow="Mix"
              title="Revenue by payment status"
              hint="Where billed dollars sit across the payment lifecycle."
            />
            <Card className="divide-y">
              {data.paymentBreakdown.map((row: ReportPaymentBreakdown) => {
                const pct = (row.total / breakdownMax) * 100;
                return (
                  <div key={row.status} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Pill tone={paymentTone(row.status)}>
                          {titleCase(row.status)}
                        </Pill>
                        <span
                          className="text-[11px]"
                          style={{ color: SIGNAL.sub }}
                        >
                          {row.count} order{row.count === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span
                        className="text-[13px] font-semibold tabular-nums"
                        style={{ color: SIGNAL.ink }}
                      >
                        {formatUsd(row.total)}
                      </span>
                    </div>
                    <div
                      className="mt-2 h-1.5 overflow-hidden rounded-full"
                      style={{ background: SIGNAL.canvas }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          background: SIGNAL.accent
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </Card>
          </section>
        ) : null}

        {/* recent orders */}
        <section className="mt-5">
          <SectionHead
            eyebrow="Ledger"
            title="Recent orders"
            hint="Most recent activity with per-order margin where costs exist."
          />
          <Card className="overflow-hidden">
            <div
              className="grid grid-cols-[1fr_1.5fr_0.8fr_0.9fr_0.9fr_0.9fr] gap-3 border-b px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
              style={{ borderColor: SIGNAL.line, color: SIGNAL.sub }}
            >
              <span>Order</span>
              <span>Customer</span>
              <span>Date</span>
              <span className="text-right">Total</span>
              <span className="text-right">Margin</span>
              <span className="text-right">Payment</span>
            </div>
            {data.recentOrders.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-[12px]" style={{ color: SIGNAL.sub }}>
                  No orders recorded yet.
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: SIGNAL.line }}>
                {data.recentOrders.map((order: ReportOrderRow) => (
                  <div
                    key={order.id}
                    className="grid grid-cols-[1fr_1.5fr_0.8fr_0.9fr_0.9fr_0.9fr] items-center gap-3 px-4 py-3 transition-colors hover:bg-[#fafbfc]"
                  >
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: SIGNAL.ink }}
                    >
                      {order.orderNumber}
                    </span>
                    <span
                      className="truncate text-[12px]"
                      style={{ color: SIGNAL.ink }}
                    >
                      {order.customerName}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: SIGNAL.sub }}
                    >
                      {formatDate(order.createdAt)}
                    </span>
                    <span
                      className="text-right text-[12px] font-semibold tabular-nums"
                      style={{ color: SIGNAL.ink }}
                    >
                      {formatUsd(order.total)}
                    </span>
                    <span
                      className="text-right text-[12px] font-medium tabular-nums"
                      style={{
                        color:
                          order.margin === null
                            ? SIGNAL.sub
                            : order.margin >= 0
                              ? "#1a7f3c"
                              : "#b5651d"
                      }}
                    >
                      {order.margin === null
                        ? "—"
                        : formatUsd(order.margin)}
                    </span>
                    <span className="flex justify-end">
                      <Pill tone={paymentTone(order.paymentStatus)}>
                        {titleCase(order.paymentStatus)}
                      </Pill>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>
      </div>
    </SignalShell>
  );
}
