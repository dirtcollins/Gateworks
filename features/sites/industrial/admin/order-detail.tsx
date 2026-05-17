"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminCard,
  AdminPill,
  AdminSection
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
import type { OrderStatus, PaymentStatus } from "@/lib/platform-backend";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin order detail. Reads a single order from the
 * real order store (or sample fallback), shows line items, customer +
 * fulfillment, the activity timeline, and drives the status/payment
 * workflow against the store and /api/orders.
 * ------------------------------------------------------------------ */

const PAYMENT_OPTIONS: PaymentStatus[] = [
  "unpaid",
  "partial",
  "paid",
  "refunded"
];

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

type OrdersResponse = { orders?: OrderRecord[]; persisted?: boolean };

export function IndustrialAdminOrderDetail({ orderId }: { orderId: string }) {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const updatePaymentStatus = useOrderStore(
    (state) => state.updatePaymentStatus
  );

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/orders?limit=250", {
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

  const order = useMemo(() => {
    return (
      storedOrders.find((record) => record.id === orderId) ||
      sampleAdminOrders.find((record) => record.id === orderId)
    );
  }, [storedOrders, orderId]);

  if (!order) {
    return (
      <div className="grid gap-6">
        <Link
          className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-pine hover:underline"
          href="/industrial/admin/orders"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All orders
        </Link>
        <div className="border-2 border-d1-ink bg-d1-card p-12 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-d1-ink">
            {loaded ? "Order not found" : "Loading order…"}
          </h1>
          {loaded ? (
            <p className="mt-2 text-sm text-d1-steel">
              This order may have been created in another browser or removed.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const action = getNextWorkflowAction(order);
  const unitCount = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  function advance() {
    if (!order) return;
    updateOrderStatus(order.id, action.next, action.detail);
    persistOrderStatus(order.id, action.next);
  }

  function setStatus(status: OrderStatus) {
    if (!order || status === order.status) return;
    updateOrderStatus(order.id, status, `Status set to ${ORDER_STATUS_LABELS[status]}.`);
    persistOrderStatus(order.id, status);
  }

  function setPayment(status: PaymentStatus) {
    if (!order || status === order.paymentStatus) return;
    updatePaymentStatus(
      order.id,
      status,
      `Payment marked ${PAYMENT_STATUS_LABELS[status]}.`
    );
  }

  return (
    <div className="grid gap-8">
      {/* Header */}
      <div className="grid gap-4">
        <Link
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-pine hover:underline"
          href="/industrial/admin/orders"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All orders
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-d1-ink pb-4">
          <div>
            <div className="flex items-center gap-2">
              <AdminPill tone={orderStatusTone(order.status)}>
                {ORDER_STATUS_LABELS[order.status]}
              </AdminPill>
              <AdminPill tone={paymentStatusTone(order.paymentStatus)}>
                {PAYMENT_STATUS_LABELS[order.paymentStatus]}
              </AdminPill>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-d1-ink sm:text-4xl">
              {order.orderNumber}
            </h1>
            <p className="mt-1 text-sm text-d1-steel">
              Placed {dateTimeFormatter.format(new Date(order.createdAt))}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 border border-d1-ink bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
              onClick={() => window.print()}
              type="button"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
            <button
              className="inline-flex items-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
              onClick={advance}
              type="button"
            >
              {action.label}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: items + activity */}
        <div className="grid gap-8 lg:col-span-8">
          <AdminSection title={`Line items (${unitCount} units)`}>
            <AdminCard>
              {order.items.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left">
                    <thead>
                      <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Unit</th>
                        <th className="px-4 py-3 text-right">Line total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-d1-line">
                      {order.items.map((item) => (
                        <tr key={item.variantId}>
                          <td className="px-4 py-3.5">
                            <span className="block text-sm font-bold text-d1-ink">
                              {item.title}
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                              {item.sku}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center text-sm font-bold text-d1-ink">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-semibold text-d1-steel">
                            {formatUsd(item.price)}
                          </td>
                          <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                            {formatUsd(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-4 py-10 text-center text-sm font-semibold text-d1-steel">
                  No line items recorded on this order.
                </p>
              )}
            </AdminCard>

            {/* Totals */}
            <div className="mt-4 grid gap-px border border-d1-line bg-d1-line sm:grid-cols-4">
              {[
                { label: "Subtotal", value: order.subtotal },
                { label: "Tax", value: order.tax },
                { label: "Delivery", value: order.deliveryFee },
                { label: "Total", value: order.total }
              ].map((row) => (
                <div className="bg-d1-card px-4 py-3" key={row.label}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                    {row.label}
                  </p>
                  <p className="mt-1 text-base font-extrabold text-d1-ink">
                    {formatUsd(row.value)}
                  </p>
                </div>
              ))}
            </div>
          </AdminSection>

          <AdminSection title="Activity">
            <AdminCard className="divide-y divide-d1-line">
              {order.activity.length ? (
                order.activity.map((entry) => (
                  <div className="px-4 py-3.5" key={entry.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-bold text-d1-ink">
                        {entry.label}
                      </p>
                      <p className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                        {dateTimeFormatter.format(new Date(entry.createdAt))}
                      </p>
                    </div>
                    <p className="mt-0.5 text-sm text-d1-steel">{entry.detail}</p>
                  </div>
                ))
              ) : (
                <p className="px-4 py-8 text-center text-sm font-semibold text-d1-steel">
                  No activity recorded yet.
                </p>
              )}
            </AdminCard>
          </AdminSection>
        </div>

        {/* Right: customer, fulfillment, controls */}
        <div className="grid gap-8 lg:col-span-4">
          <AdminSection title="Customer">
            <AdminCard className="p-4">
              <p className="text-base font-extrabold text-d1-ink">
                {order.companyName || order.customerName || "Walk-in"}
              </p>
              {order.customerName && order.companyName ? (
                <p className="text-sm text-d1-steel">{order.customerName}</p>
              ) : null}
              {order.email ? (
                <p className="mt-2 text-sm text-d1-steel">{order.email}</p>
              ) : null}
              {order.phone ? (
                <p className="text-sm text-d1-steel">{order.phone}</p>
              ) : null}
            </AdminCard>
          </AdminSection>

          <AdminSection title="Fulfillment">
            <AdminCard className="grid gap-2.5 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-d1-steel">Method</span>
                <span className="font-bold capitalize text-d1-ink">
                  {order.fulfillmentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-d1-steel">Requested</span>
                <span className="font-bold text-d1-ink">
                  {order.requestedDate
                    ? dateFormatter.format(
                        new Date(`${order.requestedDate.slice(0, 10)}T12:00:00`)
                      )
                    : "Unscheduled"}
                </span>
              </div>
              {order.requestedWindow ? (
                <div className="flex justify-between">
                  <span className="text-d1-steel">Window</span>
                  <span className="font-bold text-d1-ink">
                    {order.requestedWindow}
                  </span>
                </div>
              ) : null}
              {order.jobName ? (
                <div className="flex justify-between">
                  <span className="text-d1-steel">Job</span>
                  <span className="font-bold text-d1-ink">{order.jobName}</span>
                </div>
              ) : null}
              {order.jobsiteAddress?.addressLine1 ? (
                <div className="mt-1 border-t border-d1-line pt-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                    {order.fulfillmentMethod === "delivery"
                      ? "Delivery address"
                      : "Jobsite"}
                  </p>
                  <p className="mt-1 text-sm text-d1-ink">
                    {order.jobsiteAddress.addressLine1}
                    {order.jobsiteAddress.addressLine2
                      ? `, ${order.jobsiteAddress.addressLine2}`
                      : ""}
                    <br />
                    {[
                      order.jobsiteAddress.city,
                      order.jobsiteAddress.state,
                      order.jobsiteAddress.postalCode
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              ) : null}
            </AdminCard>
          </AdminSection>

          <AdminSection title="Status">
            <AdminCard className="grid gap-3 p-4">
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                  Order status
                </p>
                <select
                  className="h-10 w-full border border-d1-line bg-white px-3 text-sm font-bold text-d1-ink outline-none focus:border-d1-ink"
                  onChange={(event) =>
                    setStatus(event.target.value as OrderStatus)
                  }
                  value={order.status}
                >
                  {(
                    Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]
                  ).map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                  Payment status
                </p>
                <select
                  className="h-10 w-full border border-d1-line bg-white px-3 text-sm font-bold text-d1-ink outline-none focus:border-d1-ink"
                  onChange={(event) =>
                    setPayment(event.target.value as PaymentStatus)
                  }
                  value={order.paymentStatus}
                >
                  {PAYMENT_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {PAYMENT_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
            </AdminCard>
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
