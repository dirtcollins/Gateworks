// d11 "Wayfinder" — Admin orders.
// The prototype has no orders page; this builds one in the d11 visual
// language (black context bar shell, hairline cards, mono SKU/order text,
// tag styling). Wired to real orders via useLiveOrders().
"use client";

import { useMemo, useState } from "react";
import { useLiveOrders } from "@/features/design-lab/use-live-orders";
import type { OrderRecord } from "@/lib/order-store";
import {
  Card,
  D11Shell,
  Eyebrow,
  Ico,
  Mono,
  Tag,
  d11,
  fmt,
  monoFont
} from "./kit";

type DisplayStatus = "New" | "Picking" | "Ready" | "Completed";

function toDisplayStatus(status: OrderRecord["status"]): DisplayStatus {
  if (status === "completed") return "Completed";
  if (status === "ready_for_pickup" || status === "out_for_delivery") return "Ready";
  if (status === "confirmed" || status === "picking") return "Picking";
  return "New";
}

const STATUS_TONE: Record<DisplayStatus, "steel" | "in" | "out" | "solid"> = {
  New: "solid",
  Picking: "steel",
  Ready: "in",
  Completed: "in"
};

const TABS: ("All" | DisplayStatus)[] = ["All", "New", "Picking", "Ready", "Completed"];

