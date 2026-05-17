// Wayfinder — customer quotes list. Reads the signed-in customer's quotes from
// the Supabase-backed quote API (@/lib/quotes-data), scoped by siteUserId. Shows
// status filter tabs, search, totals, create, delete, and a convert-to-order
// action. Degrades gracefully when Supabase is not configured.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserStore } from "@/lib/user-store";
import {
  convertQuoteToOrder,
  deleteQuote,
  fetchQuotes,
  saveQuote,
  type DbQuote
} from "@/lib/quotes-data";
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

type QuoteTab = "open" | "draft" | "converted" | "all";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  invoiced: "Invoiced",
  converted: "Converted"
};

export function WayfinderQuotes() {
  const router = useRouter();
  const userId = useUserStore((state) => state.userId);
  const displayName = useUserStore((state) => state.displayName);

  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [quotes, setQuotes] = useState<DbQuote[]>([]);
  const [tab, setTab] = useState<QuoteTab>("open");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const result = await fetchQuotes({ siteUserId: userId });
    setQuotes(result.quotes);
    setConfigured(result.configured);
    setReady(true);
  }, [userId]);

  useEffect(() => {
    useUserStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    setReady(false);
    void load();
  }, [load]);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 3200);
    return () => window.clearTimeout(handle);
  }, [message]);

  const rows = useMemo(
    () =>
      quotes
        .slice()
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() -
            new Date(a.updatedAt || a.createdAt).getTime()
        ),
    [quotes]
  );

  const openRows = rows.filter(
    (q) => q.status !== "invoiced" && q.status !== "converted"
  );
  const draftRows = rows.filter((q) => q.status === "draft");
  const convertedRows = rows.filter((q) => q.status === "converted");
  const openTotal = openRows.reduce((sum, q) => sum + q.total, 0);

  const visibleRows = rows.filter((quote) => {
    if (tab === "open" && (quote.status === "invoiced" || quote.status === "converted"))
      return false;
    if (tab === "draft" && quote.status !== "draft") return false;
    if (tab === "converted" && quote.status !== "converted") return false;
    const search = query.trim().toLowerCase();
    if (!search) return true;
    return [quote.quoteNumber, quote.customerName, quote.customerEmail, quote.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  });

  async function handleNewQuote() {
    if (busy) return;
    setBusy(true);
    const result = await saveQuote({
      status: "draft",
      siteUserId: userId,
      customerName: displayName && displayName !== "Guest" ? displayName : "",
      createdBy: displayName || "Customer",
      items: []
    });
    setBusy(false);
    if (result.quote) {
      router.push(`/wayfinder/quotes/${result.quote.id}`);
      return;
    }
    setMessage(
      result.persisted
        ? "Could not start a new quote."
        : "Quotes are not yet persisted — Supabase is not configured."
    );
  }

  async function handleDelete(id: string) {
    if (busy) return;
    if (!window.confirm("Delete this quote?")) return;
    setBusy(true);
    const result = await deleteQuote(id);
    if (result.persisted) {
      setQuotes((current) => current.filter((q) => q.id !== id));
      setMessage("Quote deleted.");
    } else {
      setMessage("Could not delete the quote.");
    }
    setBusy(false);
  }

  async function handleConvert(quote: DbQuote) {
    if (busy) return;
    if (!quote.items.length) {
      setMessage("Add a line item before converting to an order.");
      return;
    }
    if (!window.confirm(`Convert ${quote.quoteNumber} to a full order?`)) return;
    setBusy(true);
    const result = await convertQuoteToOrder(quote.id);
    setBusy(false);
    if (result.persisted) {
      setMessage(`Converted to order ${result.orderNumber || ""}.`.trim());
      void load();
    } else {
      setMessage("Could not convert the quote — Supabase may not be configured.");
    }
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
    { id: "converted", label: "Converted", count: convertedRows.length },
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
          <h1
            style={{
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              margin: "6px 0 0"
            }}
          >
            Your quotes
          </h1>
        </div>
        <Btn variant="primary" onClick={handleNewQuote} disabled={busy}>
          <Ico.plus size={14} /> Create a quote
        </Btn>
      </div>

      {!configured ? (
        <Card
          style={{
            padding: "10px 14px",
            marginBottom: 16,
            background: wf.amber,
            borderColor: wf.amberDeep
          }}
        >
          <Mono style={{ fontSize: 12, color: "#92500a" }}>
            Quotes are not yet persisted — Supabase is not configured. You can
            still build a quote, but it will not be saved.
          </Mono>
        </Card>
      ) : null}

      {message ? (
        <Card
          style={{
            padding: "10px 14px",
            marginBottom: 16,
            background: "#e7f0ea",
            borderColor: "#bcd6c6"
          }}
        >
          <Mono style={{ fontSize: 12, color: wf.pineDeep }}>{message}</Mono>
        </Card>
      ) : null}

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
          { label: "Converted", value: String(convertedRows.length) },
          { label: "Total documents", value: String(rows.length) }
        ].map((card) => (
          <Card key={card.label} style={{ padding: 14 }}>
            <Eyebrow>{card.label}</Eyebrow>
            <p
              style={{
                fontSize: 24,
                fontWeight: 900,
                margin: "8px 0 0",
                letterSpacing: "-0.02em"
              }}
            >
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
                    <Mono style={{ fontSize: 10, opacity: 0.75 }}>
                      {tabItem.count}
                    </Mono>
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
          visibleRows.map((quote, index) => {
            const lineCount = quote.items.reduce(
              (count, item) => count + item.quantity,
              0
            );
            const converted = quote.status === "converted";
            return (
              <div
                key={quote.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0, 1.4fr) minmax(0, 1fr) 110px 130px auto",
                  gap: 12,
                  alignItems: "center",
                  padding: 14,
                  borderBottom:
                    index < visibleRows.length - 1
                      ? `1px solid ${wf.hairline}`
                      : "none"
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <Mono style={{ fontSize: 11, color: wf.muted }}>
                    {quote.quoteNumber} · updated{" "}
                    {formatDate(quote.updatedAt || quote.createdAt)}
                  </Mono>
                  <div style={{ marginTop: 4 }}>
                    <Link
                      href={`/wayfinder/quotes/${quote.id}`}
                      style={{ fontSize: 15, fontWeight: 800, color: wf.ink }}
                    >
                      {quote.customerName || "Untitled quote"}
                    </Link>
                  </div>
                  <Mono style={{ fontSize: 11, color: wf.steel }}>
                    {lineCount} unit{lineCount === 1 ? "" : "s"}
                  </Mono>
                </div>

                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
                    {quote.jobsiteAddress
                      ? quote.jobsiteAddress.split("\n")[0]
                      : "No jobsite set"}
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
                  {STATUS_LABEL[quote.status] || quote.status}
                </span>

                <span
                  style={{ fontSize: 17, fontWeight: 900, textAlign: "right" }}
                >
                  {fmt(quote.total)}
                </span>

                <div
                  style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}
                >
                  <Btn size="xs" variant="primary" href={`/wayfinder/quotes/${quote.id}`}>
                    Open
                  </Btn>
                  {!converted ? (
                    <Btn
                      size="xs"
                      variant="default"
                      onClick={() => handleConvert(quote)}
                      disabled={busy}
                      title="Convert this quote to a full order"
                    >
                      To order
                    </Btn>
                  ) : null}
                  <Btn
                    size="xs"
                    variant="danger"
                    onClick={() => handleDelete(quote.id)}
                    disabled={busy}
                  >
                    <Ico.x size={12} />
                  </Btn>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>
              No quotes in this view.
            </p>
            <p style={{ fontSize: 13, color: wf.steel, margin: "6px 0 14px" }}>
              Create a quote to start building an estimate.
            </p>
            <Btn variant="primary" onClick={handleNewQuote} disabled={busy}>
              <Ico.plus size={14} /> Create a quote
            </Btn>
          </div>
        )}
      </Card>
    </div>
  );
}
