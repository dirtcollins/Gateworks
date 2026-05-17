"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  PieChart,
  Receipt,
  TrendingUp,
  Wallet
} from "lucide-react";
import {
  Card,
  D7DesignBadge,
  D7Page,
  Eyebrow,
  LEDGER,
  Pill,
  formatUsd,
  formatUsd0
} from "./kit";
import type { ReportData } from "@/features/admin/reports/reports-dashboard";

/* d7 "Ledger" reports — a finance-grade account spend & AR dashboard.
 * Marketing: gives budget owners the visibility that justifies
 * consolidating spend on one supplier. Finance: revenue, AOV, gross
 * margin, AR aging, collection rate, and payment mix presented with
 * real rigor. All values flow from the real fetchReportData() result. */

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

const PAYMENT_TONE: Record<string, { bg: string; fg: string }> = {
  paid: { bg: LEDGER.mintSoft, fg: LEDGER.mint },
  partial: { bg: LEDGER.amberSoft, fg: LEDGER.amber },
  pending: { bg: LEDGER.indigoSoft, fg: LEDGER.indigo },
  unpaid: { bg: LEDGER.roseSoft, fg: LEDGER.rose },
  refunded: { bg: "#eef0f3", fg: LEDGER.body }
};

function paymentTone(status: string) {
  return PAYMENT_TONE[status.toLowerCase()] ?? { bg: "#eef0f3", fg: LEDGER.body };
}

