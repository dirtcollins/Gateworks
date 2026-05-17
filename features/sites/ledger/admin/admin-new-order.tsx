"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, Search, Trash2 } from "lucide-react";
import { LEDGER, formatUsd } from "@/features/sites/ledger/kit";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import { products } from "@/lib/catalog";
import { customerDirectory } from "@/lib/customers";
import { calculateTax } from "@/lib/tax";
import type { CartItem } from "@/lib/types";
import type { FulfillmentMethod } from "@/lib/platform-backend";
import {
  AdminCard,
  AdminHeading,
  AdminGhostButton,
  AdminPrimaryButton
} from "./admin-kit";

type DraftLine = CartItem;

const DELIVERY_FEE = 85;

function buildLine(productId: string): DraftLine | null {
  const product = products.find((entry) => entry.id === productId);
  if (!product) return null;
  const variant = product.variants[0];
  if (!variant) return null;
  return {
    productId: product.id,
    variantId: variant.id,
    title: product.title,
    sku: variant.sku,
    image: product.images[0]?.url || "/assets/logo.svg",
    price: variant.price,
    quantity: 1,
    options: {}
  };
}

/* Ledger admin new order — builds a genuine purchase order: pick a
 * customer from the directory, add catalog products as line items,
 * choose fulfillment, then create the order in the real order store
 * and POST it to /api/orders. */
