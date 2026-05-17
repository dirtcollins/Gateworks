"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReportData } from "@/features/admin/reports/reports-dashboard";
import { formatCurrency } from "@/lib/utils";
import { D9DesignBadge, D9Page, Display, Eyebrow, d9, serif } from "./kit";

/* DESIGN 9 — "Showroom" — Financial reports. Real Supabase report data. */

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

export function D9Reports({ data }: { data: ReportData }) {
  const headline = [
    { k: "Revenue", v: formatCurrency(data.revenue30), n: "Trailing 30 days" },
    { k: "Orders", v: String(data.orders30), n: "Trailing 30 days" },
    { k: "Average order", v: formatCurrency(data.avgOrderValue), n: "Across the order book" },
    {
      k: "Gross margin",
      v: data.hasCostData ? `${data.grossMarginPct.toFixed(1)}%` : "No cost data",
      n: data.hasCostData ? "Premium positioning protects margin" : "Add product costs"
    }
  ];

  const collectedShare = data.billed > 0 ? (data.collected / data.billed) * 100 : 0;
  const paymentPeak = Math.max(1, ...data.paymentBreakdown.map((row) => row.total));
  const agingPeak = Math.max(1, ...data.aging.map((bucket) => bucket.total));

  return (
    <D9Page>
      <D9DesignBadge />

      {/* Masthead */}
      <section className="mx-auto max-w-[1240px] px-6 pb-10 pt-16 sm:px-8 sm:pt-20">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>The Atelier · Financial Review</Eyebrow>
            <h1
              className="mt-6 text-[2.8rem] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[3.8rem]"
              style={{ ...serif, color: d9.ink }}
            >
              The house ledger
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed" style={{ color: d9.graphite }}>
              How the collection is performing — revenue, receivables, and
              the margin that premium positioning is designed to protect.
            </p>
          </div>
          <span
            className="px-5 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em]"
            style={{ background: d9.ink, color: d9.bone }}
          >
            Trailing 30 days
          </span>
        </div>

        {!data.configured ? (
          <div
            className="mt-8 px-7 py-7"
            style={{ background: d9.card, border: `1px solid ${d9.bronze}` }}
          >
            <span
              className="text-[0.6rem] font-semibold uppercase tracking-[0.28em]"
              style={{ color: d9.bronze }}
            >
              House note
            </span>
            <Display className="mt-2 text-2xl">This ledger is awaiting figures.</Display>
            <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: d9.graphite }}>
              Supabase is not configured, so live financial data is
              unavailable. Add the Supabase keys to <code>.env.local</code> to
              populate this report.
            </p>
          </div>
        ) : null}

        {/* Headline figures */}
        <div
          className="mt-9 grid grid-cols-2 gap-px lg:grid-cols-4"
          style={{ background: d9.rule, border: `1px solid ${d9.rule}` }}
        >
          {headline.map((figure) => (
            <div key={figure.k} className="px-7 py-8" style={{ background: d9.card }}>
              <p
                className="text-[0.58rem] font-semibold uppercase tracking-[0.2em]"
                style={{ color: d9.haze }}
              >
                {figure.k}
              </p>
              <p className="mt-2.5 text-4xl" style={{ ...serif, color: d9.ink }}>
                {figure.v}
              </p>
              <p className="mt-2 text-[0.72rem]" style={{ color: d9.bronze }}>
                {figure.n}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Receivables + payment mix */}
      <section className="mx-auto max-w-[1240px] px-6 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Accounts receivable */}
          <div
            className="px-8 py-9"
            style={{ background: d9.card, border: `1px solid ${d9.rule}` }}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <Eyebrow>Figure I</Eyebrow>
                <Display className="mt-3 text-2xl">Accounts receivable</Display>
              </div>
              <span
                className="text-[0.62rem] font-semibold uppercase tracking-[0.14em]"
                style={{ color: d9.haze }}
              >
                Billed vs. collected
              </span>
            </div>

            <dl className="mt-8 grid gap-5 sm:grid-cols-3">
              {[
                ["Total billed", data.billed, d9.ink],
                ["Collected", data.collected, d9.ink],
                ["Outstanding", data.outstanding, "#b42318"]
              ].map(([label, value, color]) => (
                <div key={label as string}>
                  <p
                    className="text-[0.58rem] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: d9.haze }}
                  >
                    {label}
                  </p>
                  <p
                    className="mt-1.5 text-3xl"
                    style={{ ...serif, color: color as string }}
                  >
                    {formatCurrency(value as number)}
                  </p>
                </div>
              ))}
            </dl>

            <div className="mt-8">
              <div
                className="flex items-center justify-between text-[0.62rem] font-semibold uppercase tracking-[0.14em]"
                style={{ color: d9.haze }}
              >
                <span>Collected share</span>
                <span>{collectedShare.toFixed(0)}%</span>
              </div>
              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-full"
                style={{ background: d9.rule }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, collectedShare)}%`,
                    background: `linear-gradient(90deg, ${d9.bronzeLite}, ${d9.bronze})`
                  }}
                />
              </div>
            </div>

            {/* Aging columns */}
            <div className="mt-9">
              <p
                className="text-[0.58rem] font-semibold uppercase tracking-[0.16em]"
                style={{ color: d9.haze }}
              >
                Outstanding by age
              </p>
              <div className="mt-5 flex items-end gap-4" style={{ height: 160 }}>
                {data.aging.length ? (
                  data.aging.map((bucket) => (
                    <div
                      key={bucket.bucket}
                      className="flex flex-1 flex-col items-center gap-3"
                    >
                      <span className="text-sm" style={{ ...serif, color: d9.ink }}>
                        {formatCurrency(bucket.total)}
                      </span>
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full"
                          style={{
                            height: `${Math.max(3, (bucket.total / agingPeak) * 100)}%`,
                            background: d9.ink
                          }}
                        />
                      </div>
                      <span
                        className="text-[0.6rem] font-semibold uppercase tracking-[0.1em]"
                        style={{ color: d9.haze }}
                      >
                        {bucket.bucket} days
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm" style={{ color: d9.haze }}>
                    No outstanding balances.
                  </p>
                )}
              </div>
            </div>

            <p
              className="mt-8 pt-6 text-sm leading-relaxed"
              style={{ borderTop: `1px solid ${d9.rule}`, color: d9.graphite }}
            >
              <span style={{ ...serif, color: d9.ink }}>
                {formatCurrency(data.outstanding)} outstanding
              </span>{" "}
              across {data.recentOrders.length} recent orders — premium pricing
              lifts order value, so disciplined collection protects working
              capital.
            </p>
          </div>

          {/* Payment mix */}
          <div
            className="px-8 py-9"
            style={{ background: d9.card, border: `1px solid ${d9.rule}` }}
          >
            <Eyebrow>Figure II</Eyebrow>
            <Display className="mt-3 text-2xl">Payment status</Display>
            {data.paymentBreakdown.length ? (
              <ul className="mt-7 space-y-5">
                {data.paymentBreakdown.map((row) => (
                  <li key={row.status}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2.5">
                        <span className="text-sm" style={{ ...serif, color: d9.ink }}>
                          {titleCase(row.status)}
                        </span>
                        <span className="text-[0.66rem]" style={{ color: d9.haze }}>
                          {row.count} {row.count === 1 ? "order" : "orders"}
                        </span>
                      </span>
                      <span className="text-base" style={{ ...serif, color: d9.ink }}>
                        {formatCurrency(row.total)}
                      </span>
                    </div>
                    <div
                      className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                      style={{ background: d9.rule }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(row.total / paymentPeak) * 100}%`,
                          background: d9.bronze
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-7 text-sm" style={{ color: d9.haze }}>
                No orders in range.
              </p>
            )}

            <p
              className="mt-8 pt-6 text-[0.8rem] leading-relaxed"
              style={{ borderTop: `1px solid ${d9.rule}`, color: d9.graphite }}
            >
              {data.hasCostData ? (
                <>
                  Gross profit across recent orders:{" "}
                  <span style={{ ...serif, color: d9.ink }}>
                    {formatCurrency(data.grossProfit)}
                  </span>
                  . Premium positioning is the margin engine — an aspirational
                  presentation justifies price and protects this figure.
                </>
              ) : (
                <>
                  Gross margin stays hidden until product costs are entered in
                  the catalog manager. Margin discipline is what premium
                  positioning is meant to protect.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Recent orders */}
      <section className="mx-auto max-w-[1240px] px-6 pt-8 sm:px-8">
        <div
          className="px-8 py-9"
          style={{ background: d9.card, border: `1px solid ${d9.rule}` }}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Figure III</Eyebrow>
              <Display className="mt-3 text-2xl">Recent orders</Display>
            </div>
            <Link
              className="text-[0.66rem] font-semibold uppercase tracking-[0.16em]"
              href="/design-lab/d9/orders"
              style={{ color: d9.bronze }}
            >
              Open the orders desk
            </Link>
          </div>

          {data.recentOrders.length ? (
            <ul className="mt-7">
              {data.recentOrders.map((order, index) => (
                <li
                  key={order.id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-5 py-5 sm:grid-cols-[auto_1fr_auto_auto_auto]"
                  style={{ borderTop: `1px solid ${d9.rule}` }}
                >
                  <span className="text-2xl" style={{ ...serif, color: d9.bronze }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-lg" style={{ ...serif, color: d9.ink }}>
                      {order.customerName || "Walk-in client"}
                    </span>
                    <span
                      className="text-[0.62rem] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: d9.haze }}
                    >
                      {order.orderNumber} · {formatDate(order.createdAt)}
                    </span>
                  </span>
                  <span
                    className="hidden text-right text-sm sm:block"
                    style={{ color: d9.graphite }}
                  >
                    {titleCase(order.paymentStatus)}
                  </span>
                  <span
                    className="hidden text-right text-sm sm:block"
                    style={{ color: d9.graphite }}
                  >
                    {order.margin === null ? "—" : formatCurrency(order.margin)}
                  </span>
                  <span className="text-right text-xl" style={{ ...serif, color: d9.ink }}>
                    {formatCurrency(order.total)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-7 text-sm" style={{ color: d9.haze }}>
              Orders will appear here once they are placed.
            </p>
          )}
        </div>
      </section>

      {/* Closing note */}
      <section className="mx-auto max-w-[1240px] px-6 pt-8 sm:px-8">
        <div
          className="grid items-center gap-8 px-10 py-14 sm:px-16 md:grid-cols-[1.4fr_1fr]"
          style={{ background: d9.ink, color: d9.bone }}
        >
          <div>
            <span
              className="text-[0.62rem] font-semibold uppercase tracking-[0.3em]"
              style={{ color: d9.bronzeLite }}
            >
              The house view
            </span>
            <h2
              className="mt-4 text-[2rem] leading-tight"
              style={{ ...serif, color: d9.bone }}
            >
              {data.outstanding > 0
                ? "Receivables ask for attention — premium orders are worth chasing."
                : "A clean ledger — every order collected, margin intact."}
            </h2>
          </div>
          <Link
            className="inline-flex items-center justify-center gap-2.5 self-start px-8 py-4 text-[0.7rem] font-semibold uppercase tracking-[0.18em]"
            href="/design-lab/d9/orders"
            style={{ background: d9.bronze, color: d9.bone }}
          >
            Return to orders desk <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </D9Page>
  );
}
