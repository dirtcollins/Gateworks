// Wayfinder admin — quote detail. Reads and writes the Supabase-backed quote
// API (@/lib/quotes-data): edit customer/terms/notes, advance status, adjust or
// add line items from the real catalog, assign the quote to a customer account
// (registry or a registered site user), save as a draft, save as a reusable
// template, and convert the quote into a full order.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { products } from "@/lib/catalog";
import { customerDirectory } from "@/lib/customers";
import { calculateTax } from "@/lib/tax";
import {
  convertQuoteToOrder,
  fetchQuote,
  saveQuote,
  type DbQuote,
  type QuoteItemInput,
  type QuoteStatus
} from "@/lib/quotes-data";
import type { Product } from "@/lib/types";
import { fmt } from "../kit";
import {
  AdminBtn,
  Field,
  Ico,
  Mono,
  Notice,
  Panel,
  PageHead,
  Pill,
  SelectInput,
  TextArea,
  TextInput,
  monoFont,
  wf
} from "./admin-kit";
import { formatDate } from "./order-helpers";
import { fetchSiteUsers, type SiteUser } from "./site-users";

const STATUS_FLOW: QuoteStatus[] = [
  "draft",
  "sent",
  "accepted",
  "invoiced",
  "converted"
];
const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  invoiced: "Invoiced",
  converted: "Converted"
};
const STATUS_TONE: Record<QuoteStatus, "open" | "warn" | "active" | "done" | "neutral"> = {
  draft: "open",
  sent: "warn",
  accepted: "active",
  invoiced: "done",
  converted: "neutral"
};

type DraftItem = {
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  options: Record<string, string | undefined>;
  quantity: number;
  unitPrice: number;
};

type Draft = {
  id: string;
  quoteNumber: string;
  status: QuoteStatus;
  isTemplate: boolean;
  templateName: string;
  siteUserId: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  jobsiteAddress: string;
  terms: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  convertedOrderId: string | null;
  items: DraftItem[];
};

