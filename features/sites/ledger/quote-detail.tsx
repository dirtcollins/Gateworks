"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  catalogItemToQuoteInput,
  formatLedgerDate,
  pickVariant,
  searchCatalog
} from "./quote-helpers";
import { useCartStore } from "@/lib/cart-store";
import { useUserStore } from "@/lib/user-store";
import { customerDirectory, getCustomerById } from "@/lib/customers";
import { calculateTax } from "@/lib/tax";
import type { CartItem } from "@/lib/types";
import {
  convertQuoteToOrder,
  fetchQuote,
  saveQuote,
  type DbQuote,
  type QuoteInput,
  type QuoteItemInput,
  type QuoteStatus
} from "@/lib/quotes-data";

const statusTone: Record<QuoteStatus, { bg: string; fg: string }> = {
  draft: { bg: LEDGER.amberSoft, fg: LEDGER.amber },
  sent: { bg: LEDGER.indigoSoft, fg: LEDGER.indigo },
  accepted: { bg: LEDGER.mintSoft, fg: LEDGER.mint },
  invoiced: { bg: LEDGER.mintSoft, fg: LEDGER.mint },
  converted: { bg: LEDGER.mintSoft, fg: LEDGER.mint }
};

function fieldStyle() {
  return {
    border: `1px solid ${LEDGER.line}`,
    color: LEDGER.ink,
    backgroundColor: LEDGER.surface
  } as const;
}

/* Editable working copy held client-side; flushed to the DB on save. */
type WorkingItem = QuoteItemInput & {
  id?: string;
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  quantity: number;
  unitPrice: number;
};

function toWorkingItems(quote: DbQuote): WorkingItem[] {
  return quote.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    sku: item.sku,
    title: item.title,
    options: item.options,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal
  }));
}

/* Ledger customer quote builder + detail — reads / writes one DB quote:
 * line items, quantities, quick-add catalog search, customer details,
 * terms, notes, submit (mark sent), add to PO, and convert to order. */
