"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  PackageCheck,
  Search,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";
import type { InventoryRow } from "@/features/admin/inventory/inventory-data";
import {
  buildPickLines,
  formatWarehouseDate,
  getOperationalOrders,
  getPickTicketProgress,
  orderStatusLabels,
  pickTicketStatusLabels,
  sampleWarehouseOrders
} from "@/features/admin/warehouse/warehouse-data";
import type { PickTicketProgress, PickTicketStatus } from "@/features/admin/warehouse/warehouse-data";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import {
  hydratePickTicketProgress,
  usePickTicketStore
} from "@/lib/pick-ticket-store";

type WarehouseDashboardProps = {
  inventoryRows: InventoryRow[];
};

type StatusFilter = "all" | PickTicketStatus;

function getProgressPercent(progress: PickTicketProgress) {
  if (!progress.totalQuantity) return 0;
  return Math.round((progress.pulledQuantity / progress.totalQuantity) * 100);
}

function getStatusTone(status: PickTicketStatus) {
  if (status === "completed") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (status === "ready_for_pickup" || status === "ready_for_delivery") {
    return "border-blue-200 bg-blue-50 text-blue-900";
  }
  if (status === "in_progress") return "border-amber-300 bg-amber-50 text-amber-900";
  return "border-industrial-rail bg-white text-industrial-steel";
}

