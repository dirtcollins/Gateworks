"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Minus,
  PackageCheck,
  Plus,
  TriangleAlert,
  Truck
} from "lucide-react";
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
import type { PickLine } from "@/features/admin/warehouse/warehouse-data";
import { useOrderStore } from "@/lib/order-store";
import {
  hydratePickTicketProgress,
  usePickTicketStore,
  type PickLineProgress
} from "@/lib/pick-ticket-store";
import type { OrderStatus } from "@/lib/platform-backend";
import {
  AdminCard,
  AdminHeading,
  StatusPill,
  formatAdminDate
} from "./admin-kit";

/* ------------------------------------------------------------------ *
 * LEDGER — admin / warehouse ticket detail
 * Line-by-line pick progress. Reads the real order + builds pick lines
 * against live inventory, persists each pull to the shared pick-ticket
 * store and the /api/pick-tickets route, and advances the order status
 * through /api/orders + the order store on completion.
 * ------------------------------------------------------------------ */

function lineDefaults(line: PickLine): PickLineProgress {
  return {
    orderItemId: line.orderItemId,
    productId: line.productId,
    quantityNeeded: line.quantityNeeded,
    quantityPulled: line.quantityPulled,
    pulled: line.pulled,
    pulledAt: line.pulledAt,
    pulledBy: line.pulledBy,
    notes: line.notes
  };
}

