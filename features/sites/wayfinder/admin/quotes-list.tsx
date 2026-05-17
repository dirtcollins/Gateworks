// Wayfinder admin — quotes list. Reads and writes the real quote store
// (lib/quote-store, useQuoteStore) — the same store the storefront quote
// builder uses. Supports search, status filtering, creating a quote, and
// deleting one. Pipeline KPIs are computed from live quote items.
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuoteStore, type QuoteRecord } from "@/lib/quote-store";
import { calculateTax } from "@/lib/tax";
import { fmt } from "../kit";
import {
  AdminBtn,
  DataTable,
  FilterChips,
  Ico,
  Kpi,
  Mono,
  Panel,
  PageHead,
  Pill,
  TextInput,
  monoFont,
  wf,
  type Column
} from "./admin-kit";
import { formatDate } from "./order-helpers";

type QuoteStatus = QuoteRecord["status"];
type StatusTab = "all" | QuoteStatus;

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "accepted", label: "Accepted" },
  { id: "invoiced", label: "Invoiced" }
];

const STATUS_TONE: Record<QuoteStatus, "open" | "warn" | "active" | "done"> = {
  draft: "open",
  sent: "warn",
  accepted: "active",
  invoiced: "done"
};

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  invoiced: "Invoiced"
};

export function quoteSubtotal(quote: QuoteRecord) {
  return quote.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function quoteTotal(quote: QuoteRecord) {
  const subtotal = quoteSubtotal(quote);
  return subtotal + calculateTax(subtotal);
}

export function WayfinderQuotesList() {
  const router = useRouter();
  const quotes = useQuoteStore((state) => state.quotes);
  const createQuote = useQuoteStore((state) => state.createQuote);
  const deleteQuote = useQuoteStore((state) => state.deleteQuote);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");

  useEffect(() => {
    useQuoteStore.persist.rehydrate();
    setReady(true);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quotes
      .filter((quote) => {
        const hit =
          !q ||
          quote.quoteNumber.toLowerCase().includes(q) ||
          quote.name.toLowerCase().includes(q) ||
          quote.customerName.toLowerCase().includes(q) ||
          quote.items.some((item) => item.sku.toLowerCase().includes(q));
        return hit && (tab === "all" || quote.status === tab);
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      );
  }, [quotes, query, tab]);

  const kpis = useMemo(() => {
    const open = quotes.filter((q) => q.status === "draft" || q.status === "sent");
    const pipeline = quotes
      .filter((q) => q.status !== "invoiced")
      .reduce((sum, q) => sum + quoteTotal(q), 0);
    const accepted = quotes.filter((q) => q.status === "accepted").length;
    return { count: quotes.length, open: open.length, pipeline, accepted };
  }, [quotes]);

  function handleCreate() {
    const id = createQuote("New job quote");
    router.push(`/wayfinder/admin/quotes/${encodeURIComponent(id)}`);
  }

  const columns: Column<QuoteRecord>[] = [
    {
      key: "number",
      header: "Quote",
      render: (q) => (
        <div style={{ display: "grid", gap: 2 }}>
          <Mono style={{ fontWeight: 700, fontSize: 12 }}>{q.quoteNumber}</Mono>
          <span style={{ fontSize: 11, color: wf.muted }}>{q.name}</span>
        </div>
      )
    },
    {
      key: "customer",
      header: "Customer",
      render: (q) => (
        <span style={{ fontWeight: 700 }}>{q.customerName || "Unassigned"}</span>
      )
    },
    {
      key: "items",
      header: "Items",
      align: "right",
      render: (q) => <Mono>{q.items.length}</Mono>
    },
    {
      key: "status",
      header: "Status",
      render: (q) => <Pill tone={STATUS_TONE[q.status]}>{STATUS_LABEL[q.status]}</Pill>
    },
    {
      key: "updated",
      header: "Updated",
      render: (q) => (
        <span style={{ fontFamily: monoFont, fontSize: 11, color: wf.steel }}>
          {formatDate(q.updatedAt || q.createdAt)}
        </span>
      )
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (q) => <Mono style={{ fontWeight: 700 }}>{fmt(quoteTotal(q))}</Mono>
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (q) => (
        <div style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>
          <AdminBtn
            size="sm"
            variant="danger"
            onClick={() => deleteQuote(q.id)}
            title="Delete quote"
          >
            <Ico.x size={12} />
          </AdminBtn>
          <AdminBtn
            size="sm"
            variant="primary"
            href={`/wayfinder/admin/quotes/${encodeURIComponent(q.id)}`}
          >
            Open
          </AdminBtn>
        </div>
      )
    }
  ];

  return (
    <>
      <PageHead
        eyebrow="Operations"
        title="Quotes"
        desc="The quote pipeline — draft, send, and convert customer quotes into invoiced jobs."
        action={
          <AdminBtn variant="primary" onClick={handleCreate}>
            <Ico.plus size={14} /> New quote
          </AdminBtn>
        }
      />

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))"
        }}
      >
        <Kpi label="Pipeline value" value={fmt(kpis.pipeline, { cents: false })} hint="open quotes" />
        <Kpi label="Total quotes" value={kpis.count} hint="all statuses" />
        <Kpi label="Open" value={kpis.open} hint="draft + sent" tone="safety" />
        <Kpi label="Accepted" value={kpis.accepted} hint="ready to invoice" tone="pine" />
      </div>

      <Panel
        title="Quote pipeline"
        meta={ready ? `${filtered.length} of ${quotes.length} quotes` : "Loading…"}
        action={
          <div style={{ width: 260, maxWidth: "48vw" }}>
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search quote, customer, SKU…"
              style={{ height: 34, fontSize: 12 }}
            />
          </div>
        }
        pad={false}
      >
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${wf.hairline}` }}>
          <FilterChips value={tab} options={STATUS_TABS} onChange={setTab} />
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          getKey={(q) => q.id}
          empty={ready ? "No quotes match the current filters." : "Loading quotes…"}
        />
      </Panel>
    </>
  );
}
