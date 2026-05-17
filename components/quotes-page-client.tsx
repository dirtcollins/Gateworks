"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
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
  const [quoteName, setQuoteName] = useState("");
  const [editingQuoteId, setEditingQuoteId] = useState("");
  const [editingQuoteName, setEditingQuoteName] = useState("");
  const [query, setQuery] = useState("");
  const { quotes, createQuote, deleteQuote, renameQuote, setActiveQuote } =
    useQuoteStore();

  const filteredQuotes = quotes.filter((quote) => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return [
      quote.name,
      quote.quoteNumber,
      quote.invoiceNumber,
      quote.customerName,
      quote.customerEmail,
      quote.status
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  function handleCreateQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quoteId = createQuote(quoteName || "New invoice");
    setActiveQuote(quoteId);
    setQuoteName("");
    router.push(`/quotes/${quoteId}`);
  }

  function startRenamingQuote(quoteId: string, name: string) {
    setEditingQuoteId(quoteId);
    setEditingQuoteName(name);
  }

  function finishRenamingQuote() {
    if (!editingQuoteId) {
      return;
    }

    renameQuote(editingQuoteId, editingQuoteName);
    setEditingQuoteId("");
    setEditingQuoteName("");
  }

  function cancelRenamingQuote() {
    setEditingQuoteId("");
    setEditingQuoteName("");
  }

  const openBalance = quotes.reduce((total, quote) => total + quoteTotal(quote.items), 0);
  const draftCount = quotes.filter((quote) => (quote.status || "draft") === "draft").length;

  return (
    <main className="px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto grid max-w-[1280px] gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-lg border border-black/10 bg-white/86 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col gap-3 border-b border-black/10 bg-[#fafaf8] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted">
                  Sales documents
                </span>
                <span className="text-sm font-medium text-industrial-muted">
                  {quotes.length} document{quotes.length === 1 ? "" : "s"}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-industrial-ink">
                Invoices and quotes
              </h1>
            </div>
            <label className="relative block lg:w-96">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted" size={16} />
              <input
                className="h-10 w-full rounded-lg border border-black/10 bg-white pl-9 pr-3 text-sm text-industrial-ink outline-none"
                placeholder="Search customer or invoice"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>

          <div className="hidden grid-cols-[1.2fr_1fr_120px_130px_150px] gap-3 border-b border-black/10 bg-[#f7f7f4] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-industrial-muted lg:grid">
            <span>Document</span>
            <span>Customer</span>
            <span>Status</span>
            <span className="text-right">Balance</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-black/10">
            {filteredQuotes.map((quote) => {
              const total = quoteTotal(quote.items);
              const totalQuantity = quote.items.reduce(
                (itemCount, item) => itemCount + item.quantity,
                0
              );
              const invoiceNumber = quote.invoiceNumber || quote.quoteNumber;
              const status = quote.status || "draft";

              return (
                <article key={quote.id} className="grid gap-3 p-4 transition hover:bg-[#fafaf8] lg:grid-cols-[1.2fr_1fr_120px_130px_150px] lg:items-center">
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
                          value={editingQuoteName}
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
                        />
                      ) : (
                        <>
                          <h3 className="min-w-0 truncate text-lg font-semibold text-industrial-ink">
                            {quote.name}
                          </h3>
                          <button
                            aria-label={`Rename ${quote.name}`}
                            className="grid size-8 shrink-0 place-items-center rounded-lg border border-black/10 bg-white text-industrial-muted transition hover:text-industrial-ink"
                            type="button"
                            onClick={() => startRenamingQuote(quote.id, quote.name)}
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
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-industrial-ink px-3 text-sm font-semibold text-white"
                      href={`/quotes/${quote.id}`}
                      onClick={() => setActiveQuote(quote.id)}
                    >
                      Open
                      <ArrowRight size={16} />
                    </Link>
                    <button
                      aria-label={`Delete ${quote.name}`}
                      className="grid size-10 place-items-center rounded-lg border border-black/10 text-industrial-muted transition hover:border-red-700 hover:text-red-700"
                      type="button"
                      onClick={() => deleteQuote(quote.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {!filteredQuotes.length ? (
            <div className="grid place-items-center p-10 text-center">
              <FileText size={28} />
              <p className="mt-3 text-lg font-semibold text-industrial-ink">No matching documents.</p>
            </div>
          ) : null}
        </section>

        <aside className="grid h-fit gap-4">
          <section className="rounded-lg border border-black/10 bg-white/86 p-4 shadow-sm backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-industrial-muted">
              Create
            </p>
            <form className="mt-3 grid gap-2" onSubmit={handleCreateQuote}>
              <input
                className="h-11 min-w-0 rounded-lg border border-black/10 bg-[#f7f7f4] px-3 text-sm text-industrial-ink outline-none focus:bg-white"
                id="quote-name"
                placeholder="Customer, job, or invoice name"
                value={quoteName}
                onChange={(event) => setQuoteName(event.target.value)}
              />
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-industrial-ink px-4 text-sm font-semibold text-white transition hover:bg-jobsite-pine"
                type="submit"
              >
                <Plus size={18} />
                New invoice
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-black/10 bg-white/86 p-4 shadow-sm backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-industrial-muted">
              Workflow
            </p>
            <div className="mt-4 grid gap-3">
              {[
                ["Open balance", formatCurrency(openBalance)],
                ["Drafts", String(draftCount)],
                ["Documents", String(quotes.length)]
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 border-b border-black/10 pb-2 last:border-b-0 last:pb-0">
                  <span className="text-sm font-semibold text-industrial-ink">{label}</span>
                  <span className="text-sm font-semibold text-industrial-muted">{value}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
