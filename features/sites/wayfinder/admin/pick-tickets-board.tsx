// Wayfinder admin — pick-ticket queue. Shared by the /pick-tickets and
// /warehouse routes. Reads the real operational orders (lib/order-store,
// bootstrapped from /api/orders) and the persisted pick progress
// (lib/pick-ticket-store), builds pick lines against server-supplied inventory
// rows, and renders the queue in two layouts: a status-columned board for the
// pick desk, and a flat aisle/bay list for the warehouse floor.
"use client";

import { useEffect, useMemo, useState } from "react";
import type { InventoryRow } from "@/features/admin/inventory/inventory-data";
import {
  buildPickLines,
  formatWarehouseDate,
  getOperationalOrders,
  getPickTicketProgress,
  pickTicketStatusLabels,
  sampleWarehouseOrders,
  type PickTicketProgress,
  type PickTicketStatus
} from "@/features/admin/warehouse/warehouse-data";
import { useOrderStore } from "@/lib/order-store";
import {
  hydratePickTicketProgress,
  usePickTicketStore
} from "@/lib/pick-ticket-store";
import {
  AdminBtn,
  FilterChips,
  Ico,
  Kpi,
  Mono,
  Panel,
  PageHead,
  Pill,
  TextInput,
  monoFont,
  wf
} from "./admin-kit";

type TicketRow = {
  orderId: string;
  orderNumber: string;
  customer: string;
  fulfillment: string;
  createdAt: string;
  requestedWindow: string;
  lines: ReturnType<typeof buildPickLines>;
  progress: PickTicketProgress;
};

const STATUS_TONE: Record<PickTicketStatus, "neutral" | "warn" | "active" | "done"> = {
  not_started: "neutral",
  in_progress: "warn",
  ready_for_pickup: "active",
  ready_for_delivery: "active",
  completed: "done"
};

// Pick-desk board columns — the queue collapses to these four lanes.
const BOARD_LANES: { id: PickTicketStatus | "ready"; label: string }[] = [
  { id: "not_started", label: "Queued" },
  { id: "in_progress", label: "Picking" },
  { id: "ready", label: "Staged" },
  { id: "completed", label: "Completed" }
];

function percent(progress: PickTicketProgress) {
  if (!progress.totalQuantity) return 0;
  return Math.round((progress.pulledQuantity / progress.totalQuantity) * 100);
}

function laneFor(status: PickTicketStatus): PickTicketStatus | "ready" {
  if (status === "ready_for_pickup" || status === "ready_for_delivery") {
    return "ready";
  }
  return status;
}

export function WayfinderPickTicketsBoard({
  inventoryRows,
  view
}: {
  inventoryRows: InventoryRow[];
  view: "board" | "list";
}) {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const pickTickets = usePickTicketStore((state) => state.tickets);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PickTicketStatus>(
    "all"
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    hydratePickTicketProgress();
    useOrderStore.persist.rehydrate();
    async function load() {
      try {
        const res = await fetch("/api/orders?limit=250&includeItems=true", {
          cache: "no-store"
        });
        if (res.ok) {
          const payload = (await res.json()) as {
            orders?: typeof storedOrders;
            persisted?: boolean;
          };
          if (payload.persisted && payload.orders) setOrders(payload.orders);
        }
      } finally {
        setLoaded(true);
      }
    }
    void load();
  }, [setOrders]);

  // Operational orders + warehouse samples (samples filled in only when the
  // real store has no matching id) — identical sourcing to the platform admin.
  const orders = useMemo(() => {
    const operational = getOperationalOrders(storedOrders);
    const samples = sampleWarehouseOrders.filter(
      (sample) => !operational.some((order) => order.id === sample.id)
    );
    return [...operational, ...samples];
  }, [storedOrders]);

  const rows = useMemo<TicketRow[]>(() => {
    return orders.map((order) => {
      const lines = buildPickLines(order, inventoryRows);
      const progress = getPickTicketProgress(
        order,
        lines,
        pickTickets[order.id] || {}
      );
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customer: order.companyName || order.customerName,
        fulfillment: order.fulfillmentMethod,
        createdAt: order.createdAt,
        requestedWindow: order.requestedWindow,
        lines,
        progress
      };
    })
      // An order with no pickable lines is not a real pick ticket.
      .filter((row) => row.progress.lineCount > 0);
  }, [orders, inventoryRows, pickTickets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((row) => {
        const hit =
          !q ||
          row.orderNumber.toLowerCase().includes(q) ||
          row.customer.toLowerCase().includes(q) ||
          row.lines.some((line) => line.sku.toLowerCase().includes(q));
        const matchesStatus =
          statusFilter === "all" || row.progress.status === statusFilter;
        return hit && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [rows, query, statusFilter]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      queued: rows.filter((row) => row.progress.status === "not_started")
        .length,
      picking: rows.filter((row) => row.progress.status === "in_progress")
        .length,
      staged: rows.filter((row) =>
        ["ready_for_pickup", "ready_for_delivery"].includes(row.progress.status)
      ).length,
      pulled: rows.reduce((sum, row) => sum + row.progress.pulledQuantity, 0)
    }),
    [rows]
  );

  const isBoard = view === "board";

  return (
    <>
      <PageHead
        eyebrow="Floor"
        title={isBoard ? "Pick tickets" : "Warehouse"}
        desc={
          isBoard
            ? "The pick-desk queue — every order needing warehouse work, lined up by stage from queued through staged at Bay 7."
            : "Warehouse floor view — open any ticket to walk the aisles line by line and confirm pulls against bay locations."
        }
      />

      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))"
        }}
      >
        <Kpi label="Pick tickets" value={summary.total} />
        <Kpi label="Queued" value={summary.queued} />
        <Kpi label="Picking" value={summary.picking} tone="safety" />
        <Kpi label="Staged" value={summary.staged} tone="pine" />
        <Kpi label="Items pulled" value={summary.pulled} />
      </div>

      <Panel
        title={isBoard ? "Pick queue" : "Ticket list"}
        meta={
          loaded
            ? `${filtered.length} of ${rows.length} tickets`
            : "Loading warehouse queue…"
        }
        action={
          <div style={{ width: 240, maxWidth: "100%" }}>
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order, customer, SKU…"
              style={{ height: 34, fontSize: 12 }}
            />
          </div>
        }
        pad={false}
      >
        <div
          style={{ padding: "12px 16px", borderBottom: `1px solid ${wf.hairline}` }}
        >
          <FilterChips
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { id: "all", label: "All" },
              { id: "not_started", label: "Queued" },
              { id: "in_progress", label: "Picking" },
              { id: "ready_for_pickup", label: "Will-call" },
              { id: "ready_for_delivery", label: "Delivery" },
              { id: "completed", label: "Completed" }
            ]}
          />
        </div>

        <div style={{ padding: 16 }}>
          {!filtered.length ? (
            <p
              style={{
                margin: 0,
                padding: "24px 0",
                textAlign: "center",
                fontFamily: monoFont,
                fontSize: 13,
                color: wf.muted
              }}
            >
              {loaded
                ? "No pick tickets match the current filters."
                : "Loading pick tickets…"}
            </p>
          ) : isBoard ? (
            <PickBoard rows={filtered} />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {filtered.map((row) => (
                <TicketCard key={row.orderId} row={row} dense={false} />
              ))}
            </div>
          )}
        </div>
      </Panel>
    </>
  );
}

