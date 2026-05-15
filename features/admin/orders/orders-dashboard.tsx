"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  Eye,
  FileDown,
  Filter,
  Pencil,
  Loader2,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Printer,
  Search,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import { formatCurrency } from "@/lib/utils";
import { type OrderStatus, type PaymentStatus } from "@/lib/platform-backend";

type OrderStatusTab =
  | "all"
  | "pending"
  | "processing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

const statusLabels: Record<OrderStatus, string> = {
  draft: "Draft",
  submitted: "Pending",
  confirmed: "Processing",
  picking: "Processing",
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

const statusPillClasses: Record<OrderStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-blue-50 text-blue-800 border-blue-200",
  picking: "bg-indigo-50 text-indigo-800 border-indigo-200",
  ready_for_pickup: "bg-emerald-50 text-emerald-800 border-emerald-200",
  out_for_delivery: "bg-violet-50 text-violet-800 border-violet-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200"
};

const paymentPillClasses: Record<PaymentStatus, string> = {
  unpaid: "bg-rose-50 text-rose-700 border-rose-200",
  partial: "bg-amber-50 text-amber-800 border-amber-200",
  paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
  refunded: "bg-slate-100 text-slate-600 border-slate-200",
  failed: "bg-red-100 text-red-700 border-red-200"
};

const statusFilters: Array<{ id: OrderStatusTab; label: string }> = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "ready_for_pickup", label: "Ready for Pickup" },
  { id: "out_for_delivery", label: "Out for Delivery" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" }
];

const staffRoster = ["Maya Ortiz", "Cody Lee", "Jordan Blake", "Priya Mehta"];

