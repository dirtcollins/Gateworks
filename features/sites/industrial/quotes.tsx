"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, FileText, Plus, Search, Trash2 } from "lucide-react";
import { Eyebrow, IndustrialPage, formatUsd } from "./kit";
import { useUserStore } from "@/lib/user-store";
import {
  deleteQuote,
  fetchQuotes,
  quoteDisplayName,
  type DbQuote
} from "./quote-data";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Customer quotes list. Reads the DB quotes scoped
 * to the signed-in account (`siteUserId`) via `/api/quotes`, filters
 * by status tab + search, links into each quote detail page.
 * ------------------------------------------------------------------ */

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

type QuoteTab = "open" | "draft" | "all";

export function IndustrialQuotes() {
  const userId = useUserStore((state) => state.userId);

  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [quotes, setQuotes] = useState<DbQuote[]>([]);
  const [tab, setTab] = useState<QuoteTab>("open");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    setReady(false);
    fetchQuotes(userId === "guest" ? {} : { siteUserId: userId }).then(
      (result) => {
        if (!active) return;
        setQuotes(result.quotes);
        setConfigured(result.configured);
        setReady(true);
      }
    );
    return () => {
      active = false;
    };
  }, [userId]);

  const rows = useMemo(
    () =>
      quotes.map((quote) => ({
        quote,
        status: quote.status || "draft",
        total: quote.total
      })),
    [quotes]
  );

  const openRows = rows.filter(
    (row) => row.status !== "invoiced" && row.status !== "converted"
  );
  const draftRows = rows.filter((row) => row.status === "draft");
  const openValue = openRows.reduce((total, row) => total + row.total, 0);

  const visibleRows = rows.filter(({ quote, status }) => {
    if (tab === "open" && (status === "invoiced" || status === "converted")) {
      return false;
    }
    if (tab === "draft" && status !== "draft") return false;
    const search = query.trim().toLowerCase();
    if (!search) return true;
    return [
      quoteDisplayName(quote),
      quote.quoteNumber,
      quote.customerName,
      quote.customerEmail
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search));
  });

  const tabs: Array<{ id: QuoteTab; label: string; count: number }> = [
    { id: "open", label: "Open", count: openRows.length },
    { id: "draft", label: "Draft", count: draftRows.length },
    { id: "all", label: "All", count: rows.length }
  ];

  async function handleDelete(id: string) {
    const { persisted } = await deleteQuote(id);
    if (persisted) {
      setQuotes((current) => current.filter((quote) => quote.id !== id));
    }
  }

  return (
    <IndustrialPage>
      <section className="py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-d1-ink pb-3">
          <div>
            <Eyebrow>Estimate center</Eyebrow>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-d1-ink sm:text-4xl">
              Your quotes
            </h1>
          </div>
          <Link
            className="flex items-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
            href="/industrial/quote"
          >
            <Plus className="h-4 w-4" /> New quote
          </Link>
        </div>

        {!configured ? (
          <p className="mt-6 border border-d1-amber bg-d1-amber/10 px-4 py-3 text-[12px] font-bold text-d1-ink">
            Quotes are not yet persisted — Supabase is not configured. New
            quotes will not be saved.
          </p>
        ) : null}

        {/* Summary cards */}
        <div className="mt-6 grid gap-px border border-d1-line bg-d1-line sm:grid-cols-3">
          {[
            { label: "Open quote value", value: formatUsd(openValue) },
            { label: "Draft quotes", value: String(draftRows.length) },
            { label: "Total documents", value: String(rows.length) }
          ].map((card) => (
            <div className="bg-d1-card px-5 py-4" key={card.label}>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-d1-ink">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-d1-line pb-3">
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  className={`flex items-center gap-1.5 border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
                    active
                      ? "border-d1-ink bg-d1-ink text-d1-paper"
                      : "border-d1-line bg-white text-d1-ink hover:border-d1-ink"
                  }`}
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  type="button"
                >
                  {item.label}
                  <span className={active ? "text-d1-paper/70" : "text-d1-steel"}>
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 border border-d1-line bg-white px-3 sm:w-72">
            <Search className="h-4 w-4 text-d1-steel" />
            <input
              className="h-10 w-full bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer or quote"
              value={query}
            />
          </div>
        </div>

        {/* Rows */}
        {!ready ? (
          <div className="mt-4 border border-dashed border-d1-line bg-d1-card px-6 py-16 text-center text-sm font-bold text-d1-steel">
            Loading your quotes…
          </div>
        ) : visibleRows.length ? (
          <div className="mt-4 grid gap-px border border-d1-line bg-d1-line">
            {visibleRows.map(({ quote, status, total }) => {
              const unitCount = quote.items.reduce(
                (sum, item) => sum + item.quantity,
                0
              );
              return (
                <div
                  className="grid gap-3 bg-d1-card p-4 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center"
                  key={quote.id}
                >
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                      <span>{quote.quoteNumber}</span>
                      <span className="border border-d1-line bg-white px-2 py-0.5">
                        {status}
                      </span>
                    </div>
                    <p className="mt-1.5 text-base font-bold text-d1-ink">
                      {quoteDisplayName(quote)}
                    </p>
                    <p className="text-[12px] text-d1-steel">
                      {unitCount} unit{unitCount === 1 ? "" : "s"} · Updated{" "}
                      {dateFormatter.format(new Date(quote.updatedAt))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-d1-ink">
                      {quote.customerName || "No customer"}
                    </p>
                    <p className="text-[12px] text-d1-steel">
                      {quote.customerEmail || "Add an email"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="text-lg font-extrabold text-d1-ink">
                      {formatUsd(total)}
                    </span>
                    <div className="flex gap-2">
                      <Link
                        className="flex items-center gap-1.5 bg-d1-ink px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
                        href={`/industrial/quotes/${quote.id}`}
                      >
                        Open <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        aria-label={`Delete ${quoteDisplayName(quote)}`}
                        className="grid h-9 w-9 place-items-center border border-d1-line text-d1-steel transition hover:border-d1-red hover:text-d1-red"
                        onClick={() => handleDelete(quote.id)}
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 border border-dashed border-d1-line bg-d1-card px-6 py-16 text-center">
            <FileText className="mx-auto h-9 w-9 text-d1-line" />
            <p className="mt-3 text-sm font-bold text-d1-ink">
              No quotes in this view.
            </p>
            <Link
              className="mt-4 inline-flex items-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
              href="/industrial/quote"
            >
              <Plus className="h-4 w-4" /> Create a quote
            </Link>
          </div>
        )}
      </section>
    </IndustrialPage>
  );
}
