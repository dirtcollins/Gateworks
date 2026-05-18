// Wayfinder — checkout. Customer / company info, will-call pickup or jobsite
// delivery scheduling, payment method (card or net-terms), and a real
// place-order that builds an OrderRecord via @/lib/order-store.createOrder and
// POSTs it to the real /api/orders route. Confirmation screen on success.
// Order math (subtotal / tax / delivery) is the real logic ported from
// features/checkout/checkout-page-client.tsx, restyled in Wayfinder.
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { useOrderStore, type OrderAddress } from "@/lib/order-store";
import { useUserStore } from "@/lib/user-store";
import { calculateTax } from "@/lib/tax";
import type { FulfillmentMethod } from "@/lib/platform-backend";
import { Btn, Card, Eyebrow, Ico, Mono, fmt, monoFont, wf } from "./kit";
import { WfInput } from "./cart-page";

const pickupWindows = [
  "6:00A - 8:00A",
  "8:00A - 10:00A",
  "10:00A - 12:00P",
  "12:00P - 2:00P",
  "2:00P - 4:00P"
];

type PaymentMethod = "card" | "net-terms" | "purchase-order";

const emptyAddress: OrderAddress = {
  name: "",
  company: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  notes: ""
};

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function WayfinderCheckout() {
  const { items, clearCart } = useCartStore();
  const createOrder = useOrderStore((state) => state.createOrder);
  const displayName = useUserStore((state) => state.displayName);
  const userId = useUserStore((state) => state.userId);

  const [ready, setReady] = useState(false);
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>("pickup");
  const [requestedDate, setRequestedDate] = useState(tomorrowDate());
  const [requestedWindow, setRequestedWindow] = useState(pickupWindows[1]);
  const [jobName, setJobName] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [poNumber, setPoNumber] = useState("");
  const [address, setAddress] = useState<OrderAddress>(emptyAddress);
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    useCartStore.persist.rehydrate();
    useOrderStore.persist.rehydrate();
    setReady(true);
  }, []);

  // Seed the contact name from the signed-in account once ready.
  useEffect(() => {
    if (ready && displayName && displayName !== "Guest") {
      setAddress((current) =>
        current.name ? current : { ...current, name: displayName }
      );
    }
  }, [ready, displayName]);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );
  const totalWeight = useMemo(
    () => items.reduce((total, item) => total + (item.weightLbs || 0) * item.quantity, 0),
    [items]
  );
  // Delivery is free over $500, else $85 — ported from the real checkout.
  const deliveryFee = fulfillment === "delivery" ? (subtotal >= 500 ? 0 : 85) : 0;
  const tax = calculateTax(subtotal);
  const total = subtotal + tax + deliveryFee;

  function updateAddress(field: keyof OrderAddress, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  async function placeOrder() {
    if (isSubmitting) return;

    if (!items.length) {
      setError("Add products to the cart before checkout.");
      return;
    }
    if (!address.name || !address.email || !address.phone) {
      setError("Contact name, email, and phone are required.");
      return;
    }
    if (
      fulfillment === "delivery" &&
      (!address.addressLine1 || !address.city || !address.state || !address.postalCode)
    ) {
      setError("Delivery orders require a complete jobsite address.");
      return;
    }

    if (payment === "purchase-order" && !poNumber.trim()) {
      setError("Enter a purchase-order number to bill on a PO.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      // Net-terms checkout is submitted as a quote request so staff price /
      // approve terms before invoicing. A purchase-order checkout is a real
      // order that carries a PO number and submitted PO status for admin
      // approval. Card checkout is a live order.
      const isQuoteRequest = payment === "net-terms";
      const isPurchaseOrder = payment === "purchase-order";

      const order = createOrder({
        userId,
        customerName: address.name,
        companyName: address.company,
        email: address.email,
        phone: address.phone,
        items,
        fulfillmentMethod: fulfillment,
        requestedDate,
        requestedWindow,
        jobName: jobName || poNumber,
        jobsiteAddress: address,
        drawings: [],
        pickupContact: address.name,
        subtotal,
        tax,
        deliveryFee,
        total,
        status: isQuoteRequest ? "draft" : "submitted",
        paymentStatus: "unpaid",
        isQuoteRequest
      });

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...order,
          poNumber: isPurchaseOrder ? poNumber.trim() : "",
          poStatus: isPurchaseOrder ? "submitted" : "none"
        })
      }).catch(() => null);

      if (!response) {
        setError("Could not reach /api/orders. Check that the server is running.");
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { persisted?: boolean; reason?: string; orderNumber?: string }
        | null;
      const orderNumber = payload?.orderNumber || order.orderNumber;

      if (!response.ok || !payload?.persisted) {
        setError(payload?.reason || "Order could not be saved to Supabase.");
        return;
      }

      setSubmittedOrderNumber(orderNumber);
      clearCart();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit order. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <div style={{ padding: 64, textAlign: "center", color: wf.muted }}>
        <Mono>Loading checkout…</Mono>
      </div>
    );
  }

  // Confirmation screen
  if (submittedOrderNumber) {
    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "56px 24px" }}>
        <Card style={{ padding: 36, textAlign: "center" }}>
          <div
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: wf.pine,
              color: "#fff",
              marginBottom: 16
            }}
          >
            <Ico.check size={32} />
          </div>
          <Eyebrow>
            {payment === "net-terms"
              ? "Quote request"
              : payment === "purchase-order"
                ? "Purchase order"
                : "Order"}{" "}
            confirmed
          </Eyebrow>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: "8px 0" }}>
            {payment === "net-terms"
              ? "Quote request submitted"
              : payment === "purchase-order"
                ? "Purchase order submitted"
                : "Order placed"}
          </h1>
          <Mono style={{ fontSize: 13, color: wf.steel, display: "block" }}>
            Reference {submittedOrderNumber}
          </Mono>
          <p style={{ fontSize: 13, color: wf.steel, margin: "14px 0 20px", lineHeight: 1.6 }}>
            {fulfillment === "pickup"
              ? `Your order will be staged in aisle order at Bay 7 for ${requestedWindow} pickup on ${requestedDate}.`
              : `Your order is scheduled for jobsite delivery on ${requestedDate}.`}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <Btn variant="primary" href="/account">
              View account
            </Btn>
            <Btn variant="default" href="/search">
              Keep shopping
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "56px 24px" }}>
        <Card style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Your cart is empty.</p>
          <p style={{ fontSize: 13, color: wf.steel, margin: "8px 0 18px" }}>
            Add products before scheduling pickup or delivery.
          </p>
          <Btn variant="primary" href="/search">
            Browse the catalog <Ico.arrowRight size={14} />
          </Btn>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: 24 }}>
      <div
        style={{
          borderBottom: `1px solid ${wf.rail}`,
          paddingBottom: 18,
          marginBottom: 20
        }}
      >
        <Eyebrow>Will-call checkout</Eyebrow>
        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.02em", margin: "6px 0 0" }}>
          Schedule pickup or delivery
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 360px",
          gap: 20,
          alignItems: "start"
        }}
      >
        <div style={{ display: "grid", gap: 16 }}>
          {/* Fulfillment */}
          <Card style={{ padding: 18 }}>
            <Eyebrow>Fulfillment</Eyebrow>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginTop: 12
              }}
            >
              {(
                [
                  {
                    id: "pickup" as FulfillmentMethod,
                    icon: <Ico.map size={20} />,
                    title: "Will-call pickup",
                    sub: "Staged in aisle order at Bay 7 — same-day before 11A."
                  },
                  {
                    id: "delivery" as FulfillmentMethod,
                    icon: <Ico.truck size={20} />,
                    title: "Jobsite delivery",
                    sub: "Route-ready delivery in the Bakersfield service area."
                  }
                ]
              ).map((option) => {
                const on = fulfillment === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFulfillment(option.id)}
                    style={{
                      textAlign: "left",
                      display: "grid",
                      gap: 6,
                      padding: 12,
                      cursor: "pointer",
                      border: on ? `2px solid ${wf.ink}` : `1px solid ${wf.rail}`,
                      background: on ? wf.amber : "#fff"
                    }}
                  >
                    {option.icon}
                    <span style={{ fontSize: 13, fontWeight: 800 }}>{option.title}</span>
                    <span style={{ fontSize: 12, color: wf.steel, lineHeight: 1.4 }}>
                      {option.sub}
                    </span>
                  </button>
                );
              })}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginTop: 12
              }}
            >
              <Field label="Requested date">
                <input
                  type="date"
                  min={tomorrowDate()}
                  value={requestedDate}
                  onChange={(event) => setRequestedDate(event.target.value)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Time window">
                <select
                  value={requestedWindow}
                  onChange={(event) => setRequestedWindow(event.target.value)}
                  style={inputStyle}
                >
                  {pickupWindows.map((window) => (
                    <option key={window} value={window}>
                      {window}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Card>

          {/* Customer */}
          <Card style={{ padding: 18 }}>
            <Eyebrow>Customer &amp; jobsite</Eyebrow>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginTop: 12
              }}
            >
              <WfInput
                placeholder="Contact name"
                value={address.name}
                onChange={(value) => updateAddress("name", value)}
              />
              <WfInput
                placeholder="Company"
                value={address.company}
                onChange={(value) => updateAddress("company", value)}
              />
              <WfInput
                placeholder="Email"
                type="email"
                value={address.email}
                onChange={(value) => updateAddress("email", value)}
              />
              <WfInput
                placeholder="Phone"
                value={address.phone}
                onChange={(value) => updateAddress("phone", value)}
              />
            </div>
            <div style={{ marginTop: 10 }}>
              <WfInput
                placeholder="Job name or PO number"
                value={jobName}
                onChange={setJobName}
              />
            </div>
            {fulfillment === "delivery" ? (
              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 800,
                    color: wf.ink
                  }}
                >
                  <Ico.pin size={14} /> Jobsite delivery address
                </div>
                <WfInput
                  placeholder="Address line 1"
                  value={address.addressLine1}
                  onChange={(value) => updateAddress("addressLine1", value)}
                />
                <WfInput
                  placeholder="Address line 2"
                  value={address.addressLine2}
                  onChange={(value) => updateAddress("addressLine2", value)}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr",
                    gap: 10
                  }}
                >
                  <WfInput
                    placeholder="City"
                    value={address.city}
                    onChange={(value) => updateAddress("city", value)}
                  />
                  <WfInput
                    placeholder="State"
                    value={address.state}
                    onChange={(value) => updateAddress("state", value)}
                  />
                  <WfInput
                    placeholder="ZIP"
                    value={address.postalCode}
                    onChange={(value) => updateAddress("postalCode", value)}
                  />
                </div>
              </div>
            ) : null}
            <div style={{ marginTop: 10 }}>
              <textarea
                placeholder="Gate code, forklift needs, cut instructions, shop notes"
                value={address.notes}
                onChange={(event) => updateAddress("notes", event.target.value)}
                style={{ ...inputStyle, height: 72, padding: "10px 12px", resize: "vertical" }}
              />
            </div>
          </Card>

          {/* Payment */}
          <Card style={{ padding: 18 }}>
            <Eyebrow>Payment</Eyebrow>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
                marginTop: 12
              }}
            >
              {(
                [
                  {
                    id: "card" as PaymentMethod,
                    title: "Card at pickup",
                    sub: "Pay at the counter or by card on file. Order goes live now."
                  },
                  {
                    id: "purchase-order" as PaymentMethod,
                    title: "Purchase order",
                    sub: "Bill against a PO number. Order is submitted for PO approval."
                  },
                  {
                    id: "net-terms" as PaymentMethod,
                    title: "Net terms",
                    sub: "Bill the account on net terms. Submitted for staff pricing & approval."
                  }
                ]
              ).map((option) => {
                const on = payment === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setPayment(option.id)}
                    style={{
                      textAlign: "left",
                      display: "grid",
                      gap: 6,
                      padding: 12,
                      cursor: "pointer",
                      border: on ? `2px solid ${wf.ink}` : `1px solid ${wf.rail}`,
                      background: on ? wf.amber : "#fff"
                    }}
                  >
                    <Ico.receipt size={18} />
                    <span style={{ fontSize: 13, fontWeight: 800 }}>{option.title}</span>
                    <span style={{ fontSize: 12, color: wf.steel, lineHeight: 1.4 }}>
                      {option.sub}
                    </span>
                  </button>
                );
              })}
            </div>
            {payment === "purchase-order" ? (
              <div style={{ marginTop: 10 }}>
                <Field label="Purchase-order number">
                  <WfInput
                    placeholder="e.g. PO-48213"
                    value={poNumber}
                    onChange={setPoNumber}
                  />
                </Field>
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 11,
                    color: wf.muted,
                    fontFamily: monoFont
                  }}
                >
                  The order is placed now and held for PO approval by the
                  Bakersfield desk before fulfillment.
                </p>
              </div>
            ) : null}
            {payment === "net-terms" ? (
              <div style={{ marginTop: 10 }}>
                <WfInput
                  placeholder="PO number (optional)"
                  value={poNumber}
                  onChange={setPoNumber}
                />
              </div>
            ) : null}
          </Card>
        </div>

        {/* Summary */}
        <Card style={{ padding: 18 }}>
          <Eyebrow>Order summary</Eyebrow>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {items.map((item) => (
              <div
                key={item.variantId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  borderBottom: `1px solid ${wf.hairline}`,
                  paddingBottom: 8,
                  fontSize: 13
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 800, margin: 0 }}>{item.title}</p>
                  <Mono style={{ fontSize: 11, color: wf.muted }}>
                    {item.quantity} × SKU {item.sku}
                  </Mono>
                </div>
                <span style={{ fontWeight: 800, whiteSpace: "nowrap" }}>
                  {fmt(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 12, fontSize: 13 }}>
            <SummaryRow label="Subtotal" value={fmt(subtotal)} />
            {totalWeight > 0 ? (
              <SummaryRow label="Material weight" value={`${totalWeight.toFixed(1)} lb`} />
            ) : null}
            <SummaryRow
              label="Delivery"
              value={fulfillment === "delivery" ? fmt(deliveryFee) : "Will-call"}
            />
            <SummaryRow label="Estimated tax" value={fmt(tax)} />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              borderTop: `1px solid ${wf.rail}`,
              marginTop: 12,
              paddingTop: 12
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 800 }}>Total</span>
            <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em" }}>
              {fmt(total)}
            </span>
          </div>
          {error ? (
            <p
              style={{
                marginTop: 12,
                padding: "8px 10px",
                border: `1px solid ${wf.red}`,
                color: wf.red,
                fontSize: 12,
                fontWeight: 700
              }}
            >
              {error}
            </p>
          ) : null}
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            <Btn
              variant="primary"
              block
              style={{ height: 48 }}
              disabled={isSubmitting}
              onClick={placeOrder}
            >
              {isSubmitting
                ? "Submitting…"
                : payment === "net-terms"
                  ? "Submit for net terms"
                  : payment === "purchase-order"
                    ? "Submit purchase order"
                    : "Place order"}
            </Btn>
            <Btn variant="ghost" href="/cart" block size="sm">
              Back to cart
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 40,
  border: `1px solid ${wf.rail}`,
  background: "#fff",
  padding: "0 12px",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "inherit",
  outline: "none",
  color: wf.ink,
  width: "100%"
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: wf.steel
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: wf.steel }}>{label}</span>
      <span style={{ fontWeight: 700, fontFamily: monoFont }}>{value}</span>
    </div>
  );
}
