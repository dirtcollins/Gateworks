"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, PackageCheck, Search, Warehouse } from "lucide-react";
import { LEDGER } from "@/features/sites/ledger/kit";
import type { InventoryRow } from "@/features/admin/inventory/inventory-data";
import {
  buildPickLines,
  formatWarehouseDate,
  getOperationalOrders,
  getPickTicketProgress,
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
import { AdminCard, AdminEmpty, AdminHeading, StatTile } from "./admin-kit";

/* ------------------------------------------------------------------ *
 * LEDGER — admin / warehouse
 * The warehouse floor board: operational orders grouped into Kanban
 * columns by pick-ticket status (To pick / Picking / Staged / Done).
 * Built on the same real order store + pick-ticket store as the pick
 * tickets queue; clicking a card opens the line-by-line ticket.
 * ------------------------------------------------------------------ */

type WarehouseCard = {
  order: OrderRecord;
  progress: PickTicketProgress;
};

type Column = {
  id: string;
  label: string;
  statuses: PickTicketStatus[];
  accent: string;
};

const COLUMNS: Column[] = [
  { id: "to_pick", label: "To pick", statuses: ["not_started"], accent: LEDGER.muted },
  { id: "picking", label: "Picking", statuses: ["in_progress"], accent: LEDGER.amber },
  {
    id: "staged",
    label: "Staged",
    statuses: ["ready_for_pickup", "ready_for_delivery"],
    accent: LEDGER.indigo
  },
  { id: "done", label: "Completed", statuses: ["completed"], accent: LEDGER.mint }
];

function percentOf(progress: PickTicketProgress) {
  if (!progress.totalQuantity) return 0;
  return Math.round((progress.pulledQuantity / progress.totalQuantity) * 100);
}

export function LedgerAdminWarehouse({
  inventoryRows
}: {
  inventoryRows: InventoryRow[];
}) {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const pickTickets = usePickTicketStore((state) => state.tickets);
  const [query, setQuery] = useState("");

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

  const cards = useMemo<WarehouseCard[]>(() => {
    const normalized = query.trim().toLowerCase();
    return orders
      .map((order) => {
        const lines = buildPickLines(order, inventoryRows);
        const progress = getPickTicketProgress(order, lines, pickTickets[order.id] || {});
        return { order, progress };
      })
      .filter(({ order }) => {
        if (!normalized) return true;
        return (
          order.orderNumber.toLowerCase().includes(normalized) ||
          order.companyName.toLowerCase().includes(normalized) ||
          order.customerName.toLowerCase().includes(normalized)
        );
      });
  }, [inventoryRows, orders, pickTickets, query]);

  const summary = useMemo(() => {
    const lines = cards.reduce((sum, card) => sum + card.progress.lineCount, 0);
    const open = cards.filter(
      (card) => !["completed"].includes(card.progress.status)
    ).length;
    const staged = cards.filter((card) =>
      ["ready_for_pickup", "ready_for_delivery"].includes(card.progress.status)
    ).length;
    return { tickets: cards.length, lines, open, staged };
  }, [cards]);

  return (
    <div className="grid gap-6">
      <AdminHeading
        eyebrow="Operations"
        title="Warehouse"
        description="The fulfillment floor board — every active ticket grouped by where it sits in the pick workflow."
      />

      <section className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Active tickets" value={String(summary.open)} sub="Not yet completed" />
        <StatTile label="Staged" value={String(summary.staged)} sub="Ready for handoff" />
        <StatTile label="Line items" value={String(summary.lines)} sub="On the floor" />
        <StatTile label="Total tickets" value={String(summary.tickets)} sub="Visible in board" />
      </section>

      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2"
        style={{ border: `1px solid ${LEDGER.line}`, backgroundColor: LEDGER.surface }}
      >
        <Search className="h-4 w-4" style={{ color: LEDGER.muted }} />
        <input
          aria-label="Search warehouse board"
          className="w-full bg-transparent text-[13px] outline-none"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search order or customer"
          style={{ color: LEDGER.ink }}
          value={query}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {COLUMNS.map((column) => {
          const columnCards = cards.filter((card) =>
            column.statuses.includes(card.progress.status)
          );
          return (
            <section key={column.id} className="grid content-start gap-3">
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: column.accent }}
                  />
                  <h2
                    className="text-[13px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: LEDGER.ink }}
                  >
                    {column.label}
                  </h2>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ backgroundColor: LEDGER.canvas, color: LEDGER.muted }}
                >
                  {columnCards.length}
                </span>
              </div>

              {columnCards.length ? (
                columnCards.map((card) => {
                  const percent = percentOf(card.progress);
                  return (
                    <Link
                      key={card.order.id}
                      href={`/ledger/admin/warehouse/${encodeURIComponent(card.order.id)}`}
                      className="block"
                    >
                      <AdminCard className="p-3.5 transition hover:shadow-md">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className="text-[13px] font-semibold"
                              style={{ color: LEDGER.ink }}
                            >
                              {card.order.orderNumber}
                            </p>
                            <p
                              className="truncate text-[12px]"
                              style={{ color: LEDGER.body }}
                            >
                              {card.order.companyName || card.order.customerName}
                            </p>
                          </div>
                          <ArrowUpRight
                            className="h-4 w-4 shrink-0"
                            style={{ color: LEDGER.muted }}
                          />
                        </div>

                        <div className="mt-3 grid gap-1.5">
                          <div
                            className="h-1.5 overflow-hidden rounded-full"
                            style={{ backgroundColor: LEDGER.canvas }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${percent}%`,
                                backgroundColor:
                                  percent >= 100 ? LEDGER.mint : column.accent
                              }}
                            />
                          </div>
                          <div
                            className="flex items-center justify-between text-[11px]"
                            style={{ color: LEDGER.muted }}
                          >
                            <span>
                              {card.progress.pulledQuantity}/
                              {card.progress.totalQuantity} pulled
                            </span>
                            <span className="capitalize">
                              {card.order.fulfillmentMethod}
                            </span>
                          </div>
                        </div>

                        <p
                          className="mt-2 text-[11px]"
                          style={{ color: LEDGER.muted }}
                        >
                          {formatWarehouseDate(card.order.createdAt)}
                        </p>
                      </AdminCard>
                    </Link>
                  );
                })
              ) : (
                <div
                  className="rounded-xl px-3 py-8 text-center text-[12px]"
                  style={{
                    border: `1px dashed ${LEDGER.line}`,
                    color: LEDGER.muted
                  }}
                >
                  Nothing here
                </div>
              )}
            </section>
          );
        })}
      </div>

      {cards.length === 0 ? (
        <AdminCard>
          <AdminEmpty
            icon={<Warehouse className="h-9 w-9" />}
            title="No tickets on the floor"
            description="Operational orders appear here once they are confirmed."
          />
        </AdminCard>
      ) : (
        <p className="flex items-center gap-1.5 text-[12px]" style={{ color: LEDGER.muted }}>
          <PackageCheck className="h-3.5 w-3.5" />
          {summary.tickets} tickets across the workflow.
        </p>
      )}
    </div>
  );
}
