"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Pencil,
  FileText,
  Plus,
  Trash2
} from "lucide-react";
import { useQuoteStore } from "@/lib/quote-store";
import { formatCurrency } from "@/lib/utils";

const taxRate = 0.0825;
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

export function QuotesPageClient() {
  const [quoteName, setQuoteName] = useState("");
  const [editingQuoteId, setEditingQuoteId] = useState("");
  const [editingQuoteName, setEditingQuoteName] = useState("");
  const { quotes, createQuote, deleteQuote, renameQuote, setActiveQuote } =
    useQuoteStore();

  function handleCreateQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createQuote(quoteName);
    setQuoteName("");
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

  return (
    <main className="bg-jobsite-paper">
      <section className="border-b border-jobsite-rail bg-white">
        <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-6 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-jobsite-steel">
              <Link className="hover:text-jobsite-ink" href="/">
                Products
              </Link>
              <span>/</span>
              <span>Job Quotes</span>
            </div>
            <h1 className="mt-3 text-3xl font-black text-jobsite-ink md:text-5xl">
              Job Quotes
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-jobsite-steel">
              Create a quote for each job, project, or customer, then add products
              to the active quote from product pages.
            </p>
          </div>

          <form
            className="border border-jobsite-rail bg-jobsite-paper p-3"
            onSubmit={handleCreateQuote}
          >
            <label
              className="text-xs font-black uppercase tracking-[0.14em] text-jobsite-steel"
              htmlFor="quote-name"
            >
              Create new quote
            </label>
            <div className="mt-2 flex gap-2">
              <input
                className="h-11 min-w-0 flex-1 border border-jobsite-rail bg-white px-3 text-sm font-bold text-jobsite-ink outline-none focus:border-jobsite-ink"
                id="quote-name"
                placeholder="Quote name"
                value={quoteName}
                onChange={(event) => setQuoteName(event.target.value)}
              />
              <button
                className="inline-flex h-11 items-center gap-2 bg-jobsite-ink px-4 text-sm font-black uppercase tracking-[0.08em] text-white"
                type="submit"
              >
                <Plus size={18} />
                Create
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="grid gap-4">
          {quotes.map((quote) => {
            const subtotal = quoteSubtotal(quote.items);
            const estimatedTax = subtotal * taxRate;
            const deliveryFee = subtotal >= 100 || subtotal === 0 ? 0 : 14.95;
            const total = subtotal + estimatedTax + deliveryFee;
            const totalQuantity = quote.items.reduce(
              (itemCount, item) => itemCount + item.quantity,
              0
            );

            return (
              <article
                key={quote.id}
                className="group relative grid gap-4 border border-jobsite-rail bg-white p-5 transition hover:border-jobsite-ink hover:bg-jobsite-paper lg:grid-cols-[1fr_auto]"
              >
                <Link
                  aria-label={`Open ${quote.name}`}
                  className="absolute inset-0 z-0"
                  href={`/quotes/${quote.id}`}
                  onClick={() => setActiveQuote(quote.id)}
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-jobsite-steel">
                    <span>{quote.quoteNumber}</span>
                    <span className="text-jobsite-rail">|</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={15} />
                      Expires {formatDate(quote.expiresAt)}
                    </span>
                  </div>
                  <div className="mt-2 flex max-w-xl items-center gap-2">
                    {editingQuoteId === quote.id ? (
                      <input
                        aria-label={`Rename ${quote.name}`}
                        autoFocus
                        className="relative z-10 h-10 min-w-0 flex-1 border border-jobsite-ink bg-white px-2 text-2xl font-black text-jobsite-ink outline-none"
                        value={editingQuoteName}
                        onBlur={finishRenamingQuote}
                        onChange={(event) => setEditingQuoteName(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
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
                        <h2 className="min-w-0 text-2xl font-black text-jobsite-ink">
                          {quote.name}
                        </h2>
                        <button
                          aria-label={`Rename ${quote.name}`}
                          className="relative z-10 grid size-8 shrink-0 place-items-center border border-jobsite-rail bg-white text-jobsite-steel transition hover:border-jobsite-ink hover:bg-jobsite-paper hover:text-jobsite-ink"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            startRenamingQuote(quote.id, quote.name);
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="mt-4 grid gap-2 text-sm font-bold text-jobsite-steel sm:grid-cols-3">
                    <span>{totalQuantity} item{totalQuantity === 1 ? "" : "s"}</span>
                    <span>Created {formatDate(quote.createdAt)}</span>
                    <span>{quote.items.length ? "Ready for review" : "Empty quote"}</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[auto_auto] sm:items-center">
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-jobsite-steel">
                      Estimated total
                    </p>
                    <p className="mt-1 text-3xl font-black text-jobsite-ink">
                      {formatCurrency(total)}
                    </p>
                  </div>
                  <div className="flex gap-2 sm:justify-end">
                    <Link
                      className="relative z-10 inline-flex h-11 items-center justify-center gap-2 bg-jobsite-ink px-4 text-sm font-black uppercase tracking-[0.08em] text-white"
                      href={`/quotes/${quote.id}`}
                      onClick={() => setActiveQuote(quote.id)}
                    >
                      Open
                      <ArrowRight size={17} />
                    </Link>
                    <button
                      aria-label={`Delete ${quote.name}`}
                      className="relative z-10 grid size-11 place-items-center border border-jobsite-rail text-jobsite-steel transition hover:border-red-700 hover:text-red-700"
                      type="button"
                      onClick={() => deleteQuote(quote.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {!quotes.length ? (
          <div className="grid place-items-center border border-dashed border-jobsite-rail bg-white p-10 text-center">
            <FileText size={28} />
            <p className="mt-3 text-lg font-black text-jobsite-ink">
              No quotes yet.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
