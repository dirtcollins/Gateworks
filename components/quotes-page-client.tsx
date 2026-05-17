"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import { useQuoteStore } from "@/lib/quote-store";
import { DEFAULT_TAX_RATE } from "@/lib/tax";
import { formatCurrency } from "@/lib/utils";

const taxRate = DEFAULT_TAX_RATE;
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

type QuoteTab = "open" | "draft" | "all";

function formatDate(date: string) {
  return dateFormatter.format(new Date(date));
}

function quoteSubtotal(items: { price: number; quantity: number }[]) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

function quoteTotal(items: { price: number; quantity: number }[]) {
  const subtotal = quoteSubtotal(items);
  const estimatedTax = subtotal * taxRate;
  const deliveryFee = subtotal >= 100 || subtotal === 0 ? 0 : 14.95;

  return subtotal + estimatedTax + deliveryFee;
}

export function QuotesPageClient() {
  const router = useRouter();
  const [editingQuoteId, setEditingQuoteId] = useState("");
  const [editingQuoteName, setEditingQuoteName] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<QuoteTab>("open");
  const { quotes, createQuote, deleteQuote, renameQuote, setActiveQuote } =
    useQuoteStore();

  function statusOf(quote: (typeof quotes)[number]) {
    return quote.status || "draft";
  }

  function isOpenQuote(quote: (typeof quotes)[number]) {
    return statusOf(quote) !== "invoiced";
  }

  const rows = quotes.map((quote) => ({
    quote,
    status: statusOf(quote),
    total: quoteTotal(quote.items)
  }));

  const openRows = rows.filter((row) => isOpenQuote(row.quote));
  const draftRows = rows.filter((row) => row.status === "draft");
  const openTotal = openRows.reduce((total, row) => total + row.total, 0);
  const draftTotal = draftRows.reduce((total, row) => total + row.total, 0);
  const invoicedCount = rows.filter((row) => row.status === "invoiced").length;

  const visibleRows = rows.filter(({ quote, status }) => {
    if (tab === "open" && !isOpenQuote(quote)) return false;
    if (tab === "draft" && status !== "draft") return false;

    const search = query.trim().toLowerCase();
    if (!search) return true;

    return [
      quote.name,
      quote.quoteNumber,
      quote.invoiceNumber,
      quote.customerName,
      quote.customerEmail,
      status
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  function handleNewQuote() {
    const quoteId = createQuote("New quote");
    setActiveQuote(quoteId);
    router.push(`/quotes/${quoteId}`);
  }

  function startRenamingQuote(quoteId: string, name: string) {
    setEditingQuoteId(quoteId);
    setEditingQuoteName(name);
  }

  function finishRenamingQuote() {
    if (!editingQuoteId) return;
    renameQuote(editingQuoteId, editingQuoteName);
    setEditingQuoteId("");
    setEditingQuoteName("");
  }

  function cancelRenamingQuote() {
    setEditingQuoteId("");
    setEditingQuoteName("");
  }

  const tabs: Array<{ id: QuoteTab; label: string; count: number | null }> = [
    { id: "open", label: "Open", count: openRows.length },
    { id: "draft", label: "Draft", count: draftRows.length },
    { id: "all", label: "All quotes", count: null }
  ];

  const summaryCards = [
    { label: "Open quotes", value: formatCurrency(openTotal), hint: "USD" },
    { label: "Draft quotes", value: formatCurrency(draftTotal), hint: "USD" },
    { label: "Invoiced", value: String(invoicedCount), hint: "quotes" },
    { label: "Documents", value: String(quotes.length), hint: "total" }
  ];

  return (
    <main className="px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto grid max-w-[1280px] gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-industrial-muted">
              Estimate center
            </p>
            <h1 className="mt-1 text-2xl font-black text-industrial-ink">Quotes</h1>
          </div>
          <button
            className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-industrial-ink px-4 text-sm font-semibold text-white transition hover:bg-jobsite-pine active:translate-y-px"
            onClick={handleNewQuote}
            type="button"
          >
            <Plus size={18} />
            Create a quote
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              className="rounded-lg border border-black/10 bg-white/86 p-4 shadow-sm"
              key={card.label}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-industrial-muted">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-black text-industrial-ink">{card.value}</p>
              <p className="mt-1 text-xs text-industrial-muted">{card.hint}</p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-lg border border-black/10 bg-white/86 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col gap-3 border-b border-black/10 bg-[#fafaf8] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {tabs.map((tabItem) => {
                const isActive = tab === tabItem.id;
                return (
                  <button
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.06em] transition ${
                      isActive
                        ? "border-industrial-ink bg-industrial-ink text-white"
                        : "border-black/10 bg-white text-industrial-ink hover:border-industrial-ink/60"
                    }`}
                    key={tabItem.id}
                    onClick={() => setTab(tabItem.id)}
                    type="button"
                  >
                    {tabItem.label}
                    {tabItem.count !== null ? (
                      <span
                        className={
                          isActive ? "text-white/70" : "text-industrial-muted"
                        }
                      >
                        {tabItem.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <label className="relative block lg:w-80">
              <span className="sr-only">Search quotes</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted"
                size={16}
              />
              <input
                className="h-10 w-full rounded-lg border border-black/10 bg-white pl-9 pr-3 text-sm text-industrial-ink outline-none focus:border-industrial-ink"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search customer or quote number"
                value={query}
              />
            </label>
          </div>

          <div className="hidden grid-cols-[1.2fr_1fr_120px_130px_150px] gap-3 border-b border-black/10 bg-[#f7f7f4] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted lg:grid">
            <span>Document</span>
            <span>Customer</span>
            <span>Status</span>
            <span className="text-right">Quote total</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-black/10">
            {visibleRows.map(({ quote, status, total }) => {
              const totalQuantity = quote.items.reduce(
                (itemCount, item) => itemCount + item.quantity,
                0
              );
              const invoiceNumber = quote.invoiceNumber || quote.quoteNumber;

              return (
                <article
                  className="grid gap-3 p-4 transition hover:bg-[#fafaf8] lg:grid-cols-[1.2fr_1fr_120px_130px_150px] lg:items-center"
                  key={quote.id}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">
                      <span>{invoiceNumber}</span>
                      <span>|</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={14} />
                        Due {formatDate(quote.dueAt || quote.expiresAt)}
                      </span>
                    </div>
                    <div className="mt-2 flex max-w-xl items-center gap-2">
                      {editingQuoteId === quote.id ? (
                        <input
                          aria-label={`Rename ${quote.name}`}
                          autoFocus
                          className="h-10 min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-2 text-lg font-semibold text-industrial-ink outline-none"
                          onBlur={finishRenamingQuote}
                          onChange={(event) => setEditingQuoteName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.currentTarget.blur();
                            }

                            if (event.key === "Escape") {
                              event.preventDefault();
                              cancelRenamingQuote();
                            }
                          }}
                          value={editingQuoteName}
                        />
                      ) : (
                        <>
                          <h3 className="min-w-0 truncate text-lg font-semibold text-industrial-ink">
                            {quote.name}
                          </h3>
                          <button
                            aria-label={`Rename ${quote.name}`}
                            className="grid size-8 shrink-0 place-items-center rounded-lg border border-black/10 bg-white text-industrial-muted transition hover:text-industrial-ink"
                            onClick={() => startRenamingQuote(quote.id, quote.name)}
                            type="button"
                          >
                            <Pencil size={15} />
                          </button>
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-industrial-muted">
                      {totalQuantity} line item{totalQuantity === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-industrial-ink">
                      {quote.customerName || "No customer selected"}
                    </p>
                    <p className="text-xs text-industrial-muted">
                      {quote.customerEmail || "Add email before sending"}
                    </p>
                  </div>

                  <span className="w-fit rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">
                    {status}
                  </span>

                  <p className="text-left text-xl font-semibold text-industrial-ink lg:text-right">
                    {formatCurrency(total)}
                  </p>

                  <div className="flex gap-2 lg:justify-end">
                    <Link
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-industrial-ink px-3 text-sm font-semibold text-white transition hover:bg-jobsite-pine"
                      href={`/quotes/${quote.id}`}
                      onClick={() => setActiveQuote(quote.id)}
                    >
                      Open
                      <ArrowRight size={16} />
                    </Link>
                    <button
                      aria-label={`Delete ${quote.name}`}
                      className="grid size-10 place-items-center rounded-lg border border-black/10 text-industrial-muted transition hover:border-red-700 hover:text-red-700"
                      onClick={() => deleteQuote(quote.id)}
                      type="button"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {!visibleRows.length ? (
            <div className="grid place-items-center p-10 text-center">
              <FileText className="text-industrial-muted" size={28} />
              <p className="mt-3 text-lg font-semibold text-industrial-ink">
                No quotes in this view.
              </p>
              <button
                className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-industrial-ink px-4 text-sm font-semibold text-white transition hover:bg-jobsite-pine"
                onClick={handleNewQuote}
                type="button"
              >
                <Plus size={16} />
                Create a quote
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
