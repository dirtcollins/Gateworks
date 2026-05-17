"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, FileText, LayoutTemplate, Plus, Search, Trash2 } from "lucide-react";
import { LEDGER, formatUsd, formatUsd0 } from "@/features/sites/ledger/kit";
import { formatLedgerDate } from "@/features/sites/ledger/quote-helpers";
import {
  deleteQuote,
  fetchQuotes,
  saveQuote,
  type DbQuote,
  type QuoteStatus
} from "@/lib/quotes-data";
import {
  AdminCard,
  AdminEmpty,
  AdminGhostButton,
  AdminHeading,
  AdminPrimaryButton,
  StatTile,
  StatusPill,
  titleCase
} from "./admin-kit";

type StatusFilter = "all" | QuoteStatus;

const STATUS_OPTIONS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "accepted", label: "Accepted" },
  { id: "invoiced", label: "Invoiced" },
  { id: "converted", label: "Converted" }
];

function quoteStatusTone(
  status: QuoteStatus
): "indigo" | "amber" | "mint" | "neutral" {
  if (status === "draft") return "amber";
  if (status === "sent") return "indigo";
  return "mint";
}

/* Ledger admin quotes — the operations quote list backed by the DB
 * (/api/quotes via quotes-data). Search, status filtering, quote
 * creation, start-from-template, and deletion. */
