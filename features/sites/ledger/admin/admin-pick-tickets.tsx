"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ClipboardList, Search, Truck } from "lucide-react";
import { LEDGER } from "@/features/sites/ledger/kit";
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
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import {
  hydratePickTicketProgress,
  usePickTicketStore
} from "@/lib/pick-ticket-store";
import {
  AdminCard,
  AdminEmpty,
  AdminHeading,
  StatTile,
  StatusPill
} from "./admin-kit";

/* ------------------------------------------------------------------ *
 * LEDGER — admin / pick tickets
 * The warehouse pick queue. Reads operational orders from the order
 * store + sample warehouse orders, builds pick lines against live
 * inventory, and reflects persisted pick progress from the shared
 * pick-ticket store. Grouped as a status board.
 * ------------------------------------------------------------------ */

type StatusFilter = "all" | PickTicketStatus;

const FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "not_started", label: "Not started" },
  { id: "in_progress", label: "In progress" },
  { id: "ready_for_pickup", label: "Ready · pickup" },
  { id: "ready_for_delivery", label: "Ready · delivery" },
  { id: "completed", label: "Completed" }
];

function progressTone(status: PickTicketStatus): "indigo" | "amber" | "mint" | "neutral" {
  if (status === "completed") return "mint";
  if (status === "ready_for_pickup" || status === "ready_for_delivery") return "mint";
  if (status === "in_progress") return "amber";
  return "neutral";
}

function percentOf(progress: PickTicketProgress) {
  if (!progress.totalQuantity) return 0;
  return Math.round((progress.pulledQuantity / progress.totalQuantity) * 100);
}

type PickRow = {
  order: OrderRecord;
  progress: PickTicketProgress;
};

export function LedgerAdminPickTickets({
  inventoryRows
}: {
  inventoryRows: InventoryRow[];
}) {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const pickTickets = usePickTicketStore((state) => state.tickets);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    hydratePickTicketProgress();
  }, []);

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
      } catch {
        /* fall back to local store */
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [setOrders]);

  const orders = useMemo(() => {
    const operational = getOperationalOrders(storedOrders);
    const samples = sampleWarehouseOrders.filter(
      (sample) => !operational.some((order) => order.id === sample.id)
    );
    return [...operational, ...samples];
  }, [storedOrders]);

  const rows = useMemo<PickRow[]>(() => {
    return orders.map((order) => {
      const lines = buildPickLines(order, inventoryRows);
      const progress = getPickTicketProgress(order, lines, pickTickets[order.id] || {});
      return { order, progress };
    });
  }, [inventoryRows, orders, pickTickets]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter(({ order, progress }) => {
      const matchesQuery =
        !normalized ||
        order.orderNumber.toLowerCase().includes(normalized) ||
        order.companyName.toLowerCase().includes(normalized) ||
        order.customerName.toLowerCase().includes(normalized);
      const matchesFilter = filter === "all" || progress.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, rows]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter(({ progress }) =>
        ["not_started", "in_progress"].includes(progress.status)
      ).length,
      ready: rows.filter(({ progress }) =>
        ["ready_for_pickup", "ready_for_delivery"].includes(progress.status)
      ).length,
      pulled: rows.reduce((sum, { progress }) => sum + progress.pulledQuantity, 0)
    }),
    [rows]
  );

  return (
    <div className="grid gap-6">
      <AdminHeading
        eyebrow="Operations"
        title="Pick tickets"
        description="The warehouse pick queue — every order awaiting fulfillment with live pull progress."
      />

      <section className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Tickets" value={String(summary.total)} sub="In queue" />
        <StatTile label="Active" value={String(summary.active)} sub="Not started or picking" />
        <StatTile label="Ready" value={String(summary.ready)} sub="Staged for handoff" />
        <StatTile label="Items pulled" value={String(summary.pulled)} sub="Across all tickets" />
      </section>

      <AdminCard>
        <div
          className="flex flex-wrap items-center justify-between gap-3 p-4"
          style={{ borderBottom: `1px solid ${LEDGER.line}` }}
        >
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((option) => {
              const active = filter === option.id;
              return (
                <button
                  key={option.id}
                  className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
                  onClick={() => setFilter(option.id)}
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
              aria-label="Search pick tickets"
              className="w-44 bg-transparent text-[13px] outline-none sm:w-56"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order or customer"
              style={{ color: LEDGER.ink }}
              value={query}
            />
          </div>
        </div>

        <div className="grid gap-3 p-4">
          {filtered.map(({ order, progress }) => {
            const percent = percentOf(progress);
            return (
              <article
                key={order.id}
                className="grid gap-4 rounded-xl p-4 transition lg:grid-cols-[1fr_240px_auto] lg:items-center"
                style={{ border: `1px solid ${LEDGER.line}` }}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      className="text-base font-semibold tracking-tight"
                      style={{ color: LEDGER.ink }}
                    >
                      {order.orderNumber}
                    </h2>
                    <StatusPill tone={progressTone(progress.status)}>
                      {pickTicketStatusLabels[progress.status]}
                    </StatusPill>
                  </div>
                  <p className="mt-0.5 text-[13px]" style={{ color: LEDGER.body }}>
                    {order.companyName || order.customerName}
                  </p>
                  <div
                    className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium"
                    style={{ color: LEDGER.muted }}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      {order.fulfillmentMethod}
                    </span>
                    <span>·</span>
                    <span>{orderStatusLabels[order.status]}</span>
                    <span>·</span>
                    <span>Created {formatWarehouseDate(order.createdAt)}</span>
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <div className="flex items-baseline justify-between">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                      style={{ color: LEDGER.muted }}
                    >
                      Progress
                    </span>
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {progress.pulledQuantity}/{progress.totalQuantity}
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full"
                    style={{ backgroundColor: LEDGER.canvas }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percent}%`,
                        backgroundColor:
                          percent >= 100 ? LEDGER.mint : LEDGER.indigo
                      }}
                    />
                  </div>
                  <p className="text-[11px]" style={{ color: LEDGER.muted }}>
                    {progress.lineCount} lines · {percent}% picked
                  </p>
                </div>

                <Link
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition"
                  href={`/ledger/admin/warehouse/${encodeURIComponent(order.id)}`}
                  style={{ backgroundColor: LEDGER.indigo }}
                >
                  Open ticket <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}

          {filtered.length === 0 ? (
            <AdminEmpty
              icon={<ClipboardList className="h-9 w-9" />}
              title="No pick tickets in this view"
              description="Adjust the filter or search to see the queue."
            />
          ) : null}
        </div>
      </AdminCard>
    </div>
  );
}
