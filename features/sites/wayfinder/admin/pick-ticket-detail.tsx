// Wayfinder admin — pick-ticket detail. Walks a single order line by line
// against the real inventory rows: each line carries an aisle/bay location, a
// need/pulled count, and a notes field. Pull progress persists to
// lib/pick-ticket-store (localStorage) and best-effort PATCHes
// /api/pick-tickets; completing the ticket advances the order status via
// lib/order-store and PATCHes /api/orders.
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
import {
  AdminBtn,
  Ico,
  Mono,
  Notice,
  Panel,
  PageHead,
  Pill,
  TextArea,
  monoFont,
  wf
} from "./admin-kit";

type PickLine = ReturnType<typeof buildPickLines>[number];

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

// Wayfinding location: the inventory bin code maps to a presentational
// aisle/bay pair. Bin codes look like "A-04-12" → Aisle A-04, Bay 12.
function aisleBay(binCode: string) {
  const parts = binCode.split("-");
  if (parts.length >= 3) {
    return { aisle: `${parts[0]}-${parts[1]}`, bay: parts[2] };
  }
  return { aisle: binCode || "—", bay: "—" };
}

export function WayfinderPickTicketDetail({
  inventoryRows,
  ticketId
}: {
  inventoryRows: InventoryRow[];
  ticketId: string;
}) {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const pickTickets = usePickTicketStore((state) => state.tickets);
  const setLinePulled = usePickTicketStore((state) => state.setLinePulled);
  const setLineQuantity = usePickTicketStore((state) => state.setLineQuantity);
  const setLineNotes = usePickTicketStore((state) => state.setLineNotes);

  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<
    { tone: "info" | "warn" | "good"; message: string } | null
  >(null);
  const [confirmMissing, setConfirmMissing] = useState(false);

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

  const operationalOrders = useMemo(() => {
    const operational = getOperationalOrders(storedOrders);
    const samples = sampleWarehouseOrders.filter(
      (sample) => !operational.some((order) => order.id === sample.id)
    );
    return [...operational, ...samples];
  }, [storedOrders]);

  const order = operationalOrders.find((item) => item.id === ticketId);
  const lines = useMemo(
    () => (order ? buildPickLines(order, inventoryRows) : []),
    [order, inventoryRows]
  );
  const ticketProgress = pickTickets[ticketId] || {};
  const progress = order
    ? getPickTicketProgress(order, lines, ticketProgress)
    : null;

  function patchLine(line: PickLine, next: PickLineProgress) {
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
          setNotice({
            tone: "warn",
            message:
              payload.reason ||
              "Supabase is not connected — pull progress is saved in this browser only."
          });
        }
      })
      .catch(() => null);
  }

  function patchOrderStatus(nextStatus: OrderStatus, detail: string) {
    if (!order) return;
    updateOrderStatus(order.id, nextStatus, detail);
    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, status: nextStatus })
    }).catch(() => null);
  }

  function startPickingIfNeeded() {
    if (order?.status === "submitted" || order?.status === "confirmed") {
      patchOrderStatus("picking", "Pick ticket started on the warehouse floor.");
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
      pulledBy: "Counter staff"
    };
    setLinePulled(ticketId, line.id, next);
    patchLine(line, next);
    startPickingIfNeeded();
  }

  function changeQuantity(line: PickLine, value: number) {
    const safe = Math.max(0, Math.min(line.quantityNeeded, value));
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
    patchLine(line, next);
    startPickingIfNeeded();
  }

  function changeNotes(line: PickLine, notes: string) {
    const current = ticketProgress[line.id] || lineDefaults(line);
    setLineNotes(ticketId, line.id, notes);
    patchLine(line, { ...current, notes });
  }

  function completeTicket(allowMissing = false) {
    if (!order || !progress) return;
    if (!progress.isFullyPicked && !allowMissing) {
      setConfirmMissing(true);
      return;
    }
    const nextStatus: OrderStatus =
      order.fulfillmentMethod === "pickup"
        ? "ready_for_pickup"
        : "out_for_delivery";
    patchOrderStatus(
      nextStatus,
      order.fulfillmentMethod === "pickup"
        ? "Pick ticket complete — staged for will-call at Bay 7."
        : "Pick ticket complete — loaded and dispatched for delivery."
    );
    setConfirmMissing(false);
    setNotice({
      tone: "good",
      message:
        order.fulfillmentMethod === "pickup"
          ? "Ticket closed — order staged for will-call."
          : "Ticket closed — order dispatched for delivery."
    });
  }

  if (loaded && (!order || !progress)) {
    return (
      <>
        <PageHead eyebrow="Floor" title="Pick ticket not found" />
        <Panel pad>
          <p style={{ margin: 0, fontSize: 13, color: wf.muted }}>
            This ticket may have been completed, cancelled, or created in
            another browser session.
          </p>
          <div style={{ marginTop: 14 }}>
            <AdminBtn href="/admin/pick-tickets" variant="primary">
              <Ico.arrowRight size={13} /> Back to pick tickets
            </AdminBtn>
          </div>
        </Panel>
      </>
    );
  }

  if (!order || !progress) {
    return (
      <Panel pad>
        <p
          style={{
            margin: 0,
            fontFamily: monoFont,
            fontSize: 13,
            color: wf.muted
          }}
        >
          Loading pick ticket…
        </p>
      </Panel>
    );
  }

  const pct = progress.totalQuantity
    ? Math.round((progress.pulledQuantity / progress.totalQuantity) * 100)
    : 0;

  return (
    <>
      <PageHead
        eyebrow={`Pick ticket · ${order.fulfillmentMethod}`}
        title={order.orderNumber}
        desc={`${order.companyName || order.customerName} · created ${formatWarehouseDate(order.createdAt)}`}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <AdminBtn href="/admin/pick-tickets">
              <Ico.clipboard size={13} /> Pick queue
            </AdminBtn>
            {order.status === "submitted" || order.status === "confirmed" ? (
              <AdminBtn
                variant="primary"
                onClick={() =>
                  patchOrderStatus("picking", "Picking started on the warehouse floor.")
                }
              >
                <Ico.arrowRight size={13} /> Start picking
              </AdminBtn>
            ) : order.status === "picking" ? (
              <AdminBtn variant="primary" onClick={() => completeTicket(false)}>
                <Ico.check size={13} /> Mark complete
              </AdminBtn>
            ) : null}
          </div>
        }
      />

      {notice ? <Notice tone={notice.tone}>{notice.message}</Notice> : null}

      {confirmMissing ? (
        <Notice tone="warn">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap"
            }}
          >
            <span>
              Some lines are still short of the requested count. Close the
              ticket anyway?
            </span>
            <AdminBtn
              size="sm"
              variant="danger"
              onClick={() => completeTicket(true)}
            >
              Complete with missing items
            </AdminBtn>
          </div>
        </Notice>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))"
        }}
      >
        <SummaryTile
          label="Status"
          value={
            <Pill
              tone={
                progress.status === "completed"
                  ? "done"
                  : progress.status === "in_progress"
                    ? "warn"
                    : progress.status === "not_started"
                      ? "neutral"
                      : "active"
              }
            >
              {pickTicketStatusLabels[progress.status]}
            </Pill>
          }
        />
        <SummaryTile
          label="Order stage"
          value={
            <span style={{ fontSize: 13, fontWeight: 800 }}>
              {orderStatusLabels[order.status]}
            </span>
          }
        />
        <SummaryTile
          label="Pulled"
          value={
            <Mono style={{ fontSize: 20, fontWeight: 700 }}>
              {progress.pulledQuantity}/{progress.totalQuantity}
            </Mono>
          }
        />
        <SummaryTile
          label="Lines"
          value={
            <Mono style={{ fontSize: 20, fontWeight: 700 }}>
              {progress.pulledLines}/{progress.lineCount}
            </Mono>
          }
        />
        <SummaryTile
          label="Window"
          value={
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              {order.requestedWindow || "Unscheduled"}
            </span>
          }
        />
      </div>

      <Panel title="Pick progress" pad>
        <div style={{ display: "grid", gap: 6 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
              fontWeight: 700,
              color: wf.steel
            }}
          >
            <span>{progress.isFullyPicked ? "Fully picked" : "In progress"}</span>
            <Mono>{pct}%</Mono>
          </div>
          <div
            style={{
              height: 12,
              background: wf.bone,
              border: `1px solid ${wf.rail}`,
              overflow: "hidden"
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: progress.isFullyPicked ? wf.pine : wf.safety
              }}
            />
          </div>
          {order.jobsiteAddress.notes ? (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: wf.muted }}>
              Order note: {order.jobsiteAddress.notes}
            </p>
          ) : null}
        </div>
      </Panel>

      <Panel title="Pick lines" meta={`${lines.length} lines · walk in aisle order`} pad={false}>
        <div style={{ display: "grid" }}>
          {lines.map((line) => {
            const lineProgress = ticketProgress[line.id] || lineDefaults(line);
            const pulled =
              lineProgress.pulled ||
              lineProgress.quantityPulled >= line.quantityNeeded;
            const { aisle, bay } = aisleBay(line.binCode);

            return (
              <div
                key={line.id}
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "64px minmax(0, 1.6fr) 150px 220px",
                  alignItems: "center",
                  padding: 14,
                  borderBottom: `1px solid ${wf.hairline}`,
                  background: pulled ? "#e7f0ea" : "#fff"
                }}
                className="wf-pickline"
              >
                <div
                  style={{
                    position: "relative",
                    width: 64,
                    height: 64,
                    border: `1px solid ${wf.rail}`,
                    background: "#fff",
                    flexShrink: 0
                  }}
                >
                  <Image
                    alt={line.title}
                    src={line.image}
                    fill
                    quality={45}
                    sizes="64px"
                    style={{ objectFit: "contain", padding: 4 }}
                  />
                </div>

                <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: wf.ink }}>
                    {line.title}
                  </span>
                  <Mono style={{ fontSize: 11, color: wf.muted }}>
                    SKU {line.sku}
                  </Mono>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                      fontFamily: monoFont,
                      fontSize: 10,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase"
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        border: `1px solid ${wf.rail}`,
                        background: wf.ink,
                        color: "#fff",
                        padding: "3px 7px",
                        fontWeight: 700
                      }}
                    >
                      <Ico.pin size={11} /> Aisle {aisle} · Bay {bay}
                    </span>
                    <span
                      style={{
                        border: `1px solid ${wf.hairline}`,
                        background: wf.bone,
                        color: wf.steel,
                        padding: "3px 7px"
                      }}
                    >
                      {line.available} available
                    </span>
                    {line.status === "short" ? (
                      <Pill tone="stop">Short stock</Pill>
                    ) : line.status === "substitute" ? (
                      <Pill tone="warn">Below requested</Pill>
                    ) : null}
                  </div>
                  {line.inventoryNote ? (
                    <span style={{ fontSize: 11, color: wf.muted }}>
                      {line.inventoryNote}
                    </span>
                  ) : null}
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontFamily: monoFont,
                      fontSize: 12,
                      fontWeight: 700,
                      color: wf.steel
                    }}
                  >
                    <span>Need {line.quantityNeeded}</span>
                    <span style={{ color: wf.pineDeep }}>
                      Pulled {lineProgress.quantityPulled}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      border: `1px solid ${wf.rail}`,
                      height: 32
                    }}
                  >
                    <button
                      type="button"
                      aria-label="Decrease pulled"
                      onClick={() =>
                        changeQuantity(line, lineProgress.quantityPulled - 1)
                      }
                      style={stepperBtn}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={line.quantityNeeded}
                      value={lineProgress.quantityPulled}
                      onChange={(event) =>
                        changeQuantity(line, Number(event.target.value) || 0)
                      }
                      aria-label="Quantity pulled"
                      style={{
                        flex: 1,
                        textAlign: "center",
                        border: "none",
                        borderLeft: `1px solid ${wf.rail}`,
                        borderRight: `1px solid ${wf.rail}`,
                        fontFamily: monoFont,
                        fontWeight: 700,
                        fontSize: 13,
                        outline: "none",
                        background: "transparent",
                        width: 40
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Increase pulled"
                      onClick={() =>
                        changeQuantity(line, lineProgress.quantityPulled + 1)
                      }
                      style={stepperBtn}
                    >
                      +
                    </button>
                  </div>
                  <AdminBtn
                    size="sm"
                    variant={pulled ? "default" : "primary"}
                    onClick={() => togglePulled(line)}
                    block
                  >
                    <Ico.check size={12} /> {pulled ? "Undo pull" : "Mark pulled"}
                  </AdminBtn>
                </div>

                <TextArea
                  value={lineProgress.notes}
                  onChange={(event) => changeNotes(line, event.target.value)}
                  placeholder="Pick notes — short count, damage, substitution…"
                  style={{ minHeight: 64, fontSize: 12 }}
                />
              </div>
            );
          })}
        </div>
      </Panel>

      <style>{`
        @media (max-width: 860px) {
          .wf-pickline {
            grid-template-columns: 64px minmax(0, 1fr) !important;
          }
          .wf-pickline > :nth-child(3),
          .wf-pickline > :nth-child(4) {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </>
  );
}

const stepperBtn: React.CSSProperties = {
  width: 32,
  background: "none",
  border: "none",
  fontSize: 16,
  fontWeight: 700,
  color: wf.ink,
  cursor: "pointer"
};

function SummaryTile({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${wf.rail}`,
        borderTop: `3px solid ${wf.ink}`,
        padding: "12px 14px",
        display: "grid",
        gap: 6
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: wf.steel
        }}
      >
        {label}
      </span>
      {value}
    </div>
  );
}
