// Wayfinder — customer quote builder. Builds / edits a Supabase-backed quote
// via @/lib/quotes-data: customer details, line items quick-added from the real
// catalog, quantity edit, remove, live subtotal / tax / total, save draft,
// submit (status "sent"), and convert to a full order. Quotes are scoped to the
// signed-in customer account (siteUserId) and persist server-side.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { products } from "@/lib/catalog";
import { calculateTax } from "@/lib/tax";
import { useUserStore } from "@/lib/user-store";
import {
  convertQuoteToOrder,
  fetchQuote,
  saveQuote,
  type DbQuote,
  type QuoteItemInput,
  type QuoteStatus
} from "@/lib/quotes-data";
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
  return (
    product.variants.find((variant) => variant.inventory === "in_stock") ||
    product.variants[0]
  );
}

// A local, editable draft of a quote — server state plus unsaved edits.
type Draft = {
  id?: string;
  quoteNumber: string;
  status: QuoteStatus;
  customerName: string;
  customerEmail: string;
  jobsiteAddress: string;
  billingAddress: string;
  terms: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  convertedOrderId: string | null;
  items: Array<{
    productId: string;
    variantId: string;
    sku: string;
    title: string;
    options: Record<string, string | undefined>;
    quantity: number;
    unitPrice: number;
  }>;
};

function draftFromQuote(quote: DbQuote): Draft {
  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
    jobsiteAddress: quote.jobsiteAddress,
    billingAddress: quote.billingAddress,
    terms: quote.terms || "Due on receipt",
    notes: quote.notes,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
    convertedOrderId: quote.convertedOrderId,
    items: quote.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku,
      title: item.title,
      options: item.options || {},
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }))
  };
}

function emptyDraft(): Draft {
  const now = new Date().toISOString();
  return {
    quoteNumber: "New quote",
    status: "draft",
    customerName: "",
    customerEmail: "",
    jobsiteAddress: "",
    billingAddress: "",
    terms: "Due on receipt",
    notes: "",
    createdAt: now,
    updatedAt: now,
    convertedOrderId: null,
    items: []
  };
}

