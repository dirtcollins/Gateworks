"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Database,
  Receipt,
  TrendingUp
} from "lucide-react";
import { D5, Dot, H, Panel, Shell, Tag, mono } from "./kit";
import { fmt } from "./data";
import type {
  ReportData,
  ReportOrderRow
} from "@/features/admin/reports/reports-dashboard";

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function paymentTone(status: string): "dim" | "accent" | "amber" | "red" | "blue" {
  if (status === "paid" || status === "overpaid") return "accent";
  if (status === "partial") return "amber";
  if (status === "failed") return "red";
  if (status === "refunded") return "blue";
  return "dim";
}

function shortDate(iso: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(iso));
}

export default function D5Reports({ data }: { data: ReportData }) {
  const KPI = [
    { label: "Revenue 30d", value: fmt(data.revenue30) },
    { label: "Orders 30d", value: String(data.orders30) },
    { label: "Avg ticket", value: fmt(data.avgOrderValue) },
    {
      label: "Gross margin",
      value: data.hasCostData ? `${data.grossMarginPct.toFixed(1)}%` : "No cost data"
    },
    { label: "Outstanding", value: fmt(data.outstanding) },
    { label: "Collected", value: fmt(data.collected) }
  ];

  // Revenue chart: real recent-order totals, oldest → newest.
  const revenueBars = useMemo(() => {
    const series = [...data.recentOrders]
      .reverse()
      .slice(-12)
      .map((row) => row.total);
    return series.length ? series : [0];
  }, [data.recentOrders]);
  const maxBar = Math.max(...revenueBars, 1);

  // Top orders by revenue stand in for the dense "top" table.
  const topOrders = useMemo(
    () => [...data.recentOrders].sort((a, b) => b.total - a.total).slice(0, 5),
    [data.recentOrders]
  );
  const topMax = topOrders[0]?.total || 1;

  const collectedPct =
    data.billed > 0 ? Math.round((data.collected / data.billed) * 100) : 0;

  return (
    <Shell crumb="ops / reports">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <H>Reports</H>
          <p className="mt-0.5 text-[11px]" style={{ color: D5.faint }}>
            Live financial analytics · revenue, AR, and gross margin
          </p>
        </div>
      </div>

      {!data.configured ? (
        <div
          className="mb-3 flex items-start gap-2.5 rounded-md border px-3 py-2.5"
          style={{ borderColor: "#5a2620", background: "#3a1916" }}
        >
          <Database size={14} className="mt-0.5 shrink-0" style={{ color: D5.red }} />
          <div>
            <div className="text-[11px] font-bold" style={{ color: D5.red }}>
              Supabase not configured
            </div>
            <div className="text-[10px]" style={{ color: D5.dim }}>
              Add Supabase keys to <span style={{ fontFamily: mono }}>.env.local</span> to
              populate live financial data.
            </div>
          </div>
        </div>
      ) : null}

      {/* KPI grid */}
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {KPI.map((k) => (
          <div
            key={k.label}
            className="rounded-md border px-3 py-2.5"
            style={{ borderColor: D5.line, background: D5.panel }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.14em]"
              style={{ color: D5.faint }}
            >
              {k.label}
            </div>
            <div className="mt-1 text-[19px] font-bold" style={{ color: D5.ink }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          {/* revenue chart */}
          <Panel
            title="Revenue"
            hint="// recent orders"
            right={
              data.hasCostData ? (
                <span
                  className="flex items-center gap-1 text-[10px] font-semibold"
                  style={{ color: D5.accent }}
                >
                  <TrendingUp size={11} /> {data.grossMarginPct.toFixed(1)}% margin
                </span>
              ) : null
            }
          >
            <div className="flex h-44 items-end gap-1.5 px-3 pb-3 pt-4">
              {revenueBars.map((v, i) => (
                <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                  <span
                    className="text-[8px] opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: D5.dim, fontFamily: mono }}
                  >
                    {fmt(v)}
                  </span>
                  <div
                    className="w-full rounded-sm transition-colors"
                    style={{
                      height: `${Math.max((v / maxBar) * 100, 2)}%`,
                      background: i === revenueBars.length - 1 ? D5.accent : D5.accentDim
                    }}
                  />
                </div>
              ))}
            </div>
            <div
              className="flex justify-between border-t px-3 py-1.5 text-[9px]"
              style={{ borderColor: D5.line, color: D5.faint }}
            >
              <span>oldest</span>
              <span>most recent</span>
            </div>
          </Panel>

          {/* top orders by revenue */}
          <Panel title="Top orders" hint="// by revenue">
            <div
              className="grid grid-cols-[1fr_84px_84px] gap-x-3 border-b px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] md:grid-cols-[1fr_120px_84px_84px]"
              style={{ borderColor: D5.line, color: D5.faint }}
            >
              <span>order</span>
              <span className="hidden md:block">share</span>
              <span className="text-right">margin</span>
              <span className="text-right">revenue</span>
            </div>
            {topOrders.length ? (
              topOrders.map((s: ReportOrderRow) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[1fr_84px_84px] items-center gap-x-3 border-b px-3 py-2 last:border-0 md:grid-cols-[1fr_120px_84px_84px]"
                  style={{ borderColor: D5.line }}
                >
                  <div className="overflow-hidden">
                    <div
                      className="truncate text-[12px] font-semibold"
                      style={{ color: D5.ink }}
                    >
                      {s.customerName}
                    </div>
                    <div className="text-[9px]" style={{ color: D5.faint }}>
                      {s.orderNumber} · {shortDate(s.createdAt)}
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="h-1.5 rounded-full" style={{ background: D5.line }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${Math.round((s.total / topMax) * 100)}%`,
                          background: D5.accent
                        }}
                      />
                    </div>
                  </div>
                  <span
                    className="text-right text-[11px]"
                    style={{ color: D5.dim, fontFamily: mono }}
                  >
                    {s.margin === null ? "—" : fmt(s.margin)}
                  </span>
                  <span
                    className="text-right text-[12px] font-bold"
                    style={{ color: D5.ink, fontFamily: mono }}
                  >
                    {fmt(s.total)}
                  </span>
                </div>
              ))
            ) : (
              <p className="px-3 py-6 text-center text-[11px]" style={{ color: D5.faint }}>
                No orders in range.
              </p>
            )}
          </Panel>

          {/* AR summary */}
          <Panel title="Accounts receivable" hint="// billed vs collected">
            <div className="grid gap-px md:grid-cols-2" style={{ background: D5.line }}>
              <div className="p-3" style={{ background: D5.panel }}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold" style={{ color: D5.ink }}>
                    Collection rate
                  </span>
                  <Tag tone={collectedPct >= 75 ? "accent" : "amber"}>
                    {collectedPct}%
                  </Tag>
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  <div>
                    <div className="text-[9px] uppercase" style={{ color: D5.faint }}>
                      billed
                    </div>
                    <div className="text-[16px] font-bold" style={{ color: D5.ink }}>
                      {fmt(data.billed)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase" style={{ color: D5.faint }}>
                      collected
                    </div>
                    <div className="text-[16px] font-bold" style={{ color: D5.ink }}>
                      {fmt(data.collected)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full" style={{ background: D5.line }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${collectedPct}%`,
                      background: collectedPct >= 75 ? D5.accent : D5.amber
                    }}
                  />
                </div>
              </div>
              <div className="p-3" style={{ background: D5.panel }}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold" style={{ color: D5.ink }}>
                    Outstanding by age
                  </span>
                  <Receipt size={13} style={{ color: D5.amber }} />
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  {data.aging.map((bucket) => (
                    <div
                      key={bucket.bucket}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <span style={{ color: D5.dim }}>{bucket.bucket} days</span>
                      <span
                        className="font-bold"
                        style={{ color: D5.ink, fontFamily: mono }}
                      >
                        {fmt(bucket.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>

        {/* side column */}
        <div className="flex flex-col gap-3">
          <Panel title="Payment status" hint="// by total">
            <div className="p-3">
              {data.paymentBreakdown.length ? (
                <>
                  <div className="flex h-3 overflow-hidden rounded-full">
                    {data.paymentBreakdown.map((row) => {
                      const sum = data.paymentBreakdown.reduce(
                        (s, r) => s + r.total,
                        0
                      );
                      const pct = sum > 0 ? (row.total / sum) * 100 : 0;
                      const tone = paymentTone(row.status);
                      const color =
                        tone === "accent"
                          ? D5.accent
                          : tone === "amber"
                            ? D5.amber
                            : tone === "red"
                              ? D5.red
                              : tone === "blue"
                                ? D5.blue
                                : D5.faint;
                      return (
                        <div
                          key={row.status}
                          style={{ width: `${pct}%`, background: color }}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-col gap-1.5">
                    {data.paymentBreakdown.map((row) => (
                      <div
                        key={row.status}
                        className="flex items-center justify-between"
                      >
                        <span
                          className="flex items-center gap-2 text-[11px]"
                          style={{ color: D5.dim }}
                        >
                          <Tag tone={paymentTone(row.status)}>
                            {titleCase(row.status)}
                          </Tag>
                          {row.count} orders
                        </span>
                        <span
                          className="text-[12px] font-bold"
                          style={{ color: D5.ink, fontFamily: mono }}
                        >
                          {fmt(row.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[11px]" style={{ color: D5.faint }}>
                  No orders in range.
                </p>
              )}
            </div>
          </Panel>

          <Panel
            title="Recent orders"
            hint={`// ${data.recentOrders.length}`}
            right={<AlertTriangle size={12} style={{ color: D5.amber }} />}
          >
            <div className="p-1.5">
              {data.recentOrders.length ? (
                data.recentOrders.slice(0, 6).map((row) => (
                  <div key={row.id} className="flex gap-2 rounded px-1.5 py-1.5">
                    <Dot color={paymentTone(row.paymentStatus) === "accent" ? D5.accent : D5.amber} />
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[11px] font-bold"
                        style={{ color: D5.ink }}
                      >
                        {row.orderNumber}
                      </div>
                      <div className="truncate text-[10px]" style={{ color: D5.dim }}>
                        {row.customerName} · {shortDate(row.createdAt)}
                      </div>
                    </div>
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: D5.ink, fontFamily: mono }}
                    >
                      {fmt(row.total)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-1.5 py-2 text-[10px]" style={{ color: D5.faint }}>
                  No orders yet.
                </p>
              )}
            </div>
            <div className="border-t px-3 py-1.5" style={{ borderColor: D5.line }}>
              <Link
                href="/design-lab/d5/orders"
                className="flex items-center gap-1 text-[10px] font-semibold"
                style={{ color: D5.accent }}
              >
                <ArrowUpRight size={11} /> open order desk →
              </Link>
            </div>
          </Panel>

          <Panel title="Margin">
            <div className="p-3">
              {data.hasCostData ? (
                <>
                  <div className="text-[9px] uppercase" style={{ color: D5.faint }}>
                    gross profit
                  </div>
                  <div className="text-[20px] font-bold" style={{ color: D5.ink }}>
                    {fmt(data.grossProfit)}
                  </div>
                  <div className="mt-1 text-[10px]" style={{ color: D5.dim }}>
                    {data.grossMarginPct.toFixed(1)}% margin across recent orders.
                  </div>
                </>
              ) : (
                <p className="text-[10px]" style={{ color: D5.dim }}>
                  Gross margin is hidden until product unit costs are entered in the
                  catalog manager.
                </p>
              )}
            </div>
          </Panel>

          <Link
            href="/design-lab/d5/orders"
            className="flex items-center justify-between rounded-md border px-3 py-2.5 text-[11px] font-semibold transition-colors hover:brightness-110"
            style={{ borderColor: D5.line, background: D5.panel, color: D5.ink }}
          >
            <span>Jump to live order desk</span>
            <ArrowUpRight size={13} style={{ color: D5.accent }} />
          </Link>
        </div>
      </div>
    </Shell>
  );
}
