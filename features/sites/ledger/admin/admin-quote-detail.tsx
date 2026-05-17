"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileX,
  LayoutTemplate,
  Minus,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import { LEDGER, formatUsd } from "@/features/sites/ledger/kit";
import {
  catalogItemToQuoteInput,
  formatLedgerDate,
  pickVariant,
  searchCatalog
} from "@/features/sites/ledger/quote-helpers";
import { customerDirectory, getCustomerById } from "@/lib/customers";
import { calculateTax } from "@/lib/tax";
import {
  convertQuoteToOrder,
  fetchQuote,
  saveQuote,
  type DbQuote,
  type QuoteInput,
  type QuoteItemInput,
  type QuoteStatus
} from "@/lib/quotes-data";
import {
  AdminCard,
  AdminGhostButton,
  AdminHeading,
  AdminPrimaryButton,
  StatusPill,
  titleCase
} from "./admin-kit";

const STATUS_FLOW: QuoteStatus[] = [
  "draft",
  "sent",
  "accepted",
  "invoiced",
  "converted"
];

function quoteStatusTone(
  status: QuoteStatus
): "indigo" | "amber" | "mint" {
  if (status === "draft") return "amber";
  if (status === "sent") return "indigo";
  return "mint";
}

type SiteUser = { id: string; displayName: string; lastUsedAt: string };

type WorkingItem = {
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  options?: Record<string, string | undefined>;
  quantity: number;
  unitPrice: number;
};

function toWorkingItems(quote: DbQuote): WorkingItem[] {
  return quote.items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    sku: item.sku,
    title: item.title,
    options: item.options,
    quantity: item.quantity,
    unitPrice: item.unitPrice
  }));
}

/* Ledger admin quote detail — DB-backed. Edit line items, customer /
 * terms / notes, advance status, save as draft, save as a reusable
 * template, assign the quote to a registered account, and convert to a
 * full order. */
