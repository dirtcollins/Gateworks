"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  PackageCheck,
  Truck
} from "lucide-react";
import {
  Breadcrumb,
  Card,
  Eyebrow,
  LedgerPage,
  LEDGER,
  formatUsd
} from "./kit";
import { useLedgerScope } from "./scope";
import { useCartStore } from "@/lib/cart-store";
import { useOrderStore, type OrderAddress } from "@/lib/order-store";
import { useUserStore } from "@/lib/user-store";
import { calculateTax } from "@/lib/tax";
import type { FulfillmentMethod } from "@/lib/platform-backend";

const pickupWindows = [
  "7:00 AM - 9:00 AM",
  "9:00 AM - 11:00 AM",
  "11:00 AM - 1:00 PM",
  "1:00 PM - 3:00 PM",
  "3:00 PM - 5:00 PM"
];

type PaymentMethod = "net-terms" | "card";

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

/* Shared field styling for the Ledger checkout form. */
function fieldStyle() {
  return {
    border: `1px solid ${LEDGER.line}`,
    color: LEDGER.ink,
    backgroundColor: LEDGER.surface
  } as const;
}

function FormLabel({ children }: { children: string }) {
  return (
    <span
      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em]"
      style={{ color: LEDGER.muted }}
    >
      {children}
    </span>
  );
}

/* Ledger checkout — customer/company info, pickup or delivery
 * scheduling, payment method (net-terms or card), and a real order
 * submission against /api/orders with confirmation. */
