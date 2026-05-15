"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Minus,
  PackageCheck,
  Plus,
  TriangleAlert,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
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
import { useOrderStore } from "@/lib/order-store";
import {
  hydratePickTicketProgress,
  usePickTicketStore,
  type PickLineProgress
} from "@/lib/pick-ticket-store";
import type { OrderStatus } from "@/lib/platform-backend";

type PickTicketPageClientProps = {
  inventoryRows: InventoryRow[];
  ticketId: string;
};

function lineProgressDefaults(
  line: ReturnType<typeof buildPickLines>[number]
): PickLineProgress {
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

export function PickTicketPageClient({
  inventoryRows,
  ticketId
}: PickTicketPageClientProps) {
  const storedOrders = useOrderStore((state) => state.orders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const pickTickets = usePickTicketStore((state) => state.tickets);
  const setLinePulled = usePickTicketStore((state) => state.setLinePulled);
  const setLineQuantity = usePickTicketStore((state) => state.setLineQuantity);
  const setLineNotes = usePickTicketStore((state) => state.setLineNotes);
  const [backendNotice, setBackendNotice] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [showMissingConfirm, setShowMissingConfirm] = useState(false);

  useEffect(() => {
    hydratePickTicketProgress();
  }, []);

  const operationalOrders = useMemo(() => {
    const orders = getOperationalOrders(storedOrders);
    const sampleOrders = sampleWarehouseOrders.filter(
      (sampleOrder) => !orders.some((order) => order.id === sampleOrder.id)
    );
    return [...orders, ...sampleOrders];
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
          setBackendNotice(
            payload.reason ||
              "Supabase is not configured. Pick progress is saved in this browser only."
          );
        }
      })
      .catch(() => null);
  }

  function persistLineProgress(line: ReturnType<typeof buildPickLines>[number], next: PickLineProgress) {
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
          setBackendNotice(
            payload.reason ||
              "Supabase is not configured. Pick progress is saved in this browser only."
          );
        }
      })
      .catch(() => null);
  }

  function togglePulled(line: ReturnType<typeof buildPickLines>[number]) {
    const current = ticketProgress[line.id] || lineProgressDefaults(line);
    const nextPulled = !current.pulled;
    const nextProgress = {
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

    if (order?.status === "submitted" || order?.status === "confirmed") {
      persistOrderStatus("picking", "Pick ticket started.");
    }
  }

  function changeQuantity(
    line: ReturnType<typeof buildPickLines>[number],
    quantityPulled: number
  ) {
    const safeQuantity = Math.max(0, Math.min(line.quantityNeeded, quantityPulled));
    const current = ticketProgress[line.id] || lineProgressDefaults(line);
    const nextProgress = {
      ...current,
      orderItemId: line.orderItemId,
      productId: line.productId,
      quantityNeeded: line.quantityNeeded,
      quantityPulled: safeQuantity,
      pulled: safeQuantity >= line.quantityNeeded
    };

    setLineQuantity(ticketId, line.id, safeQuantity, line.quantityNeeded);
    persistLineProgress(line, nextProgress);

    if (order?.status === "submitted" || order?.status === "confirmed") {
      persistOrderStatus("picking", "Pick ticket started.");
    }
  }

  function changeNotes(line: ReturnType<typeof buildPickLines>[number], notes: string) {
    const current = ticketProgress[line.id] || lineProgressDefaults(line);
    const nextProgress = { ...current, notes };

    setLineNotes(ticketId, line.id, notes);
    persistLineProgress(line, nextProgress);
  }

  function markComplete(allowMissing = false) {
    if (!order || !progress) return;

    if (!progress.isFullyPicked && !allowMissing) {
      setShowMissingConfirm(true);
      return;
    }

    const nextStatus =
      order.fulfillmentMethod === "pickup" ? "ready_for_pickup" : "out_for_delivery";
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
      <main className="mx-auto grid min-h-[520px] max-w-3xl place-items-center px-4 py-10 text-center">
        <Card>
          <CardBody className="p-8">
            <TriangleAlert className="mx-auto text-amber-700" size={36} />
            <h1 className="mt-4 text-3xl font-black text-industrial-ink">
              Pick ticket not found
            </h1>
            <p className="mt-2 text-sm text-industrial-steel">
              This ticket may have been completed, deleted, or created in another browser.
            </p>
            <Link
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 border border-industrial-ink bg-industrial-ink px-4 text-sm font-black uppercase tracking-[0.08em] text-white"
              href="/admin/warehouse"
            >
              <ArrowLeft size={16} />
              Back to pick tickets
            </Link>
          </CardBody>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1800px] px-3 py-3 md:px-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Link
          className="inline-flex h-10 items-center gap-2 border border-industrial-rail bg-white px-3 text-xs font-black uppercase tracking-[0.08em] text-industrial-ink hover:border-industrial-ink"
          href="/admin/warehouse"
        >
          <ArrowLeft size={15} />
          Pick tickets
        </Link>
        <span className="hidden text-xs font-black uppercase tracking-[0.12em] text-industrial-muted md:inline">
          {formatWarehouseDate(order.createdAt)}
        </span>
      </div>

      <section className="grid gap-3 border border-industrial-rail bg-white p-3 lg:grid-cols-[minmax(360px,1fr)_260px_300px] lg:items-stretch">
        <div className="grid content-center gap-2">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
            <h1 className="text-4xl font-black leading-none text-industrial-ink md:text-5xl">
              {order.orderNumber}
            </h1>
            <p className="pb-1 text-xl font-black text-industrial-steel">
              {order.companyName || order.customerName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.08em]">
            <span className="inline-flex items-center gap-2 border border-industrial-rail bg-industrial-paper px-3 py-2">
              <Truck size={16} />
              {order.fulfillmentMethod}
            </span>
            <span className="inline-flex items-center gap-2 border border-industrial-rail bg-industrial-paper px-3 py-2">
              <ClipboardCheck size={16} />
              {orderStatusLabels[order.status]}
            </span>
            <span className="inline-flex items-center gap-2 border border-industrial-rail bg-industrial-paper px-3 py-2">
              {order.requestedWindow || "No window"}
            </span>
          </div>
        </div>

        <div className="border border-industrial-rail bg-industrial-paper p-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
            Pick progress
          </p>
          <p className="mt-1 text-4xl font-black leading-none text-industrial-ink">
            {progress.pulledQuantity} of {progress.totalQuantity}
          </p>
          <p className="mt-1 text-sm font-bold text-industrial-steel">
            {pickTicketStatusLabels[progress.status]}
          </p>
          <div className="mt-3 h-4 overflow-hidden border border-industrial-rail bg-white">
            <div
              className="h-full bg-industrial-pine"
              style={{
                width: `${
                  progress.totalQuantity
                    ? Math.round((progress.pulledQuantity / progress.totalQuantity) * 100)
                    : 0
                }%`
              }}
            />
          </div>
        </div>

        <div className="grid gap-2 border border-industrial-rail bg-industrial-paper p-3">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
            Order notes
          </p>
          <p className="line-clamp-2 text-sm font-semibold leading-5 text-industrial-steel">
            {order.jobsiteAddress.notes || "No notes supplied."}
          </p>
          <Button
            className="h-11 justify-center text-sm"
            onClick={() => markComplete(false)}
            variant="primary"
          >
            <PackageCheck size={18} />
            Mark Pick Ticket Complete
          </Button>
        </div>
      </section>

      {backendNotice ? (
        <div className="mt-3 border border-amber-700 bg-amber-50 p-2 text-sm font-black text-amber-900">
          Backend notice: {backendNotice}
        </div>
      ) : null}

      {actionMessage ? (
        <div className="mt-3 border border-industrial-pine bg-industrial-paper p-2 text-sm font-black text-industrial-pine">
          {actionMessage}
        </div>
      ) : null}

      {progress.isFullyPicked ? (
        <div className="mt-3 border border-emerald-300 bg-emerald-50 p-3 text-lg font-black text-emerald-800">
          Order Fully Picked
        </div>
      ) : null}

      {showMissingConfirm ? (
        <div className="mt-3 grid gap-3 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 md:grid-cols-[1fr_auto] md:items-center">
          <p className="font-black">
            Some items are still missing. Confirm completion anyway?
          </p>
          <Button onClick={() => markComplete(true)} variant="danger">
            Complete with missing items
          </Button>
        </div>
      ) : null}

      <section className="mt-3 grid gap-2">
        {lines.map((line) => {
          const lineProgress = ticketProgress[line.id] || lineProgressDefaults(line);
          const pulled =
            lineProgress.pulled || lineProgress.quantityPulled >= line.quantityNeeded;

          return (
            <article
              className={`grid gap-3 border p-2 transition lg:grid-cols-[92px_minmax(280px,1fr)_150px_280px_minmax(260px,340px)] lg:items-center ${
                pulled
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-industrial-rail bg-white"
              }`}
              key={line.id}
            >
              <div className="relative aspect-square size-[92px] overflow-hidden border border-industrial-rail bg-white">
                <Image
                  alt={line.title}
                  className="object-contain p-1"
                  fill
                  quality={45}
                  sizes="92px"
                  src={line.image}
                />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black leading-tight text-industrial-ink">
                    {line.title}
                  </h2>
                  {pulled ? (
                    <span className="inline-flex items-center gap-1 border border-emerald-300 bg-white px-2 py-1 text-xs font-black uppercase tracking-[0.08em] text-emerald-800">
                      <CheckCircle2 size={14} />
                      Pulled
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-industrial-muted">
                  {line.sku}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.08em]">
                  <span className="border border-industrial-rail bg-industrial-paper px-2 py-1">
                    Bin {line.binCode}
                  </span>
                  <span className="border border-industrial-rail bg-industrial-paper px-2 py-1">
                    Available {line.available}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 overflow-hidden border border-industrial-rail bg-white text-center">
                <div className="border-r border-industrial-rail p-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.08em] text-industrial-muted">
                    Need
                  </p>
                  <p className="text-4xl font-black leading-none text-industrial-ink">
                    {line.quantityNeeded}
                  </p>
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.08em] text-industrial-muted">
                    Pulled
                  </p>
                  <p className="text-4xl font-black leading-none text-industrial-pine">
                    {lineProgress.quantityPulled}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2">
                <Button
                  className="h-12 px-4 text-sm"
                  onClick={() => togglePulled(line)}
                  variant={pulled ? "secondary" : "primary"}
                >
                  <CheckCircle2 size={18} />
                  {pulled ? "Undo" : "Pulled"}
                </Button>
                <Button
                  className="h-12"
                  onClick={() => changeQuantity(line, lineProgress.quantityPulled - 1)}
                  size="icon"
                >
                  <Minus size={20} />
                </Button>
                <Input
                  className="h-12 w-16 text-center text-lg font-black"
                  min={0}
                  onChange={(event) =>
                    changeQuantity(line, Number(event.target.value || 0))
                  }
                  type="number"
                  value={lineProgress.quantityPulled}
                />
                <Button
                  className="h-12"
                  onClick={() => changeQuantity(line, lineProgress.quantityPulled + 1)}
                  size="icon"
                >
                  <Plus size={20} />
                </Button>
              </div>

              <Textarea
                className="min-h-12 resize-none text-sm"
                onChange={(event) => changeNotes(line, event.target.value)}
                placeholder='Problem notes: "only 3 in stock", "damaged", etc.'
                value={lineProgress.notes}
              />
            </article>
          );
        })}
      </section>
    </main>
  );
}