export function LedgerAdminQuoteDetail({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [quote, setQuote] = useState<DbQuote | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [siteUsers, setSiteUsers] = useState<SiteUser[]>([]);

  const [items, setItems] = useState<WorkingItem[]>([]);
  const [status, setStatus] = useState<QuoteStatus>("draft");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [jobsiteAddress, setJobsiteAddress] = useState("");
  const [terms, setTerms] = useState("Net 30");
  const [notes, setNotes] = useState("");
  const [siteUserId, setSiteUserId] = useState("");
  const [templateName, setTemplateName] = useState("");

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const hydrateFrom = useCallback((next: DbQuote) => {
    setQuote(next);
    setItems(toWorkingItems(next));
    setStatus(next.status);
    setCustomerId(next.customerId);
    setCustomerName(next.customerName);
    setCustomerEmail(next.customerEmail);
    setBillingAddress(next.billingAddress);
    setJobsiteAddress(next.jobsiteAddress);
    setTerms(next.terms || "Net 30");
    setNotes(next.notes);
    setSiteUserId(next.siteUserId ?? "");
    setTemplateName(next.templateName);
  }, []);

  useEffect(() => {
    let active = true;
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
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/site-users", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { users?: SiteUser[] };
        if (active && payload.users) setSiteUsers(payload.users);
      } catch {
        /* directory still works without registered users */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 2800);
    return () => window.clearTimeout(handle);
  }, [message]);

  const results = useMemo(() => searchCatalog(search), [search]);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items]
  );
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;
  const locked = status === "converted";

  function buildInput(overrides: Partial<QuoteInput> = {}): QuoteInput {
    return {
      id: quote?.id,
      status,
      isTemplate: quote?.isTemplate ?? false,
      templateName,
      siteUserId: siteUserId || null,
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
      createdBy: quote?.createdBy || "Operations",
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
        result.persisted
          ? note
          : "Saved locally — quote database not configured."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveTemplate() {
    const name =
      templateName.trim() ||
      window.prompt("Template name", customerName || "Quote template") ||
      "";
    if (!name.trim()) return;
    setTemplateName(name.trim());
    await persist(
      { isTemplate: true, templateName: name.trim() },
      "Saved as a reusable template."
    );
  }

  async function handleConvert() {
    if (!quote || busy) return;
    setBusy(true);
    try {
      const saved = await saveQuote(buildInput());
      if (saved.quote) hydrateFrom(saved.quote);
      const result = await convertQuoteToOrder(quote.id);
      if (result.persisted && result.orderId) {
        setMessage(`Converted to order ${result.orderNumber ?? ""}.`);
        const refreshed = await fetchQuote(quote.id);
        if (refreshed.quote) hydrateFrom(refreshed.quote);
      } else {
        setMessage(
          "Conversion is not available — quote database not configured."
        );
      }
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

  if (loaded && !quote) {
    return (
      <div className="grid gap-6">
        <AdminHeading eyebrow="Operations" title="Quote detail" />
        <AdminCard className="px-5 py-16 text-center">
          <FileX className="mx-auto h-10 w-10" style={{ color: LEDGER.muted }} />
          <p
            className="mt-3 text-sm font-semibold"
            style={{ color: LEDGER.ink }}
          >
            {configured ? "Quote not found" : "Quote database not configured"}
          </p>
          <Link
            className="mt-4 inline-block text-[13px] font-semibold transition hover:underline"
            href="/ledger/admin/quotes"
            style={{ color: LEDGER.indigo }}
          >
            Back to quotes
          </Link>
        </AdminCard>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="grid gap-6">
        <AdminHeading eyebrow="Operations" title="Quote detail" />
        <AdminCard className="px-5 py-16 text-center">
          <p className="text-sm font-semibold" style={{ color: LEDGER.muted }}>
            Loading quote…
          </p>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Link
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition hover:underline"
        href="/ledger/admin/quotes"
        style={{ color: LEDGER.muted }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All quotes
      </Link>

      <AdminHeading
        eyebrow="Quote"
        title={quote.quoteNumber}
        description={`Created ${formatLedgerDate(quote.createdAt)} · ${
          customerName || "No customer"
        }`}
        action={
          <div className="flex flex-wrap gap-2">
            <AdminGhostButton disabled={busy} onClick={handleSaveTemplate}>
              <LayoutTemplate className="h-4 w-4" /> Save as template
            </AdminGhostButton>
            <AdminGhostButton
              disabled={busy}
              onClick={() => persist({}, "Quote saved as draft.")}
            >
              Save draft
            </AdminGhostButton>
            {!locked ? (
              <AdminPrimaryButton disabled={busy} onClick={handleConvert}>
                <ArrowRight className="h-4 w-4" /> Convert to order
              </AdminPrimaryButton>
            ) : null}
          </div>
        }
      />

      {!configured ? (
        <div
          className="rounded-xl px-4 py-3 text-[12px] font-semibold"
          style={{ backgroundColor: LEDGER.amberSoft, color: LEDGER.amber }}
        >
          The quote database is not configured. Changes are not persisted.
        </div>
      ) : null}
      {message ? (
        <div
          className="flex items-center gap-1.5 rounded-xl px-4 py-3 text-[12px] font-semibold"
          style={{ backgroundColor: LEDGER.mintSoft, color: LEDGER.mint }}
        >
          <CheckCircle2 className="h-4 w-4" /> {message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: line items */}
        <div className="grid gap-4">
          <AdminCard>
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${LEDGER.line}` }}
            >
              <p
                className="text-[13px] font-semibold"
                style={{ color: LEDGER.ink }}
              >
                Line items ({items.length})
              </p>
              <div className="flex items-center gap-2">
                <StatusPill tone={quoteStatusTone(status)}>
                  {titleCase(status)}
                </StatusPill>
                {!locked ? (
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition"
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
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                          style={{ backgroundColor: LEDGER.canvas }}
                        >
                          <Image
                            alt={product.title}
                            className="h-full w-full object-contain p-1.5"
                            height={80}
                            quality={75}
                            src={
                              variant.image ||
                              product.images[0]?.url ||
                              "/assets/logo.svg"
                            }
                            width={80}
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
                    className="grid gap-2 px-5 py-3 sm:grid-cols-[1.5fr_auto_auto] sm:items-center"
                    style={{ borderBottom: `1px solid ${LEDGER.line}` }}
                  >
                    <div className="min-w-0">
                      <p
                        className="truncate text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {item.title}
                      </p>
                      <p
                        className="text-[11px] font-medium"
                        style={{ color: LEDGER.muted }}
                      >
                        {item.sku} · {formatUsd(item.unitPrice)} each
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1 rounded-lg p-0.5 sm:justify-self-end"
                      style={{ border: `1px solid ${LEDGER.line}` }}
                    >
                      <button
                        aria-label="Decrease quantity"
                        className="grid h-6 w-6 place-items-center rounded-md disabled:opacity-40"
                        disabled={locked}
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity - 1)
                        }
                        style={{ color: LEDGER.body }}
                        type="button"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span
                        className="w-8 text-center text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        aria-label="Increase quantity"
                        className="grid h-6 w-6 place-items-center rounded-md disabled:opacity-40"
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
                    <div className="flex items-center justify-between gap-3 sm:justify-self-end">
                      <span
                        className="text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {formatUsd(item.unitPrice * item.quantity)}
                      </span>
                      {!locked ? (
                        <button
                          aria-label="Remove line"
                          className="grid h-7 w-7 place-items-center rounded-lg transition"
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
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="px-5 py-10 text-center text-[13px]"
                style={{ color: LEDGER.body }}
              >
                This quote has no line items yet.
              </p>
            )}
            <div className="grid gap-1.5 px-5 py-4 text-[13px]">
              <Row label="Subtotal" value={formatUsd(subtotal)} />
              <Row label="Tax" value={formatUsd(tax)} />
              <div
                className="mt-1 flex items-center justify-between pt-2"
                style={{ borderTop: `1px solid ${LEDGER.line}` }}
              >
                <span
                  className="text-[14px] font-semibold"
                  style={{ color: LEDGER.ink }}
                >
                  Quote total
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

          {/* Notes */}
          <AdminCard className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Internal notes
            </p>
            <textarea
              className="mt-2 w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
              disabled={locked}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
              value={notes}
            />
          </AdminCard>
        </div>

        {/* Right: status + details */}
        <div className="grid gap-4">
          <AdminCard className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Quote status
            </p>
            <div className="mt-3 grid gap-1.5">
              {STATUS_FLOW.map((flowStatus) => {
                const active = status === flowStatus;
                return (
                  <button
                    key={flowStatus}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-semibold transition disabled:opacity-50"
                    disabled={locked || flowStatus === "converted"}
                    onClick={() => setStatus(flowStatus)}
                    style={{
                      backgroundColor: active ? LEDGER.indigo : LEDGER.canvas,
                      color: active ? "#ffffff" : LEDGER.body
                    }}
                    type="button"
                  >
                    {titleCase(flowStatus)}
                    {active ? <span className="text-[11px]">Current</span> : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px]" style={{ color: LEDGER.muted }}>
              &ldquo;Converted&rdquo; is set automatically by Convert to order.
            </p>
          </AdminCard>

          <AdminCard className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Assign to account
            </p>
            <select
              className="mt-2 w-full rounded-xl px-3 py-2.5 text-[13px] outline-none"
              disabled={locked}
              onChange={(event) => setSiteUserId(event.target.value)}
              style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
              value={siteUserId}
            >
              <option value="">Unassigned</option>
              {siteUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.displayName}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[11px]" style={{ color: LEDGER.muted }}>
              The quote appears in this customer&apos;s account quote list.
            </p>
          </AdminCard>

          <AdminCard className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Quote details
            </p>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1">
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: LEDGER.body }}
                >
                  Customer directory
                </span>
                <select
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  disabled={locked}
                  onChange={(event) => applyCustomer(event.target.value)}
                  style={{
                    border: `1px solid ${LEDGER.line}`,
                    color: LEDGER.ink
                  }}
                  value={customerId ?? ""}
                >
                  <option value="">Manual entry</option>
                  {customerDirectory.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.company}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: LEDGER.body }}
                >
                  Customer name
                </span>
                <input
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  disabled={locked}
                  onChange={(event) => {
                    setCustomerId("");
                    setCustomerName(event.target.value);
                  }}
                  style={{
                    border: `1px solid ${LEDGER.line}`,
                    color: LEDGER.ink
                  }}
                  value={customerName}
                />
              </label>
              <label className="grid gap-1">
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: LEDGER.body }}
                >
                  Customer email
                </span>
                <input
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  disabled={locked}
                  onChange={(event) => {
                    setCustomerId("");
                    setCustomerEmail(event.target.value);
                  }}
                  style={{
                    border: `1px solid ${LEDGER.line}`,
                    color: LEDGER.ink
                  }}
                  value={customerEmail}
                />
              </label>
              <label className="grid gap-1">
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: LEDGER.body }}
                >
                  Terms
                </span>
                <input
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  disabled={locked}
                  onChange={(event) => setTerms(event.target.value)}
                  style={{
                    border: `1px solid ${LEDGER.line}`,
                    color: LEDGER.ink
                  }}
                  value={terms}
                />
              </label>
              <label className="grid gap-1">
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: LEDGER.body }}
                >
                  Jobsite address
                </span>
                <input
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  disabled={locked}
                  onChange={(event) => setJobsiteAddress(event.target.value)}
                  style={{
                    border: `1px solid ${LEDGER.line}`,
                    color: LEDGER.ink
                  }}
                  value={jobsiteAddress}
                />
              </label>
            </div>
            <p className="mt-3 text-[12px]" style={{ color: LEDGER.muted }}>
              Updated {formatLedgerDate(quote.updatedAt)}
              {quote.convertedOrderId
                ? " · Converted to an order"
                : ""}
            </p>
            <button
              className="mt-3 text-[11px] font-medium"
              onClick={() => router.refresh()}
              style={{ color: LEDGER.muted }}
              type="button"
            >
              Refresh
            </button>
          </AdminCard>
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
