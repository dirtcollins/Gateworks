"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, FileDown, Plus, Receipt, Search } from "lucide-react";
import { LEDGER, formatUsd, formatUsd0 } from "@/features/sites/ledger/kit";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import type { OrderStatus, PaymentStatus } from "@/lib/platform-backend";
import {
  AdminCard,
  AdminEmpty,
  AdminGhostButton,
  AdminHeading,
  AdminPrimaryButton,
  StatTile,
  StatusPill,
  formatAdminDate,
  orderStatusTone,
  paymentStatusTone,
  titleCase
} from "./admin-kit";

type StatusTab =
  | "all"
  | "pending"
  | "processing"
  | "ready"
  | "completed"
  | "cancelled";

const orderStatusLabels: Record<OrderStatus, string> = {
  draft: "Draft",
  submitted: "Pending",
  confirmed: "Processing",
  picking: "Picking",
  ready_for_pickup: "Ready for pickup",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled"
};

const paymentLabels: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  overpaid: "Overpaid",
  refunded: "Refunded",
  failed: "Failed"
};

const TABS: Array<{ id: StatusTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" }
];

function matchesTab(order: OrderRecord, tab: StatusTab) {
  if (tab === "all") return true;
  if (tab === "pending") return ["draft", "submitted"].includes(order.status);
  if (tab === "processing") return ["confirmed", "picking"].includes(order.status);
  if (tab === "ready")
    return ["ready_for_pickup", "out_for_delivery"].includes(order.status);
  if (tab === "completed") return order.status === "completed";
  return order.status === "cancelled";
}

function amountDue(order: OrderRecord) {
  if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") return 0;
  return order.total;
}

/* Workflow advance — mirrors the real admin orders dashboard pipeline. */
function nextWorkflow(order: OrderRecord): { label: string; next: OrderStatus; detail: string } | null {
  if (order.status === "draft" || order.status === "submitted") {
    return {
      label: "Confirm",
      next: "confirmed",
      detail: "Order confirmed and sent to the warehouse."
    };
  }
  if (order.status === "confirmed") {
    return {
      label: "Start picking",
      next: "picking",
      detail: "Order moved to the picking queue."
    };
  }
  if (order.status === "picking") {
    return order.fulfillmentMethod === "pickup"
      ? {
          label: "Ready for pickup",
          next: "ready_for_pickup",
          detail: "Picking complete; staged for pickup."
        }
      : {
          label: "Out for delivery",
          next: "out_for_delivery",
          detail: "Order dispatched for delivery."
        };
  }
  if (order.status === "ready_for_pickup" || order.status === "out_for_delivery") {
    return {
      label: "Mark complete",
      next: "completed",
      detail: "Order completed and closed."
    };
  }
  return null;
}

/* Ledger admin orders — the operations order list. Loads real orders
 * from /api/orders, supports search + status tabs, advances orders
 * through the fulfillment workflow against the real order store and
 * the /api/orders PATCH route, and exports a CSV. */