function draftFromQuote(quote: DbQuote): Draft {
  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    isTemplate: quote.isTemplate,
    templateName: quote.templateName,
    siteUserId: quote.siteUserId,
    customerId: quote.customerId,
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
    billingAddress: quote.billingAddress,
    jobsiteAddress: quote.jobsiteAddress,
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

function pickVariant(product: Product) {
  return (
    product.variants.find((variant) => variant.inventory === "in_stock") ||
    product.variants[0]
  );
}

export function WayfinderQuoteDetail({ quoteId }: { quoteId: string }) {
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [siteUsers, setSiteUsers] = useState<SiteUser[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setReady(false);
    setNotFound(false);
    const result = await fetchQuote(quoteId);
    setConfigured(result.configured);
    if (result.quote) {
      setDraft(draftFromQuote(result.quote));
    } else {
      setNotFound(true);
    }
    setReady(true);
  }, [quoteId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetchSiteUsers().then((result) => setSiteUsers(result.users));
  }, []);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 3200);
    return () => window.clearTimeout(handle);
  }, [message]);

  const searchResults = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return products.slice(0, 8);
    return products
      .filter(
        (product) =>
          product.title.toLowerCase().includes(normalized) ||
          product.variants.some((variant) =>
            variant.sku.toLowerCase().includes(normalized)
          )
      )
      .slice(0, 20);
  }, [search]);

  if (!ready) {
    return (
      <>
        <PageHead eyebrow="Operations" title="Quote" />
        <Panel>
          <p style={{ margin: 0, color: wf.muted, fontSize: 13 }}>
            Loading quote…
          </p>
        </Panel>
      </>
    );
  }

  if (notFound || !draft) {
    return (
      <>
        <PageHead
          eyebrow="Operations"
          title="Quote not found"
          action={
            <AdminBtn href="/wayfinder/admin/quotes">Back to quotes</AdminBtn>
          }
        />
        <Panel>
          <p style={{ margin: 0, color: wf.muted, fontSize: 13 }}>
            {configured
              ? `No quote matches ${quoteId}.`
              : "Supabase is not configured — quotes cannot be loaded."}
          </p>
        </Panel>
      </>
    );
  }

  const current = draft;
  const subtotal = current.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;
  const nextStatusIndex = STATUS_FLOW.indexOf(current.status) + 1;
  const nextStatus =
    nextStatusIndex < STATUS_FLOW.length - 1
      ? STATUS_FLOW[nextStatusIndex]
      : null;

  function updateDraft(patch: Partial<Draft>) {
    setDraft((value) => (value ? { ...value, ...patch } : value));
  }

  function buildItemInputs(items: DraftItem[]): QuoteItemInput[] {
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

  function addCatalogItem(product: Product) {
    const variant = pickVariant(product);
    if (!variant) return;
    setDraft((value) => {
      if (!value) return value;
      const existing = value.items.find(
        (item) => item.variantId === variant.id
      );
      if (existing) {
        return {
          ...value,
          items: value.items.map((item) =>
            item.variantId === variant.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }
      return {
        ...value,
        items: [
          ...value.items,
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
  }

  function updateQuantity(variantId: string, quantity: number) {
    setDraft((value) =>
      value
        ? {
            ...value,
            items: value.items.map((item) =>
              item.variantId === variantId
                ? { ...item, quantity: Math.max(1, quantity) }
                : item
            )
          }
        : value
    );
  }

  function removeItem(variantId: string) {
    setDraft((value) =>
      value
        ? {
            ...value,
            items: value.items.filter((item) => item.variantId !== variantId)
          }
        : value
    );
  }

  async function persist(overrides: {
    status?: QuoteStatus;
    isTemplate?: boolean;
    templateName?: string;
  }): Promise<DbQuote | null> {
    const result = await saveQuote({
      id: current.id,
      status: overrides.status ?? current.status,
      isTemplate: overrides.isTemplate ?? current.isTemplate,
      templateName: overrides.templateName ?? current.templateName,
      siteUserId: current.siteUserId,
      customerId: current.customerId,
      customerName: current.customerName,
      customerEmail: current.customerEmail,
      billingAddress: current.billingAddress,
      jobsiteAddress: current.jobsiteAddress,
      terms: current.terms,
      notes: current.notes,
      subtotal,
      tax,
      total,
      items: buildItemInputs(current.items)
    });
    setConfigured(result.persisted);
    return result.quote;
  }

  async function handleSave(status?: QuoteStatus) {
    if (busy) return;
    setBusy(true);
    const saved = await persist({ status });
    setBusy(false);
    if (saved) {
      setDraft(draftFromQuote(saved));
      setMessage(
        status && status !== current.status
          ? `Quote moved to ${STATUS_LABEL[status]}.`
          : "Quote saved."
      );
    } else {
      setMessage("Quote not persisted — Supabase is not configured.");
    }
  }

  async function handleSaveAsTemplate() {
    if (busy) return;
    const name = window.prompt(
      "Template name",
      current.templateName || `${current.customerName || "Quote"} template`
    );
    if (name === null) return;
    setBusy(true);
    const saved = await persist({
      isTemplate: true,
      templateName: name.trim() || "Untitled template"
    });
    setBusy(false);
    if (saved) {
      setDraft(draftFromQuote(saved));
      setMessage("Saved as a reusable template.");
    } else {
      setMessage("Could not save the template.");
    }
  }

  async function handleConvert() {
    if (busy) return;
    if (!current.items.length) {
      setMessage("Add a line item before converting to an order.");
      return;
    }
    setBusy(true);
    const saved = await persist({});
    if (!saved) {
      setBusy(false);
      setMessage("Save the quote before converting — Supabase is not configured.");
      return;
    }
    const result = await convertQuoteToOrder(saved.id);
    setBusy(false);
    if (result.persisted) {
      setMessage(`Converted to order ${result.orderNumber || ""}.`.trim());
      void load();
    } else {
      setMessage("Could not convert the quote.");
    }
  }

  function assignRegistryCustomer(customerName: string) {
    const picked = customerDirectory.find((c) => c.name === customerName);
    if (!picked) {
      updateDraft({ customerId: "", customerName: "" });
      return;
    }
    updateDraft({
      customerId: picked.id,
      customerName: picked.name,
      customerEmail: picked.email,
      billingAddress: picked.billingAddress,
      jobsiteAddress: picked.jobsiteAddress,
      terms: picked.terms
    });
  }

  return (
    <>
      <PageHead
        eyebrow={
          <Link href="/wayfinder/admin/quotes" style={{ color: wf.steel }}>
            ← Quotes
          </Link>
        }
        title={<Mono style={{ fontSize: 24 }}>{current.quoteNumber}</Mono>}
        desc={`${current.customerName || "Unassigned"} · ${
          current.items.length
        } line items`}
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {nextStatus ? (
              <AdminBtn
                onClick={() => handleSave(nextStatus)}
                disabled={busy}
              >
                Mark {STATUS_LABEL[nextStatus]}
              </AdminBtn>
            ) : null}
            <AdminBtn
              variant="primary"
              onClick={() => handleSave()}
              disabled={busy}
            >
              <Ico.check size={14} /> Save quote
            </AdminBtn>
          </div>
        }
      />

      {!configured ? (
        <Notice tone="warn">
          Supabase is not configured — saving will not persist this quote.
        </Notice>
      ) : null}
      {message ? <Notice tone="good">{message}</Notice> : null}

      <div
        style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}
      >
        <Pill tone={STATUS_TONE[current.status]}>
          {STATUS_LABEL[current.status]}
        </Pill>
        {current.isTemplate ? <Pill tone="neutral">Template</Pill> : null}
        {current.convertedOrderId ? (
          <Pill tone="done">Converted to order</Pill>
        ) : null}
        <span style={{ fontSize: 11, color: wf.muted, fontFamily: monoFont }}>
          Created {formatDate(current.createdAt)} · updated{" "}
          {formatDate(current.updatedAt)}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)"
        }}
        className="wf-admin-quote-grid"
      >
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel
            title="Line items"
            meta={`${current.items.length} SKUs`}
            action={
              <AdminBtn size="sm" onClick={() => setShowAdd((open) => !open)}>
                <Ico.plus size={12} /> Add item
              </AdminBtn>
            }
            pad={false}
          >
            {showAdd ? (
              <div
                style={{
                  padding: 14,
                  borderBottom: `1px solid ${wf.hairline}`,
                  background: wf.bone
                }}
              >
                <TextInput
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products by name or SKU"
                  style={{ height: 34, fontSize: 12 }}
                />
                <div
                  style={{
                    marginTop: 8,
                    maxHeight: 240,
                    overflowY: "auto",
                    border: `1px solid ${wf.rail}`,
                    background: "#fff"
                  }}
                >
                  {searchResults.map((product, index) => {
                    const variant = pickVariant(product);
                    if (!variant) return null;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addCatalogItem(product)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 12px",
                          background: "#fff",
                          border: "none",
                          borderTop:
                            index > 0 ? `1px solid ${wf.hairline}` : "none",
                          cursor: "pointer"
                        }}
                      >
                        <span style={{ minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              display: "block"
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
                  })}
                </div>
              </div>
            ) : null}

            {current.items.length ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13
                  }}
                >
                  <thead>
                    <tr style={{ background: wf.bone }}>
                      {["SKU", "Item", "Qty", "Unit", "Line", ""].map((h, i) => (
                        <th
                          key={h || "x"}
                          style={{
                            textAlign: i >= 2 && i <= 4 ? "right" : "left",
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
                    {current.items.map((item) => (
                      <tr key={item.variantId}>
                        <td style={td()}>
                          <Mono style={{ fontSize: 11 }}>{item.sku}</Mono>
                        </td>
                        <td style={td()}>
                          <span style={{ fontWeight: 700 }}>{item.title}</span>
                        </td>
                        <td style={td("right")}>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) =>
                              updateQuantity(
                                item.variantId,
                                Number(event.target.value) || 1
                              )
                            }
                            style={{
                              width: 56,
                              height: 30,
                              textAlign: "center",
                              border: `1px solid ${wf.rail}`,
                              fontFamily: monoFont,
                              fontWeight: 700,
                              fontSize: 12
                            }}
                          />
                        </td>
                        <td style={td("right")}>
                          <Mono>{fmt(item.unitPrice)}</Mono>
                        </td>
                        <td style={td("right")}>
                          <Mono style={{ fontWeight: 700 }}>
                            {fmt(item.unitPrice * item.quantity)}
                          </Mono>
                        </td>
                        <td style={td("right")}>
                          <button
                            type="button"
                            onClick={() => removeItem(item.variantId)}
                            aria-label="Remove item"
                            style={{
                              background: "none",
                              border: `1px solid ${wf.rail}`,
                              color: wf.red,
                              cursor: "pointer",
                              padding: 4,
                              lineHeight: 0
                            }}
                          >
                            <Ico.x size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  padding: "32px 14px",
                  textAlign: "center",
                  color: wf.muted,
                  fontSize: 13,
                  fontFamily: monoFont
                }}
              >
                No line items. Use “Add item” to build this quote.
              </div>
            )}
            <div
              style={{
                borderTop: `1px solid ${wf.hairline}`,
                padding: "12px 16px",
                display: "grid",
                gap: 6,
                justifyItems: "end"
              }}
            >
              <TotalRow label="Subtotal" value={subtotal} />
              <TotalRow label="Tax" value={tax} />
              <TotalRow label="Total" value={total} strong />
            </div>
          </Panel>

          <Panel title="Quote actions">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <AdminBtn onClick={() => handleSave("draft")} disabled={busy}>
                <Ico.clipboard size={13} /> Save as draft
              </AdminBtn>
              <AdminBtn onClick={handleSaveAsTemplate} disabled={busy}>
                <Ico.star size={13} /> Save as template
              </AdminBtn>
              <AdminBtn
                variant="primary"
                onClick={handleConvert}
                disabled={busy || !!current.convertedOrderId}
              >
                <Ico.truck size={13} /> Convert to order
              </AdminBtn>
            </div>
          </Panel>
        </div>

        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel title="Quote details">
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Assign to customer (registry)">
                <SelectInput
                  value={
                    customerDirectory.some(
                      (c) => c.name === current.customerName
                    )
                      ? current.customerName
                      : ""
                  }
                  onChange={(event) =>
                    assignRegistryCustomer(event.target.value)
                  }
                >
                  <option value="">Custom / unassigned</option>
                  {customerDirectory.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Assign to registered account">
                <SelectInput
                  value={current.siteUserId || ""}
                  onChange={(event) => {
                    const id = event.target.value;
                    const user = siteUsers.find((u) => u.id === id);
                    updateDraft({
                      siteUserId: id || null,
                      customerName:
                        user && !current.customerName
                          ? user.displayName
                          : current.customerName
                    });
                  }}
                >
                  <option value="">No account scope</option>
                  {siteUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName} ({user.id})
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Customer name">
                <TextInput
                  value={current.customerName}
                  onChange={(event) =>
                    updateDraft({ customerName: event.target.value })
                  }
                />
              </Field>
              <Field label="Customer email">
                <TextInput
                  value={current.customerEmail}
                  onChange={(event) =>
                    updateDraft({ customerEmail: event.target.value })
                  }
                />
              </Field>
              <Field label="Status">
                <SelectInput
                  value={current.status}
                  onChange={(event) =>
                    updateDraft({
                      status: event.target.value as QuoteStatus
                    })
                  }
                >
                  {STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Terms">
                <TextInput
                  value={current.terms}
                  onChange={(event) =>
                    updateDraft({ terms: event.target.value })
                  }
                />
              </Field>
              {current.isTemplate ? (
                <Field label="Template name">
                  <TextInput
                    value={current.templateName}
                    onChange={(event) =>
                      updateDraft({ templateName: event.target.value })
                    }
                  />
                </Field>
              ) : null}
              <Field label="Notes">
                <TextArea
                  value={current.notes}
                  onChange={(event) =>
                    updateDraft({ notes: event.target.value })
                  }
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Addresses">
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Billing address">
                <TextArea
                  value={current.billingAddress}
                  onChange={(event) =>
                    updateDraft({ billingAddress: event.target.value })
                  }
                />
              </Field>
              <Field label="Jobsite address">
                <TextArea
                  value={current.jobsiteAddress}
                  onChange={(event) =>
                    updateDraft({ jobsiteAddress: event.target.value })
                  }
                />
              </Field>
            </div>
          </Panel>
        </div>
      </div>
      <style>{`
        @media (max-width: 880px) {
          .wf-admin-quote-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

function td(align: "left" | "right" = "left"): React.CSSProperties {
  return {
    textAlign: align,
    padding: "9px 14px",
    borderBottom: `1px solid ${wf.hairline}`,
    color: wf.ink
  };
}

function TotalRow({
  label,
  value,
  strong
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 28, fontSize: strong ? 14 : 12 }}>
      <span
        style={{
          color: strong ? wf.ink : wf.steel,
          fontWeight: strong ? 800 : 600
        }}
      >
        {label}
      </span>
      <Mono
        style={{ fontWeight: strong ? 800 : 600, minWidth: 90, textAlign: "right" }}
      >
        {fmt(value)}
      </Mono>
    </div>
  );
}
