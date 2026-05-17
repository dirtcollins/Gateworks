"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, FileText, Plus, Search, Trash2 } from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminEmptyState,
  AdminHeader,
  AdminPill,
  AdminStatGrid,
  AdminTabs
} from "@/features/sites/industrial/admin/kit";
import { useQuoteStore, type QuoteRecord } from "@/lib/quote-store";
import { calculateTax } from "@/lib/tax";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin quotes list. Reads + writes the real quote
 * store (useQuoteStore): create, delete, filter by status, and link
 * into each quote's admin detail view.
 * ------------------------------------------------------------------ */

type QuoteTab = "all" | "draft" | "sent" | "accepted" | "invoiced";

const TABS: Array<{ id: QuoteTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "accepted", label: "Accepted" },
  { id: "invoiced", label: "Invoiced" }
];

const STATUS_TONE: Record<QuoteRecord["status"], "neutral" | "amber" | "pine" | "ink"> = {
  draft: "amber",
  sent: "neutral",
  accepted: "pine",
  invoiced: "ink"
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

function quoteTotal(quote: QuoteRecord) {
  const subtotal = quote.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  return subtotal + calculateTax(subtotal);
}

export function IndustrialAdminQuotes() {
  const router = useRouter();
  const quotes = useQuoteStore((state) => state.quotes);
  const createQuote = useQuoteStore((state) => state.createQuote);
  const deleteQuote = useQuoteStore((state) => state.deleteQuote);
  const setActiveQuote = useQuoteStore((state) => state.setActiveQuote);

  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<QuoteTab>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void useQuoteStore.persist.rehydrate();
    setReady(true);
  }, []);

  const rows = useMemo(
    () =>
      (ready ? quotes : []).map((quote) => ({
        quote,
        status: quote.status || "draft",
        total: quoteTotal(quote)
      })),
    [ready, quotes]
  );

  const filtered = rows.filter(({ quote, status }) => {
    if (tab !== "all" && status !== tab) return false;
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return [quote.name, quote.quoteNumber, quote.customerName, quote.customerEmail]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term));
  });

  const tabsWithCount = TABS.map((entry) => ({
    ...entry,
    count:
      entry.id === "all"
        ? rows.length
        : rows.filter((row) => row.status === entry.id).length
  }));

  const openValue = rows
    .filter((row) => row.status !== "invoiced")
    .reduce((sum, row) => sum + row.total, 0);

  const stats = [
    { label: "Open quote value", value: formatUsd(openValue) },
    {
      label: "Draft quotes",
      value: String(rows.filter((row) => row.status === "draft").length)
    },
    {
      label: "Accepted",
      value: String(rows.filter((row) => row.status === "accepted").length)
    },
    { label: "Total documents", value: String(rows.length) }
  ];

  function handleNewQuote() {
    const quoteId = createQuote("New job quote");
    setActiveQuote(quoteId);
    router.push(`/industrial/admin/quotes/${quoteId}`);
  }

  return (
    <div className="grid gap-8">
      <AdminHeader
        eyebrow="Estimate center"
        title="Quotes"
        description="The full quote pipeline — create, price, and convert estimates into orders."
        action={
          <button
            className="inline-flex items-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
            onClick={handleNewQuote}
            type="button"
          >
            <Plus className="h-4 w-4" /> New quote
          </button>
        }
      />

      <AdminStatGrid stats={stats} />

      <section className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-d1-ink pb-3">
        <AdminTabs tabs={tabsWithCount} active={tab} onSelect={setTab} />
        <div className="flex items-center gap-2 border border-d1-line bg-white px-3">
          <Search className="h-4 w-4 text-d1-steel" />
          <input
            aria-label="Search quotes"
            className="h-9 w-56 bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search quote or customer"
            value={query}
          />
        </div>
      </section>

      {filtered.length ? (
        <div className="grid gap-px border border-d1-line bg-d1-line">
          {filtered.map(({ quote, status, total }) => {
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
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                      {quote.quoteNumber}
                    </span>
                    <AdminPill tone={STATUS_TONE[status]}>{status}</AdminPill>
                  </div>
                  <p className="mt-1.5 text-base font-bold text-d1-ink">
                    {quote.name}
                  </p>
                  <p className="text-[12px] text-d1-steel">
                    {unitCount} unit{unitCount === 1 ? "" : "s"} &middot; Due{" "}
                    {dateFormatter.format(
                      new Date(quote.dueAt || quote.expiresAt)
                    )}
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
                      className="inline-flex items-center gap-1.5 bg-d1-ink px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
                      href={`/industrial/admin/quotes/${quote.id}`}
                      onClick={() => setActiveQuote(quote.id)}
                    >
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      aria-label={`Delete ${quote.name}`}
                      className="grid h-9 w-9 place-items-center border border-d1-line text-d1-steel transition hover:border-d1-red hover:text-d1-red"
                      onClick={() => deleteQuote(quote.id)}
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
        <AdminEmptyState
          icon={<FileText className="h-9 w-9" />}
          title={ready ? "No quotes in this view" : "Loading quotes…"}
          description={
            ready ? "Create a quote or adjust the filters." : undefined
          }
        />
      )}
    </div>
  );
}
