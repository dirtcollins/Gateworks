"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Minus, Plus, Search, Trash2 } from "lucide-react";
import { Eyebrow, IndustrialPage, formatUsd } from "./kit";
import { useCartStore } from "@/lib/cart-store";
import { useUserStore } from "@/lib/user-store";
import { products } from "@/lib/catalog";
import { customerDirectory, getCustomerById } from "@/lib/customers";
import { calculateTax } from "@/lib/tax";
import {
  composeQuoteNotes,
  saveQuote,
  type QuoteItemInput
} from "./quote-data";
import type { Product } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Customer quote builder. Builds a quote in local
 * draft state, then persists it to the DB (`/api/quotes`) scoped to
 * the signed-in account via `siteUserId`. Submitting sets status to
 * `sent`. Degrades gracefully when Supabase is not configured.
 * ------------------------------------------------------------------ */

type DraftItem = QuoteItemInput & {
  variantId: string;
  productId: string;
  sku: string;
  title: string;
  image: string;
  unitPrice: number;
  quantity: number;
};

function pickDefaultVariant(product: Product) {
  return (
    product.variants.find((variant) => variant.inventory === "in_stock") ||
    product.variants[0]
  );
}

export function IndustrialQuote() {
  const router = useRouter();
  const addCartItem = useCartStore((state) => state.addItem);
  const userId = useUserStore((state) => state.userId);
  const displayName = useUserStore((state) => state.displayName);
  const email = useUserStore((state) => state.email);

  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("New job quote");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [jobsiteAddress, setJobsiteAddress] = useState("");
  const [terms, setTerms] = useState("Due on receipt");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);

  useEffect(() => {
    void useCartStore.persist.rehydrate();
    setReady(true);
  }, []);

  // Prefill customer fields from the signed-in account.
  useEffect(() => {
    setCustomerName((current) =>
      current || (displayName && displayName !== "Guest" ? displayName : "")
    );
    setCustomerEmail((current) => current || email);
  }, [displayName, email]);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 3200);
    return () => window.clearTimeout(handle);
  }, [message]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products.slice(0, 6);
    return products
      .filter(
        (product) =>
          product.title.toLowerCase().includes(normalized) ||
          product.category.name.toLowerCase().includes(normalized) ||
          product.variants.some((variant) =>
            variant.sku.toLowerCase().includes(normalized)
          )
      )
      .slice(0, 12);
  }, [query]);

  const sortedCustomers = useMemo(
    () =>
      [...customerDirectory].sort((left, right) =>
        left.name.localeCompare(right.name)
      ),
    []
  );

  if (!ready) {
    return (
      <IndustrialPage>
        <div className="py-24 text-center text-sm font-bold text-d1-steel">
          Loading your quote…
        </div>
      </IndustrialPage>
    );
  }

  const subtotal = items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0
  );
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  function addCatalogItem(product: Product) {
    const variant = pickDefaultVariant(product);
    if (!variant) return;
    setItems((current) => {
      const existing = current.find(
        (item) => item.variantId === variant.id
      );
      if (existing) {
        return current.map((item) =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        {
          productId: product.id,
          variantId: variant.id,
          sku: variant.sku,
          title: product.title,
          image:
            variant.image || product.images[0]?.url || "/assets/logo.svg",
          unitPrice: variant.price,
          quantity: 1,
          options: variant.options
        },
        ...current
      ];
    });
    setMessage(`Added ${product.title} to the quote.`);
  }

  function updateQuantity(variantId: string, quantity: number) {
    setItems((current) =>
      current.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  }

  function removeItem(variantId: string) {
    setItems((current) =>
      current.filter((item) => item.variantId !== variantId)
    );
  }

  function applyCustomer(id: string) {
    setCustomerId(id);
    const customer = getCustomerById(id);
    if (!customer) return;
    setCustomerName(customer.name);
    setCustomerEmail(customer.email);
    setBillingAddress(customer.billingAddress);
    setJobsiteAddress(customer.jobsiteAddress);
    setTerms(customer.terms);
  }

  async function persist(status: "draft" | "sent") {
    if (busy) return;
    if (!items.length) {
      setMessage("Add at least one line item before saving.");
      return;
    }
    if (!customerName.trim()) {
      setMessage("Add a customer name before saving the quote.");
      return;
    }

    setBusy(true);
    try {
      const { quote, persisted } = await saveQuote({
        status,
        siteUserId: userId === "guest" ? null : userId,
        customerId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        billingAddress,
        jobsiteAddress,
        terms,
        notes: composeQuoteNotes(name, notes),
        subtotal,
        tax,
        total,
        createdBy: displayName || "Customer",
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
        setMessage(
          "Quotes are not yet persisted — Supabase is not configured. Your quote was not saved."
        );
        return;
      }

      if (quote?.id) {
        router.push(`/industrial/quotes/${quote.id}`);
        return;
      }
      setMessage(
        status === "sent"
          ? "Quote request submitted. Our team will follow up with pricing."
          : "Quote saved."
      );
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
        image: item.image,
        price: item.unitPrice,
        quantity: item.quantity,
        options: item.options || {}
      })
    );
    setMessage("Quote line items copied to your cart.");
  }

  return (
    <IndustrialPage>
      <section className="py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-d1-ink pb-3">
          <div>
            <Eyebrow>Trade desk</Eyebrow>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-d1-ink sm:text-4xl">
              Build a quote
            </h1>
          </div>
          <Link
            className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-d1-pine hover:underline"
            href="/industrial/quotes"
          >
            All quotes <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="grid gap-6">
            {/* Quote header */}
            <div className="border border-d1-line bg-d1-card p-5">
              <label className="grid gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                  Quote name
                </span>
                <input
                  className="h-11 border border-d1-line bg-white px-3 text-base font-bold text-d1-ink outline-none focus:border-d1-ink"
                  onChange={(event) => setName(event.target.value)}
                  value={name}
                />
              </label>
            </div>

            {/* Quick add */}
            <div className="border border-d1-line bg-d1-card p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-d1-pine">
                Add line items
              </p>
              <div className="mt-3 flex items-center gap-2 border border-d1-line bg-white px-3">
                <Search className="h-4 w-4 text-d1-steel" />
                <input
                  className="h-11 w-full bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products by name or SKU"
                  value={query}
                />
              </div>
              <div className="mt-3 grid max-h-80 gap-px overflow-y-auto border border-d1-line bg-d1-line">
                {results.length ? (
                  results.map((product) => {
                    const variant = pickDefaultVariant(product);
                    if (!variant) return null;
                    const image =
                      variant.image ||
                      product.images[0]?.url ||
                      "/assets/logo.svg";
                    return (
                      <button
                        className="grid grid-cols-[44px_1fr_auto] items-center gap-3 bg-white px-3 py-2.5 text-left transition hover:bg-d1-card"
                        key={product.id}
                        onClick={() => addCatalogItem(product)}
                        type="button"
                      >
                        <span className="flex h-11 w-11 items-center justify-center border border-d1-line bg-white">
                          <Image
                            alt={product.title}
                            className="h-full w-full object-contain p-1.5"
                            height={80}
                            quality={45}
                            src={image}
                            width={80}
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-d1-ink">
                            {product.title}
                          </span>
                          <span className="block truncate text-[12px] text-d1-steel">
                            SKU {variant.sku}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-d1-ink">
                            {variant.price > 0
                              ? formatUsd(variant.price)
                              : "Quote"}
                          </span>
                          <span className="grid h-7 w-7 place-items-center bg-d1-ink text-d1-paper">
                            <Plus className="h-3.5 w-3.5" />
                          </span>
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="bg-white px-3 py-6 text-center text-[13px] text-d1-steel">
                    No products match that search.
                  </p>
                )}
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
                      key={item.variantId}
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
                              updateQuantity(item.variantId, item.quantity - 1)
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
                              updateQuantity(item.variantId, item.quantity + 1)
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
                          onClick={() => removeItem(item.variantId)}
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
                  No line items yet. Search above to add products.
                </p>
              )}
            </div>

            {/* Customer details */}
            <div className="border border-d1-line bg-d1-card p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-d1-pine">
                Customer
              </p>
              <label className="mt-3 grid gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                  Account
                </span>
                <select
                  className="h-11 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                  onChange={(event) => applyCustomer(event.target.value)}
                  value={customerId}
                >
                  <option value="">Manual entry</option>
                  {sortedCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.company})
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    Customer name
                  </span>
                  <input
                    className="h-11 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) => {
                      setCustomerId("");
                      setCustomerName(event.target.value);
                    }}
                    value={customerName}
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    Email
                  </span>
                  <input
                    className="h-11 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) => {
                      setCustomerId("");
                      setCustomerEmail(event.target.value);
                    }}
                    type="email"
                    value={customerEmail}
                  />
                </label>
              </div>
              <label className="mt-3 grid gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                  Jobsite or delivery address
                </span>
                <textarea
                  className="min-h-20 resize-y border border-d1-line bg-white px-3 py-2 text-sm leading-relaxed text-d1-ink outline-none focus:border-d1-ink"
                  onChange={(event) => setJobsiteAddress(event.target.value)}
                  value={jobsiteAddress}
                />
              </label>
              <label className="mt-3 grid gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                  Notes
                </span>
                <textarea
                  className="min-h-16 resize-y border border-d1-line bg-white px-3 py-2 text-sm leading-relaxed text-d1-ink outline-none focus:border-d1-ink"
                  onChange={(event) => setNotes(event.target.value)}
                  value={notes}
                />
              </label>
            </div>
          </div>

          {/* Summary */}
          <aside className="h-fit">
            <div className="border-2 border-d1-ink bg-white p-5">
              <h2 className="text-lg font-extrabold tracking-tight text-d1-ink">
                Quote summary
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
                className="mt-4 flex w-full items-center justify-center bg-d1-ink px-5 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine disabled:cursor-not-allowed disabled:bg-d1-line disabled:text-d1-steel"
                disabled={busy}
                onClick={() => persist("sent")}
                type="button"
              >
                {busy ? "Saving…" : "Submit quote request"}
              </button>
              <button
                className="mt-2 flex w-full items-center justify-center border border-d1-ink px-5 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper disabled:cursor-not-allowed disabled:border-d1-line disabled:text-d1-steel"
                disabled={busy}
                onClick={() => persist("draft")}
                type="button"
              >
                Save draft
              </button>
              <button
                className="mt-2 flex w-full items-center justify-center border border-d1-ink px-5 py-3 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper disabled:cursor-not-allowed disabled:border-d1-line disabled:text-d1-steel"
                disabled={!items.length}
                onClick={moveToCart}
                type="button"
              >
                Move to cart
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