function PickBoard({ rows }: { rows: TicketRow[] }) {
  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        alignItems: "start"
      }}
    >
      {BOARD_LANES.map((lane) => {
        const laneRows = rows.filter((row) => laneFor(row.progress.status) === lane.id);
        return (
          <div
            key={lane.id}
            style={{
              border: `1px solid ${wf.rail}`,
              background: wf.bone
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderBottom: `1px solid ${wf.hairline}`
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: wf.ink
                }}
              >
                {lane.label}
              </span>
              <Mono style={{ fontSize: 11, color: wf.muted }}>
                {laneRows.length}
              </Mono>
            </div>
            <div style={{ display: "grid", gap: 8, padding: 10 }}>
              {laneRows.length ? (
                laneRows.map((row) => (
                  <TicketCard key={row.orderId} row={row} dense />
                ))
              ) : (
                <p
                  style={{
                    margin: 0,
                    padding: "12px 4px",
                    fontSize: 11,
                    fontFamily: monoFont,
                    color: wf.muted,
                    textAlign: "center"
                  }}
                >
                  Empty
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TicketCard({ row, dense }: { row: TicketRow; dense: boolean }) {
  const pct = percent(row.progress);
  return (
    <article
      style={{
        background: "#fff",
        border: `1px solid ${wf.rail}`,
        padding: dense ? 10 : 14,
        display: "grid",
        gap: dense ? 8 : 10
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8
        }}
      >
        <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
          <Mono style={{ fontWeight: 700, fontSize: dense ? 12 : 14 }}>
            {row.orderNumber}
          </Mono>
          <span
            style={{
              fontSize: dense ? 12 : 13,
              fontWeight: 800,
              color: wf.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {row.customer}
          </span>
        </div>
        <Pill tone={STATUS_TONE[row.progress.status]}>
          {pickTicketStatusLabels[row.progress.status]}
        </Pill>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          fontFamily: monoFont,
          fontSize: 10,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: wf.muted
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            border: `1px solid ${wf.hairline}`,
            background: wf.bone,
            padding: "3px 7px"
          }}
        >
          <Ico.truck size={11} /> {row.fulfillment}
        </span>
        <span
          style={{
            border: `1px solid ${wf.hairline}`,
            background: wf.bone,
            padding: "3px 7px"
          }}
        >
          {row.progress.lineCount} lines
        </span>
        {!dense ? (
          <span
            style={{
              border: `1px solid ${wf.hairline}`,
              background: wf.bone,
              padding: "3px 7px"
            }}
          >
            {formatWarehouseDate(row.createdAt)}
          </span>
        ) : null}
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: wf.steel,
            fontWeight: 700
          }}
        >
          <span>
            {row.progress.pulledQuantity}/{row.progress.totalQuantity} pulled
          </span>
          <Mono>{pct}%</Mono>
        </div>
        <div
          style={{
            height: 8,
            background: wf.bone,
            border: `1px solid ${wf.rail}`,
            overflow: "hidden"
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: row.progress.isFullyPicked ? wf.pine : wf.safety
            }}
          />
        </div>
      </div>

      <AdminBtn
        size="sm"
        variant="primary"
        href={`/admin/warehouse/${encodeURIComponent(row.orderId)}`}
        block
      >
        <Ico.clipboard size={13} /> Open pick ticket
      </AdminBtn>
    </article>
  );
}
