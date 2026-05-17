"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Minus,
  Plus,
  Printer,
  Save,
  ShoppingCart,
  Trash2
} from "lucide-react";
import { Eyebrow, IndustrialPage, formatUsd } from "./kit";
import { useCartStore } from "@/lib/cart-store";
import { calculateTax } from "@/lib/tax";
import {
  composeQuoteNotes,
  convertQuoteToOrder,
  fetchQuote,
  quoteDisplayName,
  quoteNoteBody,
  saveQuote,
  type DbQuote,
  type DbQuoteItem
} from "./quote-data";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Customer quote detail. Loads a single DB quote,
 * lets the customer edit line items / fields, saves changes to the DB,
 * copies to cart, or converts the quote into a full order.
 * ------------------------------------------------------------------ */

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

const termsOptions = ["Due on receipt", "Net 15", "Net 30", "Net 45"];

type EditableItem = DbQuoteItem;

export function IndustrialQuoteDetail({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const addCartItem = useCartStore((state) => state.addItem);

  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [quote, setQuote] = useState<DbQuote | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [terms, setTerms] = useState("Due on receipt");
  const [status, setStatus] = useState<DbQuote["status"]>("draft");
  const [noteBody, setNoteBody] = useState("");
  const [items, setItems] = useState<EditableItem[]>([]);

  useEffect(() => {
    void useCartStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    let active = true;
    fetchQuote(quoteId).then((result) => {
      if (!active) return;
      setConfigured(result.configured);
      if (result.quote) {
        const q = result.quote;
        setQuote(q);
        setName(quoteDisplayName(q));
        setCustomerName(q.customerName);
        setCustomerEmail(q.customerEmail);
        setBillingAddress(q.billingAddress);
        setTerms(q.terms || "Due on receipt");
        setStatus(q.status);
        setNoteBody(quoteNoteBody(q));
        setItems(q.items);
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [quoteId]);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 3200);
    return () => window.clearTimeout(handle);
  }, [message]);

  const subtotal = useMemo(
    () =>
      items.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
    [items]
  );
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

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
              {configured
                ? "It may have been deleted."
                : "Quotes are not yet persisted — Supabase is not configured."}
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

  function updateQuantity(itemId: string, quantity: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  }

  function removeItem(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  async function handleSave(nextStatus?: DbQuote["status"]) {
    if (busy || !quote) return;
    setBusy(true);
    try {
      const effectiveStatus = nextStatus || status;
      const { quote: saved, persisted } = await saveQuote({
        id: quote.id,
        status: effectiveStatus,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        billingAddress,
        terms,
        notes: composeQuoteNotes(name, noteBody),
        subtotal,
        tax,
        total,
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
        return;
      }
      if (saved) {
        setQuote(saved);
        setItems(saved.items);
      }
      setStatus(effectiveStatus);
      setMessage("Quote saved.");
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
      // Persist current edits first so the conversion uses fresh data.
      await handleSave();
      const { orderId, orderNumber, persisted } = await convertQuoteToOrder(
        quote.id
      );
      if (!persisted) {
        setMessage("Supabase is not configured — could not convert the quote.");
        return;
      }
      setMessage(`Converted to order ${orderNumber || ""}.`.trim());
      if (orderId) {
        router.push("/industrial/account");
      }
    } finally {
      setBusy(false);
    }
  }

  function moveToCart() {
    items.forEach((item) =>
      addCartItem({
        productId: item.productId,
        variantId: item.variantId,
        title: item.title,
        sku: item.sku,
        image: "/assets/logo.svg",
        price: item.unitPrice,
        quantity: item.quantity,
        options: item.options || {}
      })
    );
    setMessage("Quote items copied to your cart.");
  }

  const converted = status === "converted" || Boolean(quote.convertedOrderId);

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
              {name || quoteDisplayName(quote)}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button
              className="flex items-center gap-2 border border-d1-ink bg-white px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy}
              onClick={() => handleSave()}
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
                    Quote name
                  </span>
                  <input
                    className="h-10 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) => setName(event.target.value)}
                    value={name}
                  />
                </label>
                <label className="mt-3 grid gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    Customer
                  </span>
                  <input
                    className="h-10 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) => setCustomerName(event.target.value)}
                    value={customerName}
                  />
                </label>
                <label className="mt-3 grid gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    Email
                  </span>
                  <input
                    className="h-10 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    type="email"
                    value={customerEmail}
                  />
                </label>
                <label className="mt-3 grid gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    Billing address
                  </span>
                  <textarea
                    className="min-h-16 resize-y border border-d1-line bg-white px-3 py-2 text-sm leading-relaxed text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) => setBillingAddress(event.target.value)}
                    value={billingAddress}
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
                    <dt className="text-d1-steel">Updated</dt>
                    <dd className="font-bold text-d1-ink">
                      {dateFormatter.format(new Date(quote.updatedAt))}
                    </dd>
                  </div>
                </dl>
                <label className="mt-3 grid gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    Terms
                  </span>
                  <select
                    className="h-10 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) => setTerms(event.target.value)}
                    value={terms}
                  >
                    {termsOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <div className="mt-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    Status
                  </span>
                  <p className="mt-1.5 inline-flex border border-d1-ink bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-ink">
                    {status}
                  </p>
                </div>
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
                      className="grid grid-cols-[1fr_auto] items-center gap-3 bg-white p-3"
                      key={item.id}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-d1-ink">
                          {item.title}
                        </p>
                        <p className="text-[12px] text-d1-steel">
                          SKU {item.sku} · {formatUsd(item.unitPrice)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-d1-ink">
                          <button
                            aria-label="Decrease quantity"
                            className="grid h-9 w-9 place-items-center text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
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
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            type="button"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="w-20 text-right text-sm font-extrabold text-d1-ink">
                          {formatUsd(item.unitPrice * item.quantity)}
                        </span>
                        <button
                          aria-label={`Remove ${item.title}`}
                          className="grid h-9 w-9 place-items-center border border-d1-line text-d1-steel transition hover:border-d1-red hover:text-d1-red"
                          onClick={() => removeItem(item.id)}
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
                <Plus className="h-3.5 w-3.5" /> Start a new quote
              </Link>
            </div>

            {/* Notes */}
            <div className="border border-d1-line bg-d1-card p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-d1-pine">
                Message on quote
              </p>
              <textarea
                className="mt-3 min-h-20 w-full resize-y border border-d1-line bg-white px-3 py-2 text-sm leading-relaxed text-d1-ink outline-none focus:border-d1-ink"
                onChange={(event) => setNoteBody(event.target.value)}
                value={noteBody}
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
                disabled={busy || !items.length || converted}
                onClick={handleConvert}
                type="button"
              >
                {converted ? "Already converted" : "Convert to order"}
              </button>
              <button
                className="mt-2 flex w-full items-center justify-center gap-2 border border-d1-ink px-5 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper disabled:cursor-not-allowed disabled:border-d1-line disabled:text-d1-steel"
                disabled={!items.length}
                onClick={moveToCart}
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