export function LedgerAdminWarehouseTicket({
  inventoryRows,
  ticketId
}: {
  inventoryRows: InventoryRow[];
  ticketId: string;
}) {
  const storedOrders = useOrderStore((state) => state.orders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const pickTickets = usePickTicketStore((state) => state.tickets);
  const setLinePulled = usePickTicketStore((state) => state.setLinePulled);
  const setLineQuantity = usePickTicketStore((state) => state.setLineQuantity);
  const setLineNotes = usePickTicketStore((state) => state.setLineNotes);
  const [notice, setNotice] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [confirmMissing, setConfirmMissing] = useState(false);

  useEffect(() => {
    hydratePickTicketProgress();
  }, []);

  const operationalOrders = useMemo(() => {
    const orders = getOperationalOrders(storedOrders);
    const samples = sampleWarehouseOrders.filter(
      (sample) => !orders.some((order) => order.id === sample.id)
    );
    return [...orders, ...samples];
  }, [storedOrders]);

  const order = operationalOrders.find((item) => item.id === ticketId);
  const lines = useMemo(
    () => (order ? buildPickLines(order, inventoryRows) : []),
    [inventoryRows, order]
  );
  const ticketProgress = pickTickets[ticketId] || {};
  const progress = order
    ? getPickTicketProgress(order, lines, ticketProgress)
    : null;

  function persistOrderStatus(nextStatus: OrderStatus, detail: string) {
    if (!order) return;
    updateOrderStatus(order.id, nextStatus, detail);
    setActionMessage(detail);
    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, status: nextStatus })
    })
      .then((response) => response.json())
      .then((payload: { persisted?: boolean; reason?: string }) => {
        if (!payload.persisted) {
          setNotice(
            payload.reason ||
              "Supabase is not configured. Pick progress is saved in this browser only."
          );
        }
      })
      .catch(() => null);
  }

  function persistLine(line: PickLine, next: PickLineProgress) {
    void fetch("/api/pick-tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderItemId: line.orderItemId,
        quantityNeeded: line.quantityNeeded,
        quantityPulled: next.quantityPulled,
        pulled: next.pulled,
        notes: next.notes
      })
    })
      .then((response) => response.json())
      .then((payload: { persisted?: boolean; reason?: string }) => {
        if (!payload.persisted) {
          setNotice(
            payload.reason ||
              "Supabase is not configured. Pick progress is saved in this browser only."
          );
        }
      })
      .catch(() => null);
  }

  function startIfNeeded() {
    if (order?.status === "submitted" || order?.status === "confirmed") {
      persistOrderStatus("picking", "Pick ticket started.");
    }
  }

  function togglePulled(line: PickLine) {
    const current = ticketProgress[line.id] || lineDefaults(line);
    const nextPulled = !current.pulled;
    const next: PickLineProgress = {
      ...current,
      orderItemId: line.orderItemId,
      productId: line.productId,
      quantityNeeded: line.quantityNeeded,
      quantityPulled: nextPulled ? line.quantityNeeded : 0,
      pulled: nextPulled,
      pulledBy: "Warehouse user"
    };
    setLinePulled(ticketId, line.id, next);
    persistLine(line, next);
    startIfNeeded();
  }

  function changeQuantity(line: PickLine, quantityPulled: number) {
    const safe = Math.max(0, Math.min(line.quantityNeeded, quantityPulled));
    const current = ticketProgress[line.id] || lineDefaults(line);
    const next: PickLineProgress = {
      ...current,
      orderItemId: line.orderItemId,
      productId: line.productId,
      quantityNeeded: line.quantityNeeded,
      quantityPulled: safe,
      pulled: safe >= line.quantityNeeded
    };
    setLineQuantity(ticketId, line.id, safe, line.quantityNeeded);
    persistLine(line, next);
    startIfNeeded();
  }

  function changeNotes(line: PickLine, notes: string) {
    const current = ticketProgress[line.id] || lineDefaults(line);
    setLineNotes(ticketId, line.id, notes);
    persistLine(line, { ...current, notes });
  }

  function markComplete(allowMissing = false) {
    if (!order || !progress) return;
    if (!progress.isFullyPicked && !allowMissing) {
      setConfirmMissing(true);
      return;
    }
    const nextStatus: OrderStatus =
      order.fulfillmentMethod === "pickup" ? "ready_for_pickup" : "out_for_delivery";
    persistOrderStatus(
      nextStatus,
      order.fulfillmentMethod === "pickup"
        ? "Pick ticket complete. Order is ready for pickup."
        : "Pick ticket complete. Order is staged for delivery."
    );
    setConfirmMissing(false);
  }

  if (!order || !progress) {
    return (
      <div className="grid min-h-[420px] place-items-center">
        <AdminCard className="max-w-md p-8 text-center">
          <TriangleAlert
            className="mx-auto h-9 w-9"
            style={{ color: LEDGER.amber }}
          />
          <h1
            className="mt-3 text-lg font-semibold tracking-tight"
            style={{ color: LEDGER.ink }}
          >
            Pick ticket not found
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: LEDGER.body }}>
            This ticket may have been completed, cancelled, or created in another
            browser session.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white"
            href="/ledger/admin/warehouse"
            style={{ backgroundColor: LEDGER.indigo }}
          >
            <ArrowLeft className="h-4 w-4" /> Back to warehouse
          </Link>
        </AdminCard>
      </div>
    );
  }

  const percent = progress.totalQuantity
    ? Math.round((progress.pulledQuantity / progress.totalQuantity) * 100)
    : 0;

  return (
    <div className="grid gap-6">
      <Link
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold transition hover:underline"
        href="/ledger/admin/warehouse"
        style={{ color: LEDGER.indigo }}
      >
        <ArrowLeft className="h-4 w-4" /> Warehouse board
      </Link>

      <AdminHeading
        eyebrow="Pick ticket"
        title={order.orderNumber}
        description={`${order.companyName || order.customerName} · created ${formatAdminDate(
          order.createdAt
        )}`}
        action={
          <button
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition disabled:opacity-50"
            onClick={() => markComplete(false)}
            style={{ backgroundColor: LEDGER.indigo }}
            type="button"
          >
            <PackageCheck className="h-4 w-4" /> Mark complete
          </button>
        }
      />

      {/* Summary row */}
      <section className="grid gap-3 sm:grid-cols-3">
        <AdminCard className="p-5">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: LEDGER.muted }}
          >
            Pick progress
          </p>
          <p
            className="mt-2 text-2xl font-semibold tracking-tight"
            style={{ color: LEDGER.ink }}
          >
            {progress.pulledQuantity} of {progress.totalQuantity}
          </p>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full"
            style={{ backgroundColor: LEDGER.canvas }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${percent}%`,
                backgroundColor: percent >= 100 ? LEDGER.mint : LEDGER.indigo
              }}
            />
          </div>
        </AdminCard>
        <AdminCard className="p-5">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: LEDGER.muted }}
          >
            Status
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <StatusPill
              tone={progress.isFullyPicked ? "mint" : "amber"}
            >
              {pickTicketStatusLabels[progress.status]}
            </StatusPill>
            <span
              className="inline-flex items-center gap-1.5 text-[12px] font-medium"
              style={{ color: LEDGER.body }}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              {orderStatusLabels[order.status]}
            </span>
            <span
              className="inline-flex items-center gap-1.5 text-[12px] font-medium"
              style={{ color: LEDGER.body }}
            >
              <Truck className="h-3.5 w-3.5" />
              {order.fulfillmentMethod} · {order.requestedWindow || "No window"}
            </span>
          </div>
        </AdminCard>
        <AdminCard className="p-5">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: LEDGER.muted }}
          >
            Order notes
          </p>
          <p
            className="mt-2 text-[13px] leading-relaxed"
            style={{ color: LEDGER.body }}
          >
            {order.jobsiteAddress.notes || "No notes supplied for this order."}
          </p>
        </AdminCard>
      </section>

      {notice ? (
        <div
          className="rounded-xl p-3 text-[13px] font-medium"
          style={{ backgroundColor: LEDGER.amberSoft, color: LEDGER.amber }}
        >
          {notice}
        </div>
      ) : null}

      {actionMessage ? (
        <div
          className="rounded-xl p-3 text-[13px] font-medium"
          style={{ backgroundColor: LEDGER.mintSoft, color: LEDGER.mint }}
        >
          {actionMessage}
        </div>
      ) : null}

      {progress.isFullyPicked ? (
        <div
          className="flex items-center gap-2 rounded-xl p-3 text-[13px] font-semibold"
          style={{ backgroundColor: LEDGER.mintSoft, color: LEDGER.mint }}
        >
          <CheckCircle2 className="h-4 w-4" /> All lines fully picked.
        </div>
      ) : null}

      {confirmMissing ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl p-3"
          style={{ backgroundColor: LEDGER.amberSoft }}
        >
          <p className="text-[13px] font-semibold" style={{ color: LEDGER.amber }}>
            Some items are still missing. Complete the ticket anyway?
          </p>
          <button
            className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white"
            onClick={() => markComplete(true)}
            style={{ backgroundColor: LEDGER.rose }}
            type="button"
          >
            Complete with missing items
          </button>
        </div>
      ) : null}

      {/* Line items */}
      <AdminCard>
        <div
          className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: LEDGER.muted, borderBottom: `1px solid ${LEDGER.line}` }}
        >
          {lines.length} line items
        </div>
        <ul>
          {lines.map((line, index) => {
            const lineProgress = ticketProgress[line.id] || lineDefaults(line);
            const pulled =
              lineProgress.pulled ||
              lineProgress.quantityPulled >= line.quantityNeeded;
            return (
              <li
                key={line.id}
                className="grid gap-4 p-4 lg:grid-cols-[64px_1fr_auto_auto] lg:items-center"
                style={{
                  borderTop: index === 0 ? "none" : `1px solid ${LEDGER.line}`,
                  backgroundColor: pulled ? LEDGER.mintSoft : "transparent"
                }}
              >
                <div
                  className="relative aspect-square h-16 w-16 overflow-hidden rounded-lg"
                  style={{ border: `1px solid ${LEDGER.line}`, backgroundColor: LEDGER.surface }}
                >
                  <Image
                    alt={line.title}
                    className="object-contain p-1"
                    fill
                    quality={75}
                    sizes="64px"
                    src={line.image}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className="text-[14px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {line.title}
                    </p>
                    {pulled ? (
                      <StatusPill tone="mint">Pulled</StatusPill>
                    ) : line.status === "short" ? (
                      <StatusPill tone="rose">Short</StatusPill>
                    ) : line.status === "substitute" ? (
                      <StatusPill tone="amber">Low stock</StatusPill>
                    ) : null}
                  </div>
                  <p
                    className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em]"
                    style={{ color: LEDGER.muted }}
                  >
                    {line.sku} · Bin {line.binCode} · Available {line.available}
                  </p>
                  <input
                    aria-label={`Notes for ${line.title}`}
                    className="mt-2 w-full rounded-lg px-3 py-1.5 text-[12px] outline-none"
                    onChange={(event) => changeNotes(line, event.target.value)}
                    placeholder="Pick notes (e.g. damaged, short count)"
                    style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
                    value={lineProgress.notes}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    aria-label="Decrease pulled quantity"
                    className="grid h-9 w-9 place-items-center rounded-lg"
                    onClick={() =>
                      changeQuantity(line, lineProgress.quantityPulled - 1)
                    }
                    style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
                    type="button"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="text-center">
                    <p
                      className="text-base font-semibold tabular-nums"
                      style={{ color: LEDGER.ink }}
                    >
                      {lineProgress.quantityPulled}/{line.quantityNeeded}
                    </p>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                      style={{ color: LEDGER.muted }}
                    >
                      Pulled
                    </p>
                  </div>
                  <button
                    aria-label="Increase pulled quantity"
                    className="grid h-9 w-9 place-items-center rounded-lg"
                    onClick={() =>
                      changeQuantity(line, lineProgress.quantityPulled + 1)
                    }
                    style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition"
                  onClick={() => togglePulled(line)}
                  style={
                    pulled
                      ? {
                          backgroundColor: LEDGER.surface,
                          border: `1px solid ${LEDGER.line}`,
                          color: LEDGER.ink
                        }
                      : { backgroundColor: LEDGER.indigo, color: "#ffffff" }
                  }
                  type="button"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {pulled ? "Undo" : "Mark pulled"}
                </button>
              </li>
            );
          })}
        </ul>
        {lines.length === 0 ? (
          <p
            className="px-5 py-10 text-center text-[13px]"
            style={{ color: LEDGER.muted }}
          >
            This order has no line items to pick.
          </p>
        ) : null}
      </AdminCard>

      <p className="text-[12px]" style={{ color: LEDGER.muted }}>
        Pick progress is saved to this browser and synced to Supabase when
        configured · last order activity {formatWarehouseDate(order.updatedAt)}.
      </p>
    </div>
  );
}
