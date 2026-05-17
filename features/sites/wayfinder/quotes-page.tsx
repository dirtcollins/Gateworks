// Wayfinder — quotes list. Reads every quote from the real @/lib/quote-store,
// with status filter tabs, search, create, rename, delete, and totals.
// Restyled in the Wayfinder identity. Logic ported from
// components/quotes-page-client.tsx.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuoteStore, type QuoteRecord } from "@/lib/quote-store";
import { calculateTax } from "@/lib/tax";
import { Btn, Card, Eyebrow, Ico, Mono, fmt, monoFont, wf } from "./kit";
import { WfInput } from "./cart-page";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

function formatDate(value: string) {
  return value ? dateFormatter.format(new Date(value)) : "—";
}

function quoteSubtotal(quote: QuoteRecord) {
  return quote.items.reduce((total, item) => total + item.price * item.quantity, 0);
}

function quoteTotal(quote: QuoteRecord) {
  const subtotal = quoteSubtotal(quote);
  return subtotal + calculateTax(subtotal);
}

type QuoteTab = "open" | "draft" | "all";

export function WayfinderQuotes() {
  const router = useRouter();
  const { quotes, createQuote, deleteQuote, renameQuote, setActiveQuote } = useQuoteStore();

  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<QuoteTab>("open");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    useQuoteStore.persist.rehydrate();
    setReady(true);
  }, []);

  const rows = useMemo(
    () =>
      quotes.map((quote) => ({
        quote,
        status: quote.status || "draft",
        total: quoteTotal(quote)
      })),
    [quotes]
  );

  const openRows = rows.filter((row) => row.status !== "invoiced");
  const draftRows = rows.filter((row) => row.status === "draft");
  const openTotal = openRows.reduce((total, row) => total + row.total, 0);
  const invoicedCount = rows.filter((row) => row.status === "invoiced").length;

  const visibleRows = rows.filter(({ quote, status }) => {
    if (tab === "open" && status === "invoiced") return false;
    if (tab === "draft" && status !== "draft") return false;
    const search = query.trim().toLowerCase();
    if (!search) return true;
    return [quote.name, quote.quoteNumber, quote.customerName, quote.customerEmail, status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  function handleNewQuote() {
    const id = createQuote("New job quote");
    setActiveQuote(id);
    router.push("/wayfinder/quote");
  }

  function finishRename() {
    if (!editingId) return;
    renameQuote(editingId, editingName);
    setEditingId("");
    setEditingName("");
  }

  if (!ready) {
    return (
      <div style={{ padding: 64, textAlign: "center", color: wf.muted }}>
        <Mono>Loading quotes…</Mono>
      </div>
    );
  }

  const tabs: Array<{ id: QuoteTab; label: string; count: number | null }> = [
    { id: "open", label: "Open", count: openRows.length },
    { id: "draft", label: "Draft", count: draftRows.length },
    { id: "all", label: "All", count: rows.length }
  ];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          borderBottom: `1px solid ${wf.rail}`,
          paddingBottom: 18,
          marginBottom: 20
        }}
      >
        <div>
          <Eyebrow>Estimate center</Eyebrow>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.02em", margin: "6px 0 0" }}>
            Quotes
          </h1>
        </div>
        <Btn variant="primary" onClick={handleNewQuote}>
          <Ico.plus size={14} /> Create a quote
        </Btn>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 16
        }}
      >
        {[
          { label: "Open value", value: fmt(openTotal) },
          { label: "Draft quotes", value: String(draftRows.length) },
          { label: "Invoiced", value: String(invoicedCount) },
          { label: "Total documents", value: String(rows.length) }
        ].map((card) => (
          <Card key={card.label} style={{ padding: 14 }}>
            <Eyebrow>{card.label}</Eyebrow>
            <p style={{ fontSize: 24, fontWeight: 900, margin: "8px 0 0", letterSpacing: "-0.02em" }}>
              {card.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card style={{ padding: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            padding: 14,
            borderBottom: `1px solid ${wf.hairline}`,
            background: wf.bone
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            {tabs.map((tabItem) => {
              const on = tab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  type="button"
                  onClick={() => setTab(tabItem.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    border: `1px solid ${on ? wf.ink : wf.rail}`,
                    background: on ? wf.ink : "#fff",
                    color: on ? "#fff" : wf.ink,
                    cursor: "pointer"
                  }}
                >
                  {tabItem.label}
                  {tabItem.count !== null ? (
                    <Mono style={{ fontSize: 10, opacity: 0.75 }}>{tabItem.count}</Mono>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div style={{ width: 260 }}>
            <WfInput
              placeholder="Search customer or quote number"
              value={query}
              onChange={setQuery}
            />
          </div>
        </div>

        {visibleRows.length ? (
          visibleRows.map(({ quote, status, total }, index) => {
            const lineCount = quote.items.reduce((count, item) => count + item.quantity, 0);
            return (
              <div
                key={quote.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr) 110px 130px auto",
                  gap: 12,
                  alignItems: "center",
                  padding: 14,
                  borderBottom:
                    index < visibleRows.length - 1 ? `1px solid ${wf.hairline}` : "none"
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <Mono style={{ fontSize: 11, color: wf.muted }}>
                    {quote.quoteNumber} · expires {formatDate(quote.expiresAt)}
                  </Mono>
                  {editingId === quote.id ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      onBlur={finishRename}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") event.currentTarget.blur();
                        if (event.key === "Escape") {
                          setEditingId("");
                          setEditingName("");
                        }
                      }}
                      style={{
                        marginTop: 4,
                        height: 32,
                        width: "100%",
                        border: `1px solid ${wf.ink}`,
                        padding: "0 8px",
                        fontSize: 14,
                        fontWeight: 800,
                        fontFamily: "inherit"
                      }}
                    />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {quote.name}
                      </span>
                      <button
                        type="button"
                        aria-label={`Rename ${quote.name}`}
                        onClick={() => {
                          setEditingId(quote.id);
                          setEditingName(quote.name);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: wf.muted,
                          display: "inline-flex"
                        }}
                      >
                        <Ico.clipboard size={13} />
                      </button>
                    </div>
                  )}
                  <Mono style={{ fontSize: 11, color: wf.steel }}>
                    {lineCount} unit{lineCount === 1 ? "" : "s"}
                  </Mono>
                </div>

                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                    {quote.customerName || "No customer selected"}
                  </p>
                  <Mono style={{ fontSize: 11, color: wf.muted }}>
                    {quote.customerEmail || "Add email before sending"}
                  </Mono>
                </div>

                <span
                  style={{
                    fontFamily: monoFont,
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    padding: "3px 8px",
                    border: `1px solid ${wf.rail}`,
                    color: wf.steel,
                    width: "fit-content"
                  }}
                >
                  {status}
                </span>

                <span style={{ fontSize: 17, fontWeight: 900, textAlign: "right" }}>
                  {fmt(total)}
                </span>

                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <Btn
                    size="xs"
                    variant="primary"
                    href={`/wayfinder/quotes/${quote.id}`}
                  >
                    Open
                  </Btn>
                  <Btn size="xs" variant="danger" onClick={() => deleteQuote(quote.id)}>
                    <Ico.x size={12} />
                  </Btn>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>No quotes in this view.</p>
            <p style={{ fontSize: 13, color: wf.steel, margin: "6px 0 14px" }}>
              Create a quote to start building an estimate.
            </p>
            <Btn variant="primary" onClick={handleNewQuote}>
              <Ico.plus size={14} /> Create a quote
            </Btn>
          </div>
        )}
      </Card>
    </div>
  );
}
