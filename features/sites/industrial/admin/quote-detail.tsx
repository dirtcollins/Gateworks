"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, Printer, Search, Trash2 } from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminCard,
  AdminField,
  AdminPill,
  AdminSection,
  adminInputClass,
  adminTextareaClass
} from "@/features/sites/industrial/admin/kit";
import { customerDirectory, getCustomerById } from "@/lib/customers";
import { calculateTax } from "@/lib/tax";
import type { Product } from "@/lib/types";
import {
  composeQuoteNotes,
  convertQuoteToOrder,
  fetchQuote,
  quoteDisplayName,
  quoteNoteBody,
  saveQuote,
  type DbQuote,
  type DbQuoteItem,
  type QuoteStatus
} from "@/features/sites/industrial/quote-data";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin quote detail. DB-backed via `quotes-data`:
 * edit fields + line items, save as draft, save as a reusable
 * template, assign to a customer account, and convert to an order.
 * ------------------------------------------------------------------ */

const STATUS_OPTIONS: QuoteStatus[] = [
  "draft",
  "sent",
  "accepted",
  "invoiced",
  "converted"
];

const STATUS_TONE: Record<QuoteStatus, "neutral" | "amber" | "pine" | "ink"> = {
  draft: "amber",
  sent: "neutral",
  accepted: "pine",
  invoiced: "ink",
  converted: "ink"
};

const TERMS_OPTIONS = ["Due on receipt", "Net 15", "Net 30", "Net 45"];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

type SiteUser = { id: string; displayName: string };

type EditableItem = Omit<DbQuoteItem, "id" | "quoteId"> & { key: string };

function pickVariant(product: Product) {
  return (
    product.variants.find((variant) => variant.inventory === "in_stock") ||
    product.variants[0]
  );
}