export function LedgerCheckoutView() {
  const hydrated = useLedgerScope();
  const { items, clearCart } = useCartStore();
  const createOrder = useOrderStore((state) => state.createOrder);
  const displayName = useUserStore((state) => state.displayName);
  const userId = useUserStore((state) => state.userId);

  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<FulfillmentMethod>("pickup");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("net-terms");
  const [requestedDate, setRequestedDate] = useState(tomorrowDate());
  const [requestedWindow, setRequestedWindow] = useState(pickupWindows[1]);
  const [jobName, setJobName] = useState("");
  const [address, setAddress] = useState<OrderAddress>({
    ...emptyAddress,
    name: displayName === "Guest" ? "" : displayName
  });
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );
  const weight = useMemo(
    () =>
      items.reduce(
        (total, item) => total + (item.weightLbs || 0) * item.quantity,
        0
      ),
    [items]
  );
  const deliveryFee =
    fulfillmentMethod === "delivery" ? (subtotal >= 500 ? 0 : 85) : 0;
  const tax = calculateTax(subtotal);
  const total = subtotal + tax + deliveryFee;

  function updateAddress(field: keyof OrderAddress, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  async function placeOrder() {
    if (isSubmitting) return;

    if (!items.length) {
      setError("Add items to the purchase order before checkout.");
      return;
    }
    if (!address.name || !address.email || !address.phone) {
      setError("Contact name, email, and phone are required.");
      return;
    }
    if (
      fulfillmentMethod === "delivery" &&
      (!address.addressLine1 || !address.city || !address.state || !address.postalCode)
    ) {
      setError("Delivery orders require a complete jobsite address.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const order = createOrder({
        userId,
        customerName: address.name,
        companyName: address.company,
        email: address.email,
        phone: address.phone,
        items,
        fulfillmentMethod,
        requestedDate,
        requestedWindow,
        jobName,
        jobsiteAddress: address,
        drawings: [],
        pickupContact: address.name,
        subtotal,
        tax,
        deliveryFee,
        total,
        status: "submitted",
        paymentStatus: paymentMethod === "card" ? "paid" : "unpaid",
        isQuoteRequest: false
      });

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
      }).catch(() => null);

      if (!response) {
        setError("Could not reach the order service. Please try again.");
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { persisted?: boolean; reason?: string; orderNumber?: string }
        | null;

      if (!response.ok || !payload?.persisted) {
        setError(
          payload?.reason ||
            `Order could not be saved (status ${response.status}).`
        );
        return;
      }

      setSubmittedOrderNumber(payload.orderNumber || order.orderNumber);
      clearCart();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to place the order. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submittedOrderNumber) {
    return (
      <LedgerPage>
        <div className="py-16">
          <Card className="mx-auto max-w-xl p-10 text-center">
            <div
              className="mx-auto grid h-14 w-14 place-items-center rounded-2xl"
              style={{ backgroundColor: LEDGER.mintSoft }}
            >
              <CheckCircle2 className="h-7 w-7" style={{ color: LEDGER.mint }} />
            </div>
            <h1
              className="mt-4 text-2xl font-semibold tracking-tight"
              style={{ color: LEDGER.ink }}
            >
              Order placed
            </h1>
            <p className="mt-2 text-sm" style={{ color: LEDGER.body }}>
              Purchase order{" "}
              <strong style={{ color: LEDGER.ink }}>
                {submittedOrderNumber}
              </strong>{" "}
              has been submitted. It will appear in your order ledger and on
              your account dashboard.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition"
                href="/ledger/account"
                style={{ backgroundColor: LEDGER.indigo }}
              >
                View account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                className="inline-flex items-center rounded-xl px-4 py-2.5 text-[13px] font-semibold transition"
                href="/ledger/search"
                style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.body }}
              >
                Keep shopping
              </Link>
            </div>
          </Card>
        </div>
      </LedgerPage>
    );
  }

  if (hydrated && !items.length) {
    return (
      <LedgerPage>
        <div className="py-16">
          <Card className="mx-auto max-w-xl p-12 text-center">
            <Package className="mx-auto h-10 w-10" style={{ color: LEDGER.muted }} />
            <p
              className="mt-3 text-sm font-semibold"
              style={{ color: LEDGER.ink }}
            >
              There is nothing to check out.
            </p>
            <p className="mt-1 text-[13px]" style={{ color: LEDGER.body }}>
              Add line items to your purchase order first.
            </p>
            <Link
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition"
              href="/ledger/search"
              style={{ backgroundColor: LEDGER.indigo }}
            >
              Browse the catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </div>
      </LedgerPage>
    );
  }

  return (
    <LedgerPage>
      <div className="py-5">
        <Breadcrumb
          trail={[
            { label: "Overview", href: "/ledger" },
            { label: "Purchase order", href: "/ledger/cart" },
            { label: "Checkout" }
          ]}
        />
      </div>

      <header
        className="rounded-2xl p-6 sm:p-8"
        style={{ backgroundColor: LEDGER.ink }}
      >
        <Eyebrow>Submit purchase order</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Checkout
        </h1>
        <p
          className="mt-2 max-w-xl text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          Confirm account contact, schedule fulfillment, and choose how this
          order is billed. Net-30 terms are available on approved accounts.
        </p>
      </header>

      <div className="grid gap-6 py-8 lg:grid-cols-12">
        <div className="grid gap-3 lg:col-span-8">
          {/* Fulfillment */}
          <Card className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Fulfillment
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(["pickup", "delivery"] as FulfillmentMethod[]).map((method) => {
                const active = fulfillmentMethod === method;
                return (
                  <button
                    key={method}
                    className="rounded-xl p-4 text-left transition"
                    onClick={() => setFulfillmentMethod(method)}
                    style={{
                      border: `1px solid ${active ? LEDGER.indigo : LEDGER.line}`,
                      backgroundColor: active ? LEDGER.indigoSoft : LEDGER.surface
                    }}
                    type="button"
                  >
                    {method === "pickup" ? (
                      <PackageCheck
                        className="h-5 w-5"
                        style={{ color: active ? LEDGER.indigo : LEDGER.body }}
                      />
                    ) : (
                      <Truck
                        className="h-5 w-5"
                        style={{ color: active ? LEDGER.indigo : LEDGER.body }}
                      />
                    )}
                    <p
                      className="mt-2 text-[14px] font-semibold capitalize"
                      style={{ color: LEDGER.ink }}
                    >
                      {method}
                    </p>
                    <p className="mt-0.5 text-[12px]" style={{ color: LEDGER.body }}>
                      {method === "pickup"
                        ? "Stage material for counter or yard pickup."
                        : "Route a jobsite delivery to the address below."}
                    </p>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label>
                <FormLabel>Requested date</FormLabel>
                <input
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  min={tomorrowDate()}
                  onChange={(event) => setRequestedDate(event.target.value)}
                  style={fieldStyle()}
                  type="date"
                  value={requestedDate}
                />
              </label>
              <label>
                <FormLabel>Time window</FormLabel>
                <select
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) => setRequestedWindow(event.target.value)}
                  style={fieldStyle()}
                  value={requestedWindow}
                >
                  {pickupWindows.map((window) => (
                    <option key={window} value={window}>
                      {window}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Card>

          {/* Customer */}
          <Card className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Account contact
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label>
                <FormLabel>Contact name</FormLabel>
                <input
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) => updateAddress("name", event.target.value)}
                  style={fieldStyle()}
                  value={address.name}
                />
              </label>
              <label>
                <FormLabel>Company</FormLabel>
                <input
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) =>
                    updateAddress("company", event.target.value)
                  }
                  style={fieldStyle()}
                  value={address.company}
                />
              </label>
              <label>
                <FormLabel>Email</FormLabel>
                <input
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) => updateAddress("email", event.target.value)}
                  style={fieldStyle()}
                  type="email"
                  value={address.email}
                />
              </label>
              <label>
                <FormLabel>Phone</FormLabel>
                <input
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) => updateAddress("phone", event.target.value)}
                  style={fieldStyle()}
                  value={address.phone}
                />
              </label>
            </div>
            <label className="mt-3 block">
              <FormLabel>Job name or PO reference</FormLabel>
              <input
                className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                onChange={(event) => setJobName(event.target.value)}
                style={fieldStyle()}
                value={jobName}
              />
            </label>

            {fulfillmentMethod === "delivery" ? (
              <div className="mt-3">
                <div
                  className="flex items-center gap-1.5 text-[12px] font-semibold"
                  style={{ color: LEDGER.ink }}
                >
                  <MapPin className="h-4 w-4" style={{ color: LEDGER.indigo }} />
                  Jobsite delivery address
                </div>
                <div className="mt-2 grid gap-3">
                  <input
                    aria-label="Address line 1"
                    className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                    onChange={(event) =>
                      updateAddress("addressLine1", event.target.value)
                    }
                    placeholder="Address line 1"
                    style={fieldStyle()}
                    value={address.addressLine1}
                  />
                  <input
                    aria-label="Address line 2"
                    className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                    onChange={(event) =>
                      updateAddress("addressLine2", event.target.value)
                    }
                    placeholder="Address line 2 (optional)"
                    style={fieldStyle()}
                    value={address.addressLine2}
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      aria-label="City"
                      className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                      onChange={(event) =>
                        updateAddress("city", event.target.value)
                      }
                      placeholder="City"
                      style={fieldStyle()}
                      value={address.city}
                    />
                    <input
                      aria-label="State"
                      className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                      onChange={(event) =>
                        updateAddress("state", event.target.value)
                      }
                      placeholder="State"
                      style={fieldStyle()}
                      value={address.state}
                    />
                    <input
                      aria-label="ZIP"
                      className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                      onChange={(event) =>
                        updateAddress("postalCode", event.target.value)
                      }
                      placeholder="ZIP"
                      style={fieldStyle()}
                      value={address.postalCode}
                    />
                  </div>
                </div>
              </div>
            ) : null}
            <label className="mt-3 block">
              <FormLabel>Order notes</FormLabel>
              <textarea
                className="min-h-20 w-full resize-y rounded-xl px-3 py-2.5 text-[13px] outline-none"
                onChange={(event) => updateAddress("notes", event.target.value)}
                placeholder="Gate codes, forklift access, cut instructions"
                style={fieldStyle()}
                value={address.notes}
              />
            </label>
          </Card>

          {/* Payment */}
          <Card className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Billing method
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    id: "net-terms" as PaymentMethod,
                    title: "Net-30 terms",
                    desc: "Bill this order to your approved trade account."
                  },
                  {
                    id: "card" as PaymentMethod,
                    title: "Pay by card",
                    desc: "Charge a card on file at the time of order."
                  }
                ]
              ).map((option) => {
                const active = paymentMethod === option.id;
                return (
                  <button
                    key={option.id}
                    className="rounded-xl p-4 text-left transition"
                    onClick={() => setPaymentMethod(option.id)}
                    style={{
                      border: `1px solid ${active ? LEDGER.indigo : LEDGER.line}`,
                      backgroundColor: active ? LEDGER.indigoSoft : LEDGER.surface
                    }}
                    type="button"
                  >
                    <CreditCard
                      className="h-5 w-5"
                      style={{ color: active ? LEDGER.indigo : LEDGER.body }}
                    />
                    <p
                      className="mt-2 text-[14px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {option.title}
                    </p>
                    <p
                      className="mt-0.5 text-[12px]"
                      style={{ color: LEDGER.body }}
                    >
                      {option.desc}
                    </p>
                  </button>
                );
              })}
            </div>
            {paymentMethod === "card" ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  aria-label="Card number"
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none sm:col-span-2"
                  inputMode="numeric"
                  placeholder="Card number"
                  style={fieldStyle()}
                />
                <input
                  aria-label="Expiry"
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  placeholder="MM / YY"
                  style={fieldStyle()}
                />
                <input
                  aria-label="CVC"
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  inputMode="numeric"
                  placeholder="CVC"
                  style={fieldStyle()}
                />
              </div>
            ) : (
              <p
                className="mt-3 rounded-xl px-3 py-2.5 text-[12px]"
                style={{ backgroundColor: LEDGER.indigoSoft, color: LEDGER.indigo }}
              >
                Account #GW-40128 is approved for Net-30. Invoice issues on
                fulfillment with a 30-day due date.
              </p>
            )}
          </Card>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-4">
          <Card className="sticky top-28 p-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" style={{ color: LEDGER.indigo }} />
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: LEDGER.muted }}
              >
                Order review
              </p>
            </div>
            <div
              className="mt-3 space-y-2.5"
              style={{ borderBottom: `1px solid ${LEDGER.line}`, paddingBottom: 12 }}
            >
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex justify-between gap-3 text-[13px]"
                >
                  <span className="min-w-0">
                    <span
                      className="block truncate font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {item.title}
                    </span>
                    <span style={{ color: LEDGER.muted }}>
                      {item.quantity} × {item.sku}
                    </span>
                  </span>
                  <span
                    className="shrink-0 font-semibold"
                    style={{ color: LEDGER.ink }}
                  >
                    {formatUsd(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between">
                <dt style={{ color: LEDGER.body }}>Subtotal</dt>
                <dd style={{ color: LEDGER.ink, fontWeight: 600 }}>
                  {formatUsd(subtotal)}
                </dd>
              </div>
              {weight > 0 ? (
                <div className="flex justify-between">
                  <dt style={{ color: LEDGER.body }}>Material weight</dt>
                  <dd style={{ color: LEDGER.ink, fontWeight: 600 }}>
                    {weight.toFixed(2)} lb
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt style={{ color: LEDGER.body }}>Delivery</dt>
                <dd style={{ color: LEDGER.ink, fontWeight: 600 }}>
                  {deliveryFee ? formatUsd(deliveryFee) : "Free"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: LEDGER.body }}>Estimated tax</dt>
                <dd style={{ color: LEDGER.ink, fontWeight: 600 }}>
                  {formatUsd(tax)}
                </dd>
              </div>
              <div
                className="flex justify-between pt-2.5"
                style={{ borderTop: `1px solid ${LEDGER.line}` }}
              >
                <dt
                  className="text-[14px] font-semibold"
                  style={{ color: LEDGER.ink }}
                >
                  Total
                </dt>
                <dd
                  className="text-[20px] font-semibold tracking-tight"
                  style={{ color: LEDGER.ink }}
                >
                  {formatUsd(total)}
                </dd>
              </div>
            </dl>
            {error ? (
              <p
                className="mt-3 rounded-xl px-3 py-2.5 text-[12px] font-semibold"
                style={{ backgroundColor: LEDGER.roseSoft, color: LEDGER.rose }}
              >
                {error}
              </p>
            ) : null}
            <button
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-[14px] font-semibold text-white transition"
              disabled={isSubmitting}
              onClick={placeOrder}
              style={{
                backgroundColor: LEDGER.indigo,
                opacity: isSubmitting ? 0.6 : 1
              }}
              type="button"
            >
              {isSubmitting ? "Placing order…" : "Place order"}
              {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
            <Link
              className="mt-2 flex items-center justify-center rounded-xl px-4 py-2.5 text-[13px] font-semibold transition"
              href="/ledger/cart"
              style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.body }}
            >
              Back to purchase order
            </Link>
          </Card>
        </aside>
      </div>
    </LedgerPage>
  );
}
