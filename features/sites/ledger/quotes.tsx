"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, FileText, Plus, Search, Trash2 } from "lucide-react";
import {
  Breadcrumb,
  Card,
  Eyebrow,
  LedgerPage,
  LEDGER,
  Pill,
  formatUsd
} from "./kit";
import { formatLedgerDate } from "./quote-helpers";
import { useUserStore } from "@/lib/user-store";
import {
  deleteQuote,
  fetchQuotes,
  saveQuote,
  type DbQuote,
  type QuoteStatus
} from "@/lib/quotes-data";

type QuoteTab = "open" | "draft" | "all";

const statusTone: Record<QuoteStatus, { bg: string; fg: string }> = {
  draft: { bg: LEDGER.amberSoft, fg: LEDGER.amber },
  sent: { bg: LEDGER.indigoSoft, fg: LEDGER.indigo },
  accepted: { bg: LEDGER.mintSoft, fg: LEDGER.mint },
  invoiced: { bg: LEDGER.mintSoft, fg: LEDGER.mint },
  converted: { bg: LEDGER.mintSoft, fg: LEDGER.mint }
};

/* Ledger customer quotes list — every DB quote scoped to the logged-in
 * account. Status filtering, search, totals, creation, and deletion. */
export function LedgerQuotesView() {
  const router = useRouter();
  const userId = useUserStore((state) => state.userId);
  const displayName = useUserStore((state) => state.displayName);
  const email = useUserStore((state) => state.email);

  const [quotes, setQuotes] = useState<DbQuote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [tab, setTab] = useState<QuoteTab>("open");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchQuotes({ siteUserId: userId });
    setQuotes(result.quotes);
    setConfigured(result.configured);
    setLoaded(true);
  }, [userId]);

  useEffect(() => {
    setLoaded(false);
    void load();
  }, [load]);

  const rows = useMemo(
    () =>
      quotes.map((quote) => ({
        quote,
        status: quote.status,
        total: quote.total
      })),
    [quotes]
  );

  const openRows = rows.filter(
    (row) => row.status !== "invoiced" && row.status !== "converted"
  );
  const draftRows = rows.filter((row) => row.status === "draft");
  const openValue = openRows.reduce((total, row) => total + row.total, 0);
  const invoicedCount = rows.filter(
    (row) => row.status === "invoiced" || row.status === "converted"
  ).length;

  const visibleRows = rows.filter(({ quote, status }) => {
    if (tab === "open" && (status === "invoiced" || status === "converted")) {
      return false;
    }
    if (tab === "draft" && status !== "draft") return false;
    const search = query.trim().toLowerCase();
    if (!search) return true;
    return [quote.quoteNumber, quote.customerName, quote.customerEmail, status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  async function handleNewQuote() {
    if (creating) return;
    setCreating(true);
    try {
      const result = await saveQuote({
        status: "draft",
        siteUserId: userId,
        customerName: displayName === "Guest" ? "" : displayName,
        customerEmail: email,
        terms: "Net 30",
        items: []
      });
      if (result.quote) {
        router.push(`/ledger/quotes/${result.quote.id}`);
      } else {
        await load();
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setQuotes((current) => current.filter((quote) => quote.id !== id));
    await deleteQuote(id);
    void load();
  }

  const tabs: Array<{ id: QuoteTab; label: string; count: number | null }> = [
    { id: "open", label: "Open", count: openRows.length },
    { id: "draft", label: "Draft", count: draftRows.length },
    { id: "all", label: "All", count: null }
  ];

  const summary = [
    { label: "Open quote value", value: formatUsd(openValue) },
    { label: "Draft quotes", value: String(draftRows.length) },
    { label: "Closed", value: String(invoicedCount) },
    { label: "Total documents", value: String(quotes.length) }
  ];

  return (
    <LedgerPage>
      <div className="py-5">
        <Breadcrumb
          trail={[{ label: "Overview", href: "/ledger" }, { label: "Quotes" }]}
        />
      </div>

      <header
        className="rounded-2xl p-6 sm:p-8"
        style={{ backgroundColor: LEDGER.ink }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Estimate center</Eyebrow>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Quotes
            </h1>
            <p
              className="mt-2 max-w-xl text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              Build, send, and track formal quotes for your account. Accepted
              quotes convert straight into a purchase order.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition disabled:opacity-60"
            disabled={creating}
            onClick={handleNewQuote}
            style={{ backgroundColor: LEDGER.indigo }}
            type="button"
          >
            <Plus className="h-4 w-4" /> {creating ? "Creating…" : "New quote"}
          </button>
        </div>
      </header>

      <div className="grid gap-3 py-8">
        {loaded && !configured ? (
          <div
            className="rounded-xl px-4 py-3 text-[12px] font-semibold"
            style={{ backgroundColor: LEDGER.amberSoft, color: LEDGER.amber }}
          >
            Quotes are not yet persisted — the quote database is not configured.
            New quotes will not be saved.
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summary.map((card) => (
            <Card key={card.label} className="p-4">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: LEDGER.muted }}
              >
                {card.label}
              </p>
              <p
                className="mt-2 text-2xl font-semibold tracking-tight"
                style={{ color: LEDGER.ink }}
              >
                {card.value}
              </p>
            </Card>
          ))}
        </div>

        <Card>
          <div
            className="flex flex-wrap items-center justify-between gap-3 p-4"
            style={{ borderBottom: `1px solid ${LEDGER.line}` }}
          >
            <div className="flex flex-wrap gap-1.5">
              {tabs.map((tabItem) => {
                const active = tab === tabItem.id;
                return (
                  <button
                    key={tabItem.id}
                    className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
                    onClick={() => setTab(tabItem.id)}
                    style={{
                      backgroundColor: active ? LEDGER.indigo : LEDGER.canvas,
                      color: active ? "#ffffff" : LEDGER.body
                    }}
                    type="button"
                  >
                    {tabItem.label}
                    {tabItem.count !== null ? ` (${tabItem.count})` : ""}
                  </button>
                );
              })}
            </div>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ border: `1px solid ${LEDGER.line}` }}
            >
              <Search className="h-4 w-4" style={{ color: LEDGER.muted }} />
              <input
                aria-label="Search quotes"
                className="w-44 bg-transparent text-[13px] outline-none sm:w-56"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search customer or quote #"
                style={{ color: LEDGER.ink }}
                value={query}
              />
            </div>
          </div>

          {!loaded ? (
            <p
              className="p-14 text-center text-[13px]"
              style={{ color: LEDGER.muted }}
            >
              Loading quotes…
            </p>
          ) : !visibleRows.length ? (
            <div className="p-14 text-center">
              <FileText
                className="mx-auto h-10 w-10"
                style={{ color: LEDGER.muted }}
              />
              <p
                className="mt-3 text-sm font-semibold"
                style={{ color: LEDGER.ink }}
              >
                No quotes in this view.
              </p>
              <button
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition disabled:opacity-60"
                disabled={creating}
                onClick={handleNewQuote}
                style={{ backgroundColor: LEDGER.indigo }}
                type="button"
              >
                <Plus className="h-4 w-4" /> Create a quote
              </button>
            </div>
          ) : (
            <div>
              {visibleRows.map(({ quote, status, total }) => {
                const tone = statusTone[status];
                const units = quote.items.reduce(
                  (count, item) => count + item.quantity,
                  0
                );
                return (
                  <Link
                    key={quote.id}
                    className="grid gap-3 p-4 transition hover:bg-[#fafbfc] sm:grid-cols-[1.4fr_1fr_auto_auto] sm:items-center"
                    href={`/ledger/quotes/${quote.id}`}
                    style={{ borderBottom: `1px solid ${LEDGER.line}` }}
                  >
                    <div className="min-w-0">
                      <p
                        className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                        style={{ color: LEDGER.muted }}
                      >
                        {quote.quoteNumber} · Updated{" "}
                        {formatLedgerDate(quote.updatedAt)}
                      </p>
                      <p
                        className="mt-1 truncate text-[15px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {quote.customerName || "New quote"}
                      </p>
                      <p className="text-[12px]" style={{ color: LEDGER.body }}>
                        {units} unit{units === 1 ? "" : "s"} ·{" "}
                        {quote.items.length} line item
                        {quote.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p
                        className="truncate text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {quote.customerName || "No customer"}
                      </p>
                      <p
                        className="truncate text-[12px]"
                        style={{ color: LEDGER.muted }}
                      >
                        {quote.customerEmail || "Add an email"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <Pill bg={tone.bg} fg={tone.fg}>
                        <span className="capitalize">{status}</span>
                      </Pill>
                      <span
                        className="text-[15px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {formatUsd(total)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:justify-end">
                      <button
                        aria-label={`Delete ${quote.quoteNumber}`}
                        className="grid h-9 w-9 place-items-center rounded-lg transition"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void handleDelete(quote.id);
                        }}
                        style={{
                          border: `1px solid ${LEDGER.line}`,
                          color: LEDGER.muted
                        }}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <span
                        className="grid h-9 w-9 place-items-center rounded-lg"
                        style={{
                          backgroundColor: LEDGER.indigoSoft,
                          color: LEDGER.indigo
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </LedgerPage>
  );
}
