import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  Database,
  Download,
  PiggyBank,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users
} from "lucide-react";
import type { ReportData } from "@/features/admin/reports/reports-dashboard";
import { D4Shell, brandClasses } from "./shell";

function currency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

function currencyExact(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

const paymentTints = [
  "bg-orange-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-rose-500"
];

export function D4Reports({ data }: { data: ReportData }) {
  if (!data.configured) {
    return (
      <D4Shell active="reports">
        <div className="border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="mx-auto max-w-6xl px-5 py-7">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
              Insights
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Reports &amp; performance
            </h1>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid place-items-center rounded-2xl bg-slate-50 py-20 text-center ring-1 ring-slate-100">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-orange-500 ring-1 ring-slate-100">
              <Database className="h-7 w-7" />
            </div>
            <p className="mt-4 text-lg font-bold text-slate-900">
              Supabase isn&rsquo;t connected yet
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Add your Supabase credentials to unlock live revenue, margin and
              accounts-receivable reporting.
            </p>
            <Link
              href="/design-lab/d4/orders"
              className={`${brandClasses.btn} mt-5 px-5 py-2.5 text-sm`}
            >
              Back to orders <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </D4Shell>
    );
  }

  // Real revenue chart series from recent order totals (oldest -> newest).
  const series = [...data.recentOrders]
    .reverse()
    .map((order) => order.total);
  const chartSeries = series.length ? series : [0];
  const maxSeries = Math.max(...chartSeries, 1);

  const collectionRate =
    data.billed > 0 ? (data.collected / data.billed) * 100 : 0;
  const maxPaymentTotal = Math.max(
    ...data.paymentBreakdown.map((bucket) => bucket.total),
    1
  );

  return (
    <D4Shell active="reports">
      <div className="border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-5 py-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
              Insights
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Reports &amp; performance
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Live performance from the last 30 days of orders.
            </p>
          </div>
          <button
            type="button"
            className={`${brandClasses.btn} px-4 py-2.5 text-sm`}
          >
            <Download className="h-4 w-4" /> Export report
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Revenue (30d)",
              value: currency(data.revenue30),
              sub: `${data.orders30} orders`,
              icon: PiggyBank,
              tint: "bg-emerald-100 text-emerald-600"
            },
            {
              label: "Orders (30d)",
              value: String(data.orders30),
              sub: "Last 30 days",
              icon: ShoppingCart,
              tint: "bg-orange-100 text-orange-600"
            },
            {
              label: "Avg. order value",
              value: currency(data.avgOrderValue),
              sub: "Per order",
              icon: TrendingUp,
              tint: "bg-sky-100 text-sky-600"
            },
            {
              label: "Gross margin",
              value: data.hasCostData
                ? `${data.grossMarginPct.toFixed(1)}%`
                : "—",
              sub: data.hasCostData
                ? `${currency(data.grossProfit)} profit`
                : "No cost data",
              icon: Users,
              tint: "bg-violet-100 text-violet-600"
            }
          ].map((k) => (
            <div key={k.label} className={`${brandClasses.card} p-5`}>
              <div className="flex items-center justify-between">
                <div
                  className={`grid h-10 w-10 place-items-center rounded-xl ${k.tint}`}
                >
                  <k.icon className="h-5 w-5" />
                </div>
                <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                  <ArrowUpRight className="h-3 w-3" />
                  Live
                </span>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">
                {k.value}
              </p>
              <p className="text-sm font-semibold text-slate-500">{k.label}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                {k.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Billing summary */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Billed", value: data.billed, tint: "text-slate-900" },
            { label: "Collected", value: data.collected, tint: "text-emerald-600" },
            { label: "Outstanding", value: data.outstanding, tint: "text-orange-600" }
          ].map((b) => (
            <div key={b.label} className={`${brandClasses.card} p-5`}>
              <p className="text-sm font-semibold text-slate-500">{b.label}</p>
              <p className={`mt-1 text-xl font-extrabold ${b.tint}`}>
                {currencyExact(b.value)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Revenue chart */}
          <div className={`${brandClasses.card} p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-slate-900">
                  Recent order totals
                </p>
                <p className="text-xs text-slate-400">
                  Most recent {chartSeries.length} orders
                </p>
              </div>
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                {collectionRate.toFixed(0)}% collected
              </span>
            </div>
            <div className="mt-6 flex h-52 items-end gap-1.5">
              {chartSeries.map((v, i) => (
                <div
                  key={i}
                  className="group flex flex-1 flex-col items-center gap-2"
                >
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-orange-400 to-orange-300 transition-all group-hover:from-orange-500 group-hover:to-orange-400"
                      style={{ height: `${Math.max(2, (v / maxSeries) * 100)}%` }}
                    />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                      {currency(v)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment breakdown */}
          <div className={`${brandClasses.card} p-6`}>
            <p className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Boxes className="h-5 w-5 text-orange-500" /> Orders by payment
            </p>
            <div className="mt-5 space-y-4">
              {data.paymentBreakdown.length ? (
                data.paymentBreakdown.map((bucket, index) => (
                  <div key={bucket.status}>
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-slate-700">
                        {titleCase(bucket.status)}
                        <span className="ml-1 text-xs text-slate-400">
                          ({bucket.count})
                        </span>
                      </span>
                      <span className="font-bold text-slate-900">
                        {currency(bucket.total)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${paymentTints[index % paymentTints.length]}`}
                        style={{
                          width: `${(bucket.total / maxPaymentTotal) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No payment data yet.</p>
              )}
            </div>
            <div className="mt-5 rounded-xl bg-orange-50 p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-orange-700">
                <Sparkles className="h-4 w-4" /> AR aging
              </p>
              <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                {data.aging.map((bucket) => (
                  <div key={bucket.bucket} className="flex justify-between">
                    <span>{bucket.bucket} days</span>
                    <span className="font-bold text-slate-800">
                      {currency(bucket.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent orders */}
        <div className={`${brandClasses.card} mt-6 p-6`}>
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-slate-900">Recent orders</p>
            <Link
              href="/design-lab/d4/orders"
              className="text-sm font-bold text-orange-600 hover:text-orange-700"
            >
              View all orders
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {data.recentOrders.length ? (
              data.recentOrders.slice(0, 8).map((order, i) => (
                <div key={order.id} className="flex items-center gap-4">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {order.orderNumber} · {order.customerName}
                      </p>
                      <p className="shrink-0 text-sm font-bold text-slate-900">
                        {currencyExact(order.total)}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {titleCase(order.paymentStatus)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {order.margin !== null
                          ? `${currency(order.margin)} margin`
                          : "No cost data"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No orders yet.</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Link
            href="/design-lab/d4/orders"
            className="flex items-center gap-1 text-sm font-bold text-orange-600 hover:text-orange-700"
          >
            Back to orders <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </D4Shell>
  );
}
