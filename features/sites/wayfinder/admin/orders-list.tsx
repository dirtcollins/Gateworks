// Wayfinder admin — orders list. Reads the real order store (lib/order-store),
// bootstraps it from /api/orders, and supports search, status filtering, the
// warehouse workflow advance action, and CSV export. Status changes write back
// to the store and PATCH the orders API (best-effort).
"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import { fmt } from "../kit";
import {
  AdminBtn,
  DataTable,
  Ico,
  Mono,
  Panel,
  PageHead,
  Pill,
  FilterChips,
  TextInput,
  monoFont,
  wf,
  type Column
} from "./admin-kit";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDate,
  formatTime,
  nextWorkflowStep,
  orderAmountDue,
  orderStatusTone,
  paymentStatusTone
} from "./order-helpers";

type StatusTab =
  | "all"
  | "pending"
  | "processing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "ready_for_pickup", label: "Will-call" },
  { id: "out_for_delivery", label: "Delivery" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" }
];

function matchesTab(order: OrderRecord, tab: StatusTab) {
  if (tab === "all") return true;
  if (tab === "pending") return ["draft", "submitted"].includes(order.status);
  if (tab === "processing") return ["confirmed", "picking"].includes(order.status);
  return order.status === tab;
}

export function WayfinderOrdersList() {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");
  const [loaded, setLoaded] = useState(false);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((order) => {
        const hit =
          !q ||
          order.orderNumber.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          order.companyName.toLowerCase().includes(q) ||
          order.jobName.toLowerCase().includes(q);
        return hit && matchesTab(order, tab);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, query, tab]);

  function advance(order: OrderRecord) {
    const step = nextWorkflowStep(order);
    if (!step) return;
    updateOrderStatus(order.id, step.next, step.detail);
    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, status: step.next })
    }).catch(() => null);
  }

  function exportCsv() {
    const headers = [
      "Order",
      "Customer",
      "Status",
      "Payment",
      "Fulfillment",
      "Total",
      "Placed"
    ];
    const rows = filtered.map((order) =>
      [
        order.orderNumber,
        order.companyName || order.customerName,
        ORDER_STATUS_LABELS[order.status],
        PAYMENT_STATUS_LABELS[order.paymentStatus],
        order.fulfillmentMethod,
        order.total.toFixed(2),
        formatDate(order.createdAt)
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wayfinder-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  const columns: Column<OrderRecord>[] = [
    {
      key: "number",
      header: "Order",
      render: (o) => (
        <div style={{ display: "grid", gap: 2 }}>
          <Mono style={{ fontWeight: 700, fontSize: 12 }}>{o.orderNumber}</Mono>
          <span
            style={{
              fontSize: 10,
              fontFamily: monoFont,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: wf.muted
            }}
          >
            {o.fulfillmentMethod}
          </span>
        </div>
      )
    },
    {
      key: "customer",
      header: "Customer",
      render: (o) => (
        <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 800 }}>
            {o.companyName || o.customerName || "Unknown"}
          </span>
          <span style={{ fontSize: 11, color: wf.muted }}>
            {o.jobName || o.email || "—"}
          </span>
        </div>
      )
    },
    {
      key: "placed",
      header: "Placed",
      render: (o) => (
        <span style={{ fontFamily: monoFont, fontSize: 11, color: wf.steel }}>
          {formatDate(o.createdAt)}
          <br />
          <span style={{ color: wf.muted }}>{formatTime(o.createdAt)}</span>
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
      key: "payment",
      header: "Payment",
      render: (o) => (
        <Pill tone={paymentStatusTone(o.paymentStatus)}>
          {PAYMENT_STATUS_LABELS[o.paymentStatus]}
        </Pill>
      )
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (o) => (
        <div style={{ display: "grid", gap: 2 }}>
          <Mono style={{ fontWeight: 700 }}>{fmt(o.total)}</Mono>
          <span style={{ fontSize: 10, color: wf.muted, fontFamily: monoFont }}>
            Due {fmt(orderAmountDue(o))}
          </span>
        </div>
      )
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (o) => {
        const step = nextWorkflowStep(o);
        return (
          <div
            style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}
          >
            {step ? (
              <AdminBtn size="sm" onClick={() => advance(o)} title={step.detail}>
                {step.label}
              </AdminBtn>
            ) : null}
            <AdminBtn
              size="sm"
              variant="primary"
              href={`/admin/orders/${encodeURIComponent(o.id)}`}
            >
              Open
            </AdminBtn>
          </div>
        );
      }
    }
  ];

  return (
    <>
      <PageHead
        eyebrow="Operations"
        title="Orders"
        desc="Every order moving through the warehouse — confirm, pick, stage for will-call, and dispatch delivery."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <AdminBtn onClick={exportCsv}>
              <Ico.receipt size={14} /> Export CSV
            </AdminBtn>
            <AdminBtn href="/admin/orders/new" variant="primary">
              <Ico.plus size={14} /> New order
            </AdminBtn>
          </div>
        }
      />

      <Panel
        title="Order queue"
        meta={loaded ? `${filtered.length} of ${orders.length} orders` : "Loading…"}
        action={
          <div style={{ width: 260, maxWidth: "100%" }}>
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order, customer, job…"
              style={{ height: 34, fontSize: 12 }}
            />
          </div>
        }
        pad={false}
      >
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${wf.hairline}` }}>
          <FilterChips value={tab} options={STATUS_TABS} onChange={setTab} />
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          getKey={(o) => o.id}
          empty={
            loaded
              ? "No orders match the current filters."
              : "Loading orders from the warehouse…"
          }
        />
      </Panel>
    </>
  );
}
