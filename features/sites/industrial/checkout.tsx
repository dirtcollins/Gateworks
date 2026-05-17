"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  MapPin,
  PackageCheck,
  Truck
} from "lucide-react";
import { Eyebrow, IndustrialPage, formatUsd } from "./kit";
import { useCartStore } from "@/lib/cart-store";
import { useOrderStore, type OrderAddress } from "@/lib/order-store";
import { useUserStore } from "@/lib/user-store";
import { calculateTax } from "@/lib/tax";
import type { FulfillmentMethod } from "@/lib/platform-backend";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Checkout. Customer / company info, pickup vs.
 * delivery scheduling, payment-on-pickup vs. net-terms selection, and
 * a real place-order that creates an OrderRecord and POSTs /api/orders.
 * ------------------------------------------------------------------ */

const pickupWindows = [
  "7:00 AM - 9:00 AM",
  "9:00 AM - 11:00 AM",
  "11:00 AM - 1:00 PM",
  "1:00 PM - 3:00 PM",
  "3:00 PM - 5:00 PM"
];

type PaymentMode = "card_on_pickup" | "net_terms" | "purchase_order";

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

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
        {label}
      </span>
      <input
        className="h-11 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
        {...props}
      />
    </label>
  );
}

export function IndustrialCheckout() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const createOrder = useOrderStore((state) => state.createOrder);
  const displayName = useUserStore((state) => state.displayName);
  const email = useUserStore((state) => state.email);
  const userId = useUserStore((state) => state.userId);

  const [ready, setReady] = useState(false);
  const [fulfillmentMethod, setFulfillmentMethod] =
    useState<FulfillmentMethod>("pickup");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("card_on_pickup");
  const [requestedDate, setRequestedDate] = useState(tomorrowDate());
  const [requestedWindow, setRequestedWindow] = useState(pickupWindows[1]);
  const [jobName, setJobName] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [address, setAddress] = useState<OrderAddress>(emptyAddress);
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void useCartStore.persist.rehydrate();
    void useOrderStore.persist.rehydrate();
    setReady(true);
  }, []);

  // Prefill customer details from the signed-in account once available.
  useEffect(() => {
    setAddress((current) => ({
      ...current,
      name: current.name || (displayName === "Guest" ? "" : displayName),
      email: current.email || email
    }));
  }, [displayName, email]);

  const lineItems = ready ? items : [];
  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [lineItems]
  );
  const isQuoteRequest = paymentMode === "net_terms";
  const isPurchaseOrder = paymentMode === "purchase_order";
  const deliveryFee =
    fulfillmentMethod === "delivery" ? (subtotal >= 750 ? 0 : 85) : 0;
  const tax = isQuoteRequest ? 0 : calculateTax(subtotal);
  const total = subtotal + tax + deliveryFee;

  function updateAddress(field: keyof OrderAddress, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  async function submitOrder() {
    if (isSubmitting) return;

    if (!lineItems.length) {
      setError("Add products to the cart before checkout.");
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
    if (isPurchaseOrder && !poNumber.trim()) {
      setError("Enter a purchase-order number for net-terms PO billing.");
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
        items: lineItems,
        fulfillmentMethod,
        requestedDate,
        requestedWindow,
        jobName: jobName || (isPurchaseOrder ? `PO ${poNumber.trim()}` : ""),
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
          poNumber: isPurchaseOrder ? poNumber.trim() : undefined,
          poStatus: isPurchaseOrder ? "submitted" : undefined
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
        setError(
          payload?.reason ||
            `Order could not be saved (${response.status} ${response.statusText}).`
        );
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

  if (submittedOrderNumber) {
    return (
      <IndustrialPage>
        <section className="py-16">
          <div className="mx-auto max-w-xl border-2 border-d1-ink bg-white p-10 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-d1-pine" />
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-d1-ink">
              {isQuoteRequest ? "Quote request submitted" : "Order placed"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-d1-steel">
              Reference{" "}
              <span className="font-bold text-d1-ink">{submittedOrderNumber}</span>.
              {isQuoteRequest
                ? " Our team will price net-terms availability and follow up."
                : " We will stage your material and confirm the pickup window."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                className="bg-d1-ink px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
                href="/industrial/account"
              >
                View account
              </Link>
              <Link
                className="border border-d1-ink px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                href="/industrial/search"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </section>
      </IndustrialPage>
    );
  }

  return (
    <IndustrialPage>
      <section className="py-8">
        <div className="border-b-2 border-d1-ink pb-3">
          <Eyebrow>Contractor checkout</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-d1-ink sm:text-4xl">
            Schedule pickup or delivery
          </h1>
        </div>

        {!lineItems.length ? (
          <div className="mt-8 border border-dashed border-d1-line bg-d1-card px-6 py-20 text-center">
            <p className="text-sm font-bold text-d1-ink">Your cart is empty.</p>
            <Link
              className="mt-6 inline-flex items-center gap-2 bg-d1-ink px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
              href="/industrial/search"
            >
              Browse catalog
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="grid gap-6">
              {/* Fulfillment */}
              <div className="border border-d1-line bg-d1-card p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-d1-pine">
                  Fulfillment
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(["pickup", "delivery"] as FulfillmentMethod[]).map((method) => {
                    const active = fulfillmentMethod === method;
                    return (
                      <button
                        className={`grid gap-2 border p-4 text-left transition ${
                          active
                            ? "border-d1-ink bg-d1-ink text-d1-paper"
                            : "border-d1-line bg-white text-d1-ink hover:border-d1-ink"
                        }`}
                        key={method}
                        onClick={() => setFulfillmentMethod(method)}
                        type="button"
                      >
                        {method === "pickup" ? (
                          <PackageCheck className="h-5 w-5" />
                        ) : (
                          <Truck className="h-5 w-5" />
                        )}
                        <span className="text-sm font-extrabold capitalize">
                          {method}
                        </span>
                        <span
                          className={`text-[12px] leading-snug ${
                            active ? "text-d1-paper/70" : "text-d1-steel"
                          }`}
                        >
                          {method === "pickup"
                            ? "Stage at the will-call counter."
                            : "Route delivery to a jobsite address."}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                      Requested date
                    </span>
                    <input
                      className="h-11 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                      min={tomorrowDate()}
                      onChange={(event) => setRequestedDate(event.target.value)}
                      type="date"
                      value={requestedDate}
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                      Time window
                    </span>
                    <select
                      className="h-11 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                      onChange={(event) => setRequestedWindow(event.target.value)}
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
              </div>

              {/* Customer */}
              <div className="border border-d1-line bg-d1-card p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-d1-pine">
                  Customer &amp; jobsite
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Contact name"
                    onChange={(event) => updateAddress("name", event.target.value)}
                    value={address.name}
                  />
                  <Field
                    label="Company"
                    onChange={(event) =>
                      updateAddress("company", event.target.value)
                    }
                    value={address.company}
                  />
                  <Field
                    label="Email"
                    onChange={(event) => updateAddress("email", event.target.value)}
                    type="email"
                    value={address.email}
                  />
                  <Field
                    label="Phone"
                    onChange={(event) => updateAddress("phone", event.target.value)}
                    value={address.phone}
                  />
                </div>
                <div className="mt-3">
                  <Field
                    label="Job name or PO number"
                    onChange={(event) => setJobName(event.target.value)}
                    value={jobName}
                  />
                </div>
                {fulfillmentMethod === "delivery" ? (
                  <div className="mt-4 grid gap-3 border-t border-d1-line pt-4">
                    <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink">
                      <MapPin className="h-4 w-4" /> Jobsite delivery address
                    </p>
                    <Field
                      label="Address line 1"
                      onChange={(event) =>
                        updateAddress("addressLine1", event.target.value)
                      }
                      value={address.addressLine1}
                    />
                    <Field
                      label="Address line 2"
                      onChange={(event) =>
                        updateAddress("addressLine2", event.target.value)
                      }
                      value={address.addressLine2}
                    />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field
                        label="City"
                        onChange={(event) =>
                          updateAddress("city", event.target.value)
                        }
                        value={address.city}
                      />
                      <Field
                        label="State"
                        onChange={(event) =>
                          updateAddress("state", event.target.value)
                        }
                        value={address.state}
                      />
                      <Field
                        label="ZIP"
                        onChange={(event) =>
                          updateAddress("postalCode", event.target.value)
                        }
                        value={address.postalCode}
                      />
                    </div>
                  </div>
                ) : null}
                <label className="mt-3 grid gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    Notes for the crew
                  </span>
                  <textarea
                    className="min-h-20 resize-y border border-d1-line bg-white px-3 py-2 text-sm leading-relaxed text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) => updateAddress("notes", event.target.value)}
                    placeholder="Gate code, forklift needs, cut instructions"
                    value={address.notes}
                  />
                </label>
              </div>

              {/* Payment */}
              <div className="border border-d1-line bg-d1-card p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-d1-pine">
                  Payment
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      {
                        id: "card_on_pickup" as PaymentMode,
                        icon: CreditCard,
                        title: "Card on pickup / delivery",
                        copy: "Pay by card when the order is handed off."
                      },
                      {
                        id: "purchase_order" as PaymentMode,
                        icon: ClipboardList,
                        title: "Purchase order (net terms)",
                        copy: "Place a net-terms order against your company PO."
                      },
                      {
                        id: "net_terms" as PaymentMode,
                        icon: FileText,
                        title: "Net terms quote",
                        copy: "Submit as a quote request for net-terms pricing."
                      }
                    ]
                  ).map((option) => {
                    const active = paymentMode === option.id;
                    const Icon = option.icon;
                    return (
                      <button
                        className={`grid gap-2 border p-4 text-left transition ${
                          active
                            ? "border-d1-ink bg-d1-ink text-d1-paper"
                            : "border-d1-line bg-white text-d1-ink hover:border-d1-ink"
                        }`}
                        key={option.id}
                        onClick={() => setPaymentMode(option.id)}
                        type="button"
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-extrabold">
                          {option.title}
                        </span>
                        <span
                          className={`text-[12px] leading-snug ${
                            active ? "text-d1-paper/70" : "text-d1-steel"
                          }`}
                        >
                          {option.copy}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {isPurchaseOrder ? (
                  <div className="mt-4 grid gap-3 border-t border-d1-line pt-4">
                    <Field
                      label="Purchase order number"
                      onChange={(event) => setPoNumber(event.target.value)}
                      placeholder="e.g. PO-48213"
                      value={poNumber}
                    />
                    <p className="text-[12px] leading-snug text-d1-steel">
                      The order is placed immediately on net terms and tagged
                      with this PO number. Our team reviews and approves it for
                      billing.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Summary */}
            <aside className="h-fit">
              <div className="border-2 border-d1-ink bg-white p-5">
                <h2 className="text-lg font-extrabold tracking-tight text-d1-ink">
                  Order review
                </h2>
                <div className="mt-4 grid gap-2 border-t border-d1-line pt-4">
                  {lineItems.map((item) => (
                    <div
                      className="flex justify-between gap-3 text-sm"
                      key={item.variantId}
                    >
                      <span className="min-w-0 truncate text-d1-steel">
                        {item.quantity} × {item.title}
                      </span>
                      <span className="font-bold text-d1-ink">
                        {formatUsd(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <dl className="mt-3 grid gap-2 border-t border-d1-line pt-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-d1-steel">Subtotal</dt>
                    <dd className="font-bold text-d1-ink">{formatUsd(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-d1-steel">Delivery</dt>
                    <dd className="font-bold text-d1-ink">
                      {fulfillmentMethod === "delivery"
                        ? deliveryFee === 0
                          ? "Free"
                          : formatUsd(deliveryFee)
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-d1-steel">
                      {isQuoteRequest ? "Tax (quoted later)" : "Estimated tax"}
                    </dt>
                    <dd className="font-bold text-d1-ink">{formatUsd(tax)}</dd>
                  </div>
                  <div className="flex items-end justify-between border-t-2 border-d1-ink pt-3">
                    <dt className="text-sm font-bold uppercase tracking-[0.1em] text-d1-ink">
                      Total
                    </dt>
                    <dd className="text-2xl font-extrabold text-d1-ink">
                      {formatUsd(total)}
                    </dd>
                  </div>
                </dl>
                {error ? (
                  <p className="mt-4 border border-d1-red bg-d1-red/10 px-3 py-2 text-[12px] font-bold text-d1-red">
                    {error}
                  </p>
                ) : null}
                <button
                  className="mt-4 flex w-full items-center justify-center bg-d1-ink px-5 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine disabled:cursor-not-allowed disabled:bg-d1-line disabled:text-d1-steel"
                  disabled={isSubmitting}
                  onClick={submitOrder}
                  type="button"
                >
                  {isSubmitting
                    ? "Submitting…"
                    : isQuoteRequest
                      ? "Submit quote request"
                      : isPurchaseOrder
                        ? "Place PO order"
                        : "Place order"}
                </button>
                <Link
                  className="mt-2 flex items-center justify-center border border-d1-ink px-5 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                  href="/industrial/cart"
                >
                  Back to cart
                </Link>
              </div>
            </aside>
          </div>
        )}
      </section>
    </IndustrialPage>
  );
}
