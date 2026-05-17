"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Minus,
  Plus,
  Search,
  Send,
  ShoppingCart,
  Trash2
} from "lucide-react";
import {
  ArrowLink,
  Breadcrumb,
  Card,
  Eyebrow,
  LedgerPage,
  LEDGER,
  Pill,
  formatUsd
} from "./kit";
import { useLedgerScope } from "./scope";
import { useQuoteStore, type QuoteRecord } from "@/lib/quote-store";
import { useCartStore } from "@/lib/cart-store";
import { products } from "@/lib/catalog";
import { customerDirectory, getCustomerById } from "@/lib/customers";
import { calculateTax } from "@/lib/tax";
import type { Product } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

const statusTone: Record<QuoteRecord["status"], { bg: string; fg: string }> = {
  draft: { bg: LEDGER.amberSoft, fg: LEDGER.amber },
  sent: { bg: LEDGER.indigoSoft, fg: LEDGER.indigo },
  accepted: { bg: LEDGER.mintSoft, fg: LEDGER.mint },
  invoiced: { bg: LEDGER.mintSoft, fg: LEDGER.mint }
};

function pickVariant(product: Product) {
  return (
    product.variants.find((variant) => variant.inventory === "in_stock") ||
    product.variants[0]
  );
}

function fieldStyle() {
  return {
    border: `1px solid ${LEDGER.line}`,
    color: LEDGER.ink,
    backgroundColor: LEDGER.surface
  } as const;
}

/* Ledger quote builder + detail — reads/writes one quote in the real
 * quote-store: line items, quantity, quick-add catalog search,
 * customer details, terms, notes, and submit (mark sent + add to PO). */
