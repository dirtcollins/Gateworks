"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Database, TrendingUp } from "lucide-react";
import { Beacon, Chip, FO, Panel, Shell, Stamp } from "./kit";
import { money } from "./data";
import type { ReportData } from "@/features/admin/reports/reports-dashboard";

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function paymentTone(status: string): "hi" | "go" | "warn" | "stop" | "steel" {
  if (status === "paid" || status === "overpaid") return "go";
  if (status === "partial") return "warn";
  if (status === "failed") return "stop";
  if (status === "refunded") return "hi";
  return "steel";
}

const TONE_COLOR: Record<string, string> = {
  hi: FO.hi,
  go: FO.go,
  warn: FO.warn,
  stop: FO.stop,
  steel: FO.faint
};

function shortDate(iso: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(iso)
  );
}

export default function D5Reports({ data }: { data: ReportData }) {
  const kpis = [
    { label: "Revenue 30d", value: money(data.revenue30), big: true },
    { label: "Orders 30d", value: String(data.orders30) },
    { label: "Avg ticket", value: money(data.avgOrderValue) },
    {
      label: "Gross margin",
      value: data.hasCostData ? `${data.grossMarginPct.toFixed(1)}%` : "No cost data"
    },
    { label: "Collected", value: money(data.collected) },
    { label: "Outstanding", value: money(data.outstanding), tone: FO.stop }
  ];

  // Revenue bars from real recent-order totals, oldest -> newest.
  const bars = useMemo(() => {
    const series = [...data.recentOrders].reverse().slice(-14).map((row) => row.total);
    return series.length ? series : [0];
  }, [data.recentOrders]);
  const maxBar = Math.max(...bars, 1);

  const collectedPct =
    data.billed > 0 ? Math.round((data.collected / data.billed) * 100) : 0;
  const paymentTotal = data.paymentBreakdown.reduce((sum, row) => sum + row.total, 0);
  const maxAging = Math.max(...data.aging.map((bucket) => bucket.total), 1);

  return (
    <Shell crumb="Ops / financial reports" wide>
      <header
        className="flex flex-wrap items-end justify-between gap-4 p-6"
        style={{ background: FO.panel, border: `2px solid ${FO.line}` }}
      >
        <div>
          <Stamp>Operations</Stamp>
          <h1
            className="mt-3 text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl"
            style={{ color: FO.ink }}
          >
            Financial reports
          </h1>
          <p
            className="mt-2 text-[12px] font-bold uppercase tracking-[0.1em]"
            style={{ color: FO.dim }}
          >
            Revenue · accounts receivable · gross margin
          </p>
        </div>
        <Link
          href="/design-lab/d5/orders"
          className="flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-[0.12em]"
          style={{ background: FO.panelHi, color: FO.ink, border: `2px solid ${FO.line}` }}
        >
          Order desk <ArrowRight size={14} strokeWidth={2.75} />
        </Link>
      </header>

      {!data.configured ? (
        <div
          className="mt-6 flex items-start gap-3 p-4"
          style={{ background: FO.warnSoft, border: `2px solid ${FO.warn}` }}
        >
          <Database size={20} strokeWidth={2.5} style={{ color: FO.warn }} className="shrink-0" />
          <div>
            <p
              className="text-[12px] font-black uppercase tracking-[0.12em]"
              style={{ color: FO.warn }}
            >
              Supabase not configured
            </p>
            <p className="mt-0.5 text-[12px] font-semibold" style={{ color: FO.dim }}>
              Add Supabase keys to <code>.env.local</code> to populate live financial data.
            </p>
          </div>
        </div>
      ) : null}

      {/* KPI grid */}
      <section
        className="mt-6 grid grid-cols-2 gap-px md:grid-cols-3 xl:grid-cols-6"
        style={{ background: FO.line, border: `2px solid ${FO.line}` }}
      >
        {kpis.map((kpi) => (
          <div key={kpi.label} className="p-4" style={{ background: FO.panel }}>
            <p
              className="text-[10px] font-black uppercase tracking-[0.14em]"
              style={{ color: FO.faint }}
            >
              {kpi.label}
            </p>
            <p
              className="mt-1.5 font-black"
              style={{
                color: kpi.tone ?? FO.ink,
                fontSize: kpi.big ? "1.65rem" : "1.35rem",
                lineHeight: 1.05
              }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {/* Revenue chart */}
          <Panel
            title="Revenue trend"
            kicker="// recent orders"
            right={
              data.hasCostData ? (
                <span
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.12em]"
                  style={{ color: FO.go }}
                >
                  <TrendingUp size={13} strokeWidth={2.75} />
                  {data.grossMarginPct.toFixed(1)}% margin
                </span>
              ) : null
            }
          >
            <div className="flex h-52 items-end gap-1.5 p-4">
              {bars.map((value, index) => (
                <div key={index} className="group flex flex-1 flex-col items-center gap-1.5">
                  <span
                    className="text-[8px] font-black opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: FO.dim }}
                  >
                    {money(value)}
                  </span>
                  <div
                    className="w-full"
                    style={{
                      height: `${Math.max((value / maxBar) * 100, 3)}%`,
                      background: index === bars.length - 1 ? FO.hi : FO.hiDark
                    }}
                  />
                </div>
              ))}
            </div>
            <div
              className="flex justify-between px-4 py-2 text-[9px] font-black uppercase tracking-[0.16em]"
              style={{ borderTop: `2px solid ${FO.line}`, color: FO.faint }}
            >
              <span>Oldest</span>
              <span>Most recent</span>
            </div>
          </Panel>

          {/* AR + aging */}
          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Collections" kicker="// billed vs collected">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-black uppercase tracking-[0.1em]"
                    style={{ color: FO.dim }}
                  >
                    Collection rate
                  </span>
                  <Chip tone={collectedPct >= 75 ? "go" : "warn"}>{collectedPct}%</Chip>
                </div>
                <div
                  className="mt-3 h-3"
                  style={{ background: FO.steel }}
                >
                  <div
                    className="h-3"
                    style={{
                      width: `${collectedPct}%`,
                      background: collectedPct >= 75 ? FO.go : FO.warn
                    }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-px" style={{ background: FO.line }}>
                  <ARStat label="Billed" value={money(data.billed)} />
                  <ARStat label="Collected" value={money(data.collected)} />
                </div>
                <div
                  className="mt-px flex items-center justify-between p-3"
                  style={{ background: FO.panelHi }}
                >
                  <span
                    className="text-[11px] font-black uppercase tracking-[0.12em]"
                    style={{ color: FO.dim }}
                  >
                    Outstanding
                  </span>
                  <span className="text-base font-black" style={{ color: FO.stop }}>
                    {money(data.outstanding)}
                  </span>
                </div>
              </div>
            </Panel>

            <Panel title="AR aging" kicker="// outstanding by age">
              <div className="flex flex-col gap-3 p-4">
                {data.aging.map((bucket) => (
                  <div key={bucket.bucket}>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[11px] font-black uppercase tracking-[0.1em]"
                        style={{ color: FO.dim }}
                      >
                        {bucket.bucket} days
                      </span>
                      <span className="text-[13px] font-black" style={{ color: FO.ink }}>
                        {money(bucket.total)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5" style={{ background: FO.steel }}>
                      <div
                        className="h-2.5"
                        style={{
                          width: `${Math.max((bucket.total / maxAging) * 100, 2)}%`,
                          background: bucket.bucket === "60+" ? FO.stop : FO.hi
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Gross profit */}
          <Panel title="Gross margin" kicker="// recent orders">
            <div className="p-4">
              {data.hasCostData ? (
                <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
                  <div>
                    <p
                      className="text-[10px] font-black uppercase tracking-[0.14em]"
                      style={{ color: FO.faint }}
                    >
                      Gross profit
                    </p>
                    <p className="text-3xl font-black" style={{ color: FO.hi }}>
                      {money(data.grossProfit)}
                    </p>
                  </div>
                  <p className="text-[12px] font-bold" style={{ color: FO.dim }}>
                    {data.grossMarginPct.toFixed(1)}% margin across recent orders.
                  </p>
                </div>
              ) : (
                <p className="text-[12px] font-semibold" style={{ color: FO.dim }}>
                  Gross margin stays hidden until product unit costs are entered in the
                  catalog manager — then it calculates from real cost data.
                </p>
              )}
            </div>
          </Panel>
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-6">
          <Panel title="Payment status" kicker="// by total">
            <div className="p-4">
              {data.paymentBreakdown.length ? (
                <>
                  <div className="flex h-3.5 overflow-hidden">
                    {data.paymentBreakdown.map((row) => {
                      const pct = paymentTotal > 0 ? (row.total / paymentTotal) * 100 : 0;
                      return (
                        <div
                          key={row.status}
                          style={{
                            width: `${pct}%`,
                            background: TONE_COLOR[paymentTone(row.status)]
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {data.paymentBreakdown.map((row) => (
                      <div key={row.status} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <Chip tone={paymentTone(row.status)}>{titleCase(row.status)}</Chip>
                          <span
                            className="text-[10px] font-bold uppercase tracking-[0.1em]"
                            style={{ color: FO.faint }}
                          >
                            {row.count} {row.count === 1 ? "order" : "orders"}
                          </span>
                        </span>
                        <span className="text-[13px] font-black" style={{ color: FO.ink }}>
                          {money(row.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[12px] font-semibold" style={{ color: FO.faint }}>
                  No orders in range.
                </p>
              )}
            </div>
          </Panel>

          <Panel
            title="Recent orders"
            kicker={`// ${data.recentOrders.length}`}
            right={<Beacon tone="go" />}
          >
            {data.recentOrders.length ? (
              <div className="flex flex-col gap-px" style={{ background: FO.line }}>
                {data.recentOrders.slice(0, 8).map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center gap-3 p-3"
                    style={{ background: FO.panel }}
                  >
                    <Beacon tone={paymentTone(row.paymentStatus)} />
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-[12px] font-black uppercase"
                        style={{ color: FO.ink }}
                      >
                        {row.orderNumber}
                      </p>
                      <p
                        className="truncate text-[10px] font-bold uppercase tracking-[0.08em]"
                        style={{ color: FO.faint }}
                      >
                        {row.customerName} · {shortDate(row.createdAt)}
                      </p>
                    </div>
                    <span className="text-[13px] font-black" style={{ color: FO.hi }}>
                      {money(row.total)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="p-4 text-[12px] font-semibold"
                style={{ color: FO.faint }}
              >
                No orders yet.
              </p>
            )}
            <Link
              href="/design-lab/d5/orders"
              className="flex items-center justify-between p-3 text-[10px] font-black uppercase tracking-[0.12em]"
              style={{ borderTop: `2px solid ${FO.line}`, color: FO.hi }}
            >
              Open order desk <ArrowRight size={13} strokeWidth={2.75} />
            </Link>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}

function ARStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3" style={{ background: FO.panelHi }}>
      <p
        className="text-[9px] font-black uppercase tracking-[0.14em]"
        style={{ color: FO.faint }}
      >
        {label}
      </p>
      <p className="mt-0.5 text-base font-black" style={{ color: FO.ink }}>
        {value}
      </p>
    </div>
  );
}