export function LedgerAdminOrders() {
  const storeOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await fetch("/api/orders?limit=250&includeItems=false", {
          cache: "no-store"
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          orders?: OrderRecord[];
          persisted?: boolean;
        };
        if (mounted && payload.persisted && payload.orders) {
          setOrders(payload.orders);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [setOrders]);

  const orders = useMemo(
    () => storeOrders.filter((order) => !order.isQuoteRequest),
    [storeOrders]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        !normalized ||
        order.orderNumber.toLowerCase().includes(normalized) ||
        order.customerName.toLowerCase().includes(normalized) ||
        order.companyName.toLowerCase().includes(normalized) ||
        order.jobName.toLowerCase().includes(normalized);
      return matchesQuery && matchesTab(order, tab);
    });
  }, [orders, query, tab]);

  const totals = useMemo(() => {
    const open = orders.filter((order) =>
      ["submitted", "confirmed", "picking", "ready_for_pickup", "out_for_delivery"].includes(
        order.status
      )
    ).length;
    const value = orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0);
    const due = orders.reduce((sum, order) => sum + amountDue(order), 0);
    return { open, value, due };
  }, [orders]);

  function advance(order: OrderRecord) {
    const action = nextWorkflow(order);
    if (!action) return;
    updateOrderStatus(order.id, action.next, action.detail);
    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, status: action.next })
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
      "Created"
    ];
    const rows = filtered.map((order) =>
      [
        order.orderNumber,
        order.companyName || order.customerName,
        orderStatusLabels[order.status],
        paymentLabels[order.paymentStatus],
        order.fulfillmentMethod,
        formatUsd(order.total),
        formatAdminDate(order.createdAt)
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ledger-orders-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="grid gap-6">
      <AdminHeading
        eyebrow="Operations"
        title="Orders"
        description="Every purchase order in the workspace, with fulfillment workflow and payment status."
        action={
          <div className="flex gap-2">
            <AdminGhostButton onClick={exportCsv}>
              <FileDown className="h-4 w-4" /> Export
            </AdminGhostButton>
            <Link href="/ledger/admin/orders/new">
              <AdminPrimaryButton>
                <Plus className="h-4 w-4" /> New order
              </AdminPrimaryButton>
            </Link>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Open orders" value={String(totals.open)} sub="In fulfillment" />
        <StatTile label="Order value" value={formatUsd0(totals.value)} sub="Excluding cancelled" />
        <StatTile
          label="Amount due"
          value={formatUsd0(totals.due)}
          sub="Unpaid balance"
          accent={totals.due > 0 ? LEDGER.amber : LEDGER.mint}
        />
      </section>

      <AdminCard>
        {/* Toolbar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 p-4"
          style={{ borderBottom: `1px solid ${LEDGER.line}` }}
        >
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((option) => {
              const active = tab === option.id;
              return (
                <button
                  key={option.id}
                  className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
                  onClick={() => setTab(option.id)}
                  style={{
                    backgroundColor: active ? LEDGER.indigo : LEDGER.canvas,
                    color: active ? "#ffffff" : LEDGER.body
                  }}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ border: `1px solid ${LEDGER.line}` }}
          >
            <Search className="h-4 w-4" style={{ color: LEDGER.muted }} />
            <input
              aria-label="Search orders"
              className="w-44 bg-transparent text-[13px] outline-none sm:w-60"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order, customer, or job"
              style={{ color: LEDGER.ink }}
              value={query}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: LEDGER.muted, borderBottom: `1px solid ${LEDGER.line}` }}
              >
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Placed</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3">Fulfillment</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, index) => {
                const action = nextWorkflow(order);
                return (
                  <tr
                    key={order.id}
                    style={{ borderTop: index === 0 ? "none" : `1px solid ${LEDGER.line}` }}
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        className="text-[13px] font-semibold transition hover:underline"
                        href={`/ledger/admin/orders/${order.id}`}
                        style={{ color: LEDGER.indigo }}
                      >
                        {order.orderNumber}
                      </Link>
                      <p
                        className="text-[11px] font-medium uppercase tracking-[0.06em]"
                        style={{ color: LEDGER.muted }}
                      >
                        {order.fulfillmentMethod}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p
                        className="text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {order.companyName || order.customerName || "Unassigned"}
                      </p>
                      <p className="text-[12px]" style={{ color: LEDGER.body }}>
                        {order.jobName || order.email || "—"}
                      </p>
                    </td>
                    <td
                      className="px-5 py-3.5 text-[13px] font-medium"
                      style={{ color: LEDGER.body }}
                    >
                      {formatAdminDate(order.createdAt)}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {formatUsd(order.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill tone={orderStatusTone(order.status)}>
                        {orderStatusLabels[order.status]}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill tone={paymentStatusTone(order.paymentStatus)}>
                        {titleCase(order.paymentStatus)}
                      </StatusPill>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {action ? (
                          <button
                            className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition"
                            onClick={() => advance(order)}
                            style={{
                              backgroundColor: LEDGER.indigoSoft,
                              color: LEDGER.indigo
                            }}
                            type="button"
                          >
                            {action.label}
                          </button>
                        ) : null}
                        <Link
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition"
                          href={`/ledger/admin/orders/${order.id}`}
                          style={{
                            border: `1px solid ${LEDGER.line}`,
                            color: LEDGER.ink
                          }}
                        >
                          Open <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {isLoading ? (
          <p
            className="px-5 py-14 text-center text-sm font-medium"
            style={{ color: LEDGER.muted }}
          >
            Loading orders…
          </p>
        ) : filtered.length === 0 ? (
          <AdminEmpty
            icon={<Receipt className="h-9 w-9" />}
            title="No orders in this view"
            description="Orders will appear here once they are placed."
          />
        ) : null}
      </AdminCard>

      {!isLoading && filtered.length ? (
        <p className="text-[12px] font-medium" style={{ color: LEDGER.muted }}>
          Showing {filtered.length} of {orders.length} orders.
        </p>
      ) : null}
    </div>
  );
}