export function IndustrialAdminQuoteDetail({
  quoteId,
  catalogProducts
}: {
  quoteId: string;
  catalogProducts: Product[];
}) {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [quote, setQuote] = useState<DbQuote | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [siteUsers, setSiteUsers] = useState<SiteUser[]>([]);

  const [name, setName] = useState("");
  const [status, setStatus] = useState<QuoteStatus>("draft");
  const [terms, setTerms] = useState("Due on receipt");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [jobsiteAddress, setJobsiteAddress] = useState("");
  const [siteUserId, setSiteUserId] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [items, setItems] = useState<EditableItem[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    fetchQuote(quoteId).then((result) => {
      if (!active) return;
      setConfigured(result.configured);
      if (result.quote) {
        const q = result.quote;
        setQuote(q);
        setName(quoteDisplayName(q));
        setStatus(q.status);
        setTerms(q.terms || "Due on receipt");
        setCustomerId(q.customerId);
        setCustomerName(q.customerName);
        setCustomerEmail(q.customerEmail);
        setBillingAddress(q.billingAddress);
        setJobsiteAddress(q.jobsiteAddress);
        setSiteUserId(q.siteUserId || "");
        setNoteBody(quoteNoteBody(q));
        setItems(
          q.items.map((item, index) => ({
            key: `${item.id || item.variantId}-${index}`,
            productId: item.productId,
            variantId: item.variantId,
            sku: item.sku,
            title: item.title,
            options: item.options,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal
          }))
        );
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [quoteId]);

  useEffect(() => {
    let active = true;
    fetch("/api/site-users", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { users: [] }))
      .then((data: { users?: SiteUser[] }) => {
        if (active) setSiteUsers(data.users || []);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 3200);
    return () => window.clearTimeout(handle);
  }, [message]);

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return catalogProducts
      .filter(
        (product) =>
          product.title.toLowerCase().includes(term) ||
          product.variants.some((variant) =>
            variant.sku.toLowerCase().includes(term)
          )
      )
      .slice(0, 8);
  }, [catalogProducts, query]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items]
  );
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;
  const unitCount = items.reduce((sum, item) => sum + item.quantity, 0);

  if (!ready || !quote) {
    return (
      <div className="grid gap-6">
        <Link
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-pine hover:underline"
          href="/industrial/admin/quotes"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All quotes
        </Link>
        <div className="border-2 border-d1-ink bg-d1-card p-12 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-d1-ink">
            {!ready ? "Loading quote…" : "Quote not found"}
          </h1>
          {ready ? (
            <p className="mt-2 text-sm text-d1-steel">
              {configured
                ? "It may have been deleted."
                : "Supabase is not configured — quotes are not yet persisted."}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  function addProduct(product: Product) {
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
      return [
        {
          key: `${variant.id}-${Date.now()}`,
          productId: product.id,
          variantId: variant.id,
          sku: variant.sku,
          title: product.title,
          options: variant.options,
          quantity: 1,
          unitPrice: variant.price,
          lineTotal: variant.price
        },
        ...current
      ];
    });
    setQuery("");
  }

  function setQuantity(key: string, quantity: number) {
    setItems((current) =>
      current.map((item) =>
        item.key === key
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  }

  function setUnitPrice(key: string, price: number) {
    setItems((current) =>
      current.map((item) =>
        item.key === key
          ? { ...item, unitPrice: Math.max(0, price) }
          : item
      )
    );
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  function applyDirectoryCustomer(id: string) {
    setCustomerId(id);
    const customer = getCustomerById(id);
    if (!customer) return;
    setCustomerName(customer.name);
    setCustomerEmail(customer.email);
    setBillingAddress(customer.billingAddress);
    setJobsiteAddress(customer.jobsiteAddress);
    setTerms(customer.terms);
  }

  async function persist(options: {
    status?: QuoteStatus;
    asTemplate?: boolean;
  }): Promise<DbQuote | null> {
    if (!quote) return null;
    const effectiveStatus = options.status || status;
    const { quote: saved, persisted } = await saveQuote({
      id: quote.id,
      status: effectiveStatus,
      isTemplate: options.asTemplate ?? quote.isTemplate,
      templateName: options.asTemplate ? name.trim() : quote.templateName,
      siteUserId: siteUserId || null,
      customerId,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      billingAddress,
      jobsiteAddress,
      terms,
      notes: composeQuoteNotes(name, noteBody),
      subtotal,
      tax,
      total,
      createdBy: quote.createdBy || "Admin",
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        title: item.title,
        options: item.options,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: Number((item.unitPrice * item.quantity).toFixed(2))
      }))
    });

    if (!persisted) {
      setMessage("Supabase is not configured — changes were not saved.");
      return null;
    }
    if (saved) {
      setQuote(saved);
      setStatus(saved.status);
    }
    return saved;
  }

  async function handleSaveDraft() {
    if (busy) return;
    setBusy(true);
    try {
      const saved = await persist({ status: "draft" });
      if (saved) setMessage("Quote saved as a draft.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    try {
      const saved = await persist({});
      if (saved) setMessage("Quote saved.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveTemplate() {
    if (busy) return;
    if (!name.trim()) {
      setMessage("Give the quote a name before saving it as a template.");
      return;
    }
    setBusy(true);
    try {
      const saved = await persist({ asTemplate: true });
      if (saved) setMessage("Saved as a reusable template.");
    } finally {
      setBusy(false);
    }
  }

  async function handleConvert() {
    if (busy || !quote) return;
    if (!items.length) {
      setMessage("Add line items before converting to an order.");
      return;
    }
    setBusy(true);
    try {
      const saved = await persist({});
      if (!saved) return;
      const { orderNumber, persisted } = await convertQuoteToOrder(quote.id);
      if (!persisted) {
        setMessage("Supabase is not configured — could not convert the quote.");
        return;
      }
      setMessage(`Converted to order ${orderNumber || ""}.`.trim());
      router.push("/industrial/admin/orders");
    } finally {
      setBusy(false);
    }
  }

  const converted = status === "converted" || Boolean(quote.convertedOrderId);

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <Link
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-pine hover:underline"
          href="/industrial/admin/quotes"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All quotes
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-d1-ink pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                {quote.quoteNumber}
              </span>
              {quote.isTemplate ? (
                <AdminPill tone="pine">Template</AdminPill>
              ) : (
                <AdminPill tone={STATUS_TONE[status]}>{status}</AdminPill>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-d1-ink sm:text-4xl">
              {name || quoteDisplayName(quote)}
            </h1>
            <p className="mt-1 text-sm text-d1-steel">
              Updated {dateFormatter.format(new Date(quote.updatedAt))}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 border border-d1-ink bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
              onClick={() => window.print()}
              type="button"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
            <button
              className="inline-flex items-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy}
              onClick={handleSave}
              type="button"
            >
              Save quote
            </button>
          </div>
        </div>
        {!configured ? (
          <p className="border border-d1-amber bg-d1-amber/10 px-4 py-3 text-[12px] font-bold text-d1-ink">
            Quotes are not yet persisted — Supabase is not configured.
          </p>
        ) : null}
        {message ? (
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-d1-pine">
            {message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Line items */}
        <div className="grid gap-8 lg:col-span-8">
          <AdminSection title="Add products">
            <div className="relative">
              <div className="flex items-center gap-2 border border-d1-line bg-white px-3">
                <Search className="h-4 w-4 text-d1-steel" />
                <input
                  aria-label="Search the catalog"
                  className="h-11 w-full bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search the catalog by name or SKU"
                  value={query}
                />
              </div>
              {searchResults.length ? (
                <div className="mt-1 divide-y divide-d1-line border border-d1-line bg-d1-card">
                  {searchResults.map((product) => {
                    const variant = pickVariant(product);
                    if (!variant) return null;
                    return (
                      <button
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-d1-paper"
                        key={product.id}
                        onClick={() => addProduct(product)}
                        type="button"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-d1-ink">
                            {product.title}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                            {variant.sku}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="text-sm font-extrabold text-d1-ink">
                            {formatUsd(variant.price)}
                          </span>
                          <Plus className="h-4 w-4 text-d1-pine" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : query.trim() ? (
                <p className="mt-2 text-sm font-semibold text-d1-steel">
                  No catalog matches for &ldquo;{query}&rdquo;.
                </p>
              ) : null}
            </div>
          </AdminSection>

          <AdminSection title={`Line items (${unitCount} units)`}>
            {items.length ? (
              <AdminCard className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead>
                    <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Unit</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-d1-line">
                    {items.map((item) => (
                      <tr key={item.key}>
                        <td className="px-4 py-3.5">
                          <span className="block text-sm font-bold text-d1-ink">
                            {item.title}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                            {item.sku}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="mx-auto flex w-fit items-center border border-d1-line">
                            <button
                              aria-label="Decrease quantity"
                              className="grid h-8 w-8 place-items-center text-d1-steel transition hover:bg-d1-paper"
                              onClick={() =>
                                setQuantity(item.key, item.quantity - 1)
                              }
                              type="button"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              aria-label="Quantity"
                              className="h-8 w-12 border-x border-d1-line bg-white text-center text-sm font-bold text-d1-ink outline-none"
                              min={1}
                              onChange={(event) =>
                                setQuantity(
                                  item.key,
                                  Number(event.target.value) || 1
                                )
                              }
                              type="number"
                              value={item.quantity}
                            />
                            <button
                              aria-label="Increase quantity"
                              className="grid h-8 w-8 place-items-center text-d1-steel transition hover:bg-d1-paper"
                              onClick={() =>
                                setQuantity(item.key, item.quantity + 1)
                              }
                              type="button"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <input
                            aria-label="Unit price"
                            className="h-8 w-24 border border-d1-line bg-white px-2 text-right text-sm font-semibold text-d1-ink outline-none focus:border-d1-ink"
                            min={0}
                            onChange={(event) =>
                              setUnitPrice(
                                item.key,
                                Number(event.target.value) || 0
                              )
                            }
                            step="0.01"
                            type="number"
                            value={item.unitPrice}
                          />
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                          {formatUsd(item.unitPrice * item.quantity)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            aria-label={`Remove ${item.title}`}
                            className="grid h-8 w-8 place-items-center border border-d1-line text-d1-steel transition hover:border-d1-red hover:text-d1-red"
                            onClick={() => removeItem(item.key)}
                            type="button"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminCard>
            ) : (
              <AdminCard className="px-6 py-12 text-center">
                <p className="text-sm font-bold text-d1-ink">
                  No items on this quote
                </p>
                <p className="mt-1 text-sm text-d1-steel">
                  Search the catalog above to build the estimate.
                </p>
              </AdminCard>
            )}

            <div className="mt-4 grid gap-px border border-d1-line bg-d1-line sm:grid-cols-3">
              {[
                { label: "Subtotal", value: subtotal },
                { label: "Estimated tax", value: tax },
                { label: "Quote total", value: total }
              ].map((row) => (
                <div className="bg-d1-card px-4 py-3" key={row.label}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                    {row.label}
                  </p>
                  <p className="mt-1 text-base font-extrabold text-d1-ink">
                    {formatUsd(row.value)}
                  </p>
                </div>
              ))}
            </div>
          </AdminSection>

          <AdminSection title="Notes">
            <textarea
              className={adminTextareaClass}
              onChange={(event) => setNoteBody(event.target.value)}
              placeholder="Internal notes shown on the printed quote"
              rows={4}
              value={noteBody}
            />
          </AdminSection>
        </div>

        {/* Right column */}
        <div className="grid gap-8 lg:col-span-4">
          <AdminSection title="Actions">
            <AdminCard className="grid gap-2 p-4">
              <button
                className="w-full bg-d1-ink px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy || !items.length || converted}
                onClick={handleConvert}
                type="button"
              >
                {converted ? "Already converted" : "Convert to order"}
              </button>
              <button
                className="w-full border border-d1-ink px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy}
                onClick={handleSaveDraft}
                type="button"
              >
                Save as draft
              </button>
              <button
                className="w-full border border-d1-pine px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-pine transition hover:bg-d1-pine hover:text-d1-paper disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy}
                onClick={handleSaveTemplate}
                type="button"
              >
                Save as template
              </button>
            </AdminCard>
          </AdminSection>

          <AdminSection title="Quote details">
            <AdminCard className="grid gap-4 p-4">
              <AdminField label="Quote name">
                <input
                  className={adminInputClass}
                  onChange={(event) => setName(event.target.value)}
                  value={name}
                />
              </AdminField>
              <AdminField label="Status">
                <select
                  className={adminInputClass}
                  onChange={(event) =>
                    setStatus(event.target.value as QuoteStatus)
                  }
                  value={status}
                >
                  {STATUS_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Terms">
                <select
                  className={adminInputClass}
                  onChange={(event) => setTerms(event.target.value)}
                  value={terms}
                >
                  {TERMS_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </AdminField>
            </AdminCard>
          </AdminSection>

          <AdminSection title="Customer">
            <AdminCard className="grid gap-4 p-4">
              <AdminField label="Account directory">
                <select
                  className={adminInputClass}
                  onChange={(event) =>
                    applyDirectoryCustomer(event.target.value)
                  }
                  value={customerId}
                >
                  <option value="">Manual entry</option>
                  {customerDirectory.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.company})
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Assign to registered account">
                <select
                  className={adminInputClass}
                  onChange={(event) => setSiteUserId(event.target.value)}
                  value={siteUserId}
                >
                  <option value="">Unassigned</option>
                  {siteUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.displayName}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Customer name">
                <input
                  className={adminInputClass}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Company or contact"
                  value={customerName}
                />
              </AdminField>
              <AdminField label="Email">
                <input
                  className={adminInputClass}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  placeholder="estimating@example.com"
                  type="email"
                  value={customerEmail}
                />
              </AdminField>
              <AdminField label="Billing address">
                <textarea
                  className={adminTextareaClass}
                  onChange={(event) => setBillingAddress(event.target.value)}
                  rows={2}
                  value={billingAddress}
                />
              </AdminField>
              <AdminField label="Jobsite address">
                <textarea
                  className={adminTextareaClass}
                  onChange={(event) => setJobsiteAddress(event.target.value)}
                  rows={2}
                  value={jobsiteAddress}
                />
              </AdminField>
            </AdminCard>
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
