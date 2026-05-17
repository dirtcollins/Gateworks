"use client";

import Link from "next/link";
import { ArrowRight, Database } from "lucide-react";
import type { ReportData } from "@/features/admin/reports/reports-dashboard";
import {
  BlueprintCard,
  D8Shell,
  Dimension,
  DraftingMark,
  ink,
  mono,
  usd
} from "./kit";

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export function D8Reports({ data }: { data: ReportData }) {
  if (!data.configured) {
    return (
      <D8Shell active="reports">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <BlueprintCard>
            <div className="grid place-items-center px-5 py-20 text-center">
              <span
                className="grid h-14 w-14 place-items-center rounded-sm border"
                style={{ borderColor: ink.cyanDeep, color: ink.cyan }}
              >
                <Database className="h-6 w-6" />
              </span>
              <p
                className="mt-4 text-lg font-semibold"
                style={{ color: ink.chalk }}
              >
                Supabase not configured
              </p>
              <p
                className="mt-1 max-w-sm text-sm"
                style={{ color: ink.chalkDim }}
              >
                Live revenue, margin and accounts-receivable data is
                unavailable. Add Supabase credentials to{" "}
                <code style={{ color: ink.cyan }}>.env.local</code> to populate
                this report.
              </p>
              <Link
                href="/design-lab/d8/orders"
                className={`${mono} mt-5 inline-flex items-center gap-2 rounded-sm border px-5 py-2.5 text-[12px] uppercase tracking-[0.18em]`}
                style={{ borderColor: ink.line, color: ink.cyan }}
              >
                Back to build log <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </BlueprintCard>
        </div>
      </D8Shell>
    );
  }

  /* Real revenue series from recent orders (oldest → newest). */
  const series = [...data.recentOrders].reverse().map((order) => order.total);
  const chartSeries = series.length ? series : [0];
  const maxSeries = Math.max(...chartSeries, 1);

  const collectionRate =
    data.billed > 0 ? (data.collected / data.billed) * 100 : 0;
  const maxPayment = Math.max(
    ...data.paymentBreakdown.map((bucket) => bucket.total),
    1
  );
  const maxAging = Math.max(...data.aging.map((bucket) => bucket.total), 1);

  return (
    <D8Shell active="reports">
      {/* Header */}
      <section
        className="border-b"
        style={{ borderColor: ink.line, backgroundColor: ink.groundDeep }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-9">
          <div>
            <DraftingMark label="Sheet R-01 — Financial yield" />
            <h1
              className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl"
              style={{ color: ink.chalk }}
            >
              Yield Report
            </h1>
            <p className="mt-1 text-sm" style={{ color: ink.chalkDim }}>
              30-day commercial performance — revenue, margin mix and
              receivables.
            </p>
          </div>
          <Dimension
            value={`${collectionRate.toFixed(0)}%`}
            hint="collected"
          />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* KPI schedule */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Revenue · 30d",
              value: usd(data.revenue30, false),
              note: `${data.orders30} builds issued`
            },
            {
              label: "Builds · 30d",
              value: String(data.orders30),
              note: "Bills of materials shipped"
            },
            {
              label: "Avg BOM value",
              value: usd(data.avgOrderValue, false),
              note: "Basket per project"
            },
            {
              label: "Gross margin",
              value: data.hasCostData
                ? `${data.grossMarginPct.toFixed(1)}%`
                : "No cost data",
              note: data.hasCostData
                ? `${usd(data.grossProfit, false)} gross profit`
                : "Enter unit costs to unlock"
            }
          ].map((kpi) => (
            <BlueprintCard key={kpi.label}>
              <div className="px-4 py-4">
                <p
                  className={`${mono} text-[10px] uppercase tracking-[0.2em]`}
                  style={{ color: ink.chalkFaint }}
                >
                  {kpi.label}
                </p>
                <p
                  className={`${mono} mt-1.5 text-2xl font-semibold`}
                  style={{ color: ink.cyan }}
                >
                  {kpi.value}
                </p>
                <p
                  className={`${mono} mt-1 text-[10px] uppercase tracking-[0.12em]`}
                  style={{ color: ink.chalkDim }}
                >
                  {kpi.note}
                </p>
              </div>
            </BlueprintCard>
          ))}
        </div>

        {/* AR ledger */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total billed", value: data.billed, accent: ink.chalk },
            {
              label: "Collected",
              value: data.collected,
              accent: ink.cyan
            },
            {
              label: "Outstanding",
              value: data.outstanding,
              accent: ink.amber
            }
          ].map((row) => (
            <BlueprintCard key={row.label}>
              <div className="px-4 py-4">
                <p
                  className={`${mono} text-[10px] uppercase tracking-[0.2em]`}
                  style={{ color: ink.chalkFaint }}
                >
                  {row.label}
                </p>
                <p
                  className={`${mono} mt-1.5 text-xl font-semibold`}
                  style={{ color: row.accent }}
                >
                  {usd(row.value)}
                </p>
              </div>
            </BlueprintCard>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Revenue plot */}
          <BlueprintCard>
            <div
              className="flex items-center justify-between border-b px-4 py-2.5"
              style={{ borderColor: ink.lineSoft }}
            >
              <DraftingMark label="Plot — order totals" />
              <span
                className={`${mono} text-[10px] uppercase tracking-[0.18em]`}
                style={{ color: ink.chalkFaint }}
              >
                Last {chartSeries.length} builds
              </span>
            </div>
            <div className="px-4 py-5">
              <div className="flex h-52 items-end gap-1.5">
                {chartSeries.map((value, index) => (
                  <div
                    key={index}
                    className="group relative flex-1"
                    style={{
                      height: `${Math.max(3, (value / maxSeries) * 100)}%`
                    }}
                  >
                    <div
                      className="h-full w-full rounded-t-sm transition group-hover:opacity-80"
                      style={{
                        backgroundColor: ink.cyanDeep,
                        borderTop: `2px solid ${ink.cyan}`
                      }}
                    />
                    <span
                      className={`${mono} absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm px-1 py-0.5 text-[9px] opacity-0 transition group-hover:opacity-100`}
                      style={{
                        backgroundColor: ink.groundDeep,
                        color: ink.cyan
                      }}
                    >
                      {usd(value, false)}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="mt-2 border-t pt-2"
                style={{ borderColor: ink.lineSoft }}
              >
                <p
                  className={`${mono} text-[10px] uppercase tracking-[0.14em]`}
                  style={{ color: ink.chalkFaint }}
                >
                  X — issue order · Y — BOM value · peak {usd(maxSeries, false)}
                </p>
              </div>
            </div>
          </BlueprintCard>

          {/* Payment mix + aging */}
          <div className="space-y-6">
            <BlueprintCard>
              <div
                className="border-b px-4 py-2.5"
                style={{ borderColor: ink.lineSoft }}
              >
                <DraftingMark label="Margin mix — by payment" />
              </div>
              <div className="space-y-3 px-4 py-4">
                {data.paymentBreakdown.length ? (
                  data.paymentBreakdown.map((bucket) => (
                    <div key={bucket.status}>
                      <div
                        className={`${mono} flex justify-between text-[12px]`}
                      >
                        <span style={{ color: ink.chalkDim }}>
                          {titleCase(bucket.status)}{" "}
                          <span style={{ color: ink.chalkFaint }}>
                            ({bucket.count})
                          </span>
                        </span>
                        <span style={{ color: ink.cyan }}>
                          {usd(bucket.total, false)}
                        </span>
                      </div>
                      <div
                        className="mt-1 h-2 rounded-sm"
                        style={{ backgroundColor: ink.lineSoft }}
                      >
                        <div
                          className="h-full rounded-sm"
                          style={{
                            width: `${(bucket.total / maxPayment) * 100}%`,
                            backgroundColor: ink.cyan
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p
                    className={`${mono} text-[12px]`}
                    style={{ color: ink.chalkFaint }}
                  >
                    No payment data in range.
                  </p>
                )}
              </div>
            </BlueprintCard>

            <BlueprintCard>
              <div
                className="border-b px-4 py-2.5"
                style={{ borderColor: ink.lineSoft }}
              >
                <DraftingMark label="Receivables — by age" />
              </div>
              <div className="space-y-3 px-4 py-4">
                {data.aging.map((bucket) => (
                  <div key={bucket.bucket}>
                    <div className={`${mono} flex justify-between text-[12px]`}>
                      <span style={{ color: ink.chalkDim }}>
                        {bucket.bucket} days
                      </span>
                      <span style={{ color: ink.amber }}>
                        {usd(bucket.total, false)}
                      </span>
                    </div>
                    <div
                      className="mt-1 h-2 rounded-sm"
                      style={{ backgroundColor: ink.lineSoft }}
                    >
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width: `${(bucket.total / maxAging) * 100}%`,
                          backgroundColor: ink.amber
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </BlueprintCard>
          </div>
        </div>

        {/* Recent build ledger */}
        <BlueprintCard className="mt-6 overflow-hidden">
          <div
            className="flex items-center justify-between border-b px-4 py-2.5"
            style={{ borderColor: ink.lineSoft }}
          >
            <DraftingMark label="Ledger — recent builds" />
            <Link
              href="/design-lab/d8/orders"
              className={`${mono} text-[10px] uppercase tracking-[0.16em]`}
              style={{ color: ink.cyan }}
            >
              Full build log →
            </Link>
          </div>
          {data.recentOrders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr
                    className="border-b text-left"
                    style={{ borderColor: ink.lineSoft }}
                  >
                    {["Doc", "Customer", "Value", "Payment", "Gross margin"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className={`${mono} px-4 py-2.5 text-[10px] uppercase tracking-[0.16em]`}
                          style={{ color: ink.chalkFaint }}
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b last:border-0"
                      style={{ borderColor: ink.lineSoft }}
                    >
                      <td
                        className={`${mono} px-4 py-3 text-sm font-semibold`}
                        style={{ color: ink.chalk }}
                      >
                        {order.orderNumber}
                      </td>
                      <td
                        className="px-4 py-3 text-sm"
                        style={{ color: ink.chalkDim }}
                      >
                        {order.customerName}
                      </td>
                      <td
                        className={`${mono} px-4 py-3 text-sm font-semibold`}
                        style={{ color: ink.cyan }}
                      >
                        {usd(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`${mono} text-[11px] uppercase tracking-[0.12em]`}
                          style={{ color: ink.chalkDim }}
                        >
                          {titleCase(order.paymentStatus)}
                        </span>
                      </td>
                      <td
                        className={`${mono} px-4 py-3 text-sm`}
                        style={{
                          color:
                            order.margin === null ? ink.chalkFaint : ink.amber
                        }}
                      >
                        {order.margin === null
                          ? "— no cost"
                          : usd(order.margin)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              <p
                className={`${mono} text-[12px] uppercase tracking-[0.18em]`}
                style={{ color: ink.chalkFaint }}
              >
                No builds logged in range.
              </p>
            </div>
          )}
        </BlueprintCard>

        <p
          className={`${mono} mt-4 text-[10px] leading-relaxed`}
          style={{ color: ink.chalkFaint }}
        >
          {data.hasCostData
            ? `Gross profit across recent builds: ${usd(data.grossProfit)} — project kits raise AOV and let margin mix be steered per build stage.`
            : "Gross margin is hidden until unit costs are entered in the catalog manager."}
        </p>
      </div>
    </D8Shell>
  );
}
