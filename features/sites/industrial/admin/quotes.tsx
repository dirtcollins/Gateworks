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
import {
  deleteQuote,
  fetchQuotes,
  quoteDisplayName,
  saveQuote,
  type DbQuote,
  type QuoteStatus
} from "@/features/sites/industrial/quote-data";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin quotes list. Reads + writes the DB-backed
 * quote system via `@/lib/quotes-data` (`/api/quotes`): real quote
 * list, create a quote, start a quote from a saved template, filter
 * by status, delete, and link into the admin quote detail.
 * ------------------------------------------------------------------ */

type QuoteTab =
  | "all"
  | "draft"
  | "sent"
  | "accepted"
  | "converted"
  | "templates";

const TABS: Array<{ id: QuoteTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "accepted", label: "Accepted" },
  { id: "converted", label: "Converted" },
  { id: "templates", label: "Templates" }
];

const STATUS_TONE: Record<QuoteStatus, "neutral" | "amber" | "pine" | "ink"> = {
  draft: "amber",
  sent: "neutral",
  accepted: "pine",
  invoiced: "ink",
  converted: "ink"
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

export function IndustrialAdminQuotes() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [quotes, setQuotes] = useState<DbQuote[]>([]);
  const [templates, setTemplates] = useState<DbQuote[]>([]);
  const [tab, setTab] = useState<QuoteTab>("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function reload() {
    const [quoteResult, templateResult] = await Promise.all([
      fetchQuotes(),
      fetchQuotes({ templatesOnly: true })
    ]);
    setQuotes(quoteResult.quotes);
    setTemplates(templateResult.quotes);
    setConfigured(quoteResult.configured);
    setReady(true);
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 3200);
    return () => window.clearTimeout(handle);
  }, [message]);

  const rows = useMemo(
    () =>
      (tab === "templates" ? templates : quotes).map((quote) => ({
        quote,
        status: quote.status || "draft",
        total: quote.total
      })),
    [tab, quotes, templates]
  );

  const filtered = rows.filter(({ quote, status }) => {
    if (tab !== "all" && tab !== "templates" && status !== tab) return false;
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return [
      quoteDisplayName(quote),
      quote.templateName,
      quote.quoteNumber,
      quote.customerName,
      quote.customerEmail
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term));
  });

  const tabsWithCount = TABS.map((entry) => ({
    ...entry,
    count:
      entry.id === "templates"
        ? templates.length
        : entry.id === "all"
          ? quotes.length
          : quotes.filter((quote) => quote.status === entry.id).length
  }));

  const openValue = quotes
    .filter(
      (quote) => quote.status !== "invoiced" && quote.status !== "converted"
    )
    .reduce((sum, quote) => sum + quote.total, 0);

  const stats = [
    { label: "Open quote value", value: formatUsd(openValue) },
    {
      label: "Draft quotes",
      value: String(quotes.filter((quote) => quote.status === "draft").length)
    },
    {
      label: "Templates",
      value: String(templates.length)
    },
    { label: "Total quotes", value: String(quotes.length) }
  ];

  async function handleNewQuote() {
    if (busy) return;
    setBusy(true);
    try {
      const { quote, persisted } = await saveQuote({
        status: "draft",
        notes: "New job quote",
        createdBy: "Admin",
        items: []
      });
      if (persisted && quote?.id) {
        router.push(`/industrial/admin/quotes/${quote.id}`);
        return;
      }
      setMessage("Supabase is not configured — the quote was not created.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFromTemplate(templateId: string) {
    if (busy) return;
    const template = templates.find((entry) => entry.id === templateId);
    if (!template) return;
    setBusy(true);
    try {
      const { quote, persisted } = await saveQuote({
        status: "draft",
        isTemplate: false,
        templateName: "",
        notes: quoteDisplayName(template),
        terms: template.terms,
        subtotal: template.subtotal,
        tax: template.tax,
        total: template.total,
        createdBy: "Admin",
        items: template.items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          title: item.title,
          options: item.options,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal
        }))
      });
      if (persisted && quote?.id) {
        router.push(`/industrial/admin/quotes/${quote.id}`);
        return;
      }
      setMessage("Supabase is not configured — could not start from template.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    const { persisted } = await deleteQuote(id);
    if (persisted) {
      setQuotes((current) => current.filter((quote) => quote.id !== id));
      setTemplates((current) => current.filter((quote) => quote.id !== id));
    }
  }

  return (
    <div className="grid gap-8">
      <AdminHeader
        eyebrow="Estimate center"
        title="Quotes"
        description="The full quote pipeline — create, price, save templates, and convert estimates into orders."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy}
              onClick={handleNewQuote}
              type="button"
            >
              <Plus className="h-4 w-4" /> New quote
            </button>
            {templates.length ? (
              <select
                aria-label="Start from a template"
                className="border border-d1-ink bg-white px-3 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink outline-none"
                disabled={busy}
                onChange={(event) => {
                  if (event.target.value) {
                    void handleFromTemplate(event.target.value);
                    event.target.value = "";
                  }
                }}
                value=""
              >
                <option value="">From template…</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.templateName || quoteDisplayName(template)}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        }
      />

      {!configured ? (
        <p className="border border-d1-amber bg-d1-amber/10 px-4 py-3 text-[12px] font-bold text-d1-ink">
          Quotes are not yet persisted — Supabase is not configured. Quote
          changes will not be saved.
        </p>
      ) : null}
      {message ? (
        <p className="border border-d1-amber bg-d1-amber/10 px-4 py-3 text-[12px] font-bold text-d1-ink">
          {message}
        </p>
      ) : null}

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
            const isTemplate = quote.isTemplate;
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
                    {isTemplate ? (
                      <AdminPill tone="pine">Template</AdminPill>
                    ) : (
                      <AdminPill tone={STATUS_TONE[status]}>{status}</AdminPill>
                    )}
                  </div>
                  <p className="mt-1.5 text-base font-bold text-d1-ink">
                    {isTemplate
                      ? quote.templateName || quoteDisplayName(quote)
                      : quoteDisplayName(quote)}
                  </p>
                  <p className="text-[12px] text-d1-steel">
                    {unitCount} unit{unitCount === 1 ? "" : "s"} &middot; Updated{" "}
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
                    {isTemplate ? (
                      <button
                        className="inline-flex items-center gap-1.5 bg-d1-pine px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-ink disabled:opacity-50"
                        disabled={busy}
                        onClick={() => handleFromTemplate(quote.id)}
                        type="button"
                      >
                        Use
                      </button>
                    ) : null}
                    <Link
                      className="inline-flex items-center gap-1.5 bg-d1-ink px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
                      href={`/industrial/admin/quotes/${quote.id}`}
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
