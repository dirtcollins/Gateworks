"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Download,
  Users
} from "lucide-react";
import { D1DesignBadge, D1Page, Eyebrow, formatUsd } from "./kit";
import type { ReportData } from "@/features/admin/reports/reports-dashboard";

const CAT_TONES = ["#16150f", "#2f6f4e", "#6c685c", "#d6a93f"];

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

export function D1Reports({ data }: { data: ReportData }) {
  if (!data.configured) {
    return (
      <D1Page wide>
        <div className="pt-5">
          <D1DesignBadge />
        </div>
        <header className="border-y-2 border-d1-ink py-8">
          <Eyebrow>Business intelligence</Eyebrow>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-d1-ink sm:text-5xl">
            Reports
          </h1>
        </header>
        <section className="my-12 border border-dashed border-d1-line bg-d1-card px-6 py-20 text-center">
          <p className="text-lg font-extrabold text-d1-ink">
            Supabase is not configured.
          </p>
          <p className="mt-2 text-sm font-semibold text-d1-steel">
            Connect a Supabase project to populate live revenue, payment and
            accounts-receivable reporting.
          </p>
        </section>
      </D1Page>
    );
  }

  const kpis = [
    {
      label: "Revenue (30d)",
      value: formatUsd(data.revenue30),
      delta: `${data.orders30} orders`,
      up: true
    },
    {
      label: "Orders (30d)",
      value: data.orders30.toLocaleString(),
      delta: "Last 30 days",
      up: true
    },
    {
      label: "Avg. order value",
      value: formatUsd(data.avgOrderValue),
      delta: "Per order",
      up: true
    },
    {
      label: "Gross margin",
      value: data.hasCostData ? formatPct(data.grossMarginPct) : "—",
      delta: data.hasCostData ? formatUsd(data.grossProfit) : "No cost data",
      up: data.grossProfit >= 0
    }
  ];

  // AR aging buckets render in the bar-chart slot.
  const agingMax = Math.max(1, ...data.aging.map((bucket) => bucket.total));

  // Payment status breakdown fills the category-mix slot.
  const breakdownTotal = Math.max(
    1,
    data.paymentBreakdown.reduce((sum, row) => sum + row.total, 0)
  );

  // Recent orders, plus a derived per-customer accounts roll-up.
  const accountMap = new Map<string, { orders: number; spend: number }>();
  data.recentOrders.forEach((order) => {
    const current = accountMap.get(order.customerName) || { orders: 0, spend: 0 };
    current.orders += 1;
    current.spend += order.total;
    accountMap.set(order.customerName, current);
  });
  const accounts = Array.from(accountMap.entries())
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 4);

  return (
    <D1Page wide>
      <div className="pt-5">
        <D1DesignBadge />
      </div>

      <header className="border-y-2 border-d1-ink py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Business intelligence</Eyebrow>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-d1-ink sm:text-5xl">
              Reports
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-d1-ink">
              <span className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] bg-d1-ink text-d1-paper">
                30 days
              </span>
            </div>
            <button
              className="inline-flex items-center gap-2 border border-d1-ink px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
              type="button"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid gap-px border border-d1-line bg-d1-line sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-d1-card p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-d1-steel">
              {kpi.label}
            </p>
            <p className="mt-2 text-3xl font-extrabold text-d1-ink">
              {kpi.value}
            </p>
            <p
              className={`mt-1.5 flex items-center gap-1 text-[12px] font-bold ${
                kpi.up ? "text-d1-pine" : "text-d1-red"
              }`}
            >
              {kpi.up ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              <span className="font-semibold text-d1-steel">{kpi.delta}</span>
            </p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* AR aging chart */}
        <section className="lg:col-span-7">
          <div className="flex items-end justify-between border-b-2 border-d1-ink pb-3">
            <h2 className="text-xl font-extrabold tracking-tight text-d1-ink">
              Accounts receivable aging
            </h2>
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
              {formatUsd(data.outstanding)} outstanding
            </span>
          </div>
          <div className="mt-6 border border-d1-line bg-d1-card p-6">
            <div className="flex h-56 items-end gap-3">
              {data.aging.map((bucket, index) => {
                const pct = Math.max(
                  4,
                  Math.round((bucket.total / agingMax) * 100)
                );
                return (
                  <div
                    key={bucket.bucket}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <span className="text-[11px] font-bold text-d1-steel">
                      {formatUsd(bucket.total)}
                    </span>
                    <div
                      className="w-full transition-all"
                      style={{
                        height: `${pct}%`,
                        backgroundColor:
                          index === data.aging.length - 1 ? "#b42318" : "#16150f"
                      }}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                      {bucket.bucket} days
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Payment status mix */}
        <section className="lg:col-span-5">
          <div className="flex items-end justify-between border-b-2 border-d1-ink pb-3">
            <h2 className="text-xl font-extrabold tracking-tight text-d1-ink">
              Payment status
            </h2>
          </div>
          <div className="mt-6 border border-d1-line bg-d1-card p-6">
            <div className="flex h-3 w-full overflow-hidden">
              {data.paymentBreakdown.map((row, index) => (
                <div
                  key={row.status}
                  style={{
                    width: `${(row.total / breakdownTotal) * 100}%`,
                    backgroundColor: CAT_TONES[index % CAT_TONES.length]
                  }}
                />
              ))}
            </div>
            <ul className="mt-5 space-y-3.5">
              {data.paymentBreakdown.map((row, index) => (
                <li
                  key={row.status}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3"
                      style={{
                        backgroundColor: CAT_TONES[index % CAT_TONES.length]
                      }}
                    />
                    <span className="text-sm font-bold capitalize text-d1-ink">
                      {row.status}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-d1-steel">
                      {formatUsd(row.total)}
                    </span>
                    <span className="w-9 text-right text-sm font-extrabold text-d1-ink">
                      {row.count}
                    </span>
                  </span>
                </li>
              ))}
              {data.paymentBreakdown.length === 0 ? (
                <li className="text-sm font-semibold text-d1-steel">
                  No payment activity yet.
                </li>
              ) : null}
            </ul>
            <div className="mt-5 grid grid-cols-2 gap-px border border-d1-line bg-d1-line">
              <div className="bg-d1-card px-3 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                  Billed
                </p>
                <p className="text-sm font-extrabold text-d1-ink">
                  {formatUsd(data.billed)}
                </p>
              </div>
              <div className="bg-d1-card px-3 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                  Collected
                </p>
                <p className="text-sm font-extrabold text-d1-ink">
                  {formatUsd(data.collected)}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Recent orders */}
        <section className="lg:col-span-7">
          <div className="flex items-end justify-between border-b-2 border-d1-ink pb-3">
            <h2 className="text-xl font-extrabold tracking-tight text-d1-ink">
              Recent orders
            </h2>
            <Link
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-pine hover:underline"
              href="/design-lab/d1/orders"
            >
              All orders <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-5 overflow-x-auto border border-d1-line bg-d1-card">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3 text-right">Margin</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-d1-line">
                {data.recentOrders.slice(0, 8).map((order) => (
                  <tr key={order.id} className="transition hover:bg-white">
                    <td className="px-4 py-3.5">
                      <span className="block text-sm font-bold text-d1-ink">
                        {order.customerName}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                        {order.orderNumber} &middot; {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-bold text-d1-ink">
                      {order.margin === null
                        ? "—"
                        : formatUsd(order.margin)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                      {formatUsd(order.total)}
                    </td>
                  </tr>
                ))}
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-12 text-center text-sm font-bold text-d1-steel"
                      colSpan={3}
                    >
                      No orders yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top accounts */}
        <section className="lg:col-span-5">
          <div className="flex items-end justify-between border-b-2 border-d1-ink pb-3">
            <h2 className="text-xl font-extrabold tracking-tight text-d1-ink">
              Top trade accounts
            </h2>
          </div>
          <div className="mt-5 divide-y divide-d1-line border border-d1-line bg-d1-card">
            {accounts.map((account, index) => (
              <div
                key={account.name}
                className="flex items-center gap-4 px-4 py-3.5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center bg-d1-ink text-sm font-extrabold text-d1-paper">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-d1-ink">
                    {account.name}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                    {account.orders} {account.orders === 1 ? "order" : "orders"}
                  </p>
                </div>
                <span className="text-sm font-extrabold text-d1-ink">
                  {formatUsd(account.spend)}
                </span>
              </div>
            ))}
            {accounts.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm font-semibold text-d1-steel">
                No account activity yet.
              </div>
            ) : null}
            <div className="flex items-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-pine">
              <Users className="h-3.5 w-3.5" />
              {accountMap.size} active accounts
            </div>
          </div>

          <Link
            className="mt-5 flex items-center justify-between border-2 border-d1-ink bg-d1-ink px-5 py-4 text-d1-paper transition hover:bg-d1-pine"
            href="/design-lab/d1/orders"
          >
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-d1-amber">
                Operations
              </span>
              <span className="text-sm font-bold">Jump to live orders</span>
            </span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </section>
      </div>
    </D1Page>
  );
}
