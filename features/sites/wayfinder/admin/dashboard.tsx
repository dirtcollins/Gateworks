// Wayfinder admin — operations dashboard. Real KPI snapshot pulled from the
// live order store (orders, queue, will-call, revenue) plus catalog counts
// passed from the server. Bootstraps the order store from /api/orders so the
// numbers reflect persisted Supabase data when configured.
"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import { fmt } from "../kit";
import {
  AdminBtn,
  DataTable,
  Ico,
  Kpi,
  Mono,
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

type DashboardProps = {
  productCount: number;
  lowStockCount: number;
};

function isWithinDays(value: string, days: number) {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() - time <= days * 24 * 60 * 60 * 1000;
}

export function WayfinderAdminDashboard({ productCount, lowStockCount }: DashboardProps) {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const [loaded, setLoaded] = useState(false);

  // Rehydrate the persisted order store and pull the server copy of orders.
  useEffect(() => {
    useOrderStore.persist.rehydrate();
    async function load() {
      try {
        const res = await fetch("/api/orders?limit=250&includeItems=false", {
          cache: "no-store"
        });
        if (res.ok) {
          const payload = (await res.json()) as { orders?: OrderRecord[]; persisted?: boolean };
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
  const quotes = useMemo(
    () => storedOrders.filter((order) => order.isQuoteRequest),
    [storedOrders]
  );

  const stats = useMemo(() => {
    const open = orders.filter(
      (o) => !["completed", "cancelled"].includes(o.status)
    );
    const willCall = orders.filter((o) => o.status === "ready_for_pickup");
    const picking = orders.filter((o) => o.status === "picking");
    const revenue30 = orders
      .filter((o) => o.status !== "cancelled" && isWithinDays(o.createdAt, 30))
      .reduce((sum, o) => sum + o.total, 0);
    const orders30 = orders.filter(
      (o) => o.status !== "cancelled" && isWithinDays(o.createdAt, 30)
    ).length;
    return {
      open: open.length,
      willCall: willCall.length,
      picking: picking.length,
      revenue30,
      orders30,
      openQuotes: quotes.filter((q) => !["completed", "cancelled"].includes(q.status))
        .length
    };
  }, [orders, quotes]);

  const recent = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 8),
    [orders]
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
        desc="Live snapshot of the warehouse — orders in flight, will-call queue, quote pipeline, and catalog stock."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <AdminBtn href="/admin/orders/new" variant="primary">
              <Ico.plus size={14} /> New order
            </AdminBtn>
            <AdminBtn href="/admin/orders">Open orders</AdminBtn>
          </div>
        }
      />

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))"
        }}
      >
        <Kpi label="Open orders" value={stats.open} hint="in active workflow" tone="ink" />
        <Kpi
          label="Picking now"
          value={stats.picking}
          hint="being pulled in aisles"
          tone="safety"
        />
        <Kpi
          label="Will-call queue"
          value={stats.willCall}
          hint="staged at Bay 7"
          tone="pine"
        />
        <Kpi
          label="Revenue · 30d"
          value={fmt(stats.revenue30, { cents: false })}
          hint={`${stats.orders30} orders`}
          tone="ink"
        />
        <Kpi
          label="Open quotes"
          value={stats.openQuotes}
          hint="awaiting conversion"
          tone="ink"
        />
        <Kpi
          label="Low stock SKUs"
          value={lowStockCount}
          hint={`of ${productCount.toLocaleString()} catalog items`}
          tone={lowStockCount > 0 ? "red" : "pine"}
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(0, 2fr) minmax(240px, 1fr)"
        }}
        className="wf-admin-dash-grid"
      >
        <Panel
          title="Recent orders"
          meta={loaded ? `${orders.length} total` : "Loading…"}
          action={<AdminBtn href="/admin/orders" size="sm">View all</AdminBtn>}
          pad={false}
        >
          <DataTable
            columns={columns}
            rows={recent}
            getKey={(o) => o.id}
            empty={loaded ? "No orders yet — create one to get started." : "Loading orders…"}
            onRowHref={(o) => `/admin/orders/${encodeURIComponent(o.id)}`}
          />
        </Panel>

        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel title="Will-call board">
            <div style={{ display: "grid", gap: 10 }}>
              <Row label="Cutoff" value="11:00 AM same-day" />
              <Row label="Staging bay" value="Bay 7 · aisle order" />
              <Row
                label="Staged orders"
                value={`${stats.willCall} ready`}
                tone={stats.willCall > 0 ? "pine" : "neutral"}
              />
              <Row
                label="Picking"
                value={`${stats.picking} in progress`}
                tone={stats.picking > 0 ? "safety" : "neutral"}
              />
            </div>
          </Panel>
          <Panel title="Shortcuts">
            <div style={{ display: "grid", gap: 8 }}>
              <AdminBtn href="/admin/orders/new" block>
                <Ico.plus size={14} /> New order
              </AdminBtn>
              <AdminBtn href="/admin/quotes" block>
                <Ico.receipt size={14} /> Quotes pipeline
              </AdminBtn>
              <AdminBtn href="/admin/reports" block>
                <Ico.map size={14} /> Financial reports
              </AdminBtn>
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

function Row({
  label,
  value,
  tone = "neutral"
}: {
  label: string;
  value: string;
  tone?: "neutral" | "pine" | "safety";
}) {
  const color = tone === "pine" ? wf.pine : tone === "safety" ? wf.safety : wf.ink;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 12
      }}
    >
      <span style={{ color: wf.steel, fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: monoFont, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}