function relativeTime(value: string) {
  const created = new Date(value).getTime();
  if (!Number.isFinite(created)) return "—";
  const minutes = Math.round((Date.now() - created) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

export function D11Orders() {
  const { orders, isLoading } = useLiveOrders();
  const [tab, setTab] = useState<"All" | DisplayStatus>("All");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customerName || "Guest customer",
        company: order.companyName || order.customerName || "—",
        units: order.items.reduce((sum, item) => sum + (item.quantity || 0), 0),
        skus: order.items.length,
        total: order.total,
        status: toDisplayStatus(order.status),
        channel: order.isQuoteRequest
          ? "Quote"
          : order.fulfillmentMethod === "pickup"
            ? "Will-call"
            : "Delivery",
        placed: relativeTime(order.createdAt)
      })),
    [orders]
  );

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const matchesTab = tab === "All" || row.status === tab;
        const normalized = query.trim().toLowerCase();
        const matchesQuery =
          !normalized ||
          row.customer.toLowerCase().includes(normalized) ||
          row.company.toLowerCase().includes(normalized) ||
          row.orderNumber.toLowerCase().includes(normalized);
        return matchesTab && matchesQuery;
      }),
    [rows, tab, query]
  );

  const stats = useMemo(() => {
    const revenue = rows.reduce((sum, row) => sum + row.total, 0);
    return {
      open: rows.filter((row) => row.status !== "Completed").length,
      ready: rows.filter((row) => row.status === "Ready").length,
      revenue,
      avg: rows.length ? revenue / rows.length : 0
    };
  }, [rows]);

  return (
    <D11Shell active="orders">
      {/* Header */}
      <div
        style={{
          padding: "20px 24px 12px",
          borderBottom: `1px solid ${d11.rail}`,
          background: d11.paper
        }}
      >
        <Eyebrow>Gateworks Supply · Operations</Eyebrow>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: "-0.01em",
            marginTop: 4
          }}
        >
          Order desk
        </h1>
        <p style={{ fontSize: 13, color: d11.steel, marginTop: 6 }}>
          {stats.open} order{stats.open === 1 ? "" : "s"} on the floor · keep the
          will-call queue moving before the 11A cutoff.
        </p>
      </div>

      <div style={{ padding: "20px 24px 40px" }}>
        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 1,
            background: d11.rail,
            border: `1px solid ${d11.rail}`
          }}
        >
          {[
            { label: "Open orders", value: String(stats.open) },
            { label: "Ready for pickup", value: String(stats.ready) },
            {
              label: "Total revenue",
              value: fmt(stats.revenue, { cents: false })
            },
            { label: "Avg. order value", value: fmt(stats.avg, { cents: false }) }
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#fff", padding: 16 }}>
              <Mono
                style={{ fontSize: 10, color: d11.muted, textTransform: "uppercase" }}
              >
                {stat.label}
              </Mono>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  marginTop: 6,
                  letterSpacing: "-0.01em"
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 20,
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TABS.map((tabName) => {
              const count =
                tabName === "All"
                  ? rows.length
                  : rows.filter((row) => row.status === tabName).length;
              const on = tab === tabName;
              return (
                <button
                  key={tabName}
                  type="button"
                  onClick={() => setTab(tabName)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    minHeight: 36,
                    padding: "0 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: d11.ink,
                    cursor: "pointer",
                    border: on ? `2px solid ${d11.ink}` : `1px solid ${d11.rail}`,
                    background: on ? d11.amber : "#fff"
                  }}
                >
                  {tabName}
                  <Mono style={{ fontSize: 10, color: d11.muted }}>{count}</Mono>
                </button>
              );
            })}
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              alignItems: "center",
              gap: 8,
              border: `1px solid ${d11.rail}`,
              background: "#fff",
              padding: "0 12px",
              height: 36
            }}
          >
            <Ico.search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search orders, customers…"
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: 13,
                fontWeight: 600,
                width: 200
              }}
            />
          </div>
        </div>

        {/* Table */}
        <Card style={{ marginTop: 16, padding: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "150px 1fr 120px 90px 110px 130px",
              gap: 0,
              padding: "10px 16px",
              borderBottom: `1px solid ${d11.rail}`,
              background: d11.paper,
              fontFamily: monoFont,
              fontSize: 10,
              textTransform: "uppercase",
              fontWeight: 700,
              color: d11.muted,
              letterSpacing: "0.06em"
            }}
          >
            <span>Order</span>
            <span>Customer</span>
            <span>Channel</span>
            <span>Units</span>
            <span>Total</span>
            <span style={{ textAlign: "right" }}>Status</span>
          </div>

          {isLoading ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <Mono style={{ fontSize: 12, color: d11.muted }}>
                Loading live orders…
              </Mono>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <span style={{ color: d11.pine, display: "inline-flex" }}>
                <Ico.check size={32} />
              </span>
              <div style={{ fontSize: 16, fontWeight: 900, marginTop: 10 }}>
                {rows.length === 0 ? "No orders yet." : "All caught up."}
              </div>
              <p style={{ fontSize: 12, color: d11.steel, marginTop: 4 }}>
                {rows.length === 0
                  ? "Live orders will appear here as they come in."
                  : "No orders match this view."}
              </p>
            </div>
          ) : (
            filtered.map((row, index) => (
              <div
                key={row.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "150px 1fr 120px 90px 110px 130px",
                  gap: 0,
                  padding: "12px 16px",
                  alignItems: "center",
                  borderBottom:
                    index < filtered.length - 1
                      ? `1px solid ${d11.hairline}`
                      : "none",
                  background: index % 2 === 0 ? "#fff" : d11.bone
                }}
              >
                <div>
                  <Mono style={{ fontSize: 12, fontWeight: 700, color: d11.ink }}>
                    {row.orderNumber}
                  </Mono>
                  <div style={{ fontSize: 10, color: d11.muted }}>{row.placed}</div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: d11.ink }}>
                    {row.customer}
                  </div>
                  <div style={{ fontSize: 11, color: d11.steel }}>{row.company}</div>
                </div>
                <Mono style={{ fontSize: 11, color: d11.steel }}>{row.channel}</Mono>
                <Mono style={{ fontSize: 12, color: d11.ink }}>
                  {row.units} · {row.skus} SKU
                </Mono>
                <span style={{ fontSize: 14, fontWeight: 900, color: d11.ink }}>
                  {fmt(row.total)}
                </span>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Tag tone={STATUS_TONE[row.status]}>{row.status}</Tag>
                </div>
              </div>
            ))
          )}
        </Card>

        <Mono
          style={{ fontSize: 11, color: d11.muted, marginTop: 12, display: "block" }}
        >
          Showing {filtered.length} of {rows.length} orders
        </Mono>
      </div>
    </D11Shell>
  );
}
