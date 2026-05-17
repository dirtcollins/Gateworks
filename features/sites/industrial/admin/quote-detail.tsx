"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, Printer, Trash2 } from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminCard,
  AdminField,
  AdminPill,
  AdminSection,
  adminInputClass,
  adminTextareaClass
} from "@/features/sites/industrial/admin/kit";
import { useQuoteStore, type QuoteRecord } from "@/lib/quote-store";
import { calculateTax } from "@/lib/tax";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin quote detail. Reads + writes a single quote
 * in the real quote store: edit customer/terms, change status, adjust
 * line item quantities, and remove items.
 * ------------------------------------------------------------------ */

const STATUS_OPTIONS: QuoteRecord["status"][] = [
  "draft",
  "sent",
  "accepted",
  "invoiced"
];

const STATUS_TONE: Record<QuoteRecord["status"], "neutral" | "amber" | "pine" | "ink"> = {
  draft: "amber",
  sent: "neutral",
  accepted: "pine",
  invoiced: "ink"
};

const TERMS_OPTIONS = ["Due on receipt", "Net 15", "Net 30", "Net 45"];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

export function IndustrialAdminQuoteDetail({ quoteId }: { quoteId: string }) {
  const quotes = useQuoteStore((state) => state.quotes);
  const setActiveQuote = useQuoteStore((state) => state.setActiveQuote);
  const updateQuoteDetails = useQuoteStore(
    (state) => state.updateQuoteDetails
  );
  const updateQuantity = useQuoteStore((state) => state.updateQuantity);
  const removeItem = useQuoteStore((state) => state.removeItem);
  const saveQuote = useQuoteStore((state) => state.saveQuote);

  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void useQuoteStore.persist.rehydrate();
    setReady(true);
  }, []);

  const quote = useMemo(
    () => quotes.find((record) => record.id === quoteId),
    [quotes, quoteId]
  );

  useEffect(() => {
    if (quote) setActiveQuote(quote.id);
  }, [quote, setActiveQuote]);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 2600);
    return () => window.clearTimeout(handle);
  }, [message]);

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
              It may have been deleted or created in another browser.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const subtotal = quote.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;
  const unitCount = quote.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  function handleSave() {
    saveQuote(quote!.id);
    setMessage("Quote saved.");
  }

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
              <AdminPill tone={STATUS_TONE[quote.status]}>
                {quote.status}
              </AdminPill>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-d1-ink sm:text-4xl">
              {quote.name}
            </h1>
            <p className="mt-1 text-sm text-d1-steel">
              Due {dateFormatter.format(new Date(quote.dueAt || quote.expiresAt))}
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
              className="inline-flex items-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
              onClick={handleSave}
              type="button"
            >
              Save quote
            </button>
          </div>
        </div>
        {message ? (
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-d1-pine">
            {message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Line items */}
        <div className="grid gap-8 lg:col-span-8">
          <AdminSection title={`Line items (${unitCount} units)`}>
            {quote.items.length ? (
              <AdminCard className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
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
                    {quote.items.map((item) => (
                      <tr key={item.variantId}>
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
                                updateQuantity(
                                  quote.id,
                                  item.variantId,
                                  item.quantity - 1
                                )
                              }
                              type="button"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="grid h-8 w-12 place-items-center border-x border-d1-line text-sm font-bold text-d1-ink">
                              {item.quantity}
                            </span>
                            <button
                              aria-label="Increase quantity"
                              className="grid h-8 w-8 place-items-center text-d1-steel transition hover:bg-d1-paper"
                              onClick={() =>
                                updateQuantity(
                                  quote.id,
                                  item.variantId,
                                  item.quantity + 1
                                )
                              }
                              type="button"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm font-semibold text-d1-steel">
                          {formatUsd(item.price)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                          {formatUsd(item.price * item.quantity)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            aria-label={`Remove ${item.title}`}
                            className="grid h-8 w-8 place-items-center border border-d1-line text-d1-steel transition hover:border-d1-red hover:text-d1-red"
                            onClick={() =>
                              removeItem(quote.id, item.variantId)
                            }
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
                  Add products from the storefront catalog to build the
                  estimate.
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
              onChange={(event) =>
                updateQuoteDetails(quote.id, { notes: event.target.value })
              }
              placeholder="Internal notes shown on the printed quote"
              rows={4}
              value={quote.notes}
            />
          </AdminSection>
        </div>

        {/* Right column */}
        <div className="grid gap-8 lg:col-span-4">
          <AdminSection title="Quote details">
            <AdminCard className="grid gap-4 p-4">
              <AdminField label="Quote name">
                <input
                  className={adminInputClass}
                  onChange={(event) =>
                    updateQuoteDetails(quote.id, { name: event.target.value })
                  }
                  value={quote.name}
                />
              </AdminField>
              <AdminField label="Status">
                <select
                  className={adminInputClass}
                  onChange={(event) =>
                    updateQuoteDetails(quote.id, {
                      status: event.target.value as QuoteRecord["status"]
                    })
                  }
                  value={quote.status}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Terms">
                <select
                  className={adminInputClass}
                  onChange={(event) =>
                    updateQuoteDetails(quote.id, {
                      terms: event.target.value
                    })
                  }
                  value={quote.terms}
                >
                  {TERMS_OPTIONS.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </AdminField>
            </AdminCard>
          </AdminSection>

          <AdminSection title="Customer">
            <AdminCard className="grid gap-4 p-4">
              <AdminField label="Customer name">
                <input
                  className={adminInputClass}
                  onChange={(event) =>
                    updateQuoteDetails(quote.id, {
                      customerName: event.target.value
                    })
                  }
                  placeholder="Company or contact"
                  value={quote.customerName}
                />
              </AdminField>
              <AdminField label="Email">
                <input
                  className={adminInputClass}
                  onChange={(event) =>
                    updateQuoteDetails(quote.id, {
                      customerEmail: event.target.value
                    })
                  }
                  placeholder="estimating@example.com"
                  type="email"
                  value={quote.customerEmail}
                />
              </AdminField>
              <AdminField label="Billing address">
                <textarea
                  className={adminTextareaClass}
                  onChange={(event) =>
                    updateQuoteDetails(quote.id, {
                      billingAddress: event.target.value
                    })
                  }
                  rows={2}
                  value={quote.billingAddress}
                />
              </AdminField>
              <AdminField label="Jobsite address">
                <textarea
                  className={adminTextareaClass}
                  onChange={(event) =>
                    updateQuoteDetails(quote.id, {
                      jobsiteAddress: event.target.value
                    })
                  }
                  rows={2}
                  value={quote.jobsiteAddress}
                />
              </AdminField>
            </AdminCard>
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
