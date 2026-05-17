"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Search, Truck, Warehouse } from "lucide-react";
import {
  AdminEmptyState,
  AdminHeader,
  AdminPill,
  AdminStatGrid,
  AdminTabs
} from "@/features/sites/industrial/admin/kit";
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
import type {
  PickTicketProgress,
  PickTicketStatus
} from "@/features/admin/warehouse/warehouse-data";
import { useOrderStore } from "@/lib/order-store";
import {
  hydratePickTicketProgress,
  usePickTicketStore
} from "@/lib/pick-ticket-store";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin warehouse / pick-ticket board. Reads the
 * real order store + pick-ticket progress store. Used by both the
 * /pick-tickets and /warehouse routes.
 * ------------------------------------------------------------------ */

type WarehouseBoardProps = {
  inventoryRows: InventoryRow[];
  variant: "pick-tickets" | "warehouse";
};

type StatusTab = "all" | PickTicketStatus;

const TABS: Array<{ id: StatusTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "not_started", label: "Not started" },
  { id: "in_progress", label: "In progress" },
  { id: "ready_for_pickup", label: "Ready pickup" },
  { id: "ready_for_delivery", label: "Ready delivery" },
  { id: "completed", label: "Completed" }
];

const STATUS_TONE: Record<PickTicketStatus, "pine" | "amber" | "ink" | "neutral"> = {
  not_started: "neutral",
  in_progress: "amber",
  ready_for_pickup: "ink",
  ready_for_delivery: "ink",
  completed: "pine"
};

function progressPercent(progress: PickTicketProgress) {
  if (!progress.totalQuantity) return 0;
  return Math.round((progress.pulledQuantity / progress.totalQuantity) * 100);
}

export function IndustrialWarehouseBoard({
  inventoryRows,
  variant
}: WarehouseBoardProps) {
  const storedOrders = useOrderStore((state) => state.orders);
  const pickTickets = usePickTicketStore((state) => state.tickets);

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");

  useEffect(() => {
    hydratePickTicketProgress();
  }, []);

  const orders = useMemo(() => {
    const operational = getOperationalOrders(storedOrders);
    const samples = sampleWarehouseOrders.filter(
      (sample) => !operational.some((order) => order.id === sample.id)
    );
    return [...operational, ...samples];
  }, [storedOrders]);

  const rows = useMemo(() => {
    return orders.map((order) => {
      const lines = buildPickLines(order, inventoryRows);
      const progress = getPickTicketProgress(
        order,
        lines,
        pickTickets[order.id] || {}
      );
      return { order, lines, progress };
    });
  }, [inventoryRows, orders, pickTickets]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter(({ order, lines, progress }) => {
      const matchesQuery =
        !term ||
        order.orderNumber.toLowerCase().includes(term) ||
        order.companyName.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        lines.some((line) => line.sku.toLowerCase().includes(term));
      const matchesTab = tab === "all" || progress.status === tab;
      return matchesQuery && matchesTab;
    });
  }, [query, rows, tab]);

  const tabsWithCount = TABS.map((entry) => ({
    ...entry,
    count:
      entry.id === "all"
        ? rows.length
        : rows.filter(({ progress }) => progress.status === entry.id).length
  }));

  const stats = [
    { label: "Pick tickets", value: String(rows.length) },
    {
      label: "Not started",
      value: String(
        rows.filter(({ progress }) => progress.status === "not_started").length
      )
    },
    {
      label: "In progress",
      value: String(
        rows.filter(({ progress }) => progress.status === "in_progress").length
      )
    },
    {
      label: "Items pulled",
      value: String(
        rows.reduce((sum, { progress }) => sum + progress.pulledQuantity, 0)
      )
    }
  ];

  return (
    <div className="grid gap-8">
      <AdminHeader
        eyebrow="Network"
        title={variant === "warehouse" ? "Warehouse" : "Pick tickets"}
        description={
          variant === "warehouse"
            ? "Every order needing warehouse work — pick progress, staging, and delivery handoff."
            : "Pick-ticket queue. Open a ticket to track line-by-line pull progress."
        }
      />

      <AdminStatGrid stats={stats} />

      <section className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-d1-ink pb-3">
        <AdminTabs tabs={tabsWithCount} active={tab} onSelect={setTab} />
        <div className="flex items-center gap-2 border border-d1-line bg-white px-3">
          <Search className="h-4 w-4 text-d1-steel" />
          <input
            aria-label="Search pick tickets"
            className="h-9 w-56 bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order, customer, or SKU"
            value={query}
          />
        </div>
      </section>

      {filtered.length ? (
        <section className="grid gap-3">
          {filtered.map(({ order, progress }) => {
            const percent = progressPercent(progress);
            return (
              <article
                className="grid gap-4 border border-d1-line bg-d1-card p-4 transition hover:border-d1-ink lg:grid-cols-[1fr_280px_auto] lg:items-center"
                key={order.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-extrabold text-d1-ink">
                      {order.orderNumber}
                    </h2>
                    <AdminPill tone={STATUS_TONE[progress.status]}>
                      {pickTicketStatusLabels[progress.status]}
                    </AdminPill>
                  </div>
                  <p className="mt-1 text-sm font-bold text-d1-steel">
                    {order.companyName || order.customerName}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                    <span className="inline-flex items-center gap-1 border border-d1-line bg-white px-2 py-1">
                      <Truck className="h-3.5 w-3.5" />
                      {order.fulfillmentMethod}
                    </span>
                    <span className="border border-d1-line bg-white px-2 py-1">
                      {orderStatusLabels[order.status]}
                    </span>
                    <span className="border border-d1-line bg-white px-2 py-1">
                      {formatWarehouseDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                      Progress
                    </span>
                    <span className="text-sm font-extrabold text-d1-ink">
                      {progress.pulledQuantity} / {progress.totalQuantity} items
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden border border-d1-line bg-white">
                    <div
                      className="h-full bg-d1-pine"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-semibold text-d1-steel">
                    {progress.lineCount} line items · {percent}% picked
                  </p>
                </div>

                <Link
                  className="inline-flex items-center justify-center gap-2 bg-d1-ink px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
                  href={`/industrial/admin/warehouse/${encodeURIComponent(order.id)}`}
                >
                  {progress.isFullyPicked ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : null}
                  Open ticket
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </section>
      ) : (
        <AdminEmptyState
          icon={<Warehouse className="h-8 w-8" />}
          title="No pick tickets match this view"
          description="Clear the search or show all statuses to review the queue."
        />
      )}

      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
        Showing {filtered.length} of {rows.length} pick tickets
      </p>
    </div>
  );
}
