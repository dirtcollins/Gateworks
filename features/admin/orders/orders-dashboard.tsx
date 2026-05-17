"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  FileDown,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import { getOrderStatusTone } from "@/lib/order-status";
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

type WorkflowAction = {
  label: string;
  next: OrderStatus;
  detail: string;
  tone: "primary" | "secondary" | "ghost";
};

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
  overpaid: "Overpaid",
  refunded: "Refunded",
  failed: "Failed"
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

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getAmountDue(order: OrderRecord) {
  if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
    return 0;
  }

  return order.total;
}

function createSampleOrder(overrides: Partial<OrderRecord>): OrderRecord {
  const now = new Date();
  const requestedDate = new Date(now);
  requestedDate.setDate(now.getDate() + 1);

  return {
    id: `sample-${Math.random().toString(36).slice(2, 10)}`,
    orderNumber: `Order-${Math.floor(10027 + Math.random() * 3000)}`,
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
    orderNumber: "Order-10021",
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
    orderNumber: "Order-10022",
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
    orderNumber: "Order-10023",
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
    orderNumber: "Order-10024",
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
    orderNumber: "Order-10025",
    customerName: "Summit Gates",
    companyName: "Summit Gates",
    fulfillmentMethod: "delivery",
    status: "completed",
    paymentStatus: "paid",
    requestedDate: "2026-05-13",
    total: 3105.4
  })
];

