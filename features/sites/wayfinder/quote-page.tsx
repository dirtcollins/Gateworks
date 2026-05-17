// Wayfinder — quote builder. Builds / edits a quote in the real
// @/lib/quote-store: customer details, line items with quick-add from the real
// catalog, quantity edit, remove, live subtotal / tax / total, and submit
// (marks the quote "sent"). Works on the active quote when no quoteId is
// passed, or a specific quote when one is. Logic ported from
// components/quote-page-client.tsx, restyled in Wayfinder.
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import { useQuoteStore } from "@/lib/quote-store";
import { products } from "@/lib/catalog";
import { customerDirectory, getCustomerById } from "@/lib/customers";
import { calculateTax } from "@/lib/tax";
import type { Product } from "@/lib/types";
import {
  Btn,
  Card,
  Eyebrow,
  Ico,
  Mono,
  ProductImage,
  Qty,
  fmt,
  monoFont,
  wf
} from "./kit";
import { WfInput } from "./cart-page";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

function formatDate(value: string) {
  return value ? dateFormatter.format(new Date(value)) : "—";
}

function pickQuoteVariant(product: Product) {
  return product.variants.find((variant) => variant.inventory === "in_stock") || product.variants[0];
}

export function WayfinderQuoteBuilder({ quoteId }: { quoteId?: string }) {
  const {
    quotes,
    activeQuoteId,
    addItem,
    removeItem,
    updateQuantity,
    clearQuote,
    saveQuote,
    setActiveQuote,
    createQuote,
    updateQuoteDetails
  } = useQuoteStore();

  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    useQuoteStore.persist.rehydrate();
    useCartStore.persist.rehydrate();
    setReady(true);
  }, []);

  const targetId = quoteId || activeQuoteId;
  const quote = quotes.find((record) => record.id === targetId);

  // Keep the store's active quote in sync with the one we're editing.
  useEffect(() => {
    if (quote) setActiveQuote(quote.id);
  }, [quote, setActiveQuote]);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 2400);
    return () => window.clearTimeout(handle);
  }, [message]);

  const searchResults = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return products.slice(0, 10);
    return products
      .filter(
        (product) =>
          product.title.toLowerCase().includes(normalized) ||
          product.category.name.toLowerCase().includes(normalized) ||
          product.variants.some((variant) => variant.sku.toLowerCase().includes(normalized))
      )
      .slice(0, 24);
  }, [search]);

  const sortedCustomers = useMemo(
    () => [...customerDirectory].sort((left, right) => left.name.localeCompare(right.name)),
    []
  );

  if (!ready) {
    return (
      <div style={{ padding: 64, textAlign: "center", color: wf.muted }}>
        <Mono>Loading quote…</Mono>
      </div>
    );
  }

  if (!quote) {
    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "56px 24px" }}>
        <Card style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Quote not found</p>
          <p style={{ fontSize: 13, color: wf.steel, margin: "8px 0 18px" }}>
            It may have been deleted or created in another browser.
          </p>
          <Btn variant="primary" href="/wayfinder/quotes">
            View all quotes
          </Btn>
        </Card>
      </div>
    );
  }

  const items = quote.items;
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;
  const lineCount = items.reduce((count, item) => count + item.quantity, 0);

  function updateField(details: Parameters<typeof updateQuoteDetails>[1]) {
    updateQuoteDetails(quote!.id, details);
  }

  function selectCustomer(customerId: string) {
    const customer = getCustomerById(customerId);
    if (!customer) {
      updateField({ customerId: "" });
      return;
    }
    updateField({
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      billingAddress: customer.billingAddress,
      jobsiteAddress: customer.jobsiteAddress,
      terms: customer.terms
    });
  }

  function addCatalogItem(product: Product) {
    const variant = pickQuoteVariant(product);
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
    setMessage(`Added ${product.title}`);
  }

  function submitQuote() {
    if (!items.length) {
      setMessage("Add a line item before submitting.");
      return;
    }
    saveQuote(quote!.id);
    updateField({ status: "sent" });
    setMessage("Quote submitted to the Bakersfield desk.");
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          borderBottom: `1px solid ${wf.rail}`,
          paddingBottom: 18,
          marginBottom: 20
        }}
      >
        <div>
          <Link
            href="/wayfinder/quotes"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: wf.steel,
              display: "inline-flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Ico.chevronRight size={12} style={{ transform: "rotate(180deg)" }} /> All quotes
          </Link>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.02em", margin: "8px 0 0" }}>
            Quote builder
          </h1>
          <Mono style={{ fontSize: 12, color: wf.steel }}>
            {quote.quoteNumber} · {quote.status} · {lineCount} unit
            {lineCount === 1 ? "" : "s"}
          </Mono>
        </div>
        <Btn
          variant="default"
          size="sm"
          onClick={() => {
            const id = createQuote("New job quote");
            setActiveQuote(id);
            setMessage("Started a new quote.");
          }}
        >
          <Ico.plus size={14} /> New quote
        </Btn>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 340px",
          gap: 20,
          alignItems: "start"
        }}
      >
        <div style={{ display: "grid", gap: 16 }}>
          {/* Quote title + customer */}
          <Card style={{ padding: 18 }}>
            <Eyebrow>Quote details</Eyebrow>
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <WfInput
                placeholder="Quote title"
                value={quote.name}
                onChange={(value) => updateField({ name: value })}
              />
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
                  Customer account
                </span>
                <select
                  value={quote.customerId || ""}
                  onChange={(event) => selectCustomer(event.target.value)}
                  style={selectStyle}
                >
                  <option value="">Manual entry</option>
                  {sortedCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.company})
                    </option>
                  ))}
                </select>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <WfInput
                  placeholder="Customer name"
                  value={quote.customerName}
                  onChange={(value) => updateField({ customerId: "", customerName: value })}
                />
                <WfInput
                  placeholder="Customer email"
                  value={quote.customerEmail}
                  onChange={(value) => updateField({ customerId: "", customerEmail: value })}
                />
              </div>
              <textarea
                placeholder="Jobsite or delivery address"
                value={quote.jobsiteAddress}
                onChange={(event) =>
                  updateField({ customerId: "", jobsiteAddress: event.target.value })
                }
                style={{ ...selectStyle, height: 64, padding: "10px 12px", resize: "vertical" }}
              />
            </div>
          </Card>

          {/* Line items */}
          <Card style={{ padding: 0 }}>
            <div
              style={{
                padding: "14px 18px",
                borderBottom: `1px solid ${wf.hairline}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <Eyebrow>Line items</Eyebrow>
              <Btn size="xs" variant="default" onClick={() => setShowAdd((open) => !open)}>
                <Ico.plus size={12} /> Add item
              </Btn>
            </div>

            {showAdd ? (
              <div style={{ padding: 14, borderBottom: `1px solid ${wf.hairline}`, background: wf.bone }}>
                <WfInput
                  placeholder="Search products by name or SKU"
                  value={search}
                  onChange={setSearch}
                />
                <div
                  style={{
                    marginTop: 8,
                    maxHeight: 280,
                    overflowY: "auto",
                    border: `1px solid ${wf.rail}`,
                    background: "#fff"
                  }}
                >
                  {!searchResults.length ? (
                    <p
                      style={{
                        padding: 16,
                        textAlign: "center",
                        fontSize: 13,
                        color: wf.muted
                      }}
                    >
                      No products match your search.
                    </p>
                  ) : (
                    searchResults.map((product, index) => {
                      const variant = pickQuoteVariant(product);
                      if (!variant) return null;
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addCatalogItem(product)}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "44px minmax(0, 1fr) auto",
                            gap: 10,
                            alignItems: "center",
                            width: "100%",
                            textAlign: "left",
                            padding: "8px 10px",
                            background: "#fff",
                            border: "none",
                            borderTop:
                              index > 0 ? `1px solid ${wf.hairline}` : "none",
                            cursor: "pointer"
                          }}
                        >
                          <div style={{ border: `1px solid ${wf.rail}` }}>
                            <ProductImage product={product} ratio={1} sizes="44px" />
                          </div>
                          <span style={{ minWidth: 0 }}>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {product.title}
                            </span>
                            <Mono style={{ fontSize: 11, color: wf.muted }}>
                              SKU {variant.sku}
                            </Mono>
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800 }}>
                            {fmt(variant.price)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}

            {items.length ? (
              items.map((item, index) => (
                <div
                  key={item.variantId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "64px minmax(0, 1fr) auto",
                    gap: 12,
                    padding: 14,
                    alignItems: "center",
                    borderBottom:
                      index < items.length - 1 ? `1px solid ${wf.hairline}` : "none"
                  }}
                >
                  <div style={{ border: `1px solid ${wf.rail}` }}>
                    <ProductImage
                      product={
                        {
                          title: item.title,
                          images: item.image ? [{ url: item.image }] : [],
                          variants: [{ sku: item.sku, image: item.image }]
                        } as unknown as Product
                      }
                      ratio={1}
                      sizes="64px"
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <Link
                      href={`/wayfinder/products/${item.productId}`}
                      style={{ fontSize: 14, fontWeight: 800, color: wf.ink }}
                    >
                      {item.title}
                    </Link>
                    <Mono style={{ fontSize: 11, color: wf.muted, display: "block", marginTop: 2 }}>
                      SKU {item.sku} · {fmt(item.price)} ea
                    </Mono>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Qty
                      value={item.quantity}
                      onChange={(next) => updateQuantity(quote.id, item.variantId, next)}
                      height={34}
                    />
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 900,
                        minWidth: 78,
                        textAlign: "right"
                      }}
                    >
                      {fmt(item.price * item.quantity)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.title}`}
                      onClick={() => removeItem(quote.id, item.variantId)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: wf.red,
                        display: "inline-flex"
                      }}
                    >
                      <Ico.x size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p
                style={{
                  padding: 36,
                  textAlign: "center",
                  fontSize: 13,
                  color: wf.muted
                }}
              >
                No line items yet. Use “Add item” to build this quote.
              </p>
            )}
          </Card>

          {/* Notes */}
          <Card style={{ padding: 18 }}>
            <Eyebrow>Message on quote</Eyebrow>
            <textarea
              placeholder="Notes for the customer"
              value={quote.notes}
              onChange={(event) => updateField({ notes: event.target.value })}
              style={{
                ...selectStyle,
                marginTop: 12,
                height: 72,
                padding: "10px 12px",
                resize: "vertical"
              }}
            />
          </Card>
        </div>

        {/* Summary / actions */}
        <div style={{ display: "grid", gap: 16 }}>
          <Card style={{ padding: 18 }}>
            <Eyebrow>Quote summary</Eyebrow>
            <div style={{ display: "grid", gap: 8, marginTop: 12, fontSize: 13 }}>
              <SummaryRow label="Quote no." value={quote.quoteNumber} />
              <SummaryRow label="Created" value={formatDate(quote.createdAt)} />
              <SummaryRow label="Expires" value={formatDate(quote.expiresAt)} />
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: wf.steel }}>Terms</span>
                <select
                  value={quote.terms}
                  onChange={(event) => updateField({ terms: event.target.value })}
                  style={{ ...selectStyle, width: 130, height: 32, fontSize: 12 }}
                >
                  <option>Due on receipt</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                  <option>Net 45</option>
                </select>
              </label>
            </div>
            <div style={{ display: "grid", gap: 8, marginTop: 12, fontSize: 13 }}>
              <SummaryRow label="Subtotal" value={fmt(subtotal)} />
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
              <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em" }}>
                {fmt(total)}
              </span>
            </div>
          </Card>

          <Card style={{ padding: 18, display: "grid", gap: 8 }}>
            <Btn variant="primary" block onClick={submitQuote} disabled={!items.length}>
              <Ico.arrowRight size={14} /> Submit quote
            </Btn>
            <Btn
              variant="default"
              block
              size="sm"
              onClick={() => {
                saveQuote(quote.id);
                setMessage("Quote saved.");
              }}
            >
              <Ico.clipboard size={13} /> Save draft
            </Btn>
            <Btn
              variant="danger"
              block
              size="sm"
              disabled={!items.length}
              onClick={() => {
                if (!window.confirm("Clear all line items?")) return;
                clearQuote(quote.id);
              }}
            >
              Clear line items
            </Btn>
            {message ? (
              <Mono style={{ fontSize: 11, color: wf.pine, textAlign: "center" }}>
                {message}
              </Mono>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  height: 40,
  border: `1px solid ${wf.rail}`,
  background: "#fff",
  padding: "0 10px",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "inherit",
  outline: "none",
  color: wf.ink,
  width: "100%"
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: wf.steel }}>{label}</span>
      <span style={{ fontWeight: 700, fontFamily: monoFont }}>{value}</span>
    </div>
  );
}
