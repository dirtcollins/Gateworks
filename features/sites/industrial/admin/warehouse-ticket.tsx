"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  PackageCheck,
  Plus,
  TriangleAlert,
  Truck
} from "lucide-react";
import { AdminCard, AdminPill } from "@/features/sites/industrial/admin/kit";
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

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin warehouse ticket detail. Line-by-line pick
 * progress. Persists progress to the pick-ticket store + the
 * /api/pick-tickets and /api/orders endpoints.
 * ------------------------------------------------------------------ */

type WarehouseTicketProps = {
  inventoryRows: InventoryRow[];
  ticketId: string;
};

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

export function IndustrialWarehouseTicket({
  inventoryRows,
  ticketId
}: WarehouseTicketProps) {
  const storedOrders = useOrderStore((state) => state.orders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const pickTickets = usePickTicketStore((state) => state.tickets);
  const setLinePulled = usePickTicketStore((state) => state.setLinePulled);
  const setLineQuantity = usePickTicketStore((state) => state.setLineQuantity);
  const setLineNotes = usePickTicketStore((state) => state.setLineNotes);

  const [notice, setNotice] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [showMissingConfirm, setShowMissingConfirm] = useState(false);

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
  const lines = order ? buildPickLines(order, inventoryRows) : [];
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

  function persistLineProgress(line: PickLine, next: PickLineProgress) {
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

  function maybeStartPicking() {
    if (order?.status === "submitted" || order?.status === "confirmed") {
      persistOrderStatus("picking", "Pick ticket started.");
    }
  }

  function togglePulled(line: PickLine) {
    const current = ticketProgress[line.id] || lineDefaults(line);
    const nextPulled = !current.pulled;
    const nextProgress: PickLineProgress = {
      ...current,
      orderItemId: line.orderItemId,
      productId: line.productId,
      quantityNeeded: line.quantityNeeded,
      quantityPulled: nextPulled ? line.quantityNeeded : 0,
      pulled: nextPulled,
      pulledBy: "Warehouse user"
    };
    setLinePulled(ticketId, line.id, nextProgress);
    persistLineProgress(line, nextProgress);
    maybeStartPicking();
  }

  function changeQuantity(line: PickLine, quantityPulled: number) {
    const safeQuantity = Math.max(
      0,
      Math.min(line.quantityNeeded, quantityPulled)
    );
    const current = ticketProgress[line.id] || lineDefaults(line);
    const nextProgress: PickLineProgress = {
      ...current,
      orderItemId: line.orderItemId,
      productId: line.productId,
      quantityNeeded: line.quantityNeeded,
      quantityPulled: safeQuantity,
      pulled: safeQuantity >= line.quantityNeeded
    };
    setLineQuantity(ticketId, line.id, safeQuantity, line.quantityNeeded);
    persistLineProgress(line, nextProgress);
    maybeStartPicking();
  }

  function changeNotes(line: PickLine, notes: string) {
    const current = ticketProgress[line.id] || lineDefaults(line);
    setLineNotes(ticketId, line.id, notes);
    persistLineProgress(line, { ...current, notes });
  }

  function markComplete(allowMissing = false) {
    if (!order || !progress) return;
    if (!progress.isFullyPicked && !allowMissing) {
      setShowMissingConfirm(true);
      return;
    }
    const nextStatus: OrderStatus =
      order.fulfillmentMethod === "pickup"
        ? "ready_for_pickup"
        : "out_for_delivery";
    persistOrderStatus(
      nextStatus,
      order.fulfillmentMethod === "pickup"
        ? "Pick ticket complete. Order is ready for pickup."
        : "Pick ticket complete. Order is ready for delivery dispatch."
    );
    setShowMissingConfirm(false);
  }

  if (!order || !progress) {
    return (
      <div className="mx-auto grid min-h-[420px] max-w-2xl place-items-center text-center">
        <AdminCard className="p-8">
          <TriangleAlert className="mx-auto h-9 w-9 text-d1-amber" />
          <h1 className="mt-4 text-2xl font-extrabold text-d1-ink">
            Pick ticket not found
          </h1>
          <p className="mt-2 text-sm text-d1-steel">
            This ticket may have been completed, deleted, or created in another
            browser.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 bg-d1-ink px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
            href="/industrial/admin/warehouse"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to warehouse
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
      <div className="flex items-center justify-between gap-3">
        <Link
          className="inline-flex items-center gap-2 border border-d1-line bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:border-d1-ink"
          href="/industrial/admin/warehouse"
        >
          <ArrowLeft className="h-4 w-4" />
          Warehouse
        </Link>
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
          {formatWarehouseDate(order.createdAt)}
        </span>
      </div>

      <section className="grid gap-4 border-b-2 border-d1-ink pb-5 lg:grid-cols-[1fr_240px_260px] lg:items-stretch">
        <div className="grid content-center gap-2">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-d1-ink">
              {order.orderNumber}
            </h1>
            <p className="pb-0.5 text-lg font-bold text-d1-steel">
              {order.companyName || order.customerName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
            <span className="inline-flex items-center gap-1.5 border border-d1-line bg-white px-2.5 py-1.5">
              <Truck className="h-3.5 w-3.5" />
              {order.fulfillmentMethod}
            </span>
            <span className="border border-d1-line bg-white px-2.5 py-1.5">
              {orderStatusLabels[order.status]}
            </span>
            <span className="border border-d1-line bg-white px-2.5 py-1.5">
              {order.requestedWindow || "No window"}
            </span>
          </div>
        </div>

        <AdminCard className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
            Pick progress
          </p>
          <p className="mt-1 text-3xl font-extrabold text-d1-ink">
            {progress.pulledQuantity} / {progress.totalQuantity}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-d1-steel">
            {pickTicketStatusLabels[progress.status]}
          </p>
          <div className="mt-3 h-3 overflow-hidden border border-d1-line bg-white">
            <div
              className="h-full bg-d1-pine"
              style={{ width: `${percent}%` }}
            />
          </div>
        </AdminCard>

        <AdminCard className="grid content-between gap-3 p-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
              Order notes
            </p>
            <p className="mt-1 line-clamp-2 text-sm font-semibold text-d1-steel">
              {order.jobsiteAddress.notes || "No notes supplied."}
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 bg-d1-ink px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
            onClick={() => markComplete(false)}
            type="button"
          >
            <PackageCheck className="h-4 w-4" />
            Mark complete
          </button>
        </AdminCard>
      </section>

      {notice ? (
        <p className="border border-d1-amber bg-d1-amber/15 px-4 py-3 text-[12px] font-semibold text-d1-ink">
          {notice}
        </p>
      ) : null}

      {actionMessage ? (
        <p className="border border-d1-pine bg-d1-pine/10 px-4 py-3 text-[12px] font-bold text-d1-pine">
          {actionMessage}
        </p>
      ) : null}

      {progress.isFullyPicked ? (
        <p className="border border-d1-pine bg-d1-pine px-4 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-d1-paper">
          Order fully picked
        </p>
      ) : null}

      {showMissingConfirm ? (
        <div className="grid gap-3 border border-d1-amber bg-d1-amber/15 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <p className="text-sm font-bold text-d1-ink">
            Some items are still missing. Confirm completion anyway?
          </p>
          <button
            className="inline-flex items-center justify-center gap-2 bg-d1-red px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:opacity-90"
            onClick={() => markComplete(true)}
            type="button"
          >
            Complete with missing items
          </button>
        </div>
      ) : null}

      <section className="grid gap-2">
        {lines.map((line) => {
          const lineProgress = ticketProgress[line.id] || lineDefaults(line);
          const pulled =
            lineProgress.pulled ||
            lineProgress.quantityPulled >= line.quantityNeeded;

          return (
            <article
              className={`grid gap-3 border p-3 lg:grid-cols-[80px_minmax(220px,1fr)_140px_220px_minmax(220px,300px)] lg:items-center ${
                pulled
                  ? "border-d1-pine bg-d1-pine/[0.06]"
                  : "border-d1-line bg-d1-card"
              }`}
              key={line.id}
            >
              <div className="relative aspect-square size-20 overflow-hidden border border-d1-line bg-white">
                <Image
                  alt={line.title}
                  className="object-contain p-1"
                  fill
                  quality={75}
                  sizes="80px"
                  src={line.image}
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-extrabold leading-tight text-d1-ink">
                    {line.title}
                  </h2>
                  {pulled ? (
                    <AdminPill tone="pine">
                      <CheckCircle2 className="h-3 w-3" />
                      Pulled
                    </AdminPill>
                  ) : null}
                </div>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                  {line.sku}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                  <span className="border border-d1-line bg-white px-2 py-1">
                    Bin {line.binCode}
                  </span>
                  <span className="border border-d1-line bg-white px-2 py-1">
                    Available {line.available}
                  </span>
                  {line.status === "short" || line.status === "substitute" ? (
                    <span className="border border-d1-red bg-d1-red px-2 py-1 text-d1-paper">
                      {line.status === "short" ? "Short" : "Below qty"}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 overflow-hidden border border-d1-line bg-white text-center">
                <div className="border-r border-d1-line p-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                    Need
                  </p>
                  <p className="text-2xl font-extrabold leading-none text-d1-ink">
                    {line.quantityNeeded}
                  </p>
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                    Pulled
                  </p>
                  <p className="text-2xl font-extrabold leading-none text-d1-pine">
                    {lineProgress.quantityPulled}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2">
                <button
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
                    pulled
                      ? "border border-d1-line bg-white text-d1-ink hover:border-d1-ink"
                      : "bg-d1-ink text-d1-paper hover:bg-d1-pine"
                  }`}
                  onClick={() => togglePulled(line)}
                  type="button"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {pulled ? "Undo" : "Pulled"}
                </button>
                <button
                  aria-label="Decrease pulled quantity"
                  className="grid h-9 w-9 place-items-center border border-d1-line bg-white text-d1-ink transition hover:border-d1-ink"
                  onClick={() =>
                    changeQuantity(line, lineProgress.quantityPulled - 1)
                  }
                  type="button"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  aria-label="Pulled quantity"
                  className="h-9 w-14 border border-d1-line bg-white text-center text-sm font-extrabold text-d1-ink outline-none focus:border-d1-ink"
                  min={0}
                  onChange={(event) =>
                    changeQuantity(line, Number(event.target.value || 0))
                  }
                  type="number"
                  value={lineProgress.quantityPulled}
                />
                <button
                  aria-label="Increase pulled quantity"
                  className="grid h-9 w-9 place-items-center border border-d1-line bg-white text-d1-ink transition hover:border-d1-ink"
                  onClick={() =>
                    changeQuantity(line, lineProgress.quantityPulled + 1)
                  }
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <textarea
                className="min-h-9 w-full resize-none border border-d1-line bg-white px-3 py-2 text-sm text-d1-ink outline-none focus:border-d1-ink placeholder:text-d1-steel/70"
                onChange={(event) => changeNotes(line, event.target.value)}
                placeholder='Problem notes: "only 3 in stock", "damaged", etc.'
                value={lineProgress.notes}
              />
            </article>
          );
        })}
      </section>
    </div>
  );
}