export function LedgerQuoteDetailView({ quoteId }: { quoteId: string }) {
  const hydrated = useLedgerScope();
  const {
    quotes,
    addItem,
    removeItem,
    updateQuantity,
    clearQuote,
    saveQuote,
    setActiveQuote,
    updateQuoteDetails
  } = useQuoteStore();
  const addCartItem = useCartStore((state) => state.addItem);
  const quote = quotes.find((record) => record.id === quoteId);

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (quote) setActiveQuote(quote.id);
  }, [quote, setActiveQuote]);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 2600);
    return () => window.clearTimeout(handle);
  }, [message]);

  const results = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return products.slice(0, 8);
    return products
      .filter(
        (product) =>
          product.title.toLowerCase().includes(normalized) ||
          product.category.name.toLowerCase().includes(normalized) ||
          product.variants.some((variant) =>
            variant.sku.toLowerCase().includes(normalized)
          )
      )
      .slice(0, 24);
  }, [search]);

  const sortedCustomers = useMemo(
    () =>
      [...customerDirectory].sort((left, right) =>
        left.name.localeCompare(right.name)
      ),
    []
  );

  if (hydrated && !quote) {
    return (
      <LedgerPage>
        <div className="py-16">
          <Card className="mx-auto max-w-xl p-12 text-center">
            <p
              className="text-lg font-semibold"
              style={{ color: LEDGER.ink }}
            >
              Quote not found
            </p>
            <p className="mt-1 text-[13px]" style={{ color: LEDGER.body }}>
              It may have been deleted or created under another account.
            </p>
            <Link
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition"
              href="/ledger/quotes"
              style={{ backgroundColor: LEDGER.indigo }}
            >
              All quotes <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </div>
      </LedgerPage>
    );
  }

  if (!quote) {
    return (
      <LedgerPage>
        <div className="py-24 text-center text-[13px]" style={{ color: LEDGER.muted }}>
          Loading quote…
        </div>
      </LedgerPage>
    );
  }

  const items = quote.items;
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;
  const units = items.reduce((count, item) => count + item.quantity, 0);
  const status = quote.status || "draft";
  const tone = statusTone[status];

  function update(details: Parameters<typeof updateQuoteDetails>[1]) {
    updateQuoteDetails(quote!.id, details);
  }

  function applyCustomer(customerId: string) {
    const customer = getCustomerById(customerId);
    if (!customer) {
      update({ customerId: "" });
      return;
    }
    update({
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      billingAddress: customer.billingAddress,
      jobsiteAddress: customer.jobsiteAddress,
      terms: customer.terms
    });
  }

  function addCatalogItem(product: Product) {
    const variant = pickVariant(product);
    if (!variant) return;
    addItem(
      {
        productId: product.id,
        variantId: variant.id,
        title: product.title,
        sku: variant.sku,
        image: variant.image || product.images[0]?.url || "/assets/logo.svg",
        price: variant.price,
        weightLbs: variant.calculated_weight_lb,
        cwtPrice: variant.steel_cwt_price,
        pricingMethod: variant.pricing_method,
        quantity: 1,
        options: variant.options
      },
      quote!.id
    );
    setMessage(`Added ${product.title}.`);
  }

  function submitQuote() {
    if (!items.length) return;
    update({ status: "sent" });
    saveQuote(quote!.id);
    setMessage("Quote submitted to Gateworks for review.");
  }

  function addQuoteToCart() {
    items.forEach((item) => addCartItem(item));
    setMessage("Quote lines added to your purchase order.");
  }

  return (
    <LedgerPage>
      <div className="py-5">
        <Breadcrumb
          trail={[
            { label: "Overview", href: "/ledger" },
            { label: "Quotes", href: "/ledger/quotes" },
            { label: quote.quoteNumber }
          ]}
        />
      </div>

      <header
        className="rounded-2xl p-6 sm:p-8"
        style={{ backgroundColor: LEDGER.ink }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Quote builder</Eyebrow>
            <input
              aria-label="Quote name"
              className="mt-2 w-full max-w-lg bg-transparent text-3xl font-semibold tracking-tight text-white outline-none sm:text-4xl"
              onChange={(event) => update({ name: event.target.value })}
              value={quote.name}
            />
            <p
              className="mt-2 text-sm"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              {quote.quoteNumber} · Created {formatDate(quote.createdAt)} · Due{" "}
              {formatDate(quote.dueAt || quote.expiresAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Pill bg={tone.bg} fg={tone.fg}>
              <span className="capitalize">{status}</span>
            </Pill>
          </div>
        </div>
      </header>

      <div className="grid gap-6 py-8 lg:grid-cols-12">
        <div className="grid gap-3 lg:col-span-8">
          {/* Customer + terms */}
          <Card className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Customer and terms
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: LEDGER.muted }}
                >
                  Account
                </span>
                <select
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) => applyCustomer(event.target.value)}
                  style={fieldStyle()}
                  value={quote.customerId || ""}
                >
                  <option value="">Manual entry</option>
                  {sortedCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.company})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: LEDGER.muted }}
                >
                  Customer name
                </span>
                <input
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) =>
                    update({ customerId: "", customerName: event.target.value })
                  }
                  style={fieldStyle()}
                  value={quote.customerName}
                />
              </label>
              <label>
                <span
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: LEDGER.muted }}
                >
                  Email
                </span>
                <input
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) =>
                    update({ customerId: "", customerEmail: event.target.value })
                  }
                  style={fieldStyle()}
                  type="email"
                  value={quote.customerEmail}
                />
              </label>
              <label>
                <span
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: LEDGER.muted }}
                >
                  Terms
                </span>
                <select
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) => update({ terms: event.target.value })}
                  style={fieldStyle()}
                  value={quote.terms || "Due on receipt"}
                >
                  <option>Due on receipt</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                  <option>Net 45</option>
                </select>
              </label>
              <label>
                <span
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: LEDGER.muted }}
                >
                  Jobsite address
                </span>
                <input
                  className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  onChange={(event) =>
                    update({ customerId: "", jobsiteAddress: event.target.value })
                  }
                  style={fieldStyle()}
                  value={quote.jobsiteAddress}
                />
              </label>
            </div>
          </Card>

          {/* Line items */}
          <Card>
            <div
              className="flex items-center justify-between p-5"
              style={{ borderBottom: `1px solid ${LEDGER.line}` }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: LEDGER.muted }}
              >
                Line items
              </p>
              <button
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition"
                onClick={() => setShowAdd((value) => !value)}
                style={{
                  backgroundColor: LEDGER.indigoSoft,
                  color: LEDGER.indigo
                }}
                type="button"
              >
                <Plus className="h-3.5 w-3.5" /> Add item
              </button>
            </div>

            {showAdd ? (
              <div
                className="p-5"
                style={{ borderBottom: `1px solid ${LEDGER.line}` }}
              >
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ border: `1px solid ${LEDGER.line}` }}
                >
                  <Search className="h-4 w-4" style={{ color: LEDGER.muted }} />
                  <input
                    aria-label="Search products"
                    autoFocus
                    className="w-full bg-transparent text-[13px] outline-none"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products by name or SKU"
                    style={{ color: LEDGER.ink }}
                    value={search}
                  />
                </div>
                <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
                  {results.map((product) => {
                    const variant = pickVariant(product);
                    if (!variant) return null;
                    return (
                      <button
                        key={product.id}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-[#fafbfc]"
                        onClick={() => addCatalogItem(product)}
                        type="button"
                      >
                        <span
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg"
                          style={{ backgroundColor: LEDGER.canvas }}
                        >
                          <Image
                            alt={product.title}
                            className="h-full w-full object-contain p-1.5"
                            height={88}
                            quality={75}
                            src={
                              variant.image ||
                              product.images[0]?.url ||
                              "/assets/logo.svg"
                            }
                            width={88}
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className="block truncate text-[13px] font-semibold"
                            style={{ color: LEDGER.ink }}
                          >
                            {product.title}
                          </span>
                          <span
                            className="text-[11px]"
                            style={{ color: LEDGER.muted }}
                          >
                            SKU {variant.sku}
                          </span>
                        </span>
                        <span
                          className="shrink-0 text-[13px] font-semibold"
                          style={{ color: LEDGER.ink }}
                        >
                          {formatUsd(variant.price)}
                        </span>
                      </button>
                    );
                  })}
                  {!results.length ? (
                    <p
                      className="px-3 py-6 text-center text-[13px]"
                      style={{ color: LEDGER.muted }}
                    >
                      No products match this search.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {items.length ? (
              <div>
                {items.map((item) => (
                  <div
                    key={item.variantId}
                    className="grid gap-3 p-5 sm:grid-cols-[1fr_140px_110px] sm:items-center"
                    style={{ borderBottom: `1px solid ${LEDGER.line}` }}
                  >
                    <div className="flex gap-3">
                      <div
                        className="grid h-14 w-14 shrink-0 place-items-center rounded-xl"
                        style={{ backgroundColor: LEDGER.canvas }}
                      >
                        <Image
                          alt={item.title}
                          className="h-full w-full object-contain p-1.5"
                          height={112}
                          quality={75}
                          src={item.image}
                          width={112}
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-[13px] font-semibold leading-snug"
                          style={{ color: LEDGER.ink }}
                        >
                          {item.title}
                        </p>
                        <p
                          className="text-[11px]"
                          style={{ color: LEDGER.muted }}
                        >
                          SKU {item.sku} · {formatUsd(item.price)} each
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center rounded-xl"
                        style={{ border: `1px solid ${LEDGER.line}` }}
                      >
                        <button
                          aria-label="Decrease quantity"
                          className="grid h-8 w-8 place-items-center"
                          onClick={() =>
                            updateQuantity(
                              quote.id,
                              item.variantId,
                              item.quantity - 1
                            )
                          }
                          style={{ color: LEDGER.body }}
                          type="button"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          aria-label={`Quantity for ${item.title}`}
                          className="h-8 w-10 bg-transparent text-center text-[13px] font-semibold outline-none"
                          inputMode="numeric"
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            if (Number.isFinite(next)) {
                              updateQuantity(quote.id, item.variantId, next);
                            }
                          }}
                          style={{ color: LEDGER.ink }}
                          value={item.quantity}
                        />
                        <button
                          aria-label="Increase quantity"
                          className="grid h-8 w-8 place-items-center"
                          onClick={() =>
                            updateQuantity(
                              quote.id,
                              item.variantId,
                              item.quantity + 1
                            )
                          }
                          style={{ color: LEDGER.body }}
                          type="button"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        aria-label={`Remove ${item.title}`}
                        className="grid h-8 w-8 place-items-center rounded-lg"
                        onClick={() => removeItem(quote.id, item.variantId)}
                        style={{
                          border: `1px solid ${LEDGER.line}`,
                          color: LEDGER.muted
                        }}
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p
                      className="text-[14px] font-semibold sm:text-right"
                      style={{ color: LEDGER.ink }}
                    >
                      {formatUsd(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: LEDGER.ink }}
                >
                  No line items yet
                </p>
                <p className="mt-1 text-[12px]" style={{ color: LEDGER.body }}>
                  Use “Add item” to build this quote from the catalog.
                </p>
              </div>
            )}
            {items.length ? (
              <div className="p-5">
                <button
                  className="text-[12px] font-semibold transition hover:underline"
                  onClick={() => clearQuote(quote.id)}
                  style={{ color: LEDGER.rose }}
                  type="button"
                >
                  Clear all line items
                </button>
              </div>
            ) : null}
          </Card>

          {/* Notes */}
          <Card className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Notes for this quote
            </p>
            <textarea
              className="mt-2 min-h-20 w-full resize-y rounded-xl px-3 py-2.5 text-[13px] outline-none"
              onChange={(event) => update({ notes: event.target.value })}
              placeholder="Scope, lead time, or special instructions"
              style={fieldStyle()}
              value={quote.notes}
            />
          </Card>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-4">
          <Card className="sticky top-28 p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Quote summary
            </p>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <dt style={{ color: LEDGER.body }}>
                  Line items ({units} unit{units === 1 ? "" : "s"})
                </dt>
                <dd style={{ color: LEDGER.ink, fontWeight: 600 }}>
                  {formatUsd(subtotal)}
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
                  Quote total
                </dt>
                <dd
                  className="text-[20px] font-semibold tracking-tight"
                  style={{ color: LEDGER.ink }}
                >
                  {formatUsd(total)}
                </dd>
              </div>
            </dl>
            <button
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-[14px] font-semibold text-white transition"
              disabled={!items.length}
              onClick={submitQuote}
              style={{
                backgroundColor: items.length ? LEDGER.indigo : LEDGER.muted
              }}
              type="button"
            >
              <Send className="h-4 w-4" /> Submit quote
            </button>
            <button
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition"
              disabled={!items.length}
              onClick={addQuoteToCart}
              style={{
                border: `1px solid ${LEDGER.line}`,
                color: LEDGER.body,
                opacity: items.length ? 1 : 0.5
              }}
              type="button"
            >
              <ShoppingCart className="h-4 w-4" /> Add to purchase order
            </button>
            <button
              className="mt-2 flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-[13px] font-semibold transition"
              onClick={() => {
                saveQuote(quote.id);
                setMessage("Quote saved.");
              }}
              style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.body }}
              type="button"
            >
              Save draft
            </button>
            {message ? (
              <p
                className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold"
                style={{ color: LEDGER.mint }}
              >
                <CheckCircle2 className="h-4 w-4" /> {message}
              </p>
            ) : null}
            <div className="mt-4">
              <ArrowLink href="/ledger/quotes">Back to all quotes</ArrowLink>
            </div>
          </Card>
        </aside>
      </div>
    </LedgerPage>
  );
}
