"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CircleCheckBig,
  ClipboardList,
  CreditCard,
  PackageCheck,
  Plus,
  RefreshCw,
  UserRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import type { OrderStatus } from "@/lib/platform-backend";
import { formatCurrency } from "@/lib/utils";

type DashboardOverviewProps = {
  lowStockCount: number;
  productCount: number;
};

type OrdersResponse = {
  orders?: OrderRecord[];
  persisted?: boolean;
  reason?: string;
};

const statusLabels: Record<OrderStatus, string> = {
  draft: "Draft",
  submitted: "Pending",
  confirmed: "Processing",
  picking: "Picking",
  ready_for_pickup: "Ready pickup",
  out_for_delivery: "Out delivery",
  completed: "Complete",
  cancelled: "Cancelled"
};

const quickActions = [
  { label: "Create Order", href: "/admin/orders/new", icon: Plus },
  { label: "Create Quote", href: "/admin/quotes", icon: ClipboardList },
  { label: "Add Customer", href: "/admin/customers", icon: UserRound },
  { label: "Add Product", href: "/admin/products/new", icon: PackageCheck }
];

function isSameLocalDate(value: string, date: Date) {
  const parsed = new Date(value);
  return (
    parsed.getFullYear() === date.getFullYear() &&
    parsed.getMonth() === date.getMonth() &&
    parsed.getDate() === date.getDate()
  );
}

