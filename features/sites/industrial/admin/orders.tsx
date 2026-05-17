"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Download, Plus, Search } from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminEmptyState,
  AdminHeader,
  AdminPill,
  AdminStatGrid,
  AdminTabs
} from "@/features/sites/industrial/admin/kit";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  getNextWorkflowAction,
  orderStatusTone,
  paymentStatusTone,
  persistOrderStatus
} from "@/features/sites/industrial/admin/order-workflow";
import { sampleAdminOrders } from "@/features/sites/industrial/admin/sample-orders";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import type { OrderStatus } from "@/lib/platform-backend";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin orders list. Reads the real order store
 * (hydrated from /api/orders), filters by status tab + search, drives
 * the fulfillment workflow, and exports CSV.
 * ------------------------------------------------------------------ */

type OrderTab =
  | "all"
  | "pending"
  | "processing"
  | "ready"
  | "completed"
  | "cancelled";

const TABS: Array<{ id: OrderTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" }
];

function matchesTab(order: OrderRecord, tab: OrderTab) {
  if (tab === "all") return true;
  if (tab === "pending") return ["draft", "submitted"].includes(order.status);
  if (tab === "processing") return ["confirmed", "picking"].includes(order.status);
  if (tab === "ready") {
    return ["ready_for_pickup", "out_for_delivery"].includes(order.status);
  }
  return order.status === tab;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

function amountDue(order: OrderRecord) {
  if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
    return 0;
  }
  return order.total;
}

type OrdersResponse = { orders?: OrderRecord[]; persisted?: boolean };

export function IndustrialAdminOrders() {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<OrderTab>("all");
  const [channel, setChannel] = useState<"all" | "pickup" | "delivery">("all");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/orders?limit=250&includeItems=false", {
          cache: "no-store"
        });
        if (!response.ok) return;
        const payload = (await response.json()) as OrdersResponse;
        if (payload.persisted && payload.orders) {
          setOrders(payload.orders);
        }
      } finally {
        setLoaded(true);
      }
    }

    void loadOrders();
  }, [setOrders]);

  const orders = useMemo(() => {
    const real = storedOrders.filter((order) => !order.isQuoteRequest);
    return real.length ? real : sampleAdminOrders;
  }, [storedOrders]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        !term ||
        order.orderNumber.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        order.companyName.toLowerCase().includes(term) ||
        order.jobName.toLowerCase().includes(term);
      const matchesChannel =
        channel === "all" || order.fulfillmentMethod === channel;
      return matchesQuery && matchesTab(order, tab) && matchesChannel;
    });
  }, [orders, query, tab, channel]);

  const tabsWithCount = TABS.map((entry) => ({
    ...entry,
    count: orders.filter((order) => matchesTab(order, entry.id)).length
  }));

  const stats = [
    { label: "Total orders", value: String(orders.length) },
    {
      label: "Open queue",
      value: String(
        orders.filter(
          (order) =>
            order.status !== "completed" && order.status !== "cancelled"
        ).length
      )
    },
    {
      label: "Order value",
      value: formatUsd(
        orders.reduce((sum, order) => sum + order.total, 0)
      )
    },
    {
      label: "Amount due",
      value: formatUsd(orders.reduce((sum, order) => sum + amountDue(order), 0))
    }
  ];

  function advanceOrder(order: OrderRecord) {
    const action = getNextWorkflowAction(order);
    updateOrderStatus(order.id, action.next, action.detail);
    persistOrderStatus(order.id, action.next);
  }

  function exportCsv() {
    const headers = [
      "Order Number",
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
        ORDER_STATUS_LABELS[order.status],
        PAYMENT_STATUS_LABELS[order.paymentStatus],
        order.fulfillmentMethod,
        order.total.toFixed(2),
        dateFormatter.format(new Date(order.createdAt))
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([`﻿${csv}`], {
      type: "text/csv;charset=utf-8;"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="grid gap-8">
      <AdminHeader
        eyebrow="Operations console"
        title="Orders"
        description="Every order in the active queue, with one-click fulfillment workflow."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 border border-d1-ink bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
              onClick={exportCsv}
              type="button"
            >
              <Download className="h-4 w-4" /> Export
            </button>
            <Link
              className="inline-flex items-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
              href="/industrial/admin/orders/new"
            >
              <Plus className="h-4 w-4" /> New order
            </Link>
          </div>
        }
      />

      <AdminStatGrid stats={stats} />

      {/* Toolbar */}
      <section className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-d1-ink pb-3">
        <AdminTabs tabs={tabsWithCount} active={tab} onSelect={setTab} />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border border-d1-line">
            {(["all", "pickup", "delivery"] as const).map((option) => (
              <button
                className={`px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
                  channel === option
                    ? "bg-d1-ink text-d1-paper"
                    : "bg-white text-d1-steel hover:text-d1-ink"
                }`}
                key={option}
                onClick={() => setChannel(option)}
                type="button"
              >
                {option === "all" ? "All" : option}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 border border-d1-line bg-white px-3">
            <Search className="h-4 w-4 text-d1-steel" />
            <input
              aria-label="Search orders"
              className="h-9 w-52 bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order or customer"
              value={query}
            />
          </div>
        </div>
      </section>

      {/* Table */}
      {filtered.length ? (
        <section className="overflow-x-auto border border-d1-line bg-d1-card">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Due</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-d1-line">
              {filtered.map((order) => {
                const action = getNextWorkflowAction(order);
                return (
                  <tr className="transition hover:bg-d1-paper" key={order.id}>
                    <td className="px-4 py-3.5">
                      <span className="block text-sm font-extrabold text-d1-ink">
                        {order.orderNumber}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                        {dateFormatter.format(new Date(order.createdAt))}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block text-sm font-bold text-d1-ink">
                        {order.companyName || order.customerName || "Walk-in"}
                      </span>
                      <span className="text-[11px] text-d1-steel">
                        {order.jobName || order.email}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold capitalize text-d1-steel">
                      {order.fulfillmentMethod}
                    </td>
                    <td className="px-4 py-3.5">
                      <AdminPill tone={orderStatusTone(order.status)}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </AdminPill>
                    </td>
                    <td className="px-4 py-3.5">
                      <AdminPill tone={paymentStatusTone(order.paymentStatus)}>
                        {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                      </AdminPill>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                      {formatUsd(order.total)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-semibold text-d1-steel">
                      {formatUsd(amountDue(order))}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="border border-d1-line bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-d1-ink transition hover:border-d1-ink"
                          onClick={() => advanceOrder(order)}
                          type="button"
                        >
                          {action.label}
                        </button>
                        <Link
                          className="inline-flex items-center gap-1 bg-d1-ink px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-d1-paper transition hover:bg-d1-pine"
                          href={`/industrial/admin/orders/${order.id}`}
                        >
                          Open <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : (
        <AdminEmptyState
          title={loaded ? "No orders match this view" : "Loading orders…"}
          description={
            loaded ? "Adjust the filters or create a new order." : undefined
          }
        />
      )}

      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
        Showing {filtered.length} of {orders.length} orders
      </p>
    </div>
  );
}
