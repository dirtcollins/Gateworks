"use client";

import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminCard,
  AdminEmptyState,
  AdminHeader,
  AdminSection,
  AdminStatGrid
} from "@/features/sites/industrial/admin/kit";
import type { ReportData } from "@/features/admin/reports/reports-dashboard";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin reports. Presentational; receives a
 * serializable `data: ReportData` prop fetched server-side by
 * fetchReportData() from Supabase aggregates.
 * ------------------------------------------------------------------ */

const CAT_TONES = ["#16150f", "#2f6f4e", "#6c685c", "#d6a93f"];

function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}

export function IndustrialAdminReports({ data }: { data: ReportData }) {
  if (!data.configured) {
    return (
      <div className="grid gap-8">
        <AdminHeader
          eyebrow="Business intelligence"
          title="Reports"
          description="Live revenue, payment and accounts-receivable reporting."
        />
        <AdminEmptyState
          title="Supabase is not configured"
          description="Connect a Supabase project to populate live revenue, payment, and accounts-receivable reporting."
        />
      </div>
    );
  }

  const stats = [
    {
      label: "Revenue (30d)",
      value: formatUsd(data.revenue30),
      hint: `${data.orders30} orders`
    },
    {
      label: "Orders (30d)",
      value: data.orders30.toLocaleString(),
      hint: "Last 30 days"
    },
    {
      label: "Avg. order value",
      value: formatUsd(data.avgOrderValue),
      hint: "Per order"
    },
    {
      label: "Gross margin",
      value: data.hasCostData ? formatPct(data.grossMarginPct) : "—",
      hint: data.hasCostData ? formatUsd(data.grossProfit) : "No cost data"
    }
  ];

  const agingMax = Math.max(1, ...data.aging.map((bucket) => bucket.total));
  const breakdownTotal = Math.max(
    1,
    data.paymentBreakdown.reduce((sum, row) => sum + row.total, 0)
  );

  // Derive a per-customer roll-up from the recent orders feed.
  const accountMap = new Map<string, { orders: number; spend: number }>();
  data.recentOrders.forEach((order) => {
    const current = accountMap.get(order.customerName) || {
      orders: 0,
      spend: 0
    };
    current.orders += 1;
    current.spend += order.total;
    accountMap.set(order.customerName, current);
  });
  const accounts = Array.from(accountMap.entries())
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  return (
    <div className="grid gap-8">
      <AdminHeader
        eyebrow="Business intelligence"
        title="Reports"
        description="Revenue, gross margin, payment mix, and accounts-receivable aging from live order data."
        action={
          <span className="inline-flex items-center bg-d1-ink px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-paper">
            Rolling 30 days
          </span>
        }
      />

      <AdminStatGrid stats={stats} />

      <div className="grid gap-8 lg:grid-cols-12">
        {/* AR aging */}
        <div className="lg:col-span-7">
          <AdminSection
            title="Accounts receivable aging"
            action={
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                {formatUsd(data.outstanding)} outstanding
              </span>
            }
          >
            <AdminCard className="p-6">
              <div className="flex h-56 items-end gap-3">
                {data.aging.map((bucket, index) => {
                  const pct = Math.max(
                    4,
                    Math.round((bucket.total / agingMax) * 100)
                  );
                  return (
                    <div
                      className="flex flex-1 flex-col items-center gap-2"
                      key={bucket.bucket}
                    >
                      <span className="text-[11px] font-bold text-d1-steel">
                        {formatUsd(bucket.total)}
                      </span>
                      <div
                        className="w-full transition-all"
                        style={{
                          height: `${pct}%`,
                          backgroundColor:
                            index === data.aging.length - 1
                              ? "#b42318"
                              : "#16150f"
                        }}
                      />
                      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                        {bucket.bucket} days
                      </span>
                    </div>
                  );
                })}
              </div>
            </AdminCard>
          </AdminSection>
        </div>

        {/* Payment status */}
        <div className="lg:col-span-5">
          <AdminSection title="Payment status">
            <AdminCard className="p-6">
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
                    className="flex items-center justify-between"
                    key={row.status}
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
            </AdminCard>
          </AdminSection>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Recent orders */}
        <div className="lg:col-span-7">
          <AdminSection
            title="Recent orders"
            action={
              <Link
                className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-pine hover:underline"
                href="/industrial/admin/orders"
              >
                All orders <ArrowRight className="h-3 w-3" />
              </Link>
            }
          >
            <AdminCard className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left">
                <thead>
                  <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3 text-right">Margin</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-d1-line">
                  {data.recentOrders.slice(0, 8).map((order) => (
                    <tr className="transition hover:bg-d1-paper" key={order.id}>
                      <td className="px-4 py-3.5">
                        <span className="block text-sm font-bold text-d1-ink">
                          {order.customerName}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                          {order.orderNumber} &middot;{" "}
                          {formatDate(order.createdAt)}
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
            </AdminCard>
          </AdminSection>
        </div>

        {/* Top accounts */}
        <div className="lg:col-span-5">
          <AdminSection title="Top trade accounts">
            <AdminCard className="divide-y divide-d1-line">
              {accounts.map((account, index) => (
                <div
                  className="flex items-center gap-4 px-4 py-3.5"
                  key={account.name}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center bg-d1-ink text-sm font-extrabold text-d1-paper">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-d1-ink">
                      {account.name}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                      {account.orders}{" "}
                      {account.orders === 1 ? "order" : "orders"}
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
            </AdminCard>
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