export function LedgerQuoteDetailView({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const addCartItem = useCartStore((state) => state.addItem);
  const userId = useUserStore((state) => state.userId);

  const [quote, setQuote] = useState<DbQuote | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [configured, setConfigured] = useState(true);

  const [items, setItems] = useState<WorkingItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [jobsiteAddress, setJobsiteAddress] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [terms, setTerms] = useState("Net 30");
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const hydrateFrom = useCallback((next: DbQuote) => {
    setQuote(next);
    setItems(toWorkingItems(next));
    setCustomerName(next.customerName);
    setCustomerEmail(next.customerEmail);
    setCustomerId(next.customerId);
    setJobsiteAddress(next.jobsiteAddress);
    setBillingAddress(next.billingAddress);
    setTerms(next.terms || "Net 30");
    setNotes(next.notes);
  }, []);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    void (async () => {
      const result = await fetchQuote(quoteId);
      if (!active) return;
      setConfigured(result.configured);
      if (result.quote) hydrateFrom(result.quote);
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [quoteId, hydrateFrom]);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 2800);
    return () => window.clearTimeout(handle);
  }, [message]);

  const results = useMemo(() => searchCatalog(search), [search]);
  const sortedCustomers = useMemo(
    () =>
      [...customerDirectory].sort((left, right) =>
        left.name.localeCompare(right.name)
      ),
    []
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
    [items]
  );
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;
  const units = items.reduce((count, item) => count + item.quantity, 0);
  const status: QuoteStatus = quote?.status ?? "draft";
  const tone = statusTone[status];
  const locked = status === "converted";

  function buildInput(overrides: Partial<QuoteInput> = {}): QuoteInput {
    return {
      id: quote?.id,
      status: quote?.status ?? "draft",
      siteUserId: userId,
      customerId,
      customerName,
      customerEmail,
      billingAddress,
      jobsiteAddress,
      terms,
      notes,
      subtotal,
      tax,
      total,
      items: items.map<QuoteItemInput>((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        title: item.title,
        options: item.options,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: Number((item.unitPrice * item.quantity).toFixed(2))
      })),
      ...overrides
    };
  }

  async function persist(overrides: Partial<QuoteInput>, note: string) {
    if (busy) return;
    setBusy(true);
    try {
      const result = await saveQuote(buildInput(overrides));
      if (result.quote) hydrateFrom(result.quote);
      setConfigured(result.persisted);
      setMessage(
        result.persisted ? note : "Saved locally — quote database not configured."
      );
    } finally {
      setBusy(false);
    }
  }

  function applyCustomer(id: string) {
    const customer = getCustomerById(id);
    if (!customer) {
      setCustomerId("");
      return;
    }
    setCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerEmail(customer.email);
    setBillingAddress(customer.billingAddress);
    setJobsiteAddress(customer.jobsiteAddress);
    setTerms(customer.terms);
  }

  function addCatalogItem(productId: string) {
    const product = results.find((entry) => entry.id === productId);
    if (!product) return;
    const variant = pickVariant(product);
    if (!variant) return;
    setItems((current) => {
      const existing = current.find((item) => item.variantId === variant.id);
      if (existing) {
        return current.map((item) =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      const input = catalogItemToQuoteInput(product, variant);
      return [
        {
          productId: input.productId ?? product.id,
          variantId: input.variantId ?? variant.id,
          sku: input.sku ?? variant.sku,
          title: input.title ?? product.title,
          options: input.options,
          quantity: input.quantity ?? 1,
          unitPrice: input.unitPrice ?? variant.price
        },
        ...current
      ];
    });
    setMessage(`Added ${product.title}.`);
  }

  function updateQuantity(variantId: string, quantity: number) {
    setItems((current) =>
      current.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.max(1, Math.round(quantity) || 1) }
          : item
      )
    );
  }

  function removeItem(variantId: string) {
    setItems((current) =>
      current.filter((item) => item.variantId !== variantId)
    );
  }

  async function handleConvert() {
    if (!quote || busy) return;
    setBusy(true);
    try {
      // Flush current edits first so the conversion uses live line items.
      const saved = await saveQuote(buildInput());
      if (saved.quote) hydrateFrom(saved.quote);
      const result = await convertQuoteToOrder(quote.id);
      if (result.persisted && result.orderId) {
        setMessage(`Converted to order ${result.orderNumber ?? ""}.`);
        const refreshed = await fetchQuote(quote.id);
        if (refreshed.quote) hydrateFrom(refreshed.quote);
      } else {
        setMessage("Conversion is not available — quote database not configured.");
      }
    } finally {
      setBusy(false);
    }
  }

  function addQuoteToCart() {
    items.forEach((item) => {
      addCartItem({
        productId: item.productId,
        variantId: item.variantId,
        title: item.title,
        sku: item.sku,
        image: "/assets/logo.svg",
        price: item.unitPrice,
        quantity: item.quantity,
        options: (item.options ?? {}) as CartItem["options"]
      });
    });
    setMessage("Quote lines added to your purchase order.");
  }

  if (loaded && !quote) {
    return (
      <LedgerPage>
        <div className="py-16">
          <Card className="mx-auto max-w-xl p-12 text-center">
            <p className="text-lg font-semibold" style={{ color: LEDGER.ink }}>
              Quote not found
            </p>
            <p className="mt-1 text-[13px]" style={{ color: LEDGER.body }}>
              {configured
                ? "It may have been deleted or created under another account."
                : "The quote database is not configured."}
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
        <div
          className="py-24 text-center text-[13px]"
          style={{ color: LEDGER.muted }}
        >
          Loading quote…
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
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {quote.quoteNumber}
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Created {formatLedgerDate(quote.createdAt)} · Updated{" "}
              {formatLedgerDate(quote.updatedAt)}
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
                  disabled={locked}
                  onChange={(event) => applyCustomer(event.target.value)}
                  style={fieldStyle()}
                  value={customerId || ""}
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
                  disabled={locked}
                  onChange={(event) => {
                    setCustomerId("");
                    setCustomerName(event.target.value);
                  }}
                  style={fieldStyle()}
                  value={customerName}
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
                  disabled={locked}
                  onChange={(event) => {
                    setCustomerId("");
                    setCustomerEmail(event.target.value);
                  }}
                  style={fieldStyle()}
                  type="email"
                  value={customerEmail}
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
                  disabled={locked}
                  onChange={(event) => setTerms(event.target.value)}
                  style={fieldStyle()}
                  value={terms || "Net 30"}
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
                  disabled={locked}
                  onChange={(event) => {
                    setCustomerId("");
                    setJobsiteAddress(event.target.value);
                  }}
                  style={fieldStyle()}
                  value={jobsiteAddress}
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
              {!locked ? (
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
              ) : null}
            </div>

            {showAdd && !locked ? (
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
                        onClick={() => addCatalogItem(product.id)}
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
                        SKU {item.sku} · {formatUsd(item.unitPrice)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center rounded-xl"
                        style={{ border: `1px solid ${LEDGER.line}` }}
                      >
                        <button
                          aria-label="Decrease quantity"
                          className="grid h-8 w-8 place-items-center disabled:opacity-40"
                          disabled={locked}
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          style={{ color: LEDGER.body }}
                          type="button"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          aria-label={`Quantity for ${item.title}`}
                          className="h-8 w-10 bg-transparent text-center text-[13px] font-semibold outline-none"
                          disabled={locked}
                          inputMode="numeric"
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            if (Number.isFinite(next)) {
                              updateQuantity(item.variantId, next);
                            }
                          }}
                          style={{ color: LEDGER.ink }}
                          value={item.quantity}
                        />
                        <button
                          aria-label="Increase quantity"
                          className="grid h-8 w-8 place-items-center disabled:opacity-40"
                          disabled={locked}
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          style={{ color: LEDGER.body }}
                          type="button"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {!locked ? (
                        <button
                          aria-label={`Remove ${item.title}`}
                          className="grid h-8 w-8 place-items-center rounded-lg"
                          onClick={() => removeItem(item.variantId)}
                          style={{
                            border: `1px solid ${LEDGER.line}`,
                            color: LEDGER.muted
                          }}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                    <p
                      className="text-[14px] font-semibold sm:text-right"
                      style={{ color: LEDGER.ink }}
                    >
                      {formatUsd(item.unitPrice * item.quantity)}
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
                  Use &ldquo;Add item&rdquo; to build this quote from the
                  catalog.
                </p>
              </div>
            )}
            {items.length && !locked ? (
              <div className="p-5">
                <button
                  className="text-[12px] font-semibold transition hover:underline"
                  onClick={() => setItems([])}
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
              disabled={locked}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Scope, lead time, or special instructions"
              style={fieldStyle()}
              value={notes}
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

            {locked ? (
              <p
                className="mt-4 rounded-xl px-3 py-2.5 text-[12px] font-semibold"
                style={{ backgroundColor: LEDGER.mintSoft, color: LEDGER.mint }}
              >
                This quote has been converted to an order
                {quote.convertedOrderId ? "." : "."}
              </p>
            ) : (
              <>
                <button
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-[14px] font-semibold text-white transition disabled:opacity-60"
                  disabled={!items.length || busy}
                  onClick={() => persist({ status: "sent" }, "Quote submitted.")}
                  style={{
                    backgroundColor: items.length ? LEDGER.indigo : LEDGER.muted
                  }}
                  type="button"
                >
                  <Send className="h-4 w-4" /> Submit quote
                </button>
                <button
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition disabled:opacity-60"
                  disabled={!items.length || busy}
                  onClick={handleConvert}
                  style={{
                    border: `1px solid ${LEDGER.indigo}`,
                    color: LEDGER.indigo
                  }}
                  type="button"
                >
                  <ArrowRight className="h-4 w-4" /> Convert to order
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
                  className="mt-2 flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-[13px] font-semibold transition disabled:opacity-60"
                  disabled={busy}
                  onClick={() => persist({}, "Quote saved.")}
                  style={{
                    border: `1px solid ${LEDGER.line}`,
                    color: LEDGER.body
                  }}
                  type="button"
                >
                  Save draft
                </button>
              </>
            )}

            {!configured ? (
              <p
                className="mt-3 text-[12px] font-semibold"
                style={{ color: LEDGER.amber }}
              >
                Quote database not configured — changes are not persisted.
              </p>
            ) : null}
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
            <button
              className="mt-2 text-[11px] font-medium"
              onClick={() => router.refresh()}
              style={{ color: LEDGER.muted }}
              type="button"
            >
              Refresh
            </button>
          </Card>
        </aside>
      </div>
    </LedgerPage>
  );
}