export function LedgerAdminNewOrder() {
  const router = useRouter();
  const createOrder = useOrderStore((state) => state.createOrder);
  const setOrders = useOrderStore((state) => state.setOrders);

  const [customerId, setCustomerId] = useState(customerDirectory[0]?.id ?? "");
  const [jobName, setJobName] = useState("");
  const [fulfillment, setFulfillment] = useState<FulfillmentMethod>("delivery");
  const [requestedDate, setRequestedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const customer = customerDirectory.find((entry) => entry.id === customerId);

  const catalogMatches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products.slice(0, 6);
    return products
      .filter(
        (product) =>
          product.title.toLowerCase().includes(normalized) ||
          product.variants.some((variant) =>
            variant.sku.toLowerCase().includes(normalized)
          )
      )
      .slice(0, 8);
  }, [query]);

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const deliveryFee =
    fulfillment === "delivery" && subtotal > 0 && subtotal < 500 ? DELIVERY_FEE : 0;
  const tax = calculateTax(subtotal);
  const total = subtotal + deliveryFee + tax;

  function addLine(productId: string) {
    const existing = lines.find((line) => line.productId === productId);
    if (existing) {
      setLines((current) =>
        current.map((line) =>
          line.productId === productId
            ? { ...line, quantity: line.quantity + 1 }
            : line
        )
      );
      return;
    }
    const line = buildLine(productId);
    if (line) setLines((current) => [...current, line]);
  }

  function setQuantity(variantId: string, quantity: number) {
    setLines((current) =>
      current.map((line) =>
        line.variantId === variantId
          ? { ...line, quantity: Math.max(1, quantity) }
          : line
      )
    );
  }

  function removeLine(variantId: string) {
    setLines((current) => current.filter((line) => line.variantId !== variantId));
  }

  async function submit() {
    if (!customer || !lines.length || submitting) return;
    setSubmitting(true);
    setNotice("");

    const addressLines = customer.jobsiteAddress.split("\n");

    const created = createOrder({
      userId: "admin-user",
      customerName: customer.name,
      companyName: customer.company,
      email: customer.email,
      phone: customer.phone,
      items: lines,
      fulfillmentMethod: fulfillment,
      requestedDate,
      requestedWindow: "9:00 AM - 12:00 PM",
      jobName: jobName.trim() || "Counter order",
      jobsiteAddress: {
        name: customer.name,
        company: customer.company,
        email: customer.email,
        phone: customer.phone,
        addressLine1: addressLines[0] || "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        notes: "Order created from the Ledger operations workspace."
      },
      drawings: [],
      pickupContact: customer.name,
      subtotal,
      tax,
      deliveryFee,
      total,
      status: "submitted",
      paymentStatus: "unpaid",
      isQuoteRequest: false
    });

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: created.userId,
          orderNumber: created.orderNumber,
          customerName: created.customerName,
          companyName: created.companyName,
          email: created.email,
          phone: created.phone,
          items: created.items,
          fulfillmentMethod: created.fulfillmentMethod,
          requestedDate: created.requestedDate,
          requestedWindow: created.requestedWindow,
          jobName: created.jobName,
          jobsiteAddress: created.jobsiteAddress,
          drawings: created.drawings,
          subtotal: created.subtotal,
          tax: created.tax,
          deliveryFee: created.deliveryFee,
          total: created.total,
          status: created.status,
          paymentStatus: created.paymentStatus,
          isQuoteRequest: false
        })
      });

      const payload = (await response.json().catch(() => null)) as {
        persisted?: boolean;
        orderId?: string;
        orderNumber?: string;
      } | null;

      if (payload?.persisted && payload.orderId) {
        const persisted: OrderRecord = {
          ...created,
          id: payload.orderId,
          orderNumber: payload.orderNumber || created.orderNumber
        };
        setOrders(
          useOrderStore
            .getState()
            .orders.map((order) => (order.id === created.id ? persisted : order))
        );
        router.push(`/ledger/admin/orders/${payload.orderId}`);
        return;
      }
    } catch {
      /* fall through to local navigation */
    }

    router.push(`/ledger/admin/orders/${created.id}`);
  }

  return (
    <div className="grid gap-6">
      <Link
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition hover:underline"
        href="/ledger/admin/orders"
        style={{ color: LEDGER.muted }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All orders
      </Link>

      <AdminHeading
        eyebrow="Operations"
        title="New order"
        description="Build a purchase order for an account: pick a customer, add catalog products, and create the order."
      />

      {notice ? (
        <div
          className="rounded-2xl p-4 text-[13px] font-medium"
          style={{ backgroundColor: LEDGER.amberSoft, color: LEDGER.amber }}
        >
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Left: customer + products */}
        <div className="grid gap-4">
          <AdminCard className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Customer & job
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-[12px] font-semibold" style={{ color: LEDGER.body }}>
                  Account
                </span>
                <select
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) => setCustomerId(event.target.value)}
                  style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
                  value={customerId}
                >
                  {customerDirectory.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.company}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-[12px] font-semibold" style={{ color: LEDGER.body }}>
                  Job name
                </span>
                <input
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) => setJobName(event.target.value)}
                  placeholder="e.g. North yard gate rebuild"
                  style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
                  value={jobName}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[12px] font-semibold" style={{ color: LEDGER.body }}>
                  Fulfillment
                </span>
                <select
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) =>
                    setFulfillment(event.target.value as FulfillmentMethod)
                  }
                  style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
                  value={fulfillment}
                >
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-[12px] font-semibold" style={{ color: LEDGER.body }}>
                  Requested date
                </span>
                <input
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) => setRequestedDate(event.target.value)}
                  style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
                  type="date"
                  value={requestedDate}
                />
              </label>
            </div>
            {customer ? (
              <p className="mt-3 text-[12px]" style={{ color: LEDGER.muted }}>
                {customer.email} · {customer.phone} · Terms: {customer.terms}
              </p>
            ) : null}
          </AdminCard>

          {/* Product picker */}
          <AdminCard>
            <div
              className="flex items-center gap-2 px-5 py-4"
              style={{ borderBottom: `1px solid ${LEDGER.line}` }}
            >
              <Search className="h-4 w-4" style={{ color: LEDGER.muted }} />
              <input
                aria-label="Search catalog"
                className="w-full bg-transparent text-[13px] outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the catalog to add products"
                style={{ color: LEDGER.ink }}
                value={query}
              />
            </div>
            <div>
              {catalogMatches.map((product) => {
                const variant = product.variants[0];
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                    style={{ borderBottom: `1px solid ${LEDGER.line}` }}
                  >
                    <div className="min-w-0">
                      <p
                        className="truncate text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {product.title}
                      </p>
                      <p
                        className="text-[11px] font-medium"
                        style={{ color: LEDGER.muted }}
                      >
                        {variant?.sku} · {formatUsd(variant?.price ?? 0)}
                      </p>
                    </div>
                    <button
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition"
                      onClick={() => addLine(product.id)}
                      style={{
                        backgroundColor: LEDGER.indigoSoft,
                        color: LEDGER.indigo
                      }}
                      type="button"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                );
              })}
            </div>
          </AdminCard>
        </div>

        {/* Right: line items + totals */}
        <div className="grid gap-4">
          <AdminCard>
            <p
              className="px-5 py-4 text-[13px] font-semibold"
              style={{ color: LEDGER.ink, borderBottom: `1px solid ${LEDGER.line}` }}
            >
              Order lines ({lines.length})
            </p>
            {lines.length ? (
              <div>
                {lines.map((line) => (
                  <div
                    key={line.variantId}
                    className="grid gap-2 px-5 py-3"
                    style={{ borderBottom: `1px solid ${LEDGER.line}` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className="truncate text-[13px] font-semibold"
                          style={{ color: LEDGER.ink }}
                        >
                          {line.title}
                        </p>
                        <p
                          className="text-[11px] font-medium"
                          style={{ color: LEDGER.muted }}
                        >
                          {line.sku}
                        </p>
                      </div>
                      <button
                        aria-label="Remove line"
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg transition"
                        onClick={() => removeLine(line.variantId)}
                        style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.muted }}
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-1 rounded-lg p-0.5"
                        style={{ border: `1px solid ${LEDGER.line}` }}
                      >
                        <button
                          aria-label="Decrease quantity"
                          className="grid h-6 w-6 place-items-center rounded-md"
                          onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                          style={{ color: LEDGER.body }}
                          type="button"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span
                          className="w-8 text-center text-[13px] font-semibold"
                          style={{ color: LEDGER.ink }}
                        >
                          {line.quantity}
                        </span>
                        <button
                          aria-label="Increase quantity"
                          className="grid h-6 w-6 place-items-center rounded-md"
                          onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                          style={{ color: LEDGER.body }}
                          type="button"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span
                        className="text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {formatUsd(line.price * line.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="px-5 py-10 text-center text-[13px]"
                style={{ color: LEDGER.body }}
              >
                Search the catalog to add products to this order.
              </p>
            )}

            <div className="grid gap-1.5 px-5 py-4 text-[13px]">
              <Row label="Subtotal" value={formatUsd(subtotal)} />
              {deliveryFee > 0 ? (
                <Row label="Delivery" value={formatUsd(deliveryFee)} />
              ) : null}
              <Row label="Tax" value={formatUsd(tax)} />
              <div
                className="mt-1 flex items-center justify-between pt-2"
                style={{ borderTop: `1px solid ${LEDGER.line}` }}
              >
                <span
                  className="text-[14px] font-semibold"
                  style={{ color: LEDGER.ink }}
                >
                  Total
                </span>
                <span
                  className="text-[16px] font-semibold tracking-tight"
                  style={{ color: LEDGER.ink }}
                >
                  {formatUsd(total)}
                </span>
              </div>
            </div>
          </AdminCard>

          <div className="flex flex-wrap gap-2">
            <Link href="/ledger/admin/orders">
              <AdminGhostButton>Cancel</AdminGhostButton>
            </Link>
            <AdminPrimaryButton
              disabled={!lines.length || !customer || submitting}
              onClick={submit}
            >
              {submitting ? "Creating…" : "Create order"}
            </AdminPrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: LEDGER.body }}>{label}</span>
      <span className="font-semibold" style={{ color: LEDGER.ink }}>
        {value}
      </span>
    </div>
  );
}
