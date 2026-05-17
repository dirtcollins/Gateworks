"use client";

import { AlertTriangle, PieChart, Receipt, TrendingUp, Wallet } from "lucide-react";
import { LEDGER, formatUsd, formatUsd0 } from "@/features/sites/ledger/kit";
import type { ReportData } from "@/features/admin/reports/reports-dashboard";
import {
  AdminCard,
  AdminEmpty,
  AdminHeading,
  StatTile,
  StatusPill,
  formatAdminDate,
  paymentStatusTone,
  titleCase
} from "./admin-kit";

/* Ledger admin reports — presentational only. Receives the serializable
 * ReportData produced server-side by fetchReportData() and renders a
 * finance-grade revenue / margin / accounts-receivable dashboard in the
 * Ledger design language. */
export function LedgerAdminReports({ data }: { data: ReportData }) {
  const collectionRate = data.billed > 0 ? (data.collected / data.billed) * 100 : 0;
  const maxBreakdown = Math.max(1, ...data.paymentBreakdown.map((row) => row.total));
  const maxAging = Math.max(1, ...data.aging.map((bucket) => bucket.total));

  return (
    <div className="grid gap-6">
      <AdminHeading
        eyebrow="Operations"
        title="Financial reports"
        description="Trailing 30-day revenue, order economics, and accounts-receivable health for the trade account."
      />

      {!data.configured ? (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          style={{ backgroundColor: LEDGER.amberSoft }}
        >
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0"
            style={{ color: LEDGER.amber }}
          />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: LEDGER.amber }}>
              Supabase is not configured
            </p>
            <p className="mt-0.5 text-[12px]" style={{ color: LEDGER.amber }}>
              Live financial data is unavailable. Add the Supabase keys to{" "}
              <code>.env.local</code> to populate this report with real account
              data.
            </p>
          </div>
        </div>
      ) : null}

      {/* Headline KPIs */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Revenue (30 days)"
          value={formatUsd0(data.revenue30)}
          sub={`${data.orders30} orders billed`}
        />
        <StatTile
          label="Avg order value"
          value={formatUsd(data.avgOrderValue)}
          sub="Across recent orders"
        />
        <StatTile
          label="Gross margin"
          value={data.hasCostData ? `${data.grossMarginPct.toFixed(1)}%` : "No cost data"}
          sub={
            data.hasCostData
              ? `${formatUsd0(data.grossProfit)} gross profit`
              : "Add unit costs to compute"
          }
        />
        <StatTile
          label="Collection rate"
          value={`${collectionRate.toFixed(1)}%`}
          sub={`${formatUsd0(data.collected)} collected`}
          accent={collectionRate >= 80 ? LEDGER.mint : LEDGER.amber}
        />
      </section>

      {/* AR / payment mix / aging */}
      <section className="grid gap-4 lg:grid-cols-3">
        {/* Accounts receivable */}
        <AdminCard className="p-5">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" style={{ color: LEDGER.indigo }} />
            <p
              className="text-[12px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Accounts receivable
            </p>
          </div>
          <div className="mt-4 grid gap-3 text-[13px]">
            <Row label="Total billed" value={formatUsd(data.billed)} />
            <Row label="Collected" value={formatUsd(data.collected)} accent={LEDGER.mint} />
            <div
              className="flex items-center justify-between pt-3"
              style={{ borderTop: `1px solid ${LEDGER.line}` }}
            >
              <span className="font-semibold" style={{ color: LEDGER.ink }}>
                Outstanding
              </span>
              <span
                className="text-[16px] font-semibold tracking-tight"
                style={{ color: LEDGER.rose }}
              >
                {formatUsd(data.outstanding)}
              </span>
            </div>
            <div>
              <div
                className="h-2 overflow-hidden rounded-full"
                style={{ backgroundColor: LEDGER.canvas }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, collectionRate)}%`,
                    backgroundColor: LEDGER.mint
                  }}
                />
              </div>
              <p
                className="mt-1.5 text-[11px] font-medium"
                style={{ color: LEDGER.muted }}
              >
                {collectionRate.toFixed(1)}% of billed revenue collected
              </p>
            </div>
          </div>
        </AdminCard>

        {/* Payment mix */}
        <AdminCard className="p-5">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4" style={{ color: LEDGER.indigo }} />
            <p
              className="text-[12px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Payment status mix
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {data.paymentBreakdown.length ? (
              data.paymentBreakdown.map((row) => (
                <div key={row.status}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2">
                      <StatusPill tone={paymentStatusTone(row.status)}>
                        {titleCase(row.status)}
                      </StatusPill>
                      <span style={{ color: LEDGER.muted }}>{row.count} orders</span>
                    </span>
                    <span className="font-semibold" style={{ color: LEDGER.ink }}>
                      {formatUsd(row.total)}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                    style={{ backgroundColor: LEDGER.canvas }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(row.total / maxBreakdown) * 100}%`,
                        backgroundColor: LEDGER.indigo
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[13px]" style={{ color: LEDGER.muted }}>
                No orders in range.
              </p>
            )}
          </div>
        </AdminCard>

        {/* AR aging */}
        <AdminCard className="p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" style={{ color: LEDGER.indigo }} />
            <p
              className="text-[12px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Outstanding by age
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {data.aging.map((bucket, index) => {
              const tone =
                index === 0 ? LEDGER.mint : index === 1 ? LEDGER.amber : LEDGER.rose;
              return (
                <div key={bucket.bucket}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium" style={{ color: LEDGER.body }}>
                      {bucket.bucket} days
                    </span>
                    <span className="font-semibold" style={{ color: LEDGER.ink }}>
                      {formatUsd(bucket.total)}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                    style={{ backgroundColor: LEDGER.canvas }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(bucket.total / maxAging) * 100}%`,
                        backgroundColor: tone
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>
      </section>

      {/* Margin note */}
      <AdminCard className="flex flex-wrap items-center justify-between gap-3 p-5">
        <p className="text-[13px]" style={{ color: LEDGER.body }}>
          {data.hasCostData ? (
            <>
              Gross profit across recent orders is{" "}
              <span className="font-semibold" style={{ color: LEDGER.ink }}>
                {formatUsd(data.grossProfit)}
              </span>{" "}
              at a {data.grossMarginPct.toFixed(1)}% margin.
            </>
          ) : (
            <>
              Gross margin is hidden until product unit costs are entered. Add
              costs in the catalog manager to compute margin from real cost
              data.
            </>
          )}
        </p>
        <StatusPill tone={data.hasCostData ? "mint" : "amber"}>
          {data.hasCostData ? "Cost data available" : "Cost data pending"}
        </StatusPill>
      </AdminCard>

      {/* Recent orders */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Receipt className="h-4 w-4" style={{ color: LEDGER.indigo }} />
          <h2
            className="text-[15px] font-semibold tracking-tight"
            style={{ color: LEDGER.ink }}
          >
            Recent orders
          </h2>
        </div>
        <AdminCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{
                    color: LEDGER.muted,
                    borderBottom: `1px solid ${LEDGER.line}`
                  }}
                >
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3 text-right">Gross margin</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    style={{
                      borderTop: index === 0 ? "none" : `1px solid ${LEDGER.line}`
                    }}
                  >
                    <td
                      className="px-5 py-3.5 text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {order.orderNumber}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[13px] font-medium"
                      style={{ color: LEDGER.body }}
                    >
                      {formatAdminDate(order.createdAt)}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[13px] font-medium"
                      style={{ color: LEDGER.ink }}
                    >
                      {order.customerName}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {formatUsd(order.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill tone={paymentStatusTone(order.paymentStatus)}>
                        {titleCase(order.paymentStatus)}
                      </StatusPill>
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {order.margin === null ? "—" : formatUsd(order.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.recentOrders.length === 0 ? (
            <AdminEmpty
              icon={<TrendingUp className="h-9 w-9" />}
              title="No orders yet"
              description="Orders will appear here once they are placed."
            />
          ) : null}
        </AdminCard>
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: LEDGER.body }}>{label}</span>
      <span className="font-semibold" style={{ color: accent ?? LEDGER.ink }}>
        {value}
      </span>
    </div>
  );
}
