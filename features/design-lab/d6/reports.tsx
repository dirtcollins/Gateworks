"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import {
  D6DesignBadge,
  D6Page,
  Eyebrow,
  Mono,
  Panel,
  apex,
  formatUsd
} from "./kit";
import type { ReportData } from "@/features/admin/reports/reports-dashboard";

/* DESIGN 6 — "APEX" — Admin reports. Real Supabase report data. */

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

const PAYMENT_COLOR: Record<string, string> = {
  paid: "#3ecf8e",
  partial: "#e0b341",
  unpaid: "#ff7a7a",
  pending: "#5b9dff",
  refunded: "#7a7d8c"
};

function paymentColor(status: string): string {
  return PAYMENT_COLOR[status.toLowerCase()] ?? apex.accent;
}

export function D6Reports({ data }: { data: ReportData }) {
  const headline = [
    {
      k: "Revenue",
      v: formatUsd(data.revenue30),
      n: "Trailing 30 days",
      primary: true
    },
    { k: "Orders", v: String(data.orders30), n: "Trailing 30 days" },
    {
      k: "Avg. order value",
      v: formatUsd(data.avgOrderValue),
      n: "All channels"
    },
    {
      k: "Gross margin",
      v: data.hasCostData
        ? `${data.grossMarginPct.toFixed(1)}%`
        : "No cost data",
      n: data.hasCostData ? "From entered costs" : "Add product costs"
    }
  ];

  const collectedShare =
    data.billed > 0 ? (data.collected / data.billed) * 100 : 0;
  const paymentPeak = Math.max(
    1,
    ...data.paymentBreakdown.map((row) => row.total)
  );
  const agingPeak = Math.max(1, ...data.aging.map((bucket) => bucket.total));

  return (
    <D6Page wide>
      <div className="pt-6">
        <D6DesignBadge />
      </div>

      <header
        className="border-y py-12"
        style={{ borderColor: apex.line }}
      >
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>Operations · Financial Telemetry</Eyebrow>
            <h1
              className="mt-5 text-[2.8rem] font-medium leading-[1.02] tracking-[-0.04em] sm:text-[4rem]"
              style={{ color: apex.text }}
            >
              Reports Console
            </h1>
            <p
              className="mt-4 max-w-md text-[14px] leading-relaxed"
              style={{ color: apex.mute }}
            >
              Revenue, receivables and margin across recent orders — read
              live off the operations ledger.
            </p>
          </div>
          <Link
            className="flex items-center gap-2 rounded-full border px-5 py-2.5 transition-colors hover:bg-white/5"
            href="/design-lab/d6/orders"
            style={{ borderColor: apex.line, color: apex.text }}
          >
            <Mono style={{ color: apex.text }}>Order console</Mono>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {!data.configured ? (
        <Panel
          className="mt-8 p-7"
          style={{ borderColor: "rgba(224,179,65,0.4)" }}
        >
          <Mono style={{ color: "#e0b341" }}>Telemetry offline</Mono>
          <h2
            className="mt-3 text-[1.4rem] font-medium tracking-[-0.02em]"
            style={{ color: apex.text }}
          >
            Supabase is not configured
          </h2>
          <p
            className="mt-2 max-w-xl text-[14px] leading-relaxed"
            style={{ color: apex.mute }}
          >
            Live financial data is unavailable. Add the Supabase keys to{" "}
            <code
              className="rounded px-1.5 py-0.5"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: apex.text
              }}
            >
              .env.local
            </code>{" "}
            to populate this console.
          </p>
        </Panel>
      ) : null}

      {/* Headline metrics */}
      <section className="grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {headline.map((metric) => (
          <Panel
            key={metric.k}
            className="p-6"
            glow={metric.primary}
            style={
              metric.primary
                ? { borderColor: "rgba(91,157,255,0.35)" }
                : undefined
            }
          >
            <Mono style={{ color: apex.faint }}>{metric.k}</Mono>
            <p
              className="mt-5 text-[2.4rem] font-medium leading-none tracking-[-0.04em]"
              style={{
                color: metric.primary ? apex.accent : apex.text,
                textShadow: metric.primary
                  ? `0 0 32px ${apex.accentGlow}`
                  : "none"
              }}
            >
              {metric.v}
            </p>
            <p className="mt-3">
              <Mono style={{ color: apex.faint }}>{metric.n}</Mono>
            </p>
          </Panel>
        ))}
      </section>

      {/* Receivables + payment mix */}
      <section className="grid gap-4 pb-10 lg:grid-cols-[1.5fr_1fr]">
        {/* Accounts receivable */}
        <Panel className="p-7 sm:p-9">
          <div className="flex items-end justify-between">
            <div>
              <Eyebrow>Accounts receivable</Eyebrow>
              <h2
                className="mt-4 text-[1.7rem] font-medium tracking-[-0.03em]"
                style={{ color: apex.text }}
              >
                Billed vs. collected
              </h2>
            </div>
            <span
              className="rounded-full border px-3 py-1.5"
              style={{ borderColor: apex.line }}
            >
              <Mono style={{ color: apex.accent }}>
                {collectedShare.toFixed(0)}% collected
              </Mono>
            </span>
          </div>

          <dl className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              ["Total billed", data.billed, apex.text],
              ["Collected", data.collected, "#3ecf8e"],
              ["Outstanding", data.outstanding, "#ff7a7a"]
            ].map(([label, value, color]) => (
              <div key={label as string}>
                <Mono style={{ color: apex.faint }}>{label as string}</Mono>
                <p
                  className="mt-2 text-[1.7rem] font-medium tracking-[-0.03em]"
                  style={{ color: color as string }}
                >
                  {formatUsd(value as number)}
                </p>
              </div>
            ))}
          </dl>

          {/* Collected share bar */}
          <div className="mt-7">
            <div
              className="h-2.5 w-full overflow-hidden rounded-full"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, collectedShare)}%`,
                  background: `linear-gradient(90deg, ${apex.accent}, #3ecf8e)`,
                  boxShadow: `0 0 14px ${apex.accentGlow}`
                }}
              />
            </div>
          </div>

          {/* Aging buckets */}
          <div
            className="mt-9 border-t pt-7"
            style={{ borderColor: apex.line }}
          >
            <Mono style={{ color: apex.faint }}>Outstanding by age</Mono>
            <div
              className="mt-6 flex items-end gap-4"
              style={{ height: 168 }}
            >
              {data.aging.length ? (
                data.aging.map((bucket) => (
                  <div
                    key={bucket.bucket}
                    className="flex flex-1 flex-col items-center gap-3"
                  >
                    <span
                      className="text-[13px] font-medium"
                      style={{ color: apex.text }}
                    >
                      {formatUsd(bucket.total)}
                    </span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${Math.max(3, (bucket.total / agingPeak) * 100)}%`,
                          background: `linear-gradient(180deg, ${apex.accent}, rgba(91,157,255,0.15))`,
                          boxShadow: `0 -4px 24px -8px ${apex.accentGlow}`
                        }}
                      />
                    </div>
                    <Mono style={{ color: apex.faint }}>
                      {bucket.bucket} days
                    </Mono>
                  </div>
                ))
              ) : (
                <p className="w-full text-center">
                  <Mono style={{ color: apex.mute }}>
                    No outstanding balances
                  </Mono>
                </p>
              )}
            </div>
          </div>
        </Panel>

        {/* Payment mix */}
        <Panel className="p-7">
          <Eyebrow>Payment status</Eyebrow>
          <h2
            className="mt-4 text-[1.7rem] font-medium tracking-[-0.03em]"
            style={{ color: apex.text }}
          >
            Order ledger mix
          </h2>
          {data.paymentBreakdown.length ? (
            <ul className="mt-7 space-y-5">
              {data.paymentBreakdown.map((row) => {
                const color = paymentColor(row.status);
                return (
                  <li key={row.status}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            background: color,
                            boxShadow: `0 0 8px ${color}`
                          }}
                        />
                        <span
                          className="text-[13px] font-medium"
                          style={{ color: apex.text }}
                        >
                          {titleCase(row.status)}
                        </span>
                        <Mono style={{ color: apex.faint }}>
                          {row.count} {row.count === 1 ? "order" : "orders"}
                        </Mono>
                      </span>
                      <span
                        className="text-[14px] font-medium"
                        style={{ color: apex.text }}
                      >
                        {formatUsd(row.total)}
                      </span>
                    </div>
                    <div
                      className="mt-2 h-2 w-full overflow-hidden rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(row.total / paymentPeak) * 100}%`,
                          background: color
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-7">
              <Mono style={{ color: apex.mute }}>No orders in range</Mono>
            </p>
          )}

          <div
            className="mt-8 flex items-start gap-3 border-t pt-6"
            style={{ borderColor: apex.line }}
          >
            <TrendingUp
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: apex.accent }}
            />
            <p
              className="text-[13px] leading-relaxed"
              style={{ color: apex.mute }}
            >
              {data.hasCostData ? (
                <>
                  Gross profit across recent orders:{" "}
                  <span style={{ color: apex.text }}>
                    {formatUsd(data.grossProfit)}
                  </span>
                  .
                </>
              ) : (
                <>
                  Gross margin stays hidden until product costs are entered in
                  the catalog manager.
                </>
              )}
            </p>
          </div>
        </Panel>
      </section>

      {/* Recent orders */}
      <section className="pb-4">
        <Panel className="overflow-hidden">
          <div
            className="flex items-end justify-between border-b px-7 py-6"
            style={{ borderColor: apex.line }}
          >
            <div>
              <Eyebrow>Recent orders</Eyebrow>
              <h2
                className="mt-3 text-[1.5rem] font-medium tracking-[-0.03em]"
                style={{ color: apex.text }}
              >
                Latest activity
              </h2>
            </div>
            <Link
              className="hidden items-center gap-2 transition-colors hover:opacity-80 sm:flex"
              href="/design-lab/d6/orders"
              style={{ color: apex.accent }}
            >
              <Mono style={{ color: apex.accent }}>Open orders desk</Mono>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {data.recentOrders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${apex.line}` }}>
                    {["Order", "Date", "Customer", "Total", "Payment", "Margin"].map(
                      (head) => (
                        <th
                          key={head}
                          className={`px-7 py-4 ${
                            head === "Total" || head === "Margin"
                              ? "text-right"
                              : ""
                          }`}
                        >
                          <Mono style={{ color: apex.faint }}>{head}</Mono>
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => {
                    const color = paymentColor(order.paymentStatus);
                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-white/[0.025]"
                        style={{
                          borderBottom: `1px solid ${apex.lineSoft}`
                        }}
                      >
                        <td
                          className="px-7 py-4 text-[13px] font-medium"
                          style={{ color: apex.text }}
                        >
                          {order.orderNumber}
                        </td>
                        <td
                          className="px-7 py-4 text-[13px]"
                          style={{ color: apex.mute }}
                        >
                          {formatDate(order.createdAt)}
                        </td>
                        <td
                          className="px-7 py-4 text-[13px]"
                          style={{ color: apex.text }}
                        >
                          {order.customerName}
                        </td>
                        <td
                          className="px-7 py-4 text-right text-[13px] font-medium"
                          style={{ color: apex.text }}
                        >
                          {formatUsd(order.total)}
                        </td>
                        <td className="px-7 py-4">
                          <span
                            className="inline-flex items-center gap-2 rounded-full px-3 py-1"
                            style={{
                              background: `${color}1a`,
                              border: `1px solid ${color}40`
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: color }}
                            />
                            <Mono style={{ color }}>
                              {titleCase(order.paymentStatus)}
                            </Mono>
                          </span>
                        </td>
                        <td
                          className="px-7 py-4 text-right text-[13px] font-medium"
                          style={{ color: apex.text }}
                        >
                          {order.margin === null
                            ? "—"
                            : formatUsd(order.margin)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-7 py-16 text-center">
              <Mono style={{ color: apex.mute }}>
                Orders will appear here once they are placed
              </Mono>
            </p>
          )}
        </Panel>
      </section>
    </D6Page>
  );
}
