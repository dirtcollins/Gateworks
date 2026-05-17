"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Mail,
  Minus,
  Plus,
  Printer,
  Save,
  ShoppingCart,
  Trash2
} from "lucide-react";
import { Eyebrow, IndustrialPage, formatUsd } from "./kit";
import { useQuoteStore } from "@/lib/quote-store";
import { useCartStore } from "@/lib/cart-store";
import { calculateTax } from "@/lib/tax";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Quote detail. Edit a single quote from
 * useQuoteStore: line items, customer fields, terms, status, and
 * actions (save, print, email, push to cart).
 * ------------------------------------------------------------------ */

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

const termsOptions = ["Due on receipt", "Net 15", "Net 30", "Net 45"];

export function IndustrialQuoteDetail({ quoteId }: { quoteId: string }) {
  const quotes = useQuoteStore((state) => state.quotes);
  const setActiveQuote = useQuoteStore((state) => state.setActiveQuote);
  const removeItem = useQuoteStore((state) => state.removeItem);
  const updateQuantity = useQuoteStore((state) => state.updateQuantity);
  const updateQuoteDetails = useQuoteStore((state) => state.updateQuoteDetails);
  const saveQuote = useQuoteStore((state) => state.saveQuote);
  const addCartItem = useCartStore((state) => state.addItem);

  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void useQuoteStore.persist.rehydrate();
    void useCartStore.persist.rehydrate();
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

  if (!ready) {
    return (
      <IndustrialPage>
        <div className="py-24 text-center text-sm font-bold text-d1-steel">
          Loading quote…
        </div>
      </IndustrialPage>
    );
  }

  if (!quote) {
    return (
      <IndustrialPage>
        <section className="py-20">
          <div className="mx-auto max-w-md border-2 border-d1-ink bg-white p-10 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-d1-ink">
              Quote not found
            </h1>
            <p className="mt-2 text-sm text-d1-steel">
              It may have been deleted or created in another browser.
            </p>
            <Link
              className="mt-6 inline-flex items-center gap-2 bg-d1-ink px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
              href="/industrial/quotes"
            >
              All quotes
            </Link>
          </div>
        </section>
      </IndustrialPage>
    );
  }

  const items = quote.items;
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  function updateField(details: Parameters<typeof updateQuoteDetails>[1]) {
    if (!quote) return;
    updateQuoteDetails(quote.id, details);
  }

  function emailQuote() {
    if (!quote) return;
    updateQuoteDetails(quote.id, { status: "sent" });
    const subject = encodeURIComponent(`${quote.quoteNumber} — ${quote.name}`);
    const body = encodeURIComponent(
      `${quote.customerName || "Customer"}\n${quote.quoteNumber}\nEstimated total: ${formatUsd(total)}`
    );
    window.location.href = `mailto:${quote.customerEmail || ""}?subject=${subject}&body=${body}`;
  }

  return (
    <IndustrialPage>
      <section className="py-8">
        <Link
          className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-d1-steel transition hover:text-d1-ink"
          href="/industrial/quotes"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All quotes
        </Link>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b-2 border-d1-ink pb-3">
          <div>
            <Eyebrow>{quote.quoteNumber}</Eyebrow>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-d1-ink sm:text-4xl">
              {quote.name}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              className="flex items-center gap-2 border border-d1-ink bg-white px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
              onClick={() => {
                saveQuote(quote.id);
                setMessage("Quote saved.");
              }}
              type="button"
            >
              <Save className="h-3.5 w-3.5" /> Save
            </button>
            <button
              className="flex items-center gap-2 border border-d1-ink bg-white px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
              onClick={() => window.print()}
              type="button"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button
              className="flex items-center gap-2 bg-d1-ink px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
              onClick={emailQuote}
              type="button"
            >
              <Mail className="h-3.5 w-3.5" /> Send
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-6">
            {/* Customer + terms */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="border border-d1-line bg-d1-card p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-d1-pine">
                  Bill to
                </p>
                <label className="mt-3 grid gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    Customer
                  </span>
                  <input
                    className="h-10 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) =>
                      updateField({
                        customerId: "",
                        customerName: event.target.value
                      })
                    }
                    value={quote.customerName}
                  />
                </label>
                <label className="mt-3 grid gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    Email
                  </span>
                  <input
                    className="h-10 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) =>
                      updateField({
                        customerId: "",
                        customerEmail: event.target.value
                      })
                    }
                    type="email"
                    value={quote.customerEmail}
                  />
                </label>
                <label className="mt-3 grid gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    Billing address
                  </span>
                  <textarea
                    className="min-h-16 resize-y border border-d1-line bg-white px-3 py-2 text-sm leading-relaxed text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) =>
                      updateField({
                        customerId: "",
                        billingAddress: event.target.value
                      })
                    }
                    value={quote.billingAddress}
                  />
                </label>
              </div>
              <div className="border border-d1-line bg-d1-card p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-d1-pine">
                  Quote details
                </p>
                <dl className="mt-3 grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-d1-steel">Created</dt>
                    <dd className="font-bold text-d1-ink">
                      {dateFormatter.format(new Date(quote.createdAt))}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-d1-steel">Due</dt>
                    <dd className="font-bold text-d1-ink">
                      {dateFormatter.format(
                        new Date(quote.dueAt || quote.expiresAt)
                      )}
                    </dd>
                  </div>
                </dl>
                <label className="mt-3 grid gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    Terms
                  </span>
                  <select
                    className="h-10 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) => updateField({ terms: event.target.value })}
                    value={quote.terms}
                  >
                    {termsOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label className="mt-3 grid gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    Status
                  </span>
                  <select
                    className="h-10 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) =>
                      updateField({
                        status: event.target.value as typeof quote.status
                      })
                    }
                    value={quote.status}
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="accepted">Accepted</option>
                    <option value="invoiced">Invoiced</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Line items */}
            <div className="border border-d1-line bg-d1-card p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-d1-pine">
                Line items
              </p>
              {items.length ? (
                <div className="mt-3 grid gap-px border border-d1-line bg-d1-line">
                  {items.map((item) => (
                    <div
                      className="grid grid-cols-[44px_1fr_auto] items-center gap-3 bg-white p-3"
                      key={item.variantId}
                    >
                      <span className="flex h-11 w-11 items-center justify-center border border-d1-line bg-white">
                        {item.image ? (
                          <Image
                            alt={item.title}
                            className="h-full w-full object-contain p-1.5"
                            height={80}
                            quality={45}
                            src={item.image}
                            width={80}
                          />
                        ) : (
                          <span className="text-xs font-black text-d1-line">GW</span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-d1-ink">
                          {item.title}
                        </p>
                        <p className="text-[12px] text-d1-steel">
                          SKU {item.sku} · {formatUsd(item.price)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-d1-ink">
                          <button
                            aria-label="Decrease quantity"
                            className="grid h-9 w-9 place-items-center text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                            onClick={() =>
                              updateQuantity(
                                quote.id,
                                item.variantId,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            type="button"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="grid h-9 w-10 place-items-center border-x border-d1-ink text-sm font-extrabold">
                            {item.quantity}
                          </span>
                          <button
                            aria-label="Increase quantity"
                            className="grid h-9 w-9 place-items-center text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                            onClick={() =>
                              updateQuantity(
                                quote.id,
                                item.variantId,
                                item.quantity + 1
                              )
                            }
                            type="button"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="w-20 text-right text-sm font-extrabold text-d1-ink">
                          {formatUsd(item.price * item.quantity)}
                        </span>
                        <button
                          aria-label={`Remove ${item.title}`}
                          className="grid h-9 w-9 place-items-center border border-d1-line text-d1-steel transition hover:border-d1-red hover:text-d1-red"
                          onClick={() => removeItem(quote.id, item.variantId)}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 border border-dashed border-d1-line bg-white px-3 py-10 text-center text-[13px] text-d1-steel">
                  No line items. Use the quote builder to add products.
                </p>
              )}
              <Link
                className="mt-3 inline-flex items-center gap-2 border border-d1-ink px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                href="/industrial/quote"
              >
                <Plus className="h-3.5 w-3.5" /> Add items in builder
              </Link>
            </div>

            {/* Notes */}
            <div className="border border-d1-line bg-d1-card p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-d1-pine">
                Message on quote
              </p>
              <textarea
                className="mt-3 min-h-20 w-full resize-y border border-d1-line bg-white px-3 py-2 text-sm leading-relaxed text-d1-ink outline-none focus:border-d1-ink"
                onChange={(event) => updateField({ notes: event.target.value })}
                value={quote.notes}
              />
            </div>
          </div>

          {/* Summary */}
          <aside className="h-fit">
            <div className="border-2 border-d1-ink bg-white p-5">
              <h2 className="text-lg font-extrabold tracking-tight text-d1-ink">
                Summary
              </h2>
              <dl className="mt-4 grid gap-2.5 border-t border-d1-line pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-d1-steel">Subtotal</dt>
                  <dd className="font-bold text-d1-ink">{formatUsd(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-d1-steel">Estimated tax</dt>
                  <dd className="font-bold text-d1-ink">{formatUsd(tax)}</dd>
                </div>
                <div className="flex items-end justify-between border-t-2 border-d1-ink pt-3">
                  <dt className="text-sm font-bold uppercase tracking-[0.1em] text-d1-ink">
                    Estimated total
                  </dt>
                  <dd className="text-2xl font-extrabold text-d1-ink">
                    {formatUsd(total)}
                  </dd>
                </div>
              </dl>
              <button
                className="mt-4 flex w-full items-center justify-center gap-2 bg-d1-ink px-5 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine disabled:cursor-not-allowed disabled:bg-d1-line disabled:text-d1-steel"
                disabled={!items.length}
                onClick={() => {
                  items.forEach((item) => addCartItem(item));
                  setMessage("Quote items copied to your cart.");
                }}
                type="button"
              >
                <ShoppingCart className="h-4 w-4" /> Move to cart
              </button>
              {message ? (
                <p className="mt-3 text-center text-[12px] font-bold text-d1-pine">
                  {message}
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </IndustrialPage>
  );
}
