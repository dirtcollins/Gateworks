"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Search,
  Mail,
  Plus,
  Printer,
  Save,
  Send,
  X,
  Trash2
} from "lucide-react";
import { QuantitySelector } from "@/components/quantity-selector";
import { useCartStore } from "@/lib/cart-store";
import { products } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import { useQuoteStore } from "@/lib/quote-store";
import { cn, formatCurrency } from "@/lib/utils";
import { customerDirectory, getCustomerById } from "@/lib/customers";
import { DEFAULT_TAX_RATE } from "@/lib/tax";

const taxRate = DEFAULT_TAX_RATE;

type QuotePageClientProps = {
  quoteId: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
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

function fieldValue(value: string | undefined, fallback: string) {
  return value && value.trim() ? value : fallback;
}

export function QuotePageClient({ quoteId }: QuotePageClientProps) {
  const [actionMessage, setActionMessage] = useState("");
  const {
    quotes,
    removeItem,
    updateQuantity,
    addItem,
    clearQuote,
    saveQuote,
    setActiveQuote,
    updateQuoteDetails
  } = useQuoteStore();
  const addCartItem = useCartStore((state) => state.addItem);
  const quote = quotes.find((quoteRecord) => quoteRecord.id === quoteId);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddQuery, setQuickAddQuery] = useState("");
  const [quickAddQuantity, setQuickAddQuantity] = useState("1");
  const [focusTargetVariantId, setFocusTargetVariantId] = useState<string | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  const quoteItemQtyRef = useRef<HTMLInputElement>(null);

  const quickAddResults = useMemo(() => {
    const normalized = quickAddQuery.trim().toLowerCase();

    if (!normalized) {
      return products.slice(0, 8);
    }

    return products.filter((product) => {
      if (product.title.toLowerCase().includes(normalized)) {
        return true;
      }

      if (product.category.name.toLowerCase().includes(normalized)) {
        return true;
      }

      return product.variants.some((variant) => variant.sku.toLowerCase().includes(normalized));
    });
  }, [quickAddQuery]);

  const sortedCustomers = useMemo(
    () => [...customerDirectory].sort((left, right) => left.name.localeCompare(right.name)),
    []
  );

  useEffect(() => {
    if (quote) {
      setActiveQuote(quote.id);
    }
  }, [quote, setActiveQuote]);

  useEffect(() => {
    if (!focusTargetVariantId || !focusToken) return;

    const handle = window.setTimeout(() => {
      if (!quoteItemQtyRef.current) return;

      quoteItemQtyRef.current.focus();
      quoteItemQtyRef.current.select();
    }, 0);

    return () => window.clearTimeout(handle);
  }, [focusTargetVariantId, focusToken]);

  if (!quote) {
    return (
      <main className="grid min-h-[520px] place-items-center px-4 py-12 text-center">
        <div className="rounded-lg border border-black/10 bg-white/85 p-10 shadow-sm">
          <h1 className="text-3xl font-semibold text-industrial-ink">Quote not found</h1>
          <p className="mt-2 text-sm text-industrial-muted">
            This quote may have been deleted or created in another browser.
          </p>
          <Link
            className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-industrial-ink px-5 text-sm font-semibold text-white"
            href="/quotes"
          >
            View all quotes
          </Link>
        </div>
      </main>
    );
  }

  const currentQuote = quote;
  const selectedCustomerId = currentQuote.customerId || "";
  const items = currentQuote.items;
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const estimatedTax = subtotal * taxRate;
  const deliveryFee = subtotal >= 100 || subtotal === 0 ? 0 : 14.95;
  const total = subtotal + estimatedTax + deliveryFee;
  const amountPaid = 0;
  const balanceDue = total - amountPaid;
  const totalQuantity = items.reduce((totalItems, item) => totalItems + item.quantity, 0);
  const quoteNumber = currentQuote.quoteNumber || currentQuote.id.toUpperCase();
  const invoiceNumber = currentQuote.invoiceNumber || quoteNumber.replace("Q-", "INV-");
  const status = currentQuote.status || "draft";

  function showActionMessage(message: string) {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(""), 2400);
  }

  function updateField(field: Parameters<typeof updateQuoteDetails>[1]) {
    updateQuoteDetails(currentQuote.id, field);
  }

  function handleSaveQuote() {
    saveQuote(currentQuote.id);
    showActionMessage("Quote saved.");
  }

  function updateFromCustomerSelection(customerId: string) {
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

  function addQuoteToCart() {
    items.forEach((item) => addCartItem(item));
    setActiveQuote(currentQuote.id);
    showActionMessage("Invoice lines added to cart.");
  }

  function printQuote() {
    window.print();
  }

  function emailQuote() {
    updateQuoteDetails(currentQuote.id, { status: "sent" });
    const subject = encodeURIComponent(`${invoiceNumber} for ${currentQuote.name}`);
    const body = encodeURIComponent(
      `${fieldValue(currentQuote.customerName, "Customer")}\n${invoiceNumber}\nBalance due: ${formatCurrency(balanceDue)}\n${window.location.href}`
    );
    window.location.href = `mailto:${currentQuote.customerEmail || ""}?subject=${subject}&body=${body}`;
  }

  function pickDefaultQuoteVariant(product: Product) {
    const bestVariant = product.variants.find((variant) => variant.inventory === "in_stock");

    return bestVariant || product.variants[0];
  }

  function addCatalogItem(product: Product) {
    const variant = pickDefaultQuoteVariant(product);

    if (!variant) {
      return;
    }

    const parsedQuantity = Math.max(1, Number.parseInt(quickAddQuantity, 10) || 1);
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
        quantity: parsedQuantity,
        options: variant.options
      },
      currentQuote.id
    );

    setFocusTargetVariantId(variant.id);
    setFocusToken((value) => value + 1);
    setQuickAddQuantity("1");
    setQuickAddQuery("");
    setIsQuickAddOpen(true);
    showActionMessage(`Added ${product.title} to invoice.`);
  }

  function closeQuickAdd() {
    setIsQuickAddOpen(false);
    setQuickAddQuery("");
    setQuickAddQuantity("1");
    setFocusTargetVariantId(null);
  }

  return (
    <main className="px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto grid max-w-[1280px] gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-lg border border-black/10 bg-white/86 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col gap-3 border-b border-black/10 bg-[#fafaf8] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                className="inline-flex items-center gap-2 text-sm font-medium text-industrial-muted hover:text-industrial-ink"
                href="/quotes"
              >
                <ArrowLeft size={16} />
                All invoices
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">
                  {status}
                </span>
                <span className="text-sm font-medium text-industrial-muted">{quoteNumber}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-industrial-ink shadow-sm transition hover:bg-[#f7f7f4]" type="button" onClick={handleSaveQuote}>
                <Save size={16} />
                Save
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-industrial-ink shadow-sm transition hover:bg-[#f7f7f4]" type="button" onClick={printQuote}>
                <Printer size={16} />
                Print
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-industrial-ink shadow-sm transition hover:bg-[#f7f7f4]" type="button" onClick={printQuote}>
                <Download size={16} />
                PDF
              </button>
              <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-industrial-ink px-3 text-sm font-semibold text-white transition hover:bg-jobsite-pine" type="button" onClick={emailQuote}>
                <Send size={16} />
                Send
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-industrial-muted" htmlFor="document-title">
                  Invoice title
                </label>
                <input
                  className="mt-2 w-full rounded-lg border border-transparent bg-[#f7f7f4] px-3 py-3 text-2xl font-semibold text-industrial-ink outline-none focus:border-black/10 focus:bg-white"
                  id="document-title"
                  value={quote.name}
                  onChange={(event) => updateField({ name: event.target.value })}
                />
              </div>
              <div className="rounded-lg border border-black/10 bg-[#f7f7f4] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-industrial-muted">
                  Balance due
                </p>
                <p className="mt-1 text-3xl font-semibold text-industrial-ink">
                  {formatCurrency(balanceDue)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <section className="rounded-lg border border-black/10 bg-white p-4">
                <h2 className="text-sm font-semibold text-industrial-ink">Bill to</h2>
                <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">
                  Customer
                  <select
                    className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-[#f7f7f4] px-3 text-sm text-industrial-ink outline-none focus:bg-white"
                    value={selectedCustomerId}
                    onChange={(event) => updateFromCustomerSelection(event.target.value)}
                  >
                    <option value="">Manual entry</option>
                    {sortedCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.company})
                      </option>
                    ))}
                  </select>
                </label>
                <InvoiceInput
                  label="Customer"
                  value={fieldValue(quote.customerName, "")}
                  onChange={(value) => updateField({ customerId: "", customerName: value })}
                />
                <InvoiceInput
                  label="Email"
                  value={fieldValue(quote.customerEmail, "")}
                  onChange={(value) => updateField({ customerId: "", customerEmail: value })}
                />
                <InvoiceTextarea
                  label="Billing address"
                  value={fieldValue(quote.billingAddress, "")}
                  onChange={(value) => updateField({ customerId: "", billingAddress: value })}
                />
              </section>
              <section className="rounded-lg border border-black/10 bg-white p-4">
                <h2 className="text-sm font-semibold text-industrial-ink">Invoice details</h2>
                <InvoiceInput label="Invoice no." value={invoiceNumber} onChange={() => undefined} readOnly />
                <InvoiceInput label="Invoice date" value={formatDate(quote.createdAt)} onChange={() => undefined} readOnly />
                <InvoiceInput label="Due date" value={formatDate(quote.dueAt || quote.expiresAt)} onChange={() => undefined} readOnly />
                <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted" htmlFor="terms">
                  Terms
                </label>
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-[#f7f7f4] px-3 text-sm text-industrial-ink outline-none focus:bg-white"
                  id="terms"
                  value={fieldValue(quote.terms, "Due on receipt")}
                  onChange={(event) => updateField({ terms: event.target.value })}
                >
                  <option>Due on receipt</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                  <option>Net 45</option>
                </select>
              </section>
            </div>

            <section className="mt-5 overflow-hidden rounded-lg border border-black/10 bg-white">
              <div className="hidden grid-cols-[minmax(0,1fr)_140px_120px_120px_48px] gap-4 border-b border-black/10 bg-[#f7f7f4] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted md:grid">
                <span>Product / service</span>
                <span className="text-right">Quantity</span>
                <span className="text-right">Price</span>
                <span className="text-right">Amount</span>
                <span className="sr-only">Actions</span>
              </div>

              {items.length ? (
                <div className="divide-y divide-black/10">
                  {items.map((item) => {
                    const itemTotal = item.price * item.quantity;
                    const productSlug = getQuoteItemProductSlug(item);
                    const shouldFocusQuantity = focusTargetVariantId === item.variantId;

                    return (
                      <article
                        className="group grid gap-3 px-4 py-4 transition hover:bg-[#fafaf8] md:grid-cols-[minmax(0,1fr)_140px_120px_120px_48px] md:items-center md:gap-4"
                        key={item.variantId}
                      >
                        <Link
                          className="grid min-w-0 grid-cols-[56px_1fr] items-center gap-3"
                          href={`/products/${productSlug}`}
                        >
                          <span className="relative size-14 shrink-0 rounded-md border border-black/10 bg-[#fafaf8]">
                            <Image
                              alt={item.title}
                              className="object-contain p-1.5"
                              fill
                              quality={60}
                              sizes="56px"
                              src={item.image}
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-industrial-ink">
                              {item.title}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-industrial-muted">
                              SKU {item.sku}
                            </span>
                          </span>
                        </Link>
                        <div className="md:justify-self-end">
                          <span className="mb-1 block text-xs font-semibold text-industrial-muted md:hidden">
                            Quantity
                          </span>
                          <QuantitySelector
                            inputId={`quote-item-qty-${item.variantId}`}
                            inputRef={shouldFocusQuantity ? quoteItemQtyRef : undefined}
                            value={item.quantity}
                            onChange={(quantity) => updateQuantity(quote.id, item.variantId, quantity)}
                          />
                        </div>
                        <p className="text-sm font-medium text-industrial-ink md:text-right">
                          <span className="mr-1 text-xs font-semibold text-industrial-muted md:hidden">
                            Price
                          </span>
                          {formatCurrency(item.price)}
                        </p>
                        <p className="text-base font-semibold text-industrial-ink md:text-right">
                          <span className="mr-1 text-xs font-semibold text-industrial-muted md:hidden">
                            Amount
                          </span>
                          {formatCurrency(itemTotal)}
                        </p>
                        <button
                          aria-label={`Remove ${item.title}`}
                          className="grid size-9 place-items-center justify-self-start rounded-md text-industrial-muted opacity-50 transition hover:bg-red-50 hover:text-red-700 group-hover:opacity-100 md:justify-self-center"
                          onClick={() => removeItem(quote.id, item.variantId)}
                          type="button"
                        >
                          <Trash2 size={17} />
                        </button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="grid place-items-center gap-1 px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-industrial-ink">No line items yet</p>
                  <p className="text-xs text-industrial-muted">
                    Add a product below to start building this quote.
                  </p>
                </div>
              )}

              <div className="border-t border-black/10 p-3">
                <button
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition",
                    isQuickAddOpen
                      ? "bg-industrial-ink text-white"
                      : "text-industrial-steel hover:bg-[#f7f7f4] hover:text-industrial-ink"
                  )}
                  onClick={() => setIsQuickAddOpen((current) => !current)}
                  type="button"
                >
                  <Plus size={16} />
                  Add an item
                </button>

                {isQuickAddOpen ? (
                  <div className="mt-3 rounded-lg border border-black/10 bg-[#fafaf8] p-3">
                    <div className="flex items-center gap-2">
                      <Search className="text-jobsite-steel" size={18} />
                      <label
                        className="flex-1 text-xs font-semibold text-industrial-muted"
                        htmlFor="quote-product-search"
                      >
                        Search products to add
                      </label>
                      <button
                        aria-label="Close add item"
                        className="grid size-7 place-items-center rounded border border-black/10 text-jobsite-ink transition hover:bg-white"
                        onClick={closeQuickAdd}
                        type="button"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <input
                        autoFocus
                        className="h-9 min-w-[200px] flex-1 rounded border border-black/10 bg-white px-3 text-sm outline-none focus:border-industrial-ink"
                        id="quote-product-search"
                        onChange={(event) => setQuickAddQuery(event.target.value)}
                        placeholder="Search product title, SKU, or category"
                        value={quickAddQuery}
                      />
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-industrial-muted">
                        Qty
                        <input
                          className="h-9 w-16 rounded border border-black/10 bg-white px-2 text-sm outline-none focus:border-industrial-ink"
                          min={1}
                          onChange={(event) =>
                            setQuickAddQuantity(
                              String(Math.max(1, Number(event.target.value) || 1))
                            )
                          }
                          type="number"
                          value={quickAddQuantity}
                        />
                      </label>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs font-semibold text-industrial-muted">
                      <span>
                        {quickAddResults.length} product{quickAddResults.length === 1 ? "" : "s"}
                      </span>
                      <span>Press any result to add</span>
                    </div>
                    <div className="mt-2 max-h-60 overflow-y-auto pr-1">
                      {!quickAddResults.length ? (
                        <p className="rounded border border-dashed border-black/10 p-3 text-xs text-industrial-muted">
                          No products match your search.
                        </p>
                      ) : (
                        <div className="grid gap-1">
                          {quickAddResults.slice(0, 10).map((product) => {
                            const variant = pickDefaultQuoteVariant(product);

                            if (!variant) {
                              return null;
                            }

                            const resultImage =
                              variant.image || product.images[0]?.url || "/assets/logo.svg";

                            return (
                              <button
                                className="grid grid-cols-[34px_minmax(0,1fr)_76px_52px] items-center gap-2 rounded border border-black/10 bg-white px-2 py-1.5 text-left text-sm transition hover:border-industrial-ink"
                                key={product.id}
                                onClick={() => addCatalogItem(product)}
                                type="button"
                              >
                                <span className="relative size-[34px] overflow-hidden rounded border border-black/10 bg-[#fafaf8]">
                                  <Image
                                    alt={product.title}
                                    className="object-contain p-1"
                                    fill
                                    quality={45}
                                    sizes="34px"
                                    src={resultImage}
                                  />
                                </span>
                                <span className="min-w-0 text-industrial-ink">
                                  <span className="block truncate font-semibold leading-tight">
                                    {product.title}
                                  </span>
                                  <span className="block truncate text-xs text-industrial-muted">
                                    SKU {variant.sku}
                                  </span>
                                </span>
                                <span className="text-right font-semibold text-industrial-ink">
                                  {formatCurrency(variant.price)}
                                </span>
                                <span
                                  className={cn(
                                    "text-right text-xs font-semibold",
                                    variant.inventory === "in_stock"
                                      ? "text-jobsite-pine"
                                      : "text-red-700"
                                  )}
                                >
                                  {variant.inventory === "in_stock" ? "Stock" : "Out"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_340px]">
              <section className="rounded-lg border border-black/10 bg-white p-4">
                <InvoiceTextarea
                  label="Message on invoice"
                  value={fieldValue(quote.notes, "")}
                  onChange={(value) => updateField({ notes: value })}
                />
                <InvoiceTextarea
                  label="Jobsite or delivery address"
                  value={fieldValue(quote.jobsiteAddress, "")}
                  onChange={(value) => updateField({ customerId: "", jobsiteAddress: value })}
                />
              </section>
              <section className="rounded-lg border border-black/10 bg-white p-4">
                <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
                <SummaryRow label="Tax" value={formatCurrency(estimatedTax)} />
                <SummaryRow label="Delivery" value={deliveryFee ? formatCurrency(deliveryFee) : "Free"} />
                <SummaryRow label="Amount paid" value={formatCurrency(amountPaid)} />
                <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
                  <span className="text-base font-semibold text-industrial-ink">Balance due</span>
                  <span className="text-2xl font-semibold text-industrial-ink">{formatCurrency(balanceDue)}</span>
                </div>
              </section>
            </div>
          </div>
        </section>

        <aside className="grid h-fit gap-4">
          <section className="rounded-lg border border-black/10 bg-white/86 p-4 shadow-sm backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-industrial-muted">
              Workflow
            </p>
            <div className="mt-4 grid gap-3">
              {[
                ["Customer", fieldValue(quote.customerName, "Missing customer")],
                ["Line items", `${totalQuantity} item${totalQuantity === 1 ? "" : "s"}`],
                ["Terms", fieldValue(quote.terms, "Due on receipt")],
                ["Status", status]
              ].map(([label, value]) => (
                <div key={label} className="flex items-center gap-3">
                  <CheckCircle2 className="text-jobsite-pine" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-industrial-ink">{label}</p>
                    <p className="text-xs text-industrial-muted">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-black/10 bg-white/86 p-4 shadow-sm backdrop-blur-xl">
            <button
              className={cn("flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-industrial-ink text-sm font-semibold text-white transition hover:bg-jobsite-pine", !items.length && "cursor-not-allowed opacity-50")}
              disabled={!items.length}
              type="button"
              onClick={emailQuote}
            >
              <Mail size={17} />
              Send invoice
            </button>
            <button
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-white text-sm font-semibold text-industrial-ink transition hover:bg-[#f7f7f4] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!items.length}
              type="button"
              onClick={addQuoteToCart}
            >
              Add invoice to cart
            </button>
            <button
              className="mt-2 flex h-11 w-full items-center justify-center rounded-lg border border-black/10 bg-white text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!items.length}
              type="button"
              onClick={() => clearQuote(quote.id)}
            >
              Clear line items
            </button>
            <div aria-live="polite" className={cn("mt-3 text-center text-xs font-semibold text-jobsite-pine transition", actionMessage ? "opacity-100" : "opacity-0")}>
              {actionMessage || "Ready"}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function InvoiceInput({
  label,
  value,
  readOnly = false,
  onChange
}: {
  label: string;
  value: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-3 block">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">{label}</span>
      <input
        className="mt-1 h-10 w-full rounded-lg border border-black/10 bg-[#f7f7f4] px-3 text-sm text-industrial-ink outline-none focus:bg-white disabled:text-industrial-muted"
        readOnly={readOnly}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function InvoiceTextarea({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-3 block first:mt-0">
      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">{label}</span>
      <textarea
        className="mt-1 min-h-20 w-full resize-y rounded-lg border border-black/10 bg-[#f7f7f4] px-3 py-2 text-sm leading-6 text-industrial-ink outline-none focus:bg-white"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-industrial-muted">{label}</span>
      <span className="font-medium text-industrial-ink">{value}</span>
    </div>
  );
}