export function OrdersDashboard() {
  const router = useRouter();
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<OrderStatusTab>("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<"all" | "pickup" | "delivery">("all");
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const controlsRef = useRef<HTMLDivElement>(null);

  const orders = useMemo(() => {
    return storedOrders.length ? storedOrders : sampleOrders;
  }, [storedOrders]);

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

  function persistOrderStatus(orderId: string, nextStatus: OrderStatus, detail: string) {
    updateOrderStatus(orderId, nextStatus, detail);
    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: nextStatus })
    }).catch(() => null);
  }

  function handleCreateOrder() {
    setIsControlsOpen(false);
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

  function getNextWorkflowAction(order: OrderRecord): WorkflowAction {
    if (order.status === "draft" || order.status === "submitted") {
      return {
        label: "Confirm",
        next: "confirmed" as OrderStatus,
        detail: "Order confirmed and sent to warehouse.",
        tone: "ghost" as const
      };
    }

    if (order.status === "confirmed") {
      return {
        label: "Start picking",
        next: "picking" as OrderStatus,
        detail: "Order moved to picking queue.",
        tone: "ghost" as const
      };
    }

    if (order.status === "picking") {
      return {
        label: order.fulfillmentMethod === "pickup" ? "Ready for pickup" : "Out for delivery",
        next: order.fulfillmentMethod === "pickup" ? "ready_for_pickup" : "out_for_delivery",
        detail:
          order.fulfillmentMethod === "pickup"
            ? "Picking complete; staged for pickup."
            : "Order dispatched for delivery.",
        tone: "primary" as const
      };
    }

    if (order.status === "ready_for_pickup" || order.status === "out_for_delivery") {
      return {
        label: "Mark complete",
        next: "completed" as OrderStatus,
        detail: "Order completed and closed.",
        tone: "secondary" as const
      };
    }

    if (order.status === "completed") {
      return {
        label: "Reopen",
        next: "confirmed" as OrderStatus,
        detail: "Order moved back to processing for correction.",
        tone: "ghost" as const
      };
    }

    return {
      label: "Resume",
      next: "confirmed" as OrderStatus,
      detail: "Order resumed from cancelled state.",
      tone: "ghost" as const
    };
  }

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/orders?limit=250&includeItems=false", {
          cache: "no-store"
        });
        if (!response.ok) return;

        const payload = (await response.json()) as {
          orders?: OrderRecord[];
          persisted?: boolean;
        };

        if (payload.persisted && payload.orders) {
          setOrders(payload.orders);
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadOrders();
  }, [setOrders]);

  useEffect(() => {
    if (!isControlsOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (controlsRef.current && !controlsRef.current.contains(event.target as Node)) {
        setIsControlsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsControlsOpen(false);
        controlsRef.current
          ?.querySelector<HTMLElement>("[data-controls-trigger]")
          ?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isControlsOpen]);

  const columns: DataTableColumn<OrderRecord>[] = [
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortValue: (order) => statusLabels[order.status],
      render: (order) => (
        <Badge tone={getOrderStatusTone(order.status)}>{statusLabels[order.status]}</Badge>
      )
    },
    {
      key: "createdAt",
      header: "Order date",
      sortable: true,
      sortValue: (order) => order.createdAt,
      render: (order) => (
        <div className="min-w-0">
          <p className="font-semibold text-industrial-ink">{formatDate(order.createdAt)}</p>
          <p className="text-xs text-industrial-muted">{formatTime(order.createdAt)}</p>
        </div>
      )
    },
    {
      key: "customer",
      header: "Customer",
      sortable: true,
      sortValue: (order) => (order.customerName || "").toLowerCase(),
      render: (order) => (
        <div className="min-w-0">
          <p className="truncate font-black text-industrial-ink">
            {order.customerName || "Unknown customer"}
          </p>
          <p className="truncate text-xs text-industrial-muted">
            {order.companyName || order.email || order.fulfillmentMethod}
          </p>
        </div>
      )
    },
    {
      key: "orderNumber",
      header: "Order number",
      sortable: true,
      sortValue: (order) => order.orderNumber,
      render: (order) => (
        <div className="min-w-0">
          <p className="truncate font-black text-industrial-ink">{order.orderNumber}</p>
          <p className="text-xs font-black uppercase tracking-[0.06em] text-industrial-muted">
            {order.fulfillmentMethod}
          </p>
        </div>
      )
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      sortable: true,
      sortValue: (order) => order.total,
      render: (order) => (
        <span className="font-semibold text-industrial-ink">{formatCurrency(order.total)}</span>
      )
    },
    {
      key: "amountDue",
      header: (
        <span title="Remaining balance; $0 when the order is fully paid or refunded.">
          Amount due
        </span>
      ),
      className: "text-right",
      sortable: true,
      sortValue: (order) => getAmountDue(order),
      render: (order) => (
        <span className="font-semibold text-industrial-ink">
          {formatCurrency(getAmountDue(order))}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (order) => {
        const nextAction = getNextWorkflowAction(order);
        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              className="h-7 px-2 text-[10px]"
              onClick={() => persistOrderStatus(order.id, nextAction.next, nextAction.detail)}
              size="sm"
              type="button"
              variant={nextAction.tone}
            >
              {nextAction.label}
            </Button>
            <Link
              className="inline-flex h-7 items-center gap-1 rounded-md border border-industrial-rail bg-white px-2 text-[10px] font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:border-industrial-ink"
              href={`/admin/orders/${order.id}`}
            >
              <Eye size={13} />
              Open
            </Link>
          </div>
        );
      }
    }
  ];

  return (
    <PageShell
      className="max-w-none px-3 py-3 md:px-5 md:py-4"
    >
      <div className="grid gap-5">
        <Card className="border-industrial-ink/12 bg-gradient-to-r from-industrial-paper via-white to-industrial-paper">
          <CardBody className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(220px,0.9fr)_minmax(280px,1fr)_auto] md:items-center md:px-5">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-industrial-muted">Order control</p>
              <h2 className="truncate text-lg font-black text-industrial-ink">Operations workspace</h2>
            </div>
            <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted" size={16} />
                <Input
                  aria-label="Search orders"
                  className="h-9 bg-white pl-9 text-sm"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by order, customer, company, or job"
                  value={query}
                />
            </label>
            <div className="relative" ref={controlsRef}>
              <Button
                aria-expanded={isControlsOpen}
                aria-haspopup="true"
                className="h-9 w-full px-3 text-[11px] md:w-auto"
                data-controls-trigger
                onClick={() => setIsControlsOpen((isOpen) => !isOpen)}
                size="sm"
                type="button"
                variant="secondary"
              >
                <SlidersHorizontal size={14} />
                Controls
              </Button>
              {isControlsOpen ? (
                <div className="absolute right-0 z-20 mt-2 grid w-64 gap-3 border border-industrial-rail bg-white p-3 shadow-lg">
                  <div className="grid gap-1.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-industrial-muted">Channel</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["all", "pickup", "delivery"] as const).map((option) => (
                        <button
                          className={`h-8 border px-2 text-[10px] font-black uppercase tracking-[0.05em] ${
                            fulfillmentFilter === option
                              ? "border-industrial-ink bg-industrial-ink text-white"
                              : "border-industrial-rail bg-white text-industrial-ink"
                          }`}
                          key={option}
                          onClick={() => setFulfillmentFilter(option)}
                          type="button"
                        >
                          {option === "all" ? "All" : option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button className="h-8 px-2 text-[10px]" onClick={handleCreateOrder} size="sm" type="button" variant="primary">
                      <Plus size={13} />
                      New
                    </Button>
                    <Button className="h-8 px-2 text-[10px]" onClick={handleExportOrders} size="sm" type="button" variant="secondary">
                      <FileDown size={13} />
                      Export
                    </Button>
                  </div>
                </div>
              ) : null}
              </div>
          </CardBody>
        </Card>

        <Card className="p-0">
          <CardBody className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid gap-1">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">Orders</p>
                <p className="text-sm text-industrial-steel">{filteredOrders.length} active orders</p>
              </div>
              <Button className="h-8 px-3 text-[10px]" onClick={handleCreateOrder} size="sm" type="button" variant="primary">
                <Plus size={13} />
                Create new order
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {statusFilters.map((tab) => {
                const isActive = statusTab === tab.id;
                return (
                  <button
                    className={`inline-flex items-center rounded-full border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.06em] transition ${
                      isActive
                        ? "border-industrial-ink bg-industrial-ink text-white"
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
            <DataTable
              caption="Orders"
              columns={columns}
              emptyDescription="No orders match the current filters."
              emptyTitle="No orders found"
              getRowKey={(order) => order.id}
              isLoading={isLoading}
              pageSize={25}
              rows={filteredOrders}
            />
          </CardBody>
        </Card>
      </div>
    </PageShell>
  );
}