function isSameLocalMonth(value: string, date: Date) {
  const parsed = new Date(value);
  return (
    parsed.getFullYear() === date.getFullYear() &&
    parsed.getMonth() === date.getMonth()
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function formatShortTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getOrderDisplayName(order: OrderRecord) {
  return order.companyName || order.customerName || "Unassigned customer";
}

function getAmountPaid(order: OrderRecord) {
  const recordedTotal = (order.payments || []).reduce(
    (total, payment) => total + payment.amount,
    0
  );

  if (recordedTotal > 0) return recordedTotal;
  if (order.paymentStatus === "paid" || order.paymentStatus === "overpaid") return order.total;

  return 0;
}

function getAmountOwed(order: OrderRecord) {
  if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") return 0;

  return Math.max(order.total - getAmountPaid(order), 0);
}

export function DashboardOverview({
  lowStockCount,
  productCount
}: DashboardOverviewProps) {
  const storeOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const [query, setQuery] = useState("");
  const [loadState, setLoadState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [loadMessage, setLoadMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      setLoadState("loading");
      setLoadMessage("");

      try {
        const response = await fetch("/api/orders?limit=100&includeItems=false", {
          cache: "no-store"
        });
        const payload = (await response.json().catch(() => null)) as OrdersResponse | null;

        if (!mounted) return;

        if (!response.ok || !payload?.persisted) {
          setLoadState("error");
          setLoadMessage(payload?.reason || `Orders API returned ${response.status}.`);
          return;
        }

        setOrders(payload.orders || []);
        setLoadState("loaded");
        setLoadMessage(`Loaded ${(payload.orders || []).length} records.`);
      } catch (error) {
        if (!mounted) return;
        setLoadState("error");
        setLoadMessage(error instanceof Error ? error.message : "Could not load orders.");
      }
    }

    void loadOrders();

    return () => {
      mounted = false;
    };
  }, [setOrders]);

  const orders = storeOrders;
  const today = new Date();
  const liveOrders = orders.filter((order) => !order.isQuoteRequest);
  const activeOrders = liveOrders.filter((order) => order.status !== "cancelled");
  const fulfillmentQueue = liveOrders.filter((order) =>
    ["submitted", "confirmed", "picking", "ready_for_pickup", "out_for_delivery"].includes(order.status)
  );
  const monthRevenue = liveOrders
    .filter((order) => order.status !== "cancelled" && isSameLocalMonth(order.createdAt, today))
    .reduce((total, order) => total + order.total, 0);
  const todayOrders = liveOrders.filter((order) => isSameLocalDate(order.createdAt, today));
  const openQuotes = orders.filter(
    (order) => order.isQuoteRequest && !["completed", "cancelled"].includes(order.status)
  );

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const source = activeOrders.slice(0, 12);

    if (!normalized) return source;

    return source.filter((order) =>
      [
        order.orderNumber,
        order.customerName,
        order.companyName,
        order.jobName,
        order.status
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized))
    );
  }, [activeOrders, query]);

  const kpiCards = [
    {
      label: "Today's Orders",
      value: String(todayOrders.length),
      note: loadState === "loading" ? "Loading live orders" : `${activeOrders.length} active orders`
    },
    {
      label: "Pending Pick Tickets",
      value: String(fulfillmentQueue.length),
      note: "Submitted through delivery handoff"
    },
    {
      label: "Low Stock Items",
      value: String(lowStockCount),
      note: `${productCount} catalog products checked`
    },
    {
      label: "Revenue This Month",
      value: formatCurrency(monthRevenue),
      note: "Open and completed order value"
    }
  ];

  const moduleCards = [
    {
      title: "Recent Orders",
      value: activeOrders.length,
      description: "Live order intake and fulfillment state.",
      href: "/admin/orders"
    },
    {
      title: "Quote Pipeline",
      value: openQuotes.length,
      description: "Open quote requests waiting on pricing or conversion.",
      href: "/admin/quotes"
    },
    {
      title: "Low Stock Alerts",
      value: lowStockCount,
      description: "SKU-level replenishment signals from catalog inventory.",
      href: "/admin/inventory"
    },
    {
      title: "Delivery Schedule",
      value: liveOrders.filter((order) => order.fulfillmentMethod === "delivery" && order.status !== "completed").length,
      description: "Delivery orders not yet completed.",
      href: "/admin/orders"
    },
    {
      title: "Pickup Queue",
      value: liveOrders.filter((order) => order.fulfillmentMethod === "pickup" && order.status !== "completed").length,
      description: "Pickup orders still in the operating queue.",
      href: "/admin/pick-tickets"
    },
    {
      title: "Sales Summary",
      value: monthRevenue,
      description: "Current month order value.",
      href: "/admin/orders",
      isCurrency: true
    }
  ];

  return (
    <PageShell
      className="max-w-none px-4 md:px-6"
      title="Dashboard"
      description="Overview of orders, inventory, warehouse activity, and sales."
      eyebrow="Gateworks Operations"
      actions={
        <div className="grid w-full gap-2 md:w-auto md:grid-cols-[minmax(240px,1fr)_auto]">
          <label className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted">
              <ClipboardList size={16} aria-hidden="true" />
            </span>
            <Input
              aria-label="Search operations"
              className="h-9 w-full min-w-[240px] border-industrial-rail pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search orders, customers, SKUs"
              type="search"
              value={query}
            />
          </label>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <Button
              className="h-9 normal-case tracking-normal"
              disabled={loadState === "loading"}
              onClick={() => window.location.reload()}
              size="sm"
              variant="secondary"
              type="button"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Refresh
            </Button>
            <Link
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-industrial-rail bg-industrial-ink px-3 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:bg-industrial-pine"
              href="/admin/orders/new"
            >
              <Plus size={14} aria-hidden="true" />
              New Order
            </Link>
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        {loadState === "error" ? (
          <Card className="border-amber-300 bg-amber-50">
            <CardBody className="flex items-start gap-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 shrink-0" size={18} />
              <div>
                <p className="font-black">Dashboard could not load live orders.</p>
                <p className="mt-1">{loadMessage}</p>
              </div>
            </CardBody>
          </Card>
        ) : null}

        <section className="grid gap-3 xl:grid-cols-4">
          {kpiCards.map((card) => (
            <Card className="p-4" key={card.label}>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-black text-industrial-ink">{card.value}</p>
              <p className="mt-1 text-xs text-industrial-muted">{card.note}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="overflow-hidden">
            <CardHeader>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Live Feed
                </p>
                <h2 className="text-lg font-black text-industrial-ink">Recent orders</h2>
              </div>
              <Link
                className="text-xs font-black uppercase tracking-[0.08em] text-industrial-steel hover:text-industrial-ink"
                href="/admin/orders"
              >
                View all
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              {filteredOrders.length ? (
                <div className="divide-y divide-industrial-rail">
                  <div className="hidden grid-cols-[140px_minmax(0,1fr)_105px_100px_100px_100px] gap-2 bg-industrial-paper px-3 py-2 text-[10px] font-black uppercase tracking-[0.08em] text-industrial-muted md:grid">
                    <span>Order</span>
                    <span>Customer</span>
                    <span>Status</span>
                    <span className="text-right">Order total</span>
                    <span className="text-right">Paid</span>
                    <span className="text-right">Owed</span>
                  </div>
                  {filteredOrders.map((order) => {
                    const amountPaid = getAmountPaid(order);
                    const amountOwed = getAmountOwed(order);

                    return (
                      <Link
                        className="grid gap-2 px-3 py-2.5 text-sm transition hover:bg-industrial-paper md:grid-cols-[140px_minmax(0,1fr)_105px_100px_100px_100px]"
                        href={`/admin/orders/${order.id}`}
                        key={order.id}
                      >
                        <div>
                          <p className="font-black text-industrial-ink">{order.orderNumber}</p>
                          <p className="text-xs text-industrial-muted">
                            {formatShortDate(order.createdAt)}, {formatShortTime(order.createdAt)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-industrial-ink">
                            {getOrderDisplayName(order)}
                          </p>
                          <p className="truncate text-xs text-industrial-muted">
                            {order.jobName || order.fulfillmentMethod}
                          </p>
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-industrial-muted">
                          {statusLabels[order.status]}
                        </p>
                        <p className="font-black text-industrial-ink md:text-right">
                          <span className="mr-2 text-xs font-semibold text-industrial-muted md:hidden">Total</span>
                          {formatCurrency(order.total)}
                        </p>
                        <p className="font-black text-industrial-ink md:text-right">
                          <span className="mr-2 text-xs font-semibold text-industrial-muted md:hidden">Paid</span>
                          {formatCurrency(amountPaid)}
                        </p>
                        <p className="font-black text-industrial-ink md:text-right">
                          <span className="mr-2 text-xs font-semibold text-industrial-muted md:hidden">Owed</span>
                          {formatCurrency(amountOwed)}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-sm text-industrial-muted">
                  {loadState === "loading" ? "Loading live order feed..." : "No matching orders found."}
                </div>
              )}
            </CardBody>
          </Card>

          <aside className="grid content-start gap-4">
            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Quick Actions
                  </p>
                  <h2 className="text-lg font-black text-industrial-ink">Operations</h2>
                </div>
              </CardHeader>
              <CardBody className="grid gap-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-industrial-rail px-3 text-xs font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:border-industrial-ink hover:bg-industrial-paper"
                      href={action.href}
                      key={action.label}
                    >
                      <Icon size={14} aria-hidden="true" />
                      {action.label}
                    </Link>
                  );
                })}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Signals
                  </p>
                  <h2 className="text-lg font-black text-industrial-ink">Operating modules</h2>
                </div>
                <CreditCard className="text-industrial-muted" size={20} />
              </CardHeader>
              <CardBody className="grid gap-2">
                {moduleCards.map((module) => (
                  <Link
                    className="grid rounded-md border border-industrial-rail p-3 transition hover:border-industrial-ink hover:bg-industrial-paper"
                    href={module.href}
                    key={module.title}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-black text-industrial-ink">{module.title}</span>
                      <span className="text-sm font-black text-industrial-ink">
                        {module.isCurrency ? formatCurrency(module.value) : module.value}
                      </span>
                    </span>
                    <span className="mt-1 text-xs leading-5 text-industrial-muted">
                      {module.description}
                    </span>
                  </Link>
                ))}
                <p className="mt-1 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-industrial-muted">
                  Live data
                  <CircleCheckBig size={14} />
                </p>
              </CardBody>
            </Card>
          </aside>
        </section>
      </div>
    </PageShell>
  );
}