export function WarehouseDashboard({ inventoryRows }: WarehouseDashboardProps) {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const pickTickets = usePickTicketStore((state) => state.tickets);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [backendNotice, setBackendNotice] = useState("");

  useEffect(() => {
    hydratePickTicketProgress();

    async function loadOrders() {
      const response = await fetch("/api/orders?limit=250", { cache: "no-store" });
      if (!response.ok) return;

      const payload = (await response.json()) as {
        orders?: OrderRecord[];
        persisted?: boolean;
        reason?: string;
      };

      if (payload.persisted && payload.orders) {
        setOrders(payload.orders);
        setBackendNotice("");
      } else if (!payload.persisted) {
        setBackendNotice(
          payload.reason ||
            "Supabase is not configured. Pick progress is saved in this browser only."
        );
      }
    }

    void loadOrders();
  }, [setOrders]);

  const orders = useMemo(() => {
    const operationalOrders = getOperationalOrders(storedOrders);
    const sampleOrders = sampleWarehouseOrders.filter(
      (sampleOrder) => !operationalOrders.some((order) => order.id === sampleOrder.id)
    );
    return [...operationalOrders, ...sampleOrders];
  }, [storedOrders]);

  const rows = useMemo(() => {
    return orders.map((order) => {
      const lines = buildPickLines(order, inventoryRows);
      const progress = getPickTicketProgress(order, lines, pickTickets[order.id] || {});

      return { order, lines, progress };
    });
  }, [inventoryRows, orders, pickTickets]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return rows.filter(({ order, lines, progress }) => {
      const matchesSearch =
        !normalized ||
        order.orderNumber.toLowerCase().includes(normalized) ||
        order.companyName.toLowerCase().includes(normalized) ||
        order.customerName.toLowerCase().includes(normalized) ||
        lines.some((line) => line.sku.toLowerCase().includes(normalized));
      const matchesStatus = status === "all" || progress.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [query, rows, status]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      notStarted: rows.filter(({ progress }) => progress.status === "not_started").length,
      inProgress: rows.filter(({ progress }) => progress.status === "in_progress").length,
      ready: rows.filter(({ progress }) =>
        ["ready_for_pickup", "ready_for_delivery"].includes(progress.status)
      ).length,
      pulled: rows.reduce((total, { progress }) => total + progress.pulledQuantity, 0)
    }),
    [rows]
  );

  return (
    <PageShell
      description="Orders that need warehouse work, pick progress, pickup staging, and delivery handoff."
      eyebrow="Gateworks Operations"
      title="Pick Tickets"
    >
      <div className="grid gap-5">
        <StatGrid
          className="grid-cols-2 overflow-hidden bg-white lg:grid-cols-5"
          stats={[
            { label: "Pick tickets", value: summary.total },
            { label: "Not started", value: summary.notStarted },
            { label: "In progress", value: summary.inProgress },
            { label: "Ready", value: summary.ready },
            { label: "Items pulled", value: summary.pulled }
          ]}
        />

        {backendNotice ? (
          <div className="border border-amber-700 bg-amber-50 p-3 text-sm font-black text-amber-900">
            Backend notice: {backendNotice}
          </div>
        ) : null}

        <Card>
          <CardBody className="grid gap-4 p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
              <label className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted"
                  size={18}
                />
                <Input
                  className="h-12 pl-10"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search order, customer, company, or SKU"
                  value={query}
                />
              </label>
              <Select
                className="h-12"
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
                value={status}
              >
                <option value="all">All pick ticket statuses</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="ready_for_delivery">Ready for Delivery</option>
                <option value="completed">Completed</option>
              </Select>
            </div>

            <div className="grid gap-3">
              {filteredRows.map(({ order, progress }) => {
                const percent = getProgressPercent(progress);
                const customer = order.companyName || order.customerName;

                return (
                  <article
                    className="grid gap-4 border border-industrial-rail bg-white p-4 transition hover:border-industrial-ink lg:grid-cols-[1fr_280px_auto] lg:items-center"
                    key={order.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-black text-industrial-ink">
                          {order.orderNumber}
                        </h2>
                        <span
                          className={`inline-flex items-center border px-2 py-1 text-xs font-black uppercase tracking-[0.08em] ${getStatusTone(
                            progress.status
                          )}`}
                        >
                          {pickTicketStatusLabels[progress.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-lg font-black text-industrial-steel">
                        {customer}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.08em] text-industrial-muted">
                        <span className="inline-flex items-center gap-1 border border-industrial-rail bg-industrial-paper px-2 py-1">
                          <ClipboardCheck size={14} />
                          {orderStatusLabels[order.status]}
                        </span>
                        <span className="inline-flex items-center gap-1 border border-industrial-rail bg-industrial-paper px-2 py-1">
                          <Truck size={14} />
                          {order.fulfillmentMethod}
                        </span>
                        <span className="inline-flex items-center gap-1 border border-industrial-rail bg-industrial-paper px-2 py-1">
                          Created {formatWarehouseDate(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">
                            Progress
                          </p>
                          <p className="text-2xl font-black text-industrial-ink">
                            {progress.pulledQuantity} of {progress.totalQuantity} items pulled
                          </p>
                        </div>
                        {progress.isFullyPicked ? (
                          <CheckCircle2 className="text-emerald-700" size={28} />
                        ) : (
                          <PackageCheck className="text-industrial-muted" size={28} />
                        )}
                      </div>
                      <div className="h-4 overflow-hidden border border-industrial-rail bg-industrial-paper">
                        <div
                          className="h-full bg-industrial-pine"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <p className="text-xs font-bold text-industrial-steel">
                        {progress.lineCount} line items / {percent}% picked
                      </p>
                    </div>

                    <Link href={`/admin/warehouse/${encodeURIComponent(order.id)}`}>
                      <Button className="h-12 w-full lg:w-auto" variant="primary">
                        Open Pick Ticket
                        <ArrowRight size={18} />
                      </Button>
                    </Link>
                  </article>
                );
              })}

              {!filteredRows.length ? (
                <div className="border border-industrial-rail bg-industrial-paper p-6 text-center">
                  <p className="text-lg font-black text-industrial-ink">
                    No pick tickets match this filter.
                  </p>
                  <p className="mt-1 text-sm text-industrial-steel">
                    Clear search or show all statuses to review the queue.
                  </p>
                </div>
              ) : null}
            </div>
          </CardBody>
        </Card>
      </div>
    </PageShell>
  );
}