export function D7Reports({ data }: { data: ReportData }) {
  const collectionRate = data.billed > 0 ? (data.collected / data.billed) * 100 : 0;
  const maxBreakdown = Math.max(
    1,
    ...data.paymentBreakdown.map((row) => row.total)
  );
  const maxAging = Math.max(1, ...data.aging.map((bucket) => bucket.total));

  const headline = [
    {
      label: "Revenue (30 days)",
      value: formatUsd0(data.revenue30),
      icon: TrendingUp,
      sub: `${data.orders30} orders billed`
    },
    {
      label: "Avg order value",
      value: formatUsd(data.avgOrderValue),
      icon: Receipt,
      sub: "Across recent orders"
    },
    {
      label: "Gross margin",
      value: data.hasCostData ? `${data.grossMarginPct.toFixed(1)}%` : "No cost data",
      icon: PieChart,
      sub: data.hasCostData
        ? `${formatUsd0(data.grossProfit)} gross profit`
        : "Add unit costs to compute"
    },
    {
      label: "Collection rate",
      value: `${collectionRate.toFixed(1)}%`,
      icon: Banknote,
      sub: `${formatUsd0(data.collected)} collected`
    }
  ];

  return (
    <D7Page wide>
      <div className="pt-5">
        <D7DesignBadge />
      </div>

      <header className="py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Account finance</Eyebrow>
            <h1
              className="mt-1.5 text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ color: LEDGER.ink }}
            >
              Spend &amp; receivables
            </h1>
            <p
              className="mt-1.5 max-w-xl text-sm"
              style={{ color: LEDGER.body }}
            >
              Trailing 30-day revenue, order economics, and accounts-receivable
              health for the Gateworks trade account.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
            href="/design-lab/d7/orders"
            style={{
              color: LEDGER.ink,
              backgroundColor: LEDGER.surface,
              border: `1px solid ${LEDGER.line}`
            }}
          >
            <Receipt className="h-4 w-4" /> Order ledger
          </Link>
        </div>
      </header>

      {!data.configured ? (
        <div
          className="mb-6 flex items-start gap-3 rounded-2xl p-4"
          style={{ backgroundColor: LEDGER.amberSoft }}
        >
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0"
            style={{ color: LEDGER.amber }}
          />
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: LEDGER.amber }}
            >
              Supabase is not configured
            </p>
            <p className="mt-0.5 text-[13px]" style={{ color: LEDGER.amber }}>
              Live financial data is unavailable. Add the Supabase keys to{" "}
              <code>.env.local</code> to populate this dashboard with real
              account data.
            </p>
          </div>
        </div>
      ) : null}

      {/* Headline KPIs */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {headline.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: LEDGER.muted }}
              >
                {kpi.label}
              </span>
              <kpi.icon className="h-4 w-4" style={{ color: LEDGER.indigo }} />
            </div>
            <p
              className="mt-2.5 text-2xl font-semibold tracking-tight"
              style={{ color: LEDGER.ink }}
            >
              {kpi.value}
            </p>
            <p
              className="mt-0.5 text-[12px] font-medium"
              style={{ color: LEDGER.body }}
            >
              {kpi.sub}
            </p>
          </Card>
        ))}
      </section>

      {/* AR + payment mix + aging */}
      <section className="mt-6 grid gap-3 lg:grid-cols-3">
        {/* Accounts receivable */}
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" style={{ color: LEDGER.indigo }} />
            <p
              className="text-[12px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Accounts receivable
            </p>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <ArRow label="Total billed" value={formatUsd(data.billed)} />
            <ArRow
              label="Collected"
              value={formatUsd(data.collected)}
              accent={LEDGER.mint}
            />
            <div
              className="flex items-center justify-between pt-3"
              style={{ borderTop: `1px solid ${LEDGER.line}` }}
            >
              <span
                className="text-[13px] font-semibold"
                style={{ color: LEDGER.ink }}
              >
                Outstanding
              </span>
              <span
                className="text-lg font-semibold tracking-tight"
                style={{ color: LEDGER.rose }}
              >
                {formatUsd(data.outstanding)}
              </span>
            </div>
            {/* Collection progress bar */}
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
        </Card>

        {/* Payment mix */}
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4" style={{ color: LEDGER.indigo }} />
            <p
              className="text-[12px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Payment status mix
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {data.paymentBreakdown.length ? (
              data.paymentBreakdown.map((row) => {
                const tone = paymentTone(row.status);
                return (
                  <div key={row.status}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="flex items-center gap-2">
                        <Pill bg={tone.bg} fg={tone.fg}>
                          {titleCase(row.status)}
                        </Pill>
                        <span
                          className="font-medium"
                          style={{ color: LEDGER.muted }}
                        >
                          {row.count} orders
                        </span>
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
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
                          backgroundColor: tone.fg
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-[13px]" style={{ color: LEDGER.muted }}>
                No orders in range.
              </p>
            )}
          </div>
        </Card>

        {/* AR aging */}
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" style={{ color: LEDGER.indigo }} />
            <p
              className="text-[12px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Outstanding by age
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {data.aging.length ? (
              data.aging.map((bucket, index) => {
                const tone =
                  index === 0
                    ? LEDGER.mint
                    : index === 1
                      ? LEDGER.amber
                      : LEDGER.rose;
                return (
                  <div key={bucket.bucket}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span
                        className="font-medium"
                        style={{ color: LEDGER.body }}
                      >
                        {bucket.bucket} days
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
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
              })
            ) : (
              <p className="text-[13px]" style={{ color: LEDGER.muted }}>
                No outstanding balances.
              </p>
            )}
          </div>
        </Card>
      </section>

      {/* Margin note */}
      <section className="mt-3">
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
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
                Gross margin is hidden until product unit costs are entered.
                Add costs in the catalog manager to compute margin from real
                cost data.
              </>
            )}
          </p>
          <Pill
            bg={data.hasCostData ? LEDGER.mintSoft : LEDGER.amberSoft}
            fg={data.hasCostData ? LEDGER.mint : LEDGER.amber}
          >
            {data.hasCostData ? "Cost data available" : "Cost data pending"}
          </Pill>
        </Card>
      </section>

      {/* Recent orders */}
      <section className="mt-6 pb-8">
        <div className="flex items-end justify-between">
          <h2
            className="text-xl font-semibold tracking-tight"
            style={{ color: LEDGER.ink }}
          >
            Recent orders
          </h2>
          <Link
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition hover:underline"
            href="/design-lab/d7/orders"
            style={{ color: LEDGER.indigo }}
          >
            Full ledger <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <Card className="mt-4 overflow-hidden">
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
                {data.recentOrders.length ? (
                  data.recentOrders.map((order, index) => {
                    const tone = paymentTone(order.paymentStatus);
                    return (
                      <tr
                        key={order.id}
                        style={{
                          borderTop:
                            index === 0 ? "none" : `1px solid ${LEDGER.line}`
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
                          {formatDate(order.createdAt)}
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
                          <Pill bg={tone.bg} fg={tone.fg}>
                            {titleCase(order.paymentStatus)}
                          </Pill>
                        </td>
                        <td
                          className="px-5 py-3.5 text-right text-[13px] font-semibold"
                          style={{ color: LEDGER.ink }}
                        >
                          {order.margin === null
                            ? "—"
                            : formatUsd(order.margin)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-5 py-14 text-center" colSpan={6}>
                      <Receipt
                        className="mx-auto h-9 w-9"
                        style={{ color: LEDGER.muted }}
                      />
                      <p
                        className="mt-3 text-sm font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        No orders yet
                      </p>
                      <p
                        className="mt-1 text-[13px]"
                        style={{ color: LEDGER.body }}
                      >
                        Orders will appear here once they are placed.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </D7Page>
  );
}

function ArRow({
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
      <span className="font-medium" style={{ color: LEDGER.body }}>
        {label}
      </span>
      <span className="font-semibold" style={{ color: accent ?? LEDGER.ink }}>
        {value}
      </span>
    </div>
  );
}
