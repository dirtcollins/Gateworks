// Wayfinder admin — order detail. Loads a single order from the real order
// store (lib/order-store), falling back to /api/orders for a direct fetch when
// the store has not hydrated that record. Supports advancing the warehouse
// workflow, recording a payment, and editing fulfillment notes — all writing
// back to the order store and best-effort PATCH to /api/orders.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useOrderStore, type OrderRecord, type OrderPayment } from "@/lib/order-store";
import type { PaymentStatus } from "@/lib/platform-backend";
import { fmt } from "../kit";
import {
  AdminBtn,
  Ico,
  Mono,
  Notice,
  Panel,
  PageHead,
  Pill,
  TextInput,
  SelectInput,
  Field,
  monoFont,
  wf
} from "./admin-kit";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDate,
  formatTime,
  nextWorkflowStep,
  orderAmountDue,
  orderStatusTone,
  paymentStatusTone
} from "./order-helpers";

const PAYMENT_METHODS = ["Cash", "Check", "Credit card", "ACH", "Wire", "Financing"];

export function WayfinderOrderDetail({ orderId }: { orderId: string }) {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const upsertOrder = useOrderStore((state) => state.upsertOrder);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const updatePaymentStatus = useOrderStore((state) => state.updatePaymentStatus);

  const [loaded, setLoaded] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState(PAYMENT_METHODS[0]);
  const [message, setMessage] = useState("");

  const order = useMemo(
    () => storedOrders.find((o) => o.id === orderId),
    [storedOrders, orderId]
  );

  useEffect(() => {
    useOrderStore.persist.rehydrate();
    async function load() {
      try {
        const res = await fetch("/api/orders?limit=250", { cache: "no-store" });
        if (res.ok) {
          const payload = (await res.json()) as { orders?: OrderRecord[]; persisted?: boolean };
          if (payload.persisted && payload.orders) setOrders(payload.orders);
        }
      } finally {
        setLoaded(true);
      }
    }
    void load();
  }, [setOrders]);

  if (!order) {
    return (
      <>
        <PageHead
          eyebrow="Operations"
          title="Order not found"
          action={<AdminBtn href="/admin/orders">Back to orders</AdminBtn>}
        />
        <Panel>
          <p style={{ margin: 0, color: wf.muted, fontSize: 13 }}>
            {loaded
              ? `No order matches ${orderId}. It may have been removed, or you are viewing a fresh browser without local data.`
              : "Loading order…"}
          </p>
        </Panel>
      </>
    );
  }

  const step = nextWorkflowStep(order);
  const due = orderAmountDue(order);
  const paid = (order.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);

  function advance() {
    if (!order || !step) return;
    updateOrderStatus(order.id, step.next, step.detail);
    setMessage(step.detail);
    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, status: step.next })
    }).catch(() => null);
  }

  function recordPayment() {
    if (!order) return;
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Enter a payment amount greater than zero.");
      return;
    }
    const now = new Date().toISOString();
    const payment: OrderPayment = {
      id: `pay-${Date.now()}`,
      amount,
      method: payMethod,
      paidAt: now,
      reference: "",
      note: "",
      createdBy: "Counter staff",
      createdAt: now
    };
    const nextPaid = paid + amount;
    const nextStatus: PaymentStatus =
      nextPaid >= order.total ? (nextPaid > order.total ? "overpaid" : "paid") : "partial";
    upsertOrder({
      ...order,
      payments: [...(order.payments || []), payment],
      paymentStatus: nextStatus
    });
    updatePaymentStatus(order.id, nextStatus, `${payMethod} payment of ${fmt(amount)} recorded.`);
    setPayAmount("");
    setMessage(`${fmt(amount)} ${payMethod} payment recorded.`);
  }

  return (
    <>
      <PageHead
        eyebrow={
          <Link href="/admin/orders" style={{ color: wf.steel }}>
            ← Orders
          </Link>
        }
        title={<Mono style={{ fontSize: 24 }}>{order.orderNumber}</Mono>}
        desc={`${order.companyName || order.customerName} · placed ${formatDate(
          order.createdAt
        )}`}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            {step ? (
              <AdminBtn onClick={advance}>{step.label}</AdminBtn>
            ) : null}
            <AdminBtn
              variant="primary"
              onClick={() => window.print()}
              title="Print pick ticket"
            >
              <Ico.clipboard size={14} /> Pick ticket
            </AdminBtn>
          </div>
        }
      />

      {message ? <Notice tone="good">{message}</Notice> : null}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center"
        }}
      >
        <Pill tone={orderStatusTone(order.status)}>
          {ORDER_STATUS_LABELS[order.status]}
        </Pill>
        <Pill tone={paymentStatusTone(order.paymentStatus)}>
          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
        </Pill>
        <Pill tone="neutral">{order.fulfillmentMethod}</Pill>
        <span style={{ fontSize: 11, color: wf.muted, fontFamily: monoFont }}>
          Updated {formatDate(order.updatedAt)} · {formatTime(order.updatedAt)}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)"
        }}
        className="wf-admin-detail-grid"
      >
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel title="Line items" meta={`${order.items.length} SKUs`} pad={false}>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
              >
                <thead>
                  <tr style={{ background: wf.bone }}>
                    {["SKU", "Item", "Qty", "Unit", "Line total"].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          textAlign: i >= 2 ? "right" : "left",
                          padding: "9px 14px",
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: wf.steel,
                          borderBottom: `1px solid ${wf.rail}`
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {order.items.length ? (
                    order.items.map((item) => (
                      <tr key={item.variantId}>
                        <td style={cell()}>
                          <Mono style={{ fontSize: 11 }}>{item.sku}</Mono>
                        </td>
                        <td style={cell()}>
                          <span style={{ fontWeight: 700 }}>{item.title}</span>
                        </td>
                        <td style={cell("right")}>
                          <Mono>{item.quantity}</Mono>
                        </td>
                        <td style={cell("right")}>
                          <Mono>{fmt(item.price)}</Mono>
                        </td>
                        <td style={cell("right")}>
                          <Mono style={{ fontWeight: 700 }}>
                            {fmt(item.price * item.quantity)}
                          </Mono>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: "26px 14px",
                          textAlign: "center",
                          color: wf.muted,
                          fontFamily: monoFont
                        }}
                      >
                        No line items on this order.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div
              style={{
                borderTop: `1px solid ${wf.hairline}`,
                padding: "12px 16px",
                display: "grid",
                gap: 6,
                justifyItems: "end"
              }}
            >
              <Totals label="Subtotal" value={order.subtotal} />
              {order.deliveryFee ? (
                <Totals label="Delivery" value={order.deliveryFee} />
              ) : null}
              <Totals label="Tax" value={order.tax} />
              <Totals label="Total" value={order.total} strong />
              <Totals label="Paid" value={paid} />
              <Totals label="Balance due" value={due} strong tone="red" />
            </div>
          </Panel>

          <Panel title="Activity log" meta={`${order.activity.length} entries`}>
            <div style={{ display: "grid", gap: 12 }}>
              {order.activity.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "10px 1fr",
                    gap: 12
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: wf.pine,
                      marginTop: 5
                    }}
                  />
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>
                      {entry.label}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: wf.steel }}>
                      {entry.detail}
                    </p>
                    <p
                      style={{
                        margin: "3px 0 0",
                        fontSize: 10,
                        color: wf.muted,
                        fontFamily: monoFont
                      }}
                    >
                      {formatDate(entry.createdAt)} · {formatTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel title="Customer">
            <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
              <Detail label="Contact" value={order.customerName} />
              <Detail label="Company" value={order.companyName || "—"} />
              <Detail label="Email" value={order.email || "—"} />
              <Detail label="Phone" value={order.phone || "—"} />
              <Detail label="Job" value={order.jobName || "—"} />
            </div>
          </Panel>

          <Panel title="Fulfillment">
            <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
              <Detail
                label="Method"
                value={
                  order.fulfillmentMethod === "pickup"
                    ? "Will-call pickup · Bay 7"
                    : "Delivery"
                }
              />
              <Detail label="Requested" value={formatDate(order.requestedDate)} />
              <Detail label="Window" value={order.requestedWindow || "—"} />
              {order.fulfillmentMethod === "delivery" ? (
                <Detail
                  label="Address"
                  value={
                    [
                      order.jobsiteAddress.addressLine1,
                      order.jobsiteAddress.city,
                      order.jobsiteAddress.state
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
              ) : (
                <Detail label="Pickup contact" value={order.pickupContact || "—"} />
              )}
            </div>
          </Panel>

          <Panel title="Record payment">
            <div style={{ display: "grid", gap: 10 }}>
              <Field label="Amount">
                <TextInput
                  type="number"
                  min={0}
                  step="0.01"
                  value={payAmount}
                  onChange={(event) => setPayAmount(event.target.value)}
                  placeholder={due ? due.toFixed(2) : "0.00"}
                />
              </Field>
              <Field label="Method">
                <SelectInput
                  value={payMethod}
                  onChange={(event) => setPayMethod(event.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <AdminBtn variant="primary" block onClick={recordPayment}>
                <Ico.check size={14} /> Apply payment
              </AdminBtn>
              {(order.payments || []).length ? (
                <div
                  style={{
                    borderTop: `1px solid ${wf.hairline}`,
                    paddingTop: 8,
                    display: "grid",
                    gap: 6
                  }}
                >
                  {(order.payments || []).map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 11,
                        fontFamily: monoFont,
                        color: wf.steel
                      }}
                    >
                      <span>
                        {p.method} · {formatDate(p.paidAt)}
                      </span>
                      <span style={{ fontWeight: 700, color: wf.ink }}>
                        {fmt(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>
      <style>{`
        @media (max-width: 880px) {
          .wf-admin-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

function cell(align: "left" | "right" = "left"): React.CSSProperties {
  return {
    textAlign: align,
    padding: "10px 14px",
    borderBottom: `1px solid ${wf.hairline}`,
    color: wf.ink
  };
}

function Totals({
  label,
  value,
  strong,
  tone
}: {
  label: string;
  value: number;
  strong?: boolean;
  tone?: "red";
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 28,
        fontSize: strong ? 14 : 12,
        color: tone === "red" ? wf.red : wf.ink
      }}
    >
      <span style={{ color: strong ? "inherit" : wf.steel, fontWeight: strong ? 800 : 600 }}>
        {label}
      </span>
      <Mono style={{ fontWeight: strong ? 800 : 600, minWidth: 90, textAlign: "right" }}>
        {fmt(value)}
      </Mono>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: wf.steel
        }}
      >
        {label}
      </span>
      <span style={{ textAlign: "right", fontWeight: 600 }}>{value}</span>
    </div>
  );
}
