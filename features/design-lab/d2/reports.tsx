"use client";

/* DESIGN 2 — "MONO" — Admin reports. Receives a serializable ReportData prop;
   "use client" avoids a server/client function-boundary error. */

import {
  Label,
  MONO,
  MonoPage,
  Pill,
  Section,
  Stat,
  formatUsd
} from "./kit";
import type { ReportData } from "@/features/admin/reports/reports-dashboard";

function titleCase(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function formatDate(value: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function D2Reports({ data }: { data: ReportData }) {
  const collectedPct =
    data.billed > 0
      ? Math.min(100, Math.round((data.collected / data.billed) * 100))
      : 0;
  const maxAging = Math.max(1, ...data.aging.map((bucket) => bucket.total));
  const paymentTotal = data.paymentBreakdown.reduce(
    (sum, row) => sum + row.total,
    0
  );

  return (
    <MonoPage active="Reports">
      <Section
        className="pt-12 pb-8"
        style={{ borderBottom: `1px solid ${MONO.lineStrong}` }}
      >
        <Label index="FIN">Operations</Label>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[44px] font-semibold leading-[0.98] tracking-[-0.035em] sm:text-[56px]">
            Financial reports
          </h1>
          <p
            className="max-w-xs text-[13px] leading-relaxed"
            style={{ color: MONO.steel }}
          >
            Revenue, order value, receivables, and gross margin across the
            last 30 days.
          </p>
        </div>
      </Section>

      {!data.configured ? (
        <Section className="pt-8">
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{ border: `1px solid ${MONO.lineStrong}` }}
          >
            <Pill filled>Offline</Pill>
            <p className="text-[12px]" style={{ color: MONO.steel }}>
              Supabase is not configured — live financial data is unavailable.
              Add the Supabase keys to{" "}
              <code style={{ fontFamily: "ui-monospace, monospace" }}>
                .env.local
              </code>{" "}
              to populate this report.
            </p>
          </div>
        </Section>
      ) : null}

      {/* KPIs */}
      <Section
        className="py-0"
        style={{ borderBottom: `1px solid ${MONO.line}` }}
      >
        <div
          className="grid grid-cols-2 lg:grid-cols-4"
          style={{
            borderLeft: `1px solid ${MONO.line}`,
            borderRight: `1px solid ${MONO.line}`
          }}
        >
          {[
            {
              label: "Revenue / 30d",
              value: formatUsd(data.revenue30),
              note: "Last 30 days"
            },
            {
              label: "Orders / 30d",
              value: String(data.orders30),
              note: "Placed"
            },
            {
              label: "Avg order value",
              value: formatUsd(data.avgOrderValue),
              note: "Per order"
            },
            {
              label: "Gross margin",
              value: data.hasCostData
                ? `${data.grossMarginPct.toFixed(1)}%`
                : "No cost data",
              note: data.hasCostData
                ? `${formatUsd(data.grossProfit)} profit`
                : "Add unit costs"
            }
          ].map((kpi, index) => (
            <div
              key={kpi.label}
              style={{
                borderLeft:
                  index === 0 ? undefined : `1px solid ${MONO.line}`
              }}
            >
              <Stat label={kpi.label} note={kpi.note} value={kpi.value} />
            </div>
          ))}
        </div>
      </Section>

      <Section className="pt-12 pb-12">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Accounts receivable */}
          <div className="lg:col-span-7">
            <div
              className="flex items-end justify-between pb-4"
              style={{ borderBottom: `1px solid ${MONO.lineStrong}` }}
            >
              <h2 className="text-[22px] font-semibold tracking-[-0.025em]">
                Accounts receivable
              </h2>
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.16em] tabular-nums"
                style={{ color: MONO.muted }}
              >
                {collectedPct}% collected
              </span>
            </div>
            <div
              className="mt-px grid grid-cols-3"
              style={{ borderLeft: `1px solid ${MONO.line}` }}
            >
              {[
                ["Billed", data.billed],
                ["Collected", data.collected],
                ["Outstanding", data.outstanding]
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="px-4 py-5"
                  style={{
                    borderRight: `1px solid ${MONO.line}`,
                    borderBottom: `1px solid ${MONO.line}`
                  }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: MONO.muted }}
                  >
                    {label}
                  </p>
                  <p className="mt-2 text-[22px] font-semibold leading-none tracking-[-0.025em] tabular-nums">
                    {formatUsd(value as number)}
                  </p>
                </div>
              ))}
            </div>

            {/* Collected meter */}
            <div
              className="mt-5 h-[6px]"
              style={{ border: `1px solid ${MONO.lineStrong}` }}
            >
              <div
                className="h-full"
                style={{
                  width: `${collectedPct}%`,
                  background: MONO.ink
                }}
              />
            </div>

            {/* Aging */}
            <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.22em]">
              Outstanding by age
            </p>
            <ul
              className="mt-3"
              style={{ borderTop: `1px solid ${MONO.line}` }}
            >
              {data.aging.map((bucket) => (
                <li
                  key={bucket.bucket}
                  className="flex items-center gap-4 py-3"
                  style={{ borderBottom: `1px solid ${MONO.line}` }}
                >
                  <span className="w-24 text-[12px] tabular-nums">
                    {bucket.bucket} days
                  </span>
                  <div
                    className="h-2 flex-1"
                    style={{ background: MONO.shell }}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${(bucket.total / maxAging) * 100}%`,
                        background: MONO.ink
                      }}
                    />
                  </div>
                  <span className="w-24 text-right text-[12px] font-semibold tabular-nums">
                    {formatUsd(bucket.total)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment status */}
          <div className="lg:col-span-5">
            <div
              className="pb-4"
              style={{ borderBottom: `1px solid ${MONO.lineStrong}` }}
            >
              <h2 className="text-[22px] font-semibold tracking-[-0.025em]">
                Payment status
              </h2>
            </div>
            {data.paymentBreakdown.length ? (
              <>
                {/* Monochrome stacked bar — shades distinguish segments */}
                <div
                  className="mt-5 flex h-3 overflow-hidden"
                  style={{ border: `1px solid ${MONO.lineStrong}` }}
                >
                  {data.paymentBreakdown.map((row, index) => {
                    const shade = ["#0a0a0a", "#5a5a58", "#9a9a98", "#cfcfcd"][
                      index % 4
                    ];
                    return (
                      <div
                        key={row.status}
                        style={{
                          width: `${
                            paymentTotal > 0
                              ? (row.total / paymentTotal) * 100
                              : 0
                          }%`,
                          background: shade
                        }}
                      />
                    );
                  })}
                </div>
                <ul
                  className="mt-5"
                  style={{ borderTop: `1px solid ${MONO.line}` }}
                >
                  {data.paymentBreakdown.map((row, index) => {
                    const shade = ["#0a0a0a", "#5a5a58", "#9a9a98", "#cfcfcd"][
                      index % 4
                    ];
                    return (
                      <li
                        key={row.status}
                        className="flex items-center gap-3 py-3"
                        style={{ borderBottom: `1px solid ${MONO.line}` }}
                      >
                        <span
                          className="h-2.5 w-2.5"
                          style={{ background: shade }}
                        />
                        <span className="flex-1 text-[12px]">
                          {titleCase(row.status)}
                          <span style={{ color: MONO.muted }}>
                            {" "}
                            · {row.count}{" "}
                            {row.count === 1 ? "order" : "orders"}
                          </span>
                        </span>
                        <span className="text-[12px] font-semibold tabular-nums">
                          {formatUsd(row.total)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p
                className="mt-5 text-[12px]"
                style={{ color: MONO.muted }}
              >
                No orders in range.
              </p>
            )}

            <div
              className="mt-8 p-4"
              style={{ border: `1px solid ${MONO.lineStrong}` }}
            >
              <p className="text-[12px] font-semibold tracking-[-0.01em]">
                {data.hasCostData ? "Gross profit" : "Cost data"}
              </p>
              <p
                className="mt-1.5 text-[12px] leading-relaxed"
                style={{ color: MONO.steel }}
              >
                {data.hasCostData
                  ? `Gross profit across recent orders is ${formatUsd(
                      data.grossProfit
                    )} at a ${data.grossMarginPct.toFixed(1)}% margin.`
                  : "Gross margin is hidden until product unit costs are entered in the catalogue manager."}
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Recent orders */}
      <Section className="pb-16">
        <div
          className="flex items-end justify-between pb-4"
          style={{ borderBottom: `1px solid ${MONO.lineStrong}` }}
        >
          <h2 className="text-[22px] font-semibold tracking-[-0.025em]">
            Recent orders
          </h2>
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: MONO.muted }}
          >
            {data.recentOrders.length} shown
          </span>
        </div>
        {data.recentOrders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr
                  className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{
                    color: MONO.muted,
                    borderBottom: `1px solid ${MONO.line}`
                  }}
                >
                  <th className="py-2.5 pr-4">Order</th>
                  <th className="py-2.5 pr-4">Date</th>
                  <th className="py-2.5 pr-4">Customer</th>
                  <th className="py-2.5 pr-4 text-right">Total</th>
                  <th className="py-2.5 pr-4 text-right">Gross margin</th>
                  <th className="py-2.5">Payment</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-[#fafafa]"
                    style={{ borderBottom: `1px solid ${MONO.line}` }}
                  >
                    <td className="py-3.5 pr-4 text-[13px] font-semibold tabular-nums">
                      {order.orderNumber}
                    </td>
                    <td
                      className="py-3.5 pr-4 text-[12px]"
                      style={{ color: MONO.steel }}
                    >
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3.5 pr-4 text-[13px] font-medium tracking-[-0.01em]">
                      {order.customerName}
                    </td>
                    <td className="py-3.5 pr-4 text-right text-[13px] font-semibold tabular-nums">
                      {formatUsd(order.total)}
                    </td>
                    <td
                      className="py-3.5 pr-4 text-right text-[13px] tabular-nums"
                      style={{ color: MONO.steel }}
                    >
                      {order.margin === null
                        ? "—"
                        : formatUsd(order.margin)}
                    </td>
                    <td className="py-3.5">
                      <Pill filled={order.paymentStatus === "paid"}>
                        {titleCase(order.paymentStatus)}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className="mt-5 grid place-items-center py-16 text-center"
            style={{ border: `1px solid ${MONO.line}` }}
          >
            <div>
              <p className="text-[15px] font-semibold tracking-[-0.01em]">
                No orders yet
              </p>
              <p
                className="mt-1 text-[12px]"
                style={{ color: MONO.steel }}
              >
                {data.configured
                  ? "Orders will appear here once they are placed."
                  : "Connect Supabase to load recent orders."}
              </p>
            </div>
          </div>
        )}
      </Section>
    </MonoPage>
  );
}