export function LedgerAdminQuotes() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<DbQuote[]>([]);
  const [templates, setTemplates] = useState<DbQuote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [busy, setBusy] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const load = useCallback(async () => {
    const [quoteResult, templateResult] = await Promise.all([
      fetchQuotes(),
      fetchQuotes({ templatesOnly: true })
    ]);
    setQuotes(quoteResult.quotes);
    setTemplates(templateResult.quotes);
    setConfigured(quoteResult.configured);
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(
    () =>
      quotes.map((quote) => ({
        quote,
        status: quote.status,
        total: quote.total,
        units: quote.items.reduce((sum, item) => sum + item.quantity, 0)
      })),
    [quotes]
  );

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return rows.filter(({ quote, status }) => {
      if (filter !== "all" && status !== filter) return false;
      if (!search) return true;
      return [
        quote.quoteNumber,
        quote.customerName,
        quote.customerEmail,
        status
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [rows, filter, query]);

  const summary = useMemo(() => {
    const pipeline = rows
      .filter(({ status }) => status !== "invoiced" && status !== "converted")
      .reduce((sum, row) => sum + row.total, 0);
    const drafts = rows.filter(({ status }) => status === "draft").length;
    const sent = rows.filter(({ status }) => status === "sent").length;
    const converted = rows.filter(
      ({ status }) => status === "converted" || status === "invoiced"
    ).length;
    return { pipeline, drafts, sent, converted };
  }, [rows]);

  async function handleNewQuote() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await saveQuote({
        status: "draft",
        createdBy: "Operations",
        terms: "Net 30",
        items: []
      });
      if (result.quote) {
        router.push(`/ledger/admin/quotes/${result.quote.id}`);
      } else {
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function startFromTemplate(template: DbQuote) {
    if (busy) return;
    setBusy(true);
    try {
      const result = await saveQuote({
        status: "draft",
        isTemplate: false,
        templateName: "",
        createdBy: "Operations",
        customerName: template.customerName,
        customerEmail: template.customerEmail,
        customerId: template.customerId,
        billingAddress: template.billingAddress,
        jobsiteAddress: template.jobsiteAddress,
        terms: template.terms,
        notes: template.notes,
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
      if (result.quote) {
        router.push(`/ledger/admin/quotes/${result.quote.id}`);
      } else {
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setQuotes((current) => current.filter((quote) => quote.id !== id));
    await deleteQuote(id);
    void load();
  }

  return (
    <div className="grid gap-6">
      <AdminHeading
        eyebrow="Operations"
        title="Quotes"
        description="Build, price, and track formal quotes. Drafts, templates, and customer assignment all persist to the quote database."
        action={
          <div className="flex gap-2">
            <AdminGhostButton onClick={() => setShowTemplates((open) => !open)}>
              <LayoutTemplate className="h-4 w-4" /> Templates ({templates.length})
            </AdminGhostButton>
            <AdminPrimaryButton disabled={busy} onClick={handleNewQuote}>
              <Plus className="h-4 w-4" /> New quote
            </AdminPrimaryButton>
          </div>
        }
      />

      {loaded && !configured ? (
        <div
          className="rounded-xl px-4 py-3 text-[12px] font-semibold"
          style={{ backgroundColor: LEDGER.amberSoft, color: LEDGER.amber }}
        >
          The quote database is not configured. Quotes are not yet persisted.
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Pipeline value"
          value={formatUsd0(summary.pipeline)}
          sub="Open quotes"
        />
        <StatTile
          label="Draft quotes"
          value={String(summary.drafts)}
          sub="Not yet sent"
        />
        <StatTile
          label="Sent"
          value={String(summary.sent)}
          sub="Awaiting response"
        />
        <StatTile
          label="Converted"
          value={String(summary.converted)}
          sub="Became orders"
        />
      </section>

      {showTemplates ? (
        <AdminCard className="p-4">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: LEDGER.muted }}
          >
            Reusable templates
          </p>
          {templates.length ? (
            <div className="mt-3 grid gap-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                  style={{ border: `1px solid ${LEDGER.line}` }}
                >
                  <div className="min-w-0">
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {template.templateName || template.quoteNumber}
                    </p>
                    <p className="text-[12px]" style={{ color: LEDGER.body }}>
                      {template.items.length} line item
                      {template.items.length === 1 ? "" : "s"} ·{" "}
                      {formatUsd(template.total)}
                    </p>
                  </div>
                  <button
                    className="rounded-lg px-3 py-1.5 text-[12px] font-semibold transition disabled:opacity-60"
                    disabled={busy}
                    onClick={() => startFromTemplate(template)}
                    style={{
                      backgroundColor: LEDGER.indigoSoft,
                      color: LEDGER.indigo
                    }}
                    type="button"
                  >
                    Start a quote
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[13px]" style={{ color: LEDGER.body }}>
              No templates yet. Save any quote as a template from its detail
              page.
            </p>
          )}
        </AdminCard>
      ) : null}

      <AdminCard>
        <div
          className="flex flex-wrap items-center justify-between gap-3 p-4"
          style={{ borderBottom: `1px solid ${LEDGER.line}` }}
        >
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((option) => {
              const active = filter === option.id;
              return (
                <button
                  key={option.id}
                  className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
                  onClick={() => setFilter(option.id)}
                  style={{
                    backgroundColor: active ? LEDGER.indigo : LEDGER.canvas,
                    color: active ? "#ffffff" : LEDGER.body
                  }}
                  type="button"
                >
                  {option.label}
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
              placeholder="Search quote, customer, or job"
              style={{ color: LEDGER.ink }}
              value={query}
            />
          </div>
        </div>

        {!loaded ? (
          <p
            className="px-5 py-14 text-center text-sm font-medium"
            style={{ color: LEDGER.muted }}
          >
            Loading quotes…
          </p>
        ) : visible.length === 0 ? (
          <AdminEmpty
            icon={<FileText className="h-9 w-9" />}
            title="No quotes in this view"
            description="Create a quote to start building an estimate."
          />
        ) : (
          <div>
            {visible.map(({ quote, status, total, units }) => (
              <div
                key={quote.id}
                className="grid gap-3 px-5 py-3.5 transition hover:bg-[#fafbfc] sm:grid-cols-[1.5fr_1fr_auto_auto] sm:items-center"
                style={{ borderBottom: `1px solid ${LEDGER.line}` }}
              >
                <div className="min-w-0">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: LEDGER.muted }}
                  >
                    {quote.quoteNumber} · {formatLedgerDate(quote.createdAt)}
                  </p>
                  <Link
                    className="mt-0.5 block truncate text-[14px] font-semibold transition hover:underline"
                    href={`/ledger/admin/quotes/${quote.id}`}
                    style={{ color: LEDGER.ink }}
                  >
                    {quote.customerName || "Unassigned quote"}
                  </Link>
                  <p className="text-[12px]" style={{ color: LEDGER.body }}>
                    {units} unit{units === 1 ? "" : "s"} · {quote.items.length}{" "}
                    line item{quote.items.length === 1 ? "" : "s"}
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
                  <StatusPill tone={quoteStatusTone(status)}>
                    {titleCase(status)}
                  </StatusPill>
                  <span
                    className="text-[14px] font-semibold"
                    style={{ color: LEDGER.ink }}
                  >
                    {formatUsd(total)}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <button
                    aria-label={`Delete ${quote.quoteNumber}`}
                    className="grid h-9 w-9 place-items-center rounded-lg transition"
                    onClick={() => void handleDelete(quote.id)}
                    style={{
                      border: `1px solid ${LEDGER.line}`,
                      color: LEDGER.muted
                    }}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Link
                    className="grid h-9 w-9 place-items-center rounded-lg transition"
                    href={`/ledger/admin/quotes/${quote.id}`}
                    style={{
                      backgroundColor: LEDGER.indigoSoft,
                      color: LEDGER.indigo
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