export function WayfinderQuoteBuilder({ quoteId }: { quoteId?: string }) {
  const router = useRouter();
  const userId = useUserStore((state) => state.userId);
  const displayName = useUserStore((state) => state.displayName);

  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    useUserStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setReady(false);
      setNotFound(false);
      if (quoteId) {
        const result = await fetchQuote(quoteId);
        if (cancelled) return;
        setConfigured(result.configured);
        if (result.quote) {
          setDraft(draftFromQuote(result.quote));
        } else {
          setNotFound(result.configured);
          if (!result.configured) setDraft(emptyDraft());
        }
      } else {
        setDraft(emptyDraft());
      }
      if (!cancelled) setReady(true);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [quoteId]);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 3200);
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
          product.variants.some((variant) =>
            variant.sku.toLowerCase().includes(normalized)
          )
      )
      .slice(0, 24);
  }, [search]);

  function updateDraft(patch: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function addCatalogItem(product: Product) {
    const variant = pickQuoteVariant(product);
    if (!variant) return;
    setDraft((current) => {
      const existing = current.items.find(
        (item) => item.variantId === variant.id
      );
      if (existing) {
        return {
          ...current,
          items: current.items.map((item) =>
            item.variantId === variant.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }
      return {
        ...current,
        items: [
          ...current.items,
          {
            productId: product.id,
            variantId: variant.id,
            sku: variant.sku,
            title: product.title,
            options: variant.options || {},
            quantity: 1,
            unitPrice: variant.price
          }
        ]
      };
    });
    setMessage(`Added ${product.title}`);
  }

  function updateQuantity(variantId: string, quantity: number) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    }));
  }

  function removeItem(variantId: string) {
    setDraft((current) => ({
      ...current,
      items: current.items.filter((item) => item.variantId !== variantId)
    }));
  }

  const items = draft.items;
  const subtotal = items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0
  );
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;
  const lineCount = items.reduce((count, item) => count + item.quantity, 0);

  function buildItemInputs(): QuoteItemInput[] {
    return items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku,
      title: item.title,
      options: item.options,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: Number((item.unitPrice * item.quantity).toFixed(2))
    }));
  }

  async function persist(status: QuoteStatus): Promise<DbQuote | null> {
    const result = await saveQuote({
      id: draft.id,
      status,
      siteUserId: userId,
      customerName: draft.customerName,
      customerEmail: draft.customerEmail,
      jobsiteAddress: draft.jobsiteAddress,
      billingAddress: draft.billingAddress,
      terms: draft.terms,
      notes: draft.notes,
      subtotal,
      tax,
      total,
      createdBy: draft.id ? undefined : displayName || "Customer",
      items: buildItemInputs()
    });
    setConfigured(result.persisted);
    return result.quote;
  }

  async function handleSaveDraft() {
    if (busy) return;
    setBusy(true);
    const saved = await persist("draft");
    setBusy(false);
    if (saved) {
      setDraft(draftFromQuote(saved));
      setMessage("Quote saved.");
      if (!quoteId) router.replace(`/wayfinder/quotes/${saved.id}`);
    } else {
      setMessage("Quote not yet persisted — Supabase is not configured.");
    }
  }

  async function handleSubmit() {
    if (busy) return;
    if (!items.length) {
      setMessage("Add a line item before submitting.");
      return;
    }
    setBusy(true);
    const saved = await persist("sent");
    setBusy(false);
    if (saved) {
      setDraft(draftFromQuote(saved));
      setMessage("Quote submitted to the Bakersfield desk.");
      if (!quoteId) router.replace(`/wayfinder/quotes/${saved.id}`);
    } else {
      setMessage("Quote not yet persisted — Supabase is not configured.");
    }
  }

  async function handleConvert() {
    if (busy) return;
    if (!items.length) {
      setMessage("Add a line item before converting to an order.");
      return;
    }
    setBusy(true);
    // Persist any unsaved edits first so the conversion uses current line items.
    const saved = draft.id ? await persist(draft.status) : await persist("sent");
    if (!saved) {
      setBusy(false);
      setMessage("Save the quote before converting — Supabase is not configured.");
      return;
    }
    setDraft(draftFromQuote(saved));
    const result = await convertQuoteToOrder(saved.id);
    setBusy(false);
    if (result.persisted) {
      setMessage(`Converted to order ${result.orderNumber || ""}.`.trim());
      const refreshed = await fetchQuote(saved.id);
      if (refreshed.quote) setDraft(draftFromQuote(refreshed.quote));
    } else {
      setMessage("Could not convert the quote.");
    }
  }

  if (!ready) {
    return (
      <div style={{ padding: 64, textAlign: "center", color: wf.muted }}>
        <Mono>Loading quote…</Mono>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "56px 24px" }}>
        <Card style={{ padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
            Quote not found
          </p>
          <p style={{ fontSize: 13, color: wf.steel, margin: "8px 0 18px" }}>
            It may have been deleted or belongs to another account.
          </p>
          <Btn variant="primary" href="/wayfinder/quotes">
            View all quotes
          </Btn>
        </Card>
      </div>
    );
  }

  const converted = draft.status === "converted";

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
            <Ico.chevronRight size={12} style={{ transform: "rotate(180deg)" }} />{" "}
            All quotes
          </Link>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              margin: "8px 0 0"
            }}
          >
            Quote builder
          </h1>
          <Mono style={{ fontSize: 12, color: wf.steel }}>
            {draft.quoteNumber} · {draft.status} · {lineCount} unit
            {lineCount === 1 ? "" : "s"}
          </Mono>
        </div>
        <Btn variant="default" size="sm" href="/wayfinder/quotes">
          <Ico.plus size={14} /> New quote
        </Btn>
      </div>

      {!configured ? (
        <Card
          style={{
            padding: "10px 14px",
            marginBottom: 16,
            background: wf.amber,
            borderColor: wf.amberDeep
          }}
        >
          <Mono style={{ fontSize: 12, color: "#92500a" }}>
            Quotes are not yet persisted — Supabase is not configured. Saving
            will not store this quote.
          </Mono>
        </Card>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 340px",
          gap: 20,
          alignItems: "start"
        }}
      >
        <div style={{ display: "grid", gap: 16 }}>
          {/* Customer */}
          <Card style={{ padding: 18 }}>
            <Eyebrow>Quote details</Eyebrow>
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10
                }}
              >
                <WfInput
                  placeholder="Customer / company name"
                  value={draft.customerName}
                  onChange={(value) => updateDraft({ customerName: value })}
                />
                <WfInput
                  placeholder="Customer email"
                  value={draft.customerEmail}
                  onChange={(value) => updateDraft({ customerEmail: value })}
                />
              </div>
              <textarea
                placeholder="Jobsite or delivery address"
                value={draft.jobsiteAddress}
                onChange={(event) =>
                  updateDraft({ jobsiteAddress: event.target.value })
                }
                style={{
                  ...selectStyle,
                  height: 64,
                  padding: "10px 12px",
                  resize: "vertical"
                }}
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
              <Btn
                size="xs"
                variant="default"
                onClick={() => setShowAdd((open) => !open)}
              >
                <Ico.plus size={12} /> Add item
              </Btn>
            </div>

            {showAdd ? (
              <div
                style={{
                  padding: 14,
                  borderBottom: `1px solid ${wf.hairline}`,
                  background: wf.bone
                }}
              >
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
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    gap: 12,
                    padding: 14,
                    alignItems: "center",
                    borderBottom:
                      index < items.length - 1
                        ? `1px solid ${wf.hairline}`
                        : "none"
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <Link
                      href={`/wayfinder/products/${item.productId}`}
                      style={{ fontSize: 14, fontWeight: 800, color: wf.ink }}
                    >
                      {item.title}
                    </Link>
                    <Mono
                      style={{
                        fontSize: 11,
                        color: wf.muted,
                        display: "block",
                        marginTop: 2
                      }}
                    >
                      SKU {item.sku} · {fmt(item.unitPrice)} ea
                    </Mono>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <Qty
                      value={item.quantity}
                      onChange={(next) => updateQuantity(item.variantId, next)}
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
                      {fmt(item.unitPrice * item.quantity)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.title}`}
                      onClick={() => removeItem(item.variantId)}
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
              placeholder="Notes for the Bakersfield desk"
              value={draft.notes}
              onChange={(event) => updateDraft({ notes: event.target.value })}
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
            <div
              style={{ display: "grid", gap: 8, marginTop: 12, fontSize: 13 }}
            >
              <SummaryRow label="Quote no." value={draft.quoteNumber} />
              <SummaryRow label="Created" value={formatDate(draft.createdAt)} />
              <SummaryRow
                label="Updated"
                value={formatDate(draft.updatedAt)}
              />
              <label
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span style={{ color: wf.steel }}>Terms</span>
                <select
                  value={draft.terms}
                  onChange={(event) =>
                    updateDraft({ terms: event.target.value })
                  }
                  style={{
                    ...selectStyle,
                    width: 130,
                    height: 32,
                    fontSize: 12
                  }}
                >
                  <option>Due on receipt</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                  <option>Net 45</option>
                </select>
              </label>
            </div>
            <div
              style={{ display: "grid", gap: 8, marginTop: 12, fontSize: 13 }}
            >
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
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: "-0.02em"
                }}
              >
                {fmt(total)}
              </span>
            </div>
          </Card>

          <Card style={{ padding: 18, display: "grid", gap: 8 }}>
            {converted ? (
              <Mono
                style={{
                  fontSize: 12,
                  color: wf.pineDeep,
                  textAlign: "center"
                }}
              >
                This quote has been converted to an order.
              </Mono>
            ) : (
              <>
                <Btn
                  variant="primary"
                  block
                  onClick={handleSubmit}
                  disabled={!items.length || busy}
                >
                  <Ico.arrowRight size={14} /> Submit quote
                </Btn>
                <Btn
                  variant="default"
                  block
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={busy}
                >
                  <Ico.clipboard size={13} /> Save draft
                </Btn>
                <Btn
                  variant="default"
                  block
                  size="sm"
                  onClick={handleConvert}
                  disabled={!items.length || busy}
                  title="Convert this quote to a full order"
                >
                  <Ico.truck size={13} /> Convert to order
                </Btn>
              </>
            )}
            {message ? (
              <Mono
                style={{ fontSize: 11, color: wf.pine, textAlign: "center" }}
              >
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
