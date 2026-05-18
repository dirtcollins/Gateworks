// Wayfinder admin — operations command center. Combines server-aggregated
// financials (revenue trend, AOV, receivables — from lib/reports-data) with the
// live order store so the warehouse sees money, the fulfillment pipeline, and
// what needs attention in one view. Server data carries trend/deltas; the order
// store carries the live in-flight pipeline.
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import type { OrderStatus } from "@/lib/platform-backend";
import type { ReportData } from "@/lib/reports-data";
import { fmt } from "../kit";
import {
  AdminBtn,
  DataTable,
  Ico,
  Mono,
  Notice,
  Panel,
  PageHead,
  Pill,
  monoFont,
  wf,
  type Column
} from "./admin-kit";
import {
  ORDER_STATUS_LABELS,
  formatDate,
  formatTime,
  orderStatusTone
} from "./order-helpers";
import { Delta, Sparkline, TrendChart, TrendKpi } from "./charts";

type DashboardProps = {
  reportData: ReportData;
  productCount: number;
  lowStockCount: number;
};

const DAY = 24 * 60 * 60 * 1000;

function isWithinDays(value: string, days: number) {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time <= days * DAY;
}

export function WayfinderAdminDashboard({
  reportData,
  productCount,
  lowStockCount
}: DashboardProps) {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    useOrderStore.persist.rehydrate();
    async function load() {
      try {
        const res = await fetch("/api/orders?limit=250&includeItems=false", {
          cache: "no-store"
        });
        if (res.ok) {
          const payload = (await res.json()) as {
            orders?: OrderRecord[];
            persisted?: boolean;
          };
          if (payload.persisted && payload.orders) setOrders(payload.orders);
        }
      } finally {
        setLoaded(true);
      }
    }
    void load();
  }, [setOrders]);

  const orders = useMemo(
    () => storedOrders.filter((order) => !order.isQuoteRequest),
    [storedOrders]
  );
  const openQuotes = useMemo(
    () =>
      storedOrders.filter(
        (order) =>
          order.isQuoteRequest &&
          !["completed", "cancelled"].includes(order.status)
      ).length,
    [storedOrders]
  );

  // Fulfillment pipeline — live counts by warehouse stage.
  const pipeline = useMemo(() => {
    const count = (...statuses: OrderStatus[]) =>
      orders.filter((o) => statuses.includes(o.status)).length;
    return {
      pending: count("draft", "submitted"),
      confirmed: count("confirmed"),
      picking: count("picking"),
      willCall: count("ready_for_pickup"),
      delivery: count("out_for_delivery"),
      completed30: orders.filter(
        (o) => o.status === "completed" && isWithinDays(o.createdAt, 30)
      ).length
    };
  }, [orders]);

  const recent = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 8),
    [orders]
  );

  // Server-side daily series drives the trend KPIs and the revenue chart.
  const daily = reportData.daily;
  const last30 = daily.slice(-30);
  const spark14 = daily.slice(-14);
  const today = daily[daily.length - 1];
  const yesterday = daily[daily.length - 2];
  const avg7 =
    daily.slice(-7).reduce((sum, d) => sum + d.revenue, 0) / Math.max(1, 7);

  const triage = useMemo(
    () => buildTriage(pipeline, openQuotes, lowStockCount),
    [pipeline, openQuotes, lowStockCount]
  );

  const columns: Column<OrderRecord>[] = [
    {
      key: "number",
      header: "Order",
      render: (o) => (
        <Mono style={{ fontWeight: 700, fontSize: 12 }}>{o.orderNumber}</Mono>
      )
    },
    {
      key: "customer",
      header: "Customer",
      render: (o) => (
        <span style={{ fontWeight: 700 }}>
          {o.companyName || o.customerName || "Unknown"}
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (o) => (
        <Pill tone={orderStatusTone(o.status)}>{ORDER_STATUS_LABELS[o.status]}</Pill>
      )
    },
    {
      key: "date",
      header: "Placed",
      render: (o) => (
        <span style={{ color: wf.muted, fontFamily: monoFont, fontSize: 11 }}>
          {formatDate(o.createdAt)} · {formatTime(o.createdAt)}
        </span>
      )
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (o) => <Mono style={{ fontWeight: 700 }}>{fmt(o.total)}</Mono>
    }
  ];

  return (
    <>
      <PageHead
        eyebrow="Operations console"
        title="Dashboard"
        desc="Money, the fulfillment pipeline, and what needs attention — one warehouse view."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <AdminBtn href="/admin/orders/new" variant="primary">
              <Ico.plus size={14} /> New order
            </AdminBtn>
            <AdminBtn href="/admin/orders">Open orders</AdminBtn>
          </div>
        }
      />

      {!reportData.configured ? (
        <Notice tone="warn">
          Supabase is not configured — revenue trends are unavailable. The
          fulfillment pipeline below still reflects locally stored orders.
        </Notice>
      ) : null}

      {/* Trend KPI strip — server financials with period-over-period deltas */}
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))"
        }}
      >
        <TrendKpi
          label="Revenue · 30d"
          value={fmt(reportData.revenue30, { cents: false })}
          accent={wf.pine}
          delta={<Delta current={reportData.revenue30} previous={reportData.revenuePrev30} />}
          spark={<Sparkline values={spark14.map((d) => d.revenue)} color={wf.pine} />}
        />
        <TrendKpi
          label="Orders · 30d"
          value={reportData.orders30}
          accent={wf.ink}
          delta={<Delta current={reportData.orders30} previous={reportData.ordersPrev30} />}
          spark={<Sparkline values={spark14.map((d) => d.orders)} color={wf.ink} />}
        />
        <TrendKpi
          label="Avg order value"
          value={fmt(reportData.avgOrderValue, { cents: false })}
          accent={wf.ink}
          delta={
            <Delta
              current={reportData.avgOrderValue}
              previous={reportData.avgOrderValuePrev}
            />
          }
        />
        <TrendKpi
          label="Outstanding AR"
          value={fmt(reportData.outstanding, { cents: false })}
          accent={reportData.outstanding > 0 ? wf.red : wf.pine}
          hint={`${reportData.collectionRatePct.toFixed(0)}% of billed collected`}
        />
      </div>

      {/* Fulfillment pipeline — live, by warehouse stage */}
      <Panel
        title="Fulfillment pipeline"
        meta="Live orders by warehouse stage"
        action={
          <span style={{ fontFamily: monoFont, fontSize: 11, color: wf.muted }}>
            {pipeline.completed30} completed · 30d
          </span>
        }
      >
        <div style={{ display: "flex", alignItems: "stretch", overflowX: "auto" }}>
          <Stage
            label="Awaiting confirm"
            count={pipeline.pending}
            caption="needs review"
            accent={pipeline.pending > 0 ? "#1d4ed8" : wf.rail}
            href="/admin/orders"
          />
          <Chevron />
          <Stage
            label="Confirmed"
            count={pipeline.confirmed}
            caption="queued to pick"
            accent={wf.steel}
            href="/admin/orders"
          />
          <Chevron />
          <Stage
            label="Picking"
            count={pipeline.picking}
            caption="in the aisles"
            accent={pipeline.picking > 0 ? wf.safety : wf.rail}
            href="/admin/orders"
          />
          <Chevron />
          <Stage
            label="Will-call"
            count={pipeline.willCall}
            caption="staged at Bay 7"
            accent={pipeline.willCall > 0 ? wf.pine : wf.rail}
            href="/admin/orders"
          />
          <Chevron />
          <Stage
            label="Out for delivery"
            count={pipeline.delivery}
            caption="on the truck"
            accent={pipeline.delivery > 0 ? wf.pine : wf.rail}
            href="/admin/orders"
          />
        </div>
      </Panel>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(0, 1.55fr) minmax(260px, 1fr)"
        }}
        className="wf-admin-dash-grid"
      >
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel
            title="Needs attention"
            meta={
              triage.length
                ? `${triage.length} ${triage.length === 1 ? "item" : "items"}`
                : "Nothing pending"
            }
            pad={false}
          >
            {triage.length ? (
              <div>
                {triage.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "11px 16px",
                      borderBottom: `1px solid ${wf.hairline}`
                    }}
                  >
                    <span
                      style={{
                        display: "grid",
                        placeItems: "center",
                        minWidth: 30,
                        height: 30,
                        padding: "0 6px",
                        background: item.accent,
                        color: "#fff",
                        fontFamily: monoFont,
                        fontSize: 13,
                        fontWeight: 800
                      }}
                    >
                      {item.count}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{ display: "block", fontSize: 13, fontWeight: 700, color: wf.ink }}
                      >
                        {item.label}
                      </span>
                      <span style={{ display: "block", fontSize: 11, color: wf.muted }}>
                        {item.detail}
                      </span>
                    </span>
                    <Ico.chevronRight size={15} style={{ color: wf.muted }} />
                  </Link>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "28px 16px",
                  textAlign: "center",
                  color: wf.pine,
                  fontFamily: monoFont,
                  fontSize: 13,
                  fontWeight: 700
                }}
              >
                <Ico.check size={20} /> All clear — nothing needs attention.
              </div>
            )}
          </Panel>

          <Panel
            title="Recent orders"
            meta={loaded ? `${orders.length} total` : "Loading…"}
            action={
              <AdminBtn href="/admin/orders" size="sm">
                View all
              </AdminBtn>
            }
            pad={false}
          >
            <DataTable
              columns={columns}
              rows={recent}
              getKey={(o) => o.id}
              empty={
                loaded ? "No orders yet — create one to get started." : "Loading orders…"
              }
              onRowHref={(o) => `/admin/orders/${encodeURIComponent(o.id)}`}
            />
          </Panel>
        </div>

        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel title="Revenue · 30 days" meta="Daily booked revenue">
            <TrendChart
              points={last30.map((d) => ({
                label: shortDate(d.date),
                value: d.revenue,
                caption: `${d.orders} ${d.orders === 1 ? "order" : "orders"}`
              }))}
              accent={wf.pine}
              height={188}
              format={(n) => fmt(n, { cents: false })}
            />
          </Panel>

          <Panel title="Today">
            <div style={{ display: "grid", gap: 12 }}>
              <TodayRow
                label="Booked today"
                value={fmt(today?.revenue || 0, { cents: false })}
                sub={
                  <Delta
                    current={today?.revenue || 0}
                    previous={yesterday?.revenue || 0}
                    suffix="vs yesterday"
                  />
                }
              />
              <TodayRow
                label="Orders today"
                value={String(today?.orders || 0)}
                sub={
                  <Delta
                    current={today?.orders || 0}
                    previous={yesterday?.orders || 0}
                    suffix="vs yesterday"
                  />
                }
              />
              <TodayRow
                label="7-day daily avg"
                value={fmt(avg7, { cents: false })}
                sub={
                  <span style={{ fontFamily: monoFont, fontSize: 10, color: wf.muted }}>
                    revenue per day
                  </span>
                }
              />
              <div
                style={{
                  borderTop: `1px solid ${wf.hairline}`,
                  paddingTop: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline"
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: wf.steel }}>
                  Low-stock SKUs
                </span>
                <Link
                  href="/admin/inventory"
                  style={{
                    fontFamily: monoFont,
                    fontWeight: 700,
                    color: lowStockCount > 0 ? wf.red : wf.pine
                  }}
                >
                  {lowStockCount} / {productCount.toLocaleString()}
                </Link>
              </div>
            </div>
          </Panel>
        </div>
      </div>
      <style>{`
        @media (max-width: 880px) {
          .wf-admin-dash-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

type TriageItem = {
  key: string;
  count: number;
  label: string;
  detail: string;
  href: string;
  accent: string;
  weight: number;
};

function buildTriage(
  pipeline: {
    pending: number;
    picking: number;
    willCall: number;
    delivery: number;
  },
  openQuotes: number,
  lowStockCount: number
): TriageItem[] {
  const items: TriageItem[] = [
    {
      key: "pending",
      count: pipeline.pending,
      label: "New orders awaiting confirmation",
      detail: "Review and route to the warehouse floor",
      href: "/admin/orders",
      accent: "#1d4ed8",
      weight: 5
    },
    {
      key: "quotes",
      count: openQuotes,
      label: "Open quotes to convert",
      detail: "Follow up before they go cold",
      href: "/admin/quotes",
      accent: wf.safety,
      weight: 4
    },
    {
      key: "lowstock",
      count: lowStockCount,
      label: "SKUs at or below reorder point",
      detail: "Raise purchase orders to restock",
      href: "/admin/inventory",
      accent: wf.red,
      weight: 3
    },
    {
      key: "picking",
      count: pipeline.picking,
      label: "Orders being picked",
      detail: "Pulls in progress across the aisles",
      href: "/admin/orders",
      accent: wf.safety,
      weight: 2
    },
    {
      key: "willcall",
      count: pipeline.willCall,
      label: "Staged for will-call pickup",
      detail: "Waiting on the customer at Bay 7",
      href: "/admin/orders",
      accent: wf.pine,
      weight: 1
    }
  ];

  return items
    .filter((item) => item.count > 0)
    .sort((a, b) => b.weight - a.weight);
}

function Stage({
  label,
  count,
  caption,
  accent,
  href
}: {
  label: string;
  count: number;
  caption: string;
  accent: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        flex: "1 0 132px",
        display: "grid",
        gap: 3,
        padding: "12px 14px",
        borderTop: `3px solid ${accent}`,
        background: count > 0 ? "#fff" : wf.bone
      }}
    >
      <span
        style={{
          fontFamily: monoFont,
          fontSize: 24,
          fontWeight: 700,
          color: count > 0 ? wf.ink : wf.muted,
          lineHeight: 1
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: wf.ink
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 10, color: wf.muted, fontFamily: monoFont }}>
        {caption}
      </span>
    </Link>
  );
}

function Chevron() {
  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        padding: "0 2px",
        color: wf.rail,
        flexShrink: 0
      }}
    >
      <Ico.chevronRight size={16} />
    </div>
  );
}

function TodayRow({
  label,
  value,
  sub
}: {
  label: string;
  value: string;
  sub: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: wf.steel }}>{label}</span>
      <span style={{ display: "grid", justifyItems: "end", gap: 2 }}>
        <Mono style={{ fontWeight: 700, fontSize: 15, color: wf.ink }}>{value}</Mono>
        {sub}
      </span>
    </div>
  );
}

function shortDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(date);
}
