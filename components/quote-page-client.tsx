"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Mail,
  MapPin,
  Printer,
  Share2,
  ShoppingCart,
  Trash2,
  Truck
} from "lucide-react";
import { QuantitySelector } from "@/components/quantity-selector";
import { useCartStore } from "@/lib/cart-store";
import { products } from "@/lib/catalog";
import { useQuoteStore } from "@/lib/quote-store";
import { cn, formatCurrency } from "@/lib/utils";

const taxRate = 0.0825;

type QuotePageClientProps = {
  quoteId: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric"
});

function formatDate(date: string) {
  return dateFormatter.format(new Date(date));
}

function getQuoteItemProductSlug(item: { productId: string; variantId: string; sku: string }) {
  return (
    products.find(
      (product) =>
        product.id === item.productId ||
        product.slug === item.productId ||
        product.variants.some(
          (variant) => variant.id === item.variantId || variant.sku === item.sku
        )
    )?.slug || item.productId
  );
}

export function QuotePageClient({ quoteId }: QuotePageClientProps) {
  const [actionMessage, setActionMessage] = useState("");
  const { quotes, removeItem, updateQuantity, clearQuote, setActiveQuote } =
    useQuoteStore();
  const addCartItem = useCartStore((state) => state.addItem);
  const quote = quotes.find((quoteRecord) => quoteRecord.id === quoteId);
  const items = quote?.items || [];
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const estimatedTax = subtotal * taxRate;
  const deliveryFee = subtotal >= 100 || subtotal === 0 ? 0 : 14.95;
  const total = subtotal + estimatedTax + deliveryFee;
  const totalQuantity = items.reduce((totalItems, item) => totalItems + item.quantity, 0);

  if (!quote) {
    return (
      <main className="mx-auto grid min-h-[520px] max-w-[900px] place-items-center px-4 py-12 text-center">
        <div className="border border-jobsite-rail bg-white p-10">
          <div className="mx-auto grid size-14 place-items-center border border-jobsite-rail bg-jobsite-paper text-jobsite-ink">
            <FileText size={25} />
          </div>
          <h1 className="mt-5 text-3xl font-black text-jobsite-ink">
            Quote not found
          </h1>
          <p className="mt-2 text-sm font-semibold text-jobsite-steel">
            This quote may have been deleted or created in another browser.
          </p>
          <Link
            className="truewerk-cta mt-5 inline-flex h-12 items-center justify-center bg-jobsite-ink px-6 text-sm font-black uppercase tracking-[0.1em] text-white"
            href="/quotes"
          >
            <span>View all quotes</span>
          </Link>
        </div>
      </main>
    );
  }

  const currentQuote = quote;
  const quoteDate = formatDate(currentQuote.createdAt);
  const expirationDate = formatDate(currentQuote.expiresAt);

  function addQuoteToCart() {
    items.forEach((item) => addCartItem(item));
    setActiveQuote(currentQuote.id);
    showActionMessage("Quote items added to cart.");
  }

  function showActionMessage(message: string) {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(""), 2400);
  }

  function printQuote() {
    window.print();
  }

  async function shareQuote() {
    const quoteUrl = window.location.href;

    try {
      await navigator.clipboard.writeText(quoteUrl);
      showActionMessage("Quote link copied.");
    } catch {
      showActionMessage("Quote link could not be copied.");
    }
  }

  function emailQuote() {
    const subject = encodeURIComponent(`${currentQuote.name} - ${currentQuote.quoteNumber}`);
    const body = encodeURIComponent(
      `${currentQuote.name}\nQuote ${currentQuote.quoteNumber}\nEstimated total: ${formatCurrency(total)}\n${window.location.href}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <main className="bg-jobsite-paper">
      <section className="border-b border-jobsite-rail bg-white">
        <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-jobsite-steel">
              <Link className="hover:text-jobsite-ink" href="/">
                Products
              </Link>
              <span>/</span>
              <Link className="hover:text-jobsite-ink" href="/quotes">
                Job Quotes
              </Link>
              <span>/</span>
              <span>{currentQuote.quoteNumber}</span>
            </div>
            <h1 className="mt-3 text-3xl font-black text-jobsite-ink md:text-5xl">
              {currentQuote.name}
            </h1>
            <p className="mt-2 text-lg font-black text-jobsite-steel">
              Quote {currentQuote.quoteNumber}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
              <span className="inline-flex items-center gap-2 border border-jobsite-pine bg-white px-3 py-2 text-jobsite-pine">
                <CheckCircle2 size={17} />
                Ready for purchase
              </span>
              <span className="inline-flex items-center gap-2 border border-jobsite-rail bg-jobsite-paper px-3 py-2 text-jobsite-steel">
                <CalendarDays size={17} />
                Expires {expirationDate}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 border border-jobsite-rail bg-white px-4 text-sm font-black text-jobsite-ink transition hover:border-jobsite-ink"
              type="button"
              onClick={printQuote}
            >
              <Printer size={18} />
              Print
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 border border-jobsite-rail bg-white px-4 text-sm font-black text-jobsite-ink transition hover:border-jobsite-ink"
              type="button"
              onClick={printQuote}
            >
              <Download size={18} />
              PDF
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 border border-jobsite-rail bg-white px-4 text-sm font-black text-jobsite-ink transition hover:border-jobsite-ink"
              type="button"
              onClick={shareQuote}
            >
              <Share2 size={18} />
              Share
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1500px] items-start gap-5 px-4 py-6 xl:grid-cols-[1fr_390px]">
        <div className="grid content-start gap-5">
          <div className="grid items-start gap-4 lg:grid-cols-3">
            <SummaryTile
              icon={<FileText size={20} />}
              label="Quote created"
              value={quoteDate}
            />
            <SummaryTile
              icon={<Building2 size={20} />}
              label="Customer"
              value="Bakersfield Store Account"
            />
            <SummaryTile
              icon={<Truck size={20} />}
              label="Fulfillment"
              value="Pickup or delivery"
            />
          </div>

          <section className="border border-jobsite-rail bg-white">
            <div className="flex flex-col gap-3 border-b border-jobsite-rail p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-jobsite-steel">
                  Line Items
                </p>
                <h2 className="mt-1 text-2xl font-black text-jobsite-ink">
                  {items.length ? `${items.length} products in quote` : "No products in quote"}
                </h2>
              </div>
              {items.length ? (
                <button
                  className="h-10 border border-jobsite-rail bg-white px-4 text-sm font-black text-jobsite-ink transition hover:border-red-700 hover:text-red-700"
                  type="button"
                  onClick={() => clearQuote(currentQuote.id)}
                >
                  Clear quote
                </button>
              ) : null}
            </div>

            {!items.length ? (
              <div className="grid place-items-center p-10 text-center">
                <div className="grid size-14 place-items-center border border-jobsite-rail bg-jobsite-paper text-jobsite-ink">
                  <FileText size={25} />
                </div>
                <p className="mt-4 text-lg font-black text-jobsite-ink">
                  Your quote is empty.
                </p>
                <p className="mt-2 max-w-md text-sm font-semibold text-jobsite-steel">
                  Add products from a product page to build a contractor quote, then
                  return here to adjust quantities and send it to cart.
                </p>
                <Link
                  className="truewerk-cta mt-5 inline-flex h-12 items-center justify-center bg-jobsite-ink px-6 text-sm font-black uppercase tracking-[0.1em] text-white"
                  href="/"
                >
                  <span>Browse products</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-jobsite-rail">
                {items.map((item) => {
                  const itemTotal = item.price * item.quantity;
                  const productSlug = getQuoteItemProductSlug(item);

                  return (
                    <article
                      key={item.variantId}
                      className="grid gap-4 p-4 transition hover:bg-jobsite-paper lg:grid-cols-[112px_1fr_auto]"
                    >
                      <Link
                        aria-label={`Open ${item.title}`}
                        className="relative aspect-square border border-jobsite-rail bg-white"
                        href={`/products/${productSlug}`}
                      >
                        <Image
                          alt={item.title}
                          className="object-contain p-2"
                          fill
                          sizes="112px"
                          src={item.image}
                        />
                      </Link>
                      <Link
                        className="min-w-0 underline-offset-4 hover:underline"
                        href={`/products/${productSlug}`}
                      >
                        <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-jobsite-steel">
                          <span>SKU {item.sku}</span>
                          <span className="text-jobsite-rail">|</span>
                          <span>Vendor direct</span>
                        </div>
                        <h3 className="mt-2 text-lg font-black text-jobsite-ink">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm font-semibold capitalize text-jobsite-steel">
                          {Object.entries(item.options)
                            .filter(([, value]) => Boolean(value))
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(" / ")}
                        </p>
                        <div className="mt-4 grid gap-2 text-sm font-bold text-jobsite-steel sm:grid-cols-3">
                          <span className="inline-flex items-center gap-2">
                            <CheckCircle2 size={17} className="text-jobsite-pine" />
                            In stock
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <MapPin size={17} />
                            Bakersfield
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Truck size={17} />
                            Delivery available
                          </span>
                        </div>
                      </Link>
                      <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center lg:min-w-[260px] lg:grid-cols-1 lg:justify-items-end">
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-bold text-jobsite-steel">
                            Unit price
                          </p>
                          <p className="text-xl font-black text-jobsite-ink">
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                        <QuantitySelector
                          value={item.quantity}
                          onChange={(quantity) =>
                            updateQuantity(currentQuote.id, item.variantId, quantity)
                          }
                        />
                        <div className="flex items-center justify-between gap-3 sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p className="text-sm font-bold text-jobsite-steel">
                              Line total
                            </p>
                            <p className="text-xl font-black text-jobsite-ink">
                              {formatCurrency(itemTotal)}
                            </p>
                          </div>
                          <button
                            aria-label={`Remove ${item.title}`}
                            className="grid size-11 place-items-center border border-jobsite-rail text-jobsite-steel transition hover:border-red-700 hover:text-red-700"
                            type="button"
                            onClick={() => removeItem(currentQuote.id, item.variantId)}
                          >
                            <Trash2 size={19} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="grid h-fit gap-5">
          <section className="border border-jobsite-rail bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-jobsite-steel">
              Quote Summary
            </p>
            <h2 className="mt-1 text-2xl font-black text-jobsite-ink">
              Estimated Total
            </h2>
            <dl className="mt-5 grid gap-3 text-sm font-bold">
              <SummaryRow label={`${totalQuantity} items`} value={formatCurrency(subtotal)} />
              <SummaryRow label="Estimated tax" value={formatCurrency(estimatedTax)} />
              <SummaryRow
                label="Delivery"
                value={deliveryFee ? formatCurrency(deliveryFee) : "Free"}
              />
              <div className="mt-2 flex items-center justify-between border-t border-jobsite-rail pt-4">
                <dt className="text-base font-black text-jobsite-ink">Total</dt>
                <dd className="text-3xl font-black text-jobsite-ink">
                  {formatCurrency(total)}
                </dd>
              </div>
            </dl>
            <button
              className={cn(
                "truewerk-cta mt-5 flex h-12 w-full items-center justify-center gap-2 bg-jobsite-ink px-5 text-sm font-black uppercase tracking-[0.1em] text-white transition active:scale-[0.98]",
                !items.length && "cursor-not-allowed opacity-50"
              )}
              disabled={!items.length}
              type="button"
              onClick={addQuoteToCart}
            >
              <span className="inline-flex items-center gap-2">
                <ShoppingCart size={19} />
                Add quote to cart
              </span>
            </button>
            <button
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 border border-jobsite-ink bg-white px-5 text-sm font-black uppercase tracking-[0.1em] text-jobsite-ink transition hover:bg-jobsite-paper disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!items.length}
              type="button"
              onClick={emailQuote}
            >
              <Mail size={18} />
              Email quote
            </button>
            <div
              aria-live="polite"
              className={cn(
                "mt-3 text-center text-xs font-black text-jobsite-pine transition",
                actionMessage ? "opacity-100" : "opacity-0"
              )}
            >
              {actionMessage || "Quote action ready"}
            </div>
          </section>

          <section className="border border-jobsite-rail bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-jobsite-steel">
              Fulfillment
            </p>
            <div className="mt-4 grid gap-3">
              <button
                className="border-2 border-jobsite-ink bg-jobsite-amber p-4 text-left"
                type="button"
              >
                <span className="block text-base font-black text-jobsite-ink">
                  Pickup
                </span>
                <span className="mt-1 block text-sm font-bold text-jobsite-steel">
                  Bakersfield Store, today
                </span>
                <span className="mt-2 block text-sm font-black text-jobsite-pine">
                  Free
                </span>
              </button>
              <button
                className="border border-jobsite-rail bg-white p-4 text-left transition hover:border-jobsite-ink"
                type="button"
              >
                <span className="block text-base font-black text-jobsite-ink">
                  Delivery
                </span>
                <span className="mt-1 block text-sm font-bold text-jobsite-steel">
                  Schedule during checkout
                </span>
                <span className="mt-2 block text-sm font-black text-jobsite-pine">
                  Available
                </span>
              </button>
            </div>
            <Link
              className="mt-4 inline-flex items-center gap-2 text-sm font-black text-jobsite-ink underline"
              href="/"
            >
              Check nearby stores
              <ArrowRight size={16} />
            </Link>
          </section>

          <section className="border border-jobsite-rail bg-white p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-jobsite-steel">
              Terms
            </p>
            <ul className="mt-3 grid gap-2 text-sm font-semibold text-jobsite-steel">
              <li>Prices are estimated and valid until {expirationDate}.</li>
              <li>Final tax and delivery charges are calculated at checkout.</li>
              <li>Quote availability depends on current store inventory.</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}

function SummaryTile({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border border-jobsite-rail bg-white p-4">
      <div className="grid size-11 place-items-center border border-jobsite-rail bg-jobsite-paper text-jobsite-ink">
        {icon}
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-jobsite-steel">
          {label}
        </p>
        <p className="mt-1 text-sm font-black text-jobsite-ink">{value}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-jobsite-steel">{label}</dt>
      <dd className="text-jobsite-ink">{value}</dd>
    </div>
  );
}
