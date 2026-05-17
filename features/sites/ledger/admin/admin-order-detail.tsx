"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, PackageX } from "lucide-react";
import { LEDGER, formatUsd } from "@/features/sites/ledger/kit";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import type { OrderStatus, PaymentStatus } from "@/lib/platform-backend";
import {
  AdminCard,
  AdminHeading,
  StatusPill,
  formatAdminDate,
  formatAdminTime,
  orderStatusTone,
  paymentStatusTone,
  titleCase
} from "./admin-kit";

const STATUS_FLOW: OrderStatus[] = [
  "submitted",
  "confirmed",
  "picking",
  "ready_for_pickup",
  "out_for_delivery",
  "completed"
];

const PAYMENT_FLOW: PaymentStatus[] = [
  "unpaid",
  "partial",
  "paid",
  "overpaid",
  "refunded"
];

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

function lineTotal(item: OrderRecord["items"][number]) {
  return item.price * item.quantity;
}

/* Ledger admin order detail — reads one real order from the order
 * store (hydrated from /api/orders), renders line items, fulfillment +
 * billing detail, and the activity log. Staff can advance fulfillment
 * and payment status, persisted to the store and /api/orders. */
export function LedgerAdminOrderDetail({ orderId }: { orderId: string }) {
  const orders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const updatePaymentStatus = useOrderStore((state) => state.updatePaymentStatus);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await fetch("/api/orders?limit=250&includeItems=true", {
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

  const order = useMemo(
    () => orders.find((record) => record.id === orderId),
    [orders, orderId]
  );

  if (!order) {
    return (
      <div className="grid gap-6">
        <AdminHeading eyebrow="Operations" title="Order detail" />
        <AdminCard className="px-5 py-16 text-center">
          <PackageX
            className="mx-auto h-10 w-10"
            style={{ color: LEDGER.muted }}
          />
          <p className="mt-3 text-sm font-semibold" style={{ color: LEDGER.ink }}>
            {isLoading ? "Loading order…" : "Order not found"}
          </p>
          {!isLoading ? (
            <Link
              className="mt-4 inline-block text-[13px] font-semibold transition hover:underline"
              href="/ledger/admin/orders"
              style={{ color: LEDGER.indigo }}
            >
              Back to orders
            </Link>
          ) : null}
        </AdminCard>
      </div>
    );
  }

  function persistStatus(next: OrderStatus) {
    if (!order || next === order.status) return;
    updateOrderStatus(order.id, next, `Status changed to ${orderStatusLabels[next]}.`);
    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, status: next })
    }).catch(() => null);
  }

  function persistPayment(next: PaymentStatus) {
    if (!order || next === order.paymentStatus) return;
    updatePaymentStatus(order.id, next, `Payment marked ${titleCase(next)}.`);
    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, paymentStatus: next })
    }).catch(() => null);
  }

  const address = order.jobsiteAddress;

  return (
    <div className="grid gap-6">
      <Link
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition hover:underline"
        href="/ledger/admin/orders"
        style={{ color: LEDGER.muted }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All orders
      </Link>

      <AdminHeading
        eyebrow="Order"
        title={order.orderNumber}
        description={`Placed ${formatAdminDate(order.createdAt)} · ${
          order.companyName || order.customerName || "Unassigned customer"
        }`}
        action={
          <div className="flex gap-2">
            <StatusPill tone={orderStatusTone(order.status)}>
              {orderStatusLabels[order.status]}
            </StatusPill>
            <StatusPill tone={paymentStatusTone(order.paymentStatus)}>
              {titleCase(order.paymentStatus)}
            </StatusPill>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Left column */}
        <div className="grid gap-4">
          {/* Line items */}
          <AdminCard>
            <p
              className="px-5 py-4 text-[13px] font-semibold"
              style={{ color: LEDGER.ink, borderBottom: `1px solid ${LEDGER.line}` }}
            >
              Line items
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left">
                <thead>
                  <tr
                    className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{
                      color: LEDGER.muted,
                      borderBottom: `1px solid ${LEDGER.line}`
                    }}
                  >
                    <th className="px-5 py-2.5">Product</th>
                    <th className="px-5 py-2.5 text-center">Qty</th>
                    <th className="px-5 py-2.5 text-right">Unit</th>
                    <th className="px-5 py-2.5 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.length ? (
                    order.items.map((item, index) => (
                      <tr
                        key={item.variantId || `${item.productId}-${index}`}
                        style={{
                          borderTop:
                            index === 0 ? "none" : `1px solid ${LEDGER.line}`
                        }}
                      >
                        <td className="px-5 py-3">
                          <p
                            className="text-[13px] font-semibold"
                            style={{ color: LEDGER.ink }}
                          >
                            {item.title}
                          </p>
                          <p
                            className="text-[11px] font-medium"
                            style={{ color: LEDGER.muted }}
                          >
                            {item.sku}
                          </p>
                        </td>
                        <td
                          className="px-5 py-3 text-center text-[13px] font-semibold"
                          style={{ color: LEDGER.ink }}
                        >
                          {item.quantity}
                        </td>
                        <td
                          className="px-5 py-3 text-right text-[13px]"
                          style={{ color: LEDGER.body }}
                        >
                          {formatUsd(item.price)}
                        </td>
                        <td
                          className="px-5 py-3 text-right text-[13px] font-semibold"
                          style={{ color: LEDGER.ink }}
                        >
                          {formatUsd(lineTotal(item))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-5 py-8 text-center text-[13px]"
                        colSpan={4}
                        style={{ color: LEDGER.body }}
                      >
                        No line items recorded on this order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Totals */}
            <div
              className="grid gap-1.5 px-5 py-4 text-[13px]"
              style={{ borderTop: `1px solid ${LEDGER.line}` }}
            >
              <TotalRow label="Subtotal" value={formatUsd(order.subtotal)} />
              {order.deliveryFee > 0 ? (
                <TotalRow label="Delivery" value={formatUsd(order.deliveryFee)} />
              ) : null}
              <TotalRow label="Tax" value={formatUsd(order.tax)} />
              <div
                className="mt-1 flex items-center justify-between pt-2"
                style={{ borderTop: `1px solid ${LEDGER.line}` }}
              >
                <span
                  className="text-[14px] font-semibold"
                  style={{ color: LEDGER.ink }}
                >
                  Order total
                </span>
                <span
                  className="text-[16px] font-semibold tracking-tight"
                  style={{ color: LEDGER.ink }}
                >
                  {formatUsd(order.total)}
                </span>
              </div>
            </div>
          </AdminCard>

          {/* Activity */}
          <AdminCard>
            <p
              className="px-5 py-4 text-[13px] font-semibold"
              style={{ color: LEDGER.ink, borderBottom: `1px solid ${LEDGER.line}` }}
            >
              Activity log
            </p>
            <div className="px-5 py-4">
              {order.activity.length ? (
                <ol className="grid gap-3">
                  {order.activity.map((entry) => (
                    <li key={entry.id} className="flex gap-3">
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: LEDGER.indigo }}
                      />
                      <div>
                        <p
                          className="text-[13px] font-semibold"
                          style={{ color: LEDGER.ink }}
                        >
                          {entry.label}
                        </p>
                        <p className="text-[12px]" style={{ color: LEDGER.body }}>
                          {entry.detail}
                        </p>
                        <p
                          className="mt-0.5 text-[11px] font-medium"
                          style={{ color: LEDGER.muted }}
                        >
                          {formatAdminDate(entry.createdAt)}{" "}
                          {formatAdminTime(entry.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[13px]" style={{ color: LEDGER.body }}>
                  No activity recorded.
                </p>
              )}
            </div>
          </AdminCard>
        </div>

        {/* Right column */}
        <div className="grid gap-4">
          {/* Workflow controls */}
          <AdminCard className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Fulfillment status
            </p>
            <div className="mt-3 grid gap-1.5">
              {STATUS_FLOW.map((status) => {
                const active = order.status === status;
                return (
                  <button
                    key={status}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-semibold transition"
                    onClick={() => persistStatus(status)}
                    style={{
                      backgroundColor: active ? LEDGER.indigo : LEDGER.canvas,
                      color: active ? "#ffffff" : LEDGER.body
                    }}
                    type="button"
                  >
                    {orderStatusLabels[status]}
                    {active ? <span className="text-[11px]">Current</span> : null}
                  </button>
                );
              })}
              <button
                className="mt-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition"
                onClick={() => persistStatus("cancelled")}
                style={{
                  backgroundColor:
                    order.status === "cancelled" ? LEDGER.rose : LEDGER.roseSoft,
                  color: order.status === "cancelled" ? "#ffffff" : LEDGER.rose
                }}
                type="button"
              >
                Cancel order
              </button>
            </div>
          </AdminCard>

          {/* Payment controls */}
          <AdminCard className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Payment status
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PAYMENT_FLOW.map((status) => {
                const active = order.paymentStatus === status;
                return (
                  <button
                    key={status}
                    className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
                    onClick={() => persistPayment(status)}
                    style={{
                      backgroundColor: active ? LEDGER.indigo : LEDGER.canvas,
                      color: active ? "#ffffff" : LEDGER.body
                    }}
                    type="button"
                  >
                    {titleCase(status)}
                  </button>
                );
              })}
            </div>
          </AdminCard>

          {/* Customer + fulfillment */}
          <AdminCard className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Customer
            </p>
            <div className="mt-2 grid gap-1 text-[13px]">
              <p className="font-semibold" style={{ color: LEDGER.ink }}>
                {order.customerName || "Unassigned"}
              </p>
              {order.companyName ? (
                <p style={{ color: LEDGER.body }}>{order.companyName}</p>
              ) : null}
              {order.email ? (
                <p style={{ color: LEDGER.body }}>{order.email}</p>
              ) : null}
              {order.phone ? (
                <p style={{ color: LEDGER.body }}>{order.phone}</p>
              ) : null}
            </div>

            <div
              className="mt-4 pt-4"
              style={{ borderTop: `1px solid ${LEDGER.line}` }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: LEDGER.muted }}
              >
                {order.fulfillmentMethod === "pickup" ? "Pickup" : "Delivery"}
              </p>
              <div className="mt-2 grid gap-0.5 text-[13px]" style={{ color: LEDGER.body }}>
                {order.jobName ? (
                  <p className="font-semibold" style={{ color: LEDGER.ink }}>
                    {order.jobName}
                  </p>
                ) : null}
                {address?.addressLine1 ? <p>{address.addressLine1}</p> : null}
                {address?.addressLine2 ? <p>{address.addressLine2}</p> : null}
                {address?.city || address?.state || address?.postalCode ? (
                  <p>
                    {[address?.city, address?.state].filter(Boolean).join(", ")}{" "}
                    {address?.postalCode}
                  </p>
                ) : null}
                <p className="mt-1" style={{ color: LEDGER.muted }}>
                  Requested {formatAdminDate(order.requestedDate)}
                  {order.requestedWindow ? ` · ${order.requestedWindow}` : ""}
                </p>
              </div>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: LEDGER.body }}>{label}</span>
      <span className="font-semibold" style={{ color: LEDGER.ink }}>
        {value}
      </span>
    </div>
  );
}