function matchesStatusTab(order: OrderRecord, tab: OrderStatusTab) {
  if (tab === "all") return true;
  if (tab === "pending") return ["draft", "submitted"].includes(order.status);
  if (tab === "processing")
    return ["confirmed", "picking"].includes(order.status);
  if (tab === "ready_for_pickup") return order.status === "ready_for_pickup";
  if (tab === "out_for_delivery") return order.status === "out_for_delivery";
  if (tab === "completed") return order.status === "completed";
  return order.status === "cancelled";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getAssignedStaff(order: OrderRecord) {
  const index = [...order.id].reduce((acc, char) => acc + char.charCodeAt(0), 0) % staffRoster.length;
  return staffRoster[index];
}

function createSampleOrder(overrides: Partial<OrderRecord>): OrderRecord {
  const now = new Date();
  const requestedDate = new Date(now);
  requestedDate.setDate(now.getDate() + 1);

  return {
    id: `sample-${Math.random().toString(36).slice(2, 10)}`,
    orderNumber: `GW-${Math.floor(2000 + Math.random() * 3000)}`,
    userId: "sample",
    customerName: "Guest Customer",
    companyName: "Guest Customer",
    email: "orders@example.com",
    phone: "555-0100",
    items: [],
    fulfillmentMethod: "delivery",
    requestedDate: requestedDate.toISOString().slice(0, 10),
    requestedWindow: "10:00 AM - 1:00 PM",
    jobName: "Metal supply project",
    jobsiteAddress: {
      name: "Guest Customer",
      company: "Guest Customer",
      email: "orders@example.com",
      phone: "555-0100",
      addressLine1: "1100 Industrial Ave",
      addressLine2: "",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90025",
      notes: "Call before arrival."
    },
    drawings: [],
    pickupContact: "Guest Customer",
    subtotal: 860,
    tax: 72.6,
    deliveryFee: 35,
    total: 967.6,
    status: "submitted",
    paymentStatus: "unpaid",
    isQuoteRequest: false,
    createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
    activity: [
      {
        id: `sample-activity-${Date.now()}`,
        label: "Order submitted",
        detail: "Order captured and placed in active queue.",
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
      }
    ],
    ...overrides
  };
}

const sampleOrders: OrderRecord[] = [
  createSampleOrder({
    id: "sample-order-1",
    orderNumber: "GW-2001",
    customerName: "Jessie Metal Supply",
    companyName: "Jessie Metal Supply",
    fulfillmentMethod: "delivery",
    status: "submitted",
    paymentStatus: "unpaid",
    requestedDate: "2026-05-15",
    total: 1991.8
  }),
  createSampleOrder({
    id: "sample-order-2",
    orderNumber: "GW-2002",
    customerName: "Coastal Fencing LLC",
    companyName: "Coastal Fencing LLC",
    fulfillmentMethod: "pickup",
    status: "confirmed",
    paymentStatus: "partial",
    requestedDate: "2026-05-16",
    total: 8420.0
  }),
  createSampleOrder({
    id: "sample-order-3",
    orderNumber: "GW-2003",
    customerName: "Ironworks Depot",
    companyName: "Ironworks Depot",
    fulfillmentMethod: "pickup",
    status: "ready_for_pickup",
    paymentStatus: "paid",
    requestedDate: "2026-05-16",
    total: 12450.0
  }),
  createSampleOrder({
    id: "sample-order-4",
    orderNumber: "GW-2004",
    customerName: "Forge Lane Group",
    companyName: "Forge Lane Group",
    fulfillmentMethod: "delivery",
    status: "out_for_delivery",
    paymentStatus: "paid",
    requestedDate: "2026-05-14",
    total: 5620.5
  }),
  createSampleOrder({
    id: "sample-order-5",
    orderNumber: "GW-2005",
    customerName: "Summit Gates",
    companyName: "Summit Gates",
    fulfillmentMethod: "delivery",
    status: "completed",
    paymentStatus: "paid",
    requestedDate: "2026-05-13",
    total: 3105.4
  })
];

const warehouseAlerts = [
  { id: "alert-1", severity: "high", message: "3 pickup orders with no assigned staff for >90 minutes." },
  { id: "alert-2", severity: "medium", message: "1 delivery window exceeded expected dispatch window by 1 hour." },
  { id: "alert-3", severity: "low", message: "2 payments pending on large gate components." }
];

export function OrdersDashboard() {
  const router = useRouter();
  const storedOrders = useOrderStore((state) => state.orders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<OrderStatusTab>("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<"all" | "pickup" | "delivery">("all");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const orders = useMemo(() => {
    return storedOrders.length ? storedOrders : sampleOrders;
  }, [storedOrders]);

  useEffect(() => {
    if (orders.length === 0) return;
    if (!selectedOrderId || !orders.find((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery =
        !normalized ||
        order.orderNumber.toLowerCase().includes(normalized) ||
        order.customerName.toLowerCase().includes(normalized) ||
        order.companyName.toLowerCase().includes(normalized) ||
        order.jobName.toLowerCase().includes(normalized);
      const matchesStatus = matchesStatusTab(order, statusTab);
      const matchesFulfillment =
        fulfillmentFilter === "all" || order.fulfillmentMethod === fulfillmentFilter;
      return matchesQuery && matchesStatus && matchesFulfillment;
    });
  }, [fulfillmentFilter, orders, query, statusTab]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId),
    [orders, selectedOrderId]
  );

  const summary = useMemo(
    () => ({
      pending: orders.filter((order) => ["draft", "submitted", "confirmed"].includes(order.status)).length,
      processing: orders.filter((order) => ["picking", "ready_for_pickup"].includes(order.status)).length,
      delivery: orders.filter((order) => order.status === "out_for_delivery").length,
      completed: orders.filter((order) => order.status === "completed").length,
      openValue: orders
        .filter((order) => !["completed", "cancelled"].includes(order.status))
        .reduce((total, order) => total + order.total, 0)
    }),
    [orders]
  );

  const pendingPickTickets = useMemo(
    () =>
      orders.filter((order) =>
        ["submitted", "confirmed", "picking"].includes(order.status) &&
        order.fulfillmentMethod === "pickup"
      ),
    [orders]
  );

  const deliveryQueue = useMemo(
    () => orders.filter((order) => order.status === "out_for_delivery"),
    [orders]
  );

  const recentActivity = useMemo(() => {
    if (selectedOrder?.activity.length) {
      return selectedOrder.activity.map((event) => ({
        ...event,
        order: selectedOrder.orderNumber
      }));
    }

    return orders
      .flatMap((order) =>
        order.activity.slice(0, 1).map((event) => ({ ...event, order: order.orderNumber }))
      )
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .slice(0, 8);
  }, [orders, selectedOrder]);

  function persistOrderStatus(orderId: string, nextStatus: OrderStatus, detail: string) {
    updateOrderStatus(orderId, nextStatus, detail);
    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: nextStatus })
    }).catch(() => null);
  }

  function handleCreateOrder() {
    router.push("/admin/orders/new");
  }

  function handleExportOrders() {
    const headers = [
      "Order Number",
      "Customer",
      "Status",
      "Payment Status",
      "Fulfillment Type",
      "Total",
      "Assigned Staff",
      "Created Date"
    ];
    const rows = filteredOrders.map((order) =>
      [
        order.orderNumber,
        order.companyName || order.customerName,
        statusLabels[order.status],
        paymentLabels[order.paymentStatus],
        order.fulfillmentMethod,
        formatCurrency(order.total),
        getAssignedStaff(order),
        formatDate(order.createdAt)
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  const hasRealData = storedOrders.length > 0;

  return (
    <PageShell
      className="max-w-none px-3 py-4 md:px-5 md:py-6"
      eyebrow="Gateworks Operations"
      title="Orders"
      description="Manage customer orders, fulfillment, pickups, and deliveries."
    >
      <div className="grid gap-5">
        <div className="grid gap-4 rounded-2xl border border-industrial-rail bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Operations queue</p>
            <h2 className="mt-1 text-xl font-black text-industrial-ink">Orders workspace</h2>
            <p className="mt-2 text-sm text-industrial-steel">
              Wide-screen table operations for warehouse, fulfillment, and logistics teams.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,260px)_auto_auto_auto] lg:grid-cols-[minmax(0,320px)_auto_auto_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted" size={16} />
              <Input
                aria-label="Search orders"
                className="h-10 pl-9"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search order, customer, job"
                value={query}
              />
            </label>
            <Button
              className="h-10 w-full normal-case tracking-normal"
              onClick={handleCreateOrder}
              size="sm"
              type="button"
              variant="primary"
            >
              <Plus size={14} />
              <span>Create Order</span>
            </Button>
            <Button
              className="h-10 w-full normal-case tracking-normal"
              onClick={handleExportOrders}
              size="sm"
              type="button"
            >
              <FileDown size={14} />
              <span>Export</span>
            </Button>
            <Button
              className="h-10 w-full normal-case tracking-normal"
              onClick={() => setIsFilterOpen((value) => !value)}
              size="sm"
              type="button"
            >
              <Filter size={14} />
              <span>Filter</span>
            </Button>
          </div>
          {isFilterOpen ? (
            <div className="grid gap-2 border-t border-industrial-rail pt-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="grid gap-1 text-sm">
                <span className="text-[11px] font-black uppercase tracking-[0.12em] text-industrial-muted">
                  Fulfillment
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    className="h-9 px-3"
                    onClick={() => setFulfillmentFilter("all")}
                    size="sm"
                    type="button"
                    variant={fulfillmentFilter === "all" ? "primary" : "secondary"}
                  >
                    All
                  </Button>
                  <Button
                    className="h-9 px-3"
                    onClick={() => setFulfillmentFilter("pickup")}
                    size="sm"
                    type="button"
                    variant={fulfillmentFilter === "pickup" ? "primary" : "secondary"}
                  >
                    Pickup
                  </Button>
                  <Button
                    className="h-9 px-3"
                    onClick={() => setFulfillmentFilter("delivery")}
                    size="sm"
                    type="button"
                    variant={fulfillmentFilter === "delivery" ? "primary" : "secondary"}
                  >
                    Delivery
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((tab) => {
            const isActive = statusTab === tab.id;
            return (
              <button
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-black uppercase tracking-[0.08em] transition ${
                  isActive
                    ? "border-industrial-ink bg-industrial-ink/95 text-white"
                    : "border-industrial-rail bg-white text-industrial-ink hover:border-industrial-ink/70"
                }`}
                key={tab.id}
                onClick={() => setStatusTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <Card className="overflow-hidden">
            <CardHeader className="px-4 py-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Active queue
                </p>
                <h2 className="text-xl font-black text-industrial-ink">Order table</h2>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b border-industrial-rail/80">
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      Order Number
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      Order Status
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      Payment Status
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      Fulfillment Type
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      Total
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      Assigned Staff
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      Created Date
                    </th>
                    <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length ? (
                    filteredOrders.map((order) => {
                      const isSelected = selectedOrderId === order.id;
                      return (
                        <tr
                          className={`border-b border-industrial-rail/60 transition hover:bg-industrial-paper ${
                            isSelected ? "bg-amber-50/70" : "bg-white"
                          }`}
                          key={order.id}
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-black text-industrial-ink">
                            {order.orderNumber}
                          </td>
                          <td className="max-w-52 px-4 py-3">
                            <p className="truncate font-medium text-industrial-ink">{order.customerName}</p>
                            <p className="truncate text-xs text-industrial-muted">{order.companyName}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${statusPillClasses[order.status]}`}
                            >
                              {statusLabels[order.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${paymentPillClasses[order.paymentStatus]}`}
                            >
                              {paymentLabels[order.paymentStatus]}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 capitalize text-industrial-ink">
                            {order.fulfillmentMethod}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-black text-industrial-ink">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-industrial-steel">
                            {getAssignedStaff(order)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-industrial-steel">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-industrial-rail bg-white px-3 text-xs font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:border-industrial-ink"
                                href={`/admin/orders/${order.id}`}
                                onClick={() => setSelectedOrderId(order.id)}
                              >
                                <Eye size={14} aria-hidden="true" />
                                <span className="hidden xl:inline">View Order</span>
                              </Link>
                              <Link
                                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-industrial-rail bg-white px-3 text-xs font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:border-industrial-ink"
                                href={`/admin/orders/${order.id}?edit=1`}
                                onClick={() => setSelectedOrderId(order.id)}
                              >
                                <Pencil size={14} aria-hidden="true" />
                                <span className="hidden xl:inline">Edit order</span>
                              </Link>
                              <Button
                                className="normal-case tracking-normal"
                                onClick={() => window.print()}
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                <Printer size={14} />
                                <span className="hidden xl:inline">Print Pick Ticket</span>
                              </Button>
                              <Button
                                className="normal-case tracking-normal"
                                onClick={() =>
                                  persistOrderStatus(
                                    order.id,
                                    order.fulfillmentMethod === "pickup" ? "ready_for_pickup" : "out_for_delivery",
                                    "Manually moved from admin workspace."
                                  )
                                }
                                size="sm"
                                type="button"
                              >
                                <PackageCheck size={14} />
                                <span className="hidden xl:inline">Mark Ready</span>
                              </Button>
                              <Button
                                className="normal-case tracking-normal"
                                onClick={() =>
                                  persistOrderStatus(
                                    order.id,
                                    "completed",
                                    "Order marked delivered from admin workspace."
                                  )
                                }
                                size="sm"
                                type="button"
                                variant="secondary"
                              >
                                <Truck size={14} />
                                <span className="hidden xl:inline">Mark Delivered</span>
                              </Button>
                              <details className="relative">
                                <summary className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-md border border-industrial-rail bg-white px-3 text-xs font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:border-industrial-ink">
                                  <MoreHorizontal size={14} />
                                  <span className="hidden xl:inline">More</span>
                                  <ChevronDown size={12} />
                                </summary>
                                <div className="absolute right-0 z-10 mt-2 w-52 border border-industrial-rail bg-white p-2 shadow-sm">
                                  <button
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:bg-industrial-paper"
                                    type="button"
                                    onClick={() =>
                                      persistOrderStatus(
                                        order.id,
                                        "confirmed",
                                        "Order moved to confirmed state."
                                      )
                                    }
                                  >
                                    Set confirmed
                                  </button>
                                  <button
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:bg-industrial-paper"
                                    type="button"
                                    onClick={() =>
                                      persistOrderStatus(
                                        order.id,
                                        "cancelled",
                                        "Order cancelled from more actions."
                                      )
                                    }
                                  >
                                    Cancel order
                                  </button>
                                  <button
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:bg-industrial-paper"
                                    type="button"
                                    onClick={() => persistOrderStatus(order.id, "picking", "Returned to warehouse picking.")}
                                  >
                                    Return to picking
                                  </button>
                                </div>
                              </details>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-4 py-12 text-center text-industrial-muted" colSpan={9}>
                        <Loader2 className="mx-auto mb-2 animate-spin text-industrial-ink/60" size={18} />
                        <p>No orders matched this filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <section className="grid gap-4">
            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Pending Pick Tickets
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">{pendingPickTickets.length} pending</h2>
                </div>
                <CalendarDays className="text-industrial-muted" size={18} />
              </CardHeader>
              <CardBody className="grid gap-2 text-sm">
                {pendingPickTickets.length ? (
                  pendingPickTickets.slice(0, 5).map((order) => (
                    <div className="flex items-center justify-between border border-industrial-rail p-3" key={order.id}>
                      <div>
                        <p className="font-black text-industrial-ink">{order.orderNumber}</p>
                        <p className="text-xs text-industrial-muted">{order.customerName}</p>
                      </div>
                      <Button
                        className="normal-case tracking-normal"
                        onClick={() => setSelectedOrderId(order.id)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Open
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md border border-dashed border-industrial-rail p-3 text-sm text-industrial-muted">
                    No pending pickup tickets right now.
                  </p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Delivery Queue
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">{deliveryQueue.length} active</h2>
                </div>
                <Truck className="text-industrial-muted" size={18} />
              </CardHeader>
              <CardBody className="grid gap-2 text-sm">
                {deliveryQueue.length ? (
                  deliveryQueue.slice(0, 5).map((order) => (
                    <div className="flex items-center justify-between border border-industrial-rail p-3" key={order.id}>
                      <div>
                        <p className="font-black text-industrial-ink">{order.orderNumber}</p>
                        <p className="text-xs text-industrial-muted">
                          {order.companyName} · {formatDate(order.requestedDate)}
                        </p>
                      </div>
                      <span className="rounded-full border border-industrial-rail bg-white px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-industrial-muted">
                        En route
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md border border-dashed border-industrial-rail p-3 text-sm text-industrial-muted">
                    No deliveries in queue.
                  </p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Recent Activity
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">
                    {selectedOrder ? `${selectedOrder.orderNumber}` : "System activity"}
                  </h2>
                </div>
              </CardHeader>
              <CardBody className="grid gap-2 text-sm">
                {recentActivity.length ? (
                  recentActivity.slice(0, 6).map((event) => (
                    <div className="border border-industrial-rail p-3" key={`${event.order}-${event.id}`}>
                      <p className="text-xs text-industrial-muted">
                        {event.order} · {formatDateTime(event.createdAt)}
                      </p>
                      <p className="mt-1 font-black text-industrial-ink">{event.label}</p>
                      <p className="text-sm text-industrial-steel">{event.detail}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md border border-dashed border-industrial-rail p-3 text-sm text-industrial-muted">
                    No activity yet.
                  </p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Warehouse Alerts
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">
                    {hasRealData ? "Live signals" : "Placeholder signals"}
                  </h2>
                </div>
                <AlertCircle className="text-industrial-muted" size={18} />
              </CardHeader>
              <CardBody className="grid gap-2">
                {warehouseAlerts.map((alert) => (
                  <div
                    className="grid gap-1 border border-industrial-rail p-3 text-sm"
                    key={alert.id}
                  >
                    <p className="font-black text-industrial-ink">{alert.severity.toUpperCase()} PRIORITY</p>
                    <p className="text-industrial-steel">{alert.message}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
          </section>
        </div>

        <Card>
          <CardHeader>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
              Daily operations summary
            </p>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-industrial-rail p-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Pending</p>
                <p className="mt-1 text-2xl font-black text-industrial-ink">{summary.pending}</p>
              </div>
              <div className="rounded-xl border border-industrial-rail p-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Processing</p>
                <p className="mt-1 text-2xl font-black text-industrial-ink">{summary.processing}</p>
              </div>
              <div className="rounded-xl border border-industrial-rail p-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Out for delivery</p>
                <p className="mt-1 text-2xl font-black text-industrial-ink">{summary.delivery}</p>
              </div>
              <div className="rounded-xl border border-industrial-rail p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">Open value</p>
                <p className="mt-1 text-2xl font-black text-industrial-ink">{formatCurrency(summary.openValue)}</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </PageShell>
  );
}
