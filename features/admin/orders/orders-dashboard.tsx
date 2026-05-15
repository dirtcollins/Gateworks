"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CreditCard, PackageCheck, Search, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import { formatCurrency } from "@/lib/utils";
import { orderStatuses, paymentStatuses, type OrderStatus, type PaymentStatus } from "@/lib/platform-backend";

const statusLabels: Record<OrderStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  confirmed: "Confirmed",
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
  refunded: "Refunded",
  failed: "Failed"
};

const sampleOrders: OrderRecord[] = [
  {
    id: "sample-order-1",
    orderNumber: "GW-2001",
    userId: "sample",
    customerName: "Jessie Metal Supply",
    companyName: "Jessie Metal Supply",
    email: "orders@example.com",
    phone: "555-0134",
    items: [],
    fulfillmentMethod: "delivery",
    requestedDate: "2026-05-15",
    requestedWindow: "9:00 AM - 11:00 AM",
    jobName: "North yard gate rebuild",
    jobsiteAddress: {
      name: "Jessie Metal Supply",
      company: "Jessie Metal Supply",
      email: "orders@example.com",
      phone: "555-0134",
      addressLine1: "1200 Industrial Way",
      addressLine2: "",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90001",
      notes: "Call before arrival."
    },
    drawings: [],
    pickupContact: "Jessie Metal Supply",
    subtotal: 1840,
    tax: 151.8,
    deliveryFee: 0,
    total: 1991.8,
    status: "submitted",
    paymentStatus: "unpaid",
    isQuoteRequest: false,
    createdAt: "2026-05-14T16:00:00.000Z",
    updatedAt: "2026-05-14T16:00:00.000Z",
    activity: [
      {
        id: "sample-activity-1",
        label: "Order submitted",
        detail: "Delivery requested for 2026-05-15.",
        createdAt: "2026-05-14T16:00:00.000Z"
      }
    ]
  }
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

export function OrdersDashboard() {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const updatePaymentStatus = useOrderStore((state) => state.updatePaymentStatus);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [fulfillment, setFulfillment] = useState("all");
  const [selectedOrderId, setSelectedOrderId] = useState("");

  useEffect(() => {
    async function loadOrders() {
      const response = await fetch("/api/orders?limit=250", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        orders?: typeof storedOrders;
        persisted?: boolean;
      };
      if (payload.persisted && payload.orders) {
        setOrders(payload.orders);
      }
    }

    void loadOrders();
  }, [setOrders]);

  const orders = storedOrders.length ? storedOrders : sampleOrders;
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || orders[0];

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        !normalized ||
        order.orderNumber.toLowerCase().includes(normalized) ||
        order.customerName.toLowerCase().includes(normalized) ||
        order.companyName.toLowerCase().includes(normalized) ||
        order.jobName.toLowerCase().includes(normalized);
      const matchesStatus = status === "all" || order.status === status;
      const matchesFulfillment = fulfillment === "all" || order.fulfillmentMethod === fulfillment;
      return matchesSearch && matchesStatus && matchesFulfillment;
    });
  }, [fulfillment, orders, query, status]);

  const summary = {
    submitted: orders.filter((order) => order.status === "submitted").length,
    picking: orders.filter((order) => order.status === "picking").length,
    pickup: orders.filter((order) => order.status === "ready_for_pickup").length,
    delivery: orders.filter((order) => order.status === "out_for_delivery").length,
    openValue: orders
      .filter((order) => !["completed", "cancelled"].includes(order.status))
      .reduce((total, order) => total + order.total, 0)
  };

  function persistOrderStatus(orderId: string, nextStatus: OrderStatus, detail: string) {
    updateOrderStatus(orderId, nextStatus, detail);
    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: nextStatus })
    }).catch(() => null);
  }

  function persistPaymentStatus(orderId: string, nextPaymentStatus: PaymentStatus, detail: string) {
    updatePaymentStatus(orderId, nextPaymentStatus, detail);
    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, paymentStatus: nextPaymentStatus })
    }).catch(() => null);
  }

  return (
    <PageShell
      description="Admin order queue for submitted customer orders, quote requests, pickup scheduling, delivery scheduling, payment status, and warehouse handoff."
      eyebrow="Gateworks Operations"
      title="Orders"
    >
      <div className="grid gap-5">
        <StatGrid
          className="grid-cols-2 overflow-hidden bg-white lg:grid-cols-5"
          stats={[
            { label: "Submitted", value: summary.submitted },
            { label: "Picking", value: summary.picking },
            { label: "Ready pickup", value: summary.pickup },
            { label: "Delivery", value: summary.delivery },
            { label: "Open value", value: formatCurrency(summary.openValue) }
          ]}
        />

        <div className="grid gap-5 xl:grid-cols-[460px_1fr]">
          <Card>
            <CardHeader>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Order Queue
                </p>
                <h2 className="text-xl font-black text-industrial-ink">Customer orders</h2>
              </div>
            </CardHeader>
            <CardBody className="grid gap-3">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted" size={16} />
                <Input
                  className="pl-9"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search order, customer, job"
                  value={query}
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Select value={status} onChange={(event) => setStatus(event.target.value as "all" | OrderStatus)}>
                  <option value="all">All statuses</option>
                  {orderStatuses.map((item) => (
                    <option key={item} value={item}>
                      {statusLabels[item]}
                    </option>
                  ))}
                </Select>
                <Select value={fulfillment} onChange={(event) => setFulfillment(event.target.value)}>
                  <option value="all">All fulfillment</option>
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                </Select>
              </div>
              <div className="max-h-[640px] overflow-auto border border-industrial-rail">
                {filteredOrders.map((order) => (
                  <button
                    className={`grid w-full gap-2 border-b border-industrial-rail p-3 text-left transition hover:bg-industrial-paper ${
                      selectedOrder?.id === order.id ? "bg-industrial-amber" : "bg-white"
                    }`}
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-industrial-ink">{order.orderNumber}</p>
                        <p className="text-sm text-industrial-steel">{order.companyName || order.customerName}</p>
                      </div>
                      <span className="border border-industrial-rail bg-white px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em]">
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-industrial-muted">
                      {order.fulfillmentMethod} / {formatDate(order.requestedDate)} / {formatCurrency(order.total)}
                    </p>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {selectedOrder && (
            <section className="grid content-start gap-5">
              <Card>
                <CardHeader>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                      {selectedOrder.orderNumber}
                    </p>
                    <h2 className="text-2xl font-black text-industrial-ink">
                      {selectedOrder.jobName || selectedOrder.companyName || selectedOrder.customerName}
                    </h2>
                    <p className="mt-2 text-sm text-industrial-steel">
                      {selectedOrder.customerName} / {selectedOrder.email} / {selectedOrder.phone}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Select
                      value={selectedOrder.status}
                      onChange={(event) =>
                        persistOrderStatus(
                          selectedOrder.id,
                          event.target.value as OrderStatus,
                          "Changed from admin orders dashboard."
                        )
                      }
                    >
                      {orderStatuses.map((item) => (
                        <option key={item} value={item}>
                          {statusLabels[item]}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={selectedOrder.paymentStatus}
                      onChange={(event) =>
                        persistPaymentStatus(
                          selectedOrder.id,
                          event.target.value as PaymentStatus,
                          "Changed from admin orders dashboard."
                        )
                      }
                    >
                      {paymentStatuses.map((item) => (
                        <option key={item} value={item}>
                          {paymentLabels[item]}
                        </option>
                      ))}
                    </Select>
                  </div>
                </CardHeader>
                <CardBody className="grid gap-5">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="border border-industrial-rail p-3">
                      <Truck size={18} />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Fulfillment</p>
                      <p className="font-black capitalize text-industrial-ink">{selectedOrder.fulfillmentMethod}</p>
                    </div>
                    <div className="border border-industrial-rail p-3">
                      <CalendarDays size={18} />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Schedule</p>
                      <p className="font-black text-industrial-ink">{formatDate(selectedOrder.requestedDate)}</p>
                      <p className="text-xs text-industrial-steel">{selectedOrder.requestedWindow}</p>
                    </div>
                    <div className="border border-industrial-rail p-3">
                      <CreditCard size={18} />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Total</p>
                      <p className="font-black text-industrial-ink">{formatCurrency(selectedOrder.total)}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-black text-industrial-ink">Line items</h3>
                      </CardHeader>
                      <CardBody className="grid gap-3">
                        {selectedOrder.items.length ? (
                          selectedOrder.items.map((item) => (
                            <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-industrial-rail pb-3 text-sm" key={item.variantId}>
                              <div>
                                <p className="font-black text-industrial-ink">{item.title}</p>
                                <p className="text-xs text-industrial-muted">{item.quantity} x {item.sku}</p>
                              </div>
                              <p className="font-black">{formatCurrency(item.price * item.quantity)}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-industrial-steel">Sample order line items will come from submitted checkout orders.</p>
                        )}
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-black text-industrial-ink">Jobsite / pickup details</h3>
                      </CardHeader>
                      <CardBody className="text-sm leading-6 text-industrial-steel">
                        <p className="font-black text-industrial-ink">{selectedOrder.jobsiteAddress.addressLine1 || "Pickup at yard"}</p>
                        {selectedOrder.jobsiteAddress.addressLine2 && <p>{selectedOrder.jobsiteAddress.addressLine2}</p>}
                        <p>
                          {selectedOrder.jobsiteAddress.city} {selectedOrder.jobsiteAddress.state} {selectedOrder.jobsiteAddress.postalCode}
                        </p>
                        <p className="mt-3">{selectedOrder.jobsiteAddress.notes || "No notes provided."}</p>
                      </CardBody>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-black text-industrial-ink">Customer drawings</h3>
                    </CardHeader>
                    <CardBody className="grid gap-3">
                      {(selectedOrder.drawings || []).length ? (
                        (selectedOrder.drawings || []).map((drawing) => (
                          <div className="grid gap-2 border border-industrial-rail p-3 sm:grid-cols-[1fr_auto]" key={drawing.id}>
                            <div className="min-w-0">
                              <p className="truncate font-black text-industrial-ink">{drawing.fileName}</p>
                              <p className="text-xs font-semibold text-industrial-muted">
                                {drawing.fileType} / {(drawing.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            {drawing.publicUrl ? (
                              <a
                                className="inline-flex h-9 items-center justify-center border border-industrial-ink px-3 text-xs font-black uppercase tracking-[0.08em] text-industrial-ink"
                                href={drawing.publicUrl}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Open
                              </a>
                            ) : (
                              <span className="self-center text-xs font-black uppercase tracking-[0.08em] text-industrial-muted">
                                Metadata saved
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-industrial-steel">No customer drawings attached.</p>
                      )}
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-black text-industrial-ink">Activity</h3>
                    </CardHeader>
                    <CardBody className="grid gap-3">
                      {selectedOrder.activity.map((event) => (
                        <div className="border border-industrial-rail p-3" key={event.id}>
                          <p className="font-black text-industrial-ink">{event.label}</p>
                          <p className="mt-1 text-sm text-industrial-steel">{event.detail}</p>
                        </div>
                      ))}
                    </CardBody>
                  </Card>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => persistOrderStatus(selectedOrder.id, "confirmed", "Order confirmed and ready for inventory reservation.")} variant="primary">
                      Confirm order
                    </Button>
                    <Button onClick={() => persistOrderStatus(selectedOrder.id, "picking", "Sent to warehouse picking queue.")}>
                      <PackageCheck size={16} />
                      Send to picking
                    </Button>
                    <Button onClick={() => persistOrderStatus(selectedOrder.id, selectedOrder.fulfillmentMethod === "pickup" ? "ready_for_pickup" : "out_for_delivery", "Fulfillment handoff started.")}>
                      Fulfillment handoff
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </section>
          )}
        </div>
      </div>
    </PageShell>
  );
}
