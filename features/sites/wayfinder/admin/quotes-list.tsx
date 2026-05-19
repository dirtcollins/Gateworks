// Wayfinder admin — quotes list. Reads the Supabase-backed quote API
// (@/lib/quotes-data via /api/quotes): the live quote pipeline, reusable
// templates, and customer purchase orders awaiting approval. Supports search,
// status filtering, creating a quote, starting a quote from a template, and
// deleting quotes. PO approvals (approve / reject / fulfill) PATCH /api/orders.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import {
  deleteQuote,
  fetchQuotes,
  saveQuote,
  type DbQuote
} from "@/lib/quotes-data";
import { fmt } from "../kit";
import {
  AdminBtn,
  DataTable,
  FilterChips,
  Ico,
  Kpi,
  Mono,
  Notice,
  Panel,
  PageHead,
  Pill,
  SelectInput,
  TextInput,
  monoFont,
  wf,
  type Column
} from "./admin-kit";
import { formatDate } from "./order-helpers";

// The orders API returns poNumber / poStatus on every order row, but the
// shared OrderRecord type does not declare them — extend it locally.
type PoOrder = OrderRecord & { poNumber?: string; poStatus?: string };

type View = "quotes" | "templates" | "purchase-orders";
type StatusTab = "all" | "draft" | "sent" | "accepted" | "invoiced" | "converted";

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "accepted", label: "Accepted" },
  { id: "invoiced", label: "Invoiced" },
  { id: "converted", label: "Converted" }
];

const STATUS_TONE: Record<string, "open" | "warn" | "active" | "done" | "neutral"> = {
  draft: "open",
  sent: "warn",
  accepted: "active",
  invoiced: "done",
  converted: "neutral"
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  invoiced: "Invoiced",
  converted: "Converted"
};

// Customer PO statuses on orders carrying a poNumber.
const PO_STATUS_LABEL: Record<string, string> = {
  none: "—",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  fulfilled: "Fulfilled"
};

const PO_STATUS_TONE: Record<string, "open" | "warn" | "active" | "done" | "stop" | "neutral"> = {
  none: "neutral",
  submitted: "warn",
  approved: "active",
  rejected: "stop",
  fulfilled: "done"
};

export function WayfinderQuotesList() {
  const router = useRouter();
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);

  const [view, setView] = useState<View>("quotes");
  const [quotes, setQuotes] = useState<DbQuote[]>([]);
  const [templates, setTemplates] = useState<DbQuote[]>([]);
  const [configured, setConfigured] = useState(true);
  const [ready, setReady] = useState(false);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");
  const [busy, setBusy] = useState(false);
  const [templateChoice, setTemplateChoice] = useState("");
  const [message, setMessage] = useState("");

  const loadQuotes = useCallback(async () => {
    const [quoteResult, templateResult] = await Promise.all([
      fetchQuotes({}),
      fetchQuotes({ templatesOnly: true })
    ]);
    setQuotes(quoteResult.quotes);
    setTemplates(templateResult.quotes);
    setConfigured(quoteResult.configured);
    setReady(true);
  }, []);

  useEffect(() => {
    void loadQuotes();
  }, [loadQuotes]);

  useEffect(() => {
    useOrderStore.persist.rehydrate();
    async function load() {
      try {
        const res = await fetch("/api/orders?limit=250", { cache: "no-store" });
        if (res.ok) {
          const payload = (await res.json()) as {
            orders?: OrderRecord[];
            persisted?: boolean;
          };
          if (payload.persisted && payload.orders) setOrders(payload.orders);
        }
      } finally {
        setOrdersLoaded(true);
      }
    }
    void load();
  }, [setOrders]);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 3200);
    return () => window.clearTimeout(handle);
  }, [message]);

  // Customer purchase orders = orders with a poNumber set.
  const purchaseOrders = useMemo<PoOrder[]>(
    () =>
      (storedOrders as PoOrder[])
        .filter((order) => order.poNumber && order.poNumber.trim())
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [storedOrders]
  );

  const filteredQuotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quotes
      .filter((quote) => {
        const hit =
          !q ||
          quote.quoteNumber.toLowerCase().includes(q) ||
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

  const filteredPurchaseOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return purchaseOrders;
    return purchaseOrders.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(q) ||
        (order.poNumber || "").toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.companyName.toLowerCase().includes(q)
    );
  }, [purchaseOrders, query]);

  const kpis = useMemo(() => {
    const open = quotes.filter(
      (q) => q.status === "draft" || q.status === "sent"
    );
    const pipeline = quotes
      .filter((q) => q.status !== "invoiced" && q.status !== "converted")
      .reduce((sum, q) => sum + q.total, 0);
    const accepted = quotes.filter((q) => q.status === "accepted").length;
    return { count: quotes.length, open: open.length, pipeline, accepted };
  }, [quotes]);

  async function handleStartFromTemplate() {
    if (busy || !templateChoice) return;
    const template = templates.find((t) => t.id === templateChoice);
    if (!template) return;
    setBusy(true);
    const result = await saveQuote({
      status: "draft",
      isTemplate: false,
      templateName: "",
      customerName: template.customerName,
      customerEmail: template.customerEmail,
      billingAddress: template.billingAddress,
      jobsiteAddress: template.jobsiteAddress,
      terms: template.terms,
      notes: template.notes,
      createdBy: "Counter staff",
      subtotal: template.subtotal,
      tax: template.tax,
      total: template.total,
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
    setBusy(false);
    if (result.quote) {
      router.push(`/admin/quotes/${encodeURIComponent(result.quote.id)}`);
    } else {
      setMessage("Could not start a quote from this template.");
    }
  }

  async function handleDelete(quote: DbQuote) {
    if (busy) return;
    if (!window.confirm(`Delete ${quote.quoteNumber}?`)) return;
    setBusy(true);
    const result = await deleteQuote(quote.id);
    if (result.persisted) {
      setQuotes((current) => current.filter((q) => q.id !== quote.id));
      setTemplates((current) => current.filter((q) => q.id !== quote.id));
      setMessage("Quote deleted.");
    } else {
      setMessage("Could not delete the quote.");
    }
    setBusy(false);
  }

  async function setPoStatus(order: PoOrder, poStatus: string) {
    if (busy) return;
    setBusy(true);
    const response = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, poStatus })
    }).catch(() => null);
    setBusy(false);
    if (response && response.ok) {
      const res = await fetch("/api/orders?limit=250", { cache: "no-store" });
      if (res.ok) {
        const payload = (await res.json()) as {
          orders?: OrderRecord[];
          persisted?: boolean;
        };
        if (payload.persisted && payload.orders) setOrders(payload.orders);
      }
      setMessage(`Purchase order ${PO_STATUS_LABEL[poStatus] || poStatus}.`);
    } else {
      setMessage("Could not update the purchase order.");
    }
  }

  const quoteColumns: Column<DbQuote>[] = [
    {
      key: "number",
      header: "Quote",
      render: (q) => (
        <div style={{ display: "grid", gap: 2 }}>
          <Mono style={{ fontWeight: 700, fontSize: 12 }}>{q.quoteNumber}</Mono>
          <span style={{ fontSize: 11, color: wf.muted }}>
            {q.isTemplate
              ? q.templateName || "Template"
              : q.notes
                ? q.notes.slice(0, 40)
                : "—"}
          </span>
        </div>
      )
    },
    {
      key: "customer",
      header: "Customer",
      render: (q) => (
        <span style={{ fontWeight: 700 }}>
          {q.customerName || "Unassigned"}
        </span>
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
      render: (q) =>
        q.isTemplate ? (
          <Pill tone="neutral">Template</Pill>
        ) : (
          <Pill tone={STATUS_TONE[q.status] || "neutral"}>
            {STATUS_LABEL[q.status] || q.status}
          </Pill>
        )
    },
    {
      key: "updated",
      header: "Updated",
      render: (q) => (
        <span
          style={{ fontFamily: monoFont, fontSize: 11, color: wf.steel }}
        >
          {formatDate(q.updatedAt || q.createdAt)}
        </span>
      )
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (q) => (
        <Mono style={{ fontWeight: 700 }}>{fmt(q.total)}</Mono>
      )
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
            onClick={() => handleDelete(q)}
            disabled={busy}
            title="Delete quote"
          >
            <Ico.x size={12} />
          </AdminBtn>
          <AdminBtn
            size="sm"
            variant="primary"
            href={`/admin/quotes/${encodeURIComponent(q.id)}`}
          >
            Open
          </AdminBtn>
        </div>
      )
    }
  ];

  const poColumns: Column<PoOrder>[] = [
    {
      key: "po",
      header: "PO number",
      render: (o) => (
        <div style={{ display: "grid", gap: 2 }}>
          <Mono style={{ fontWeight: 700, fontSize: 12 }}>{o.poNumber}</Mono>
          <Mono style={{ fontSize: 10, color: wf.muted }}>{o.orderNumber}</Mono>
        </div>
      )
    },
    {
      key: "customer",
      header: "Customer",
      render: (o) => (
        <span style={{ fontWeight: 700 }}>
          {o.companyName || o.customerName || "Unknown"}
        </span>
      )
    },
    {
      key: "placed",
      header: "Placed",
      render: (o) => (
        <span style={{ fontFamily: monoFont, fontSize: 11, color: wf.steel }}>
          {formatDate(o.createdAt)}
        </span>
      )
    },
    {
      key: "po-status",
      header: "PO status",
      render: (o) => (
        <Pill tone={PO_STATUS_TONE[o.poStatus || "none"] || "neutral"}>
          {PO_STATUS_LABEL[o.poStatus || "none"] || o.poStatus}
        </Pill>
      )
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (o) => <Mono style={{ fontWeight: 700 }}>{fmt(o.total)}</Mono>
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (o) => {
        const status = o.poStatus || "none";
        return (
          <div
            style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}
          >
            {status === "submitted" ? (
              <>
                <AdminBtn
                  size="sm"
                  variant="danger"
                  onClick={() => setPoStatus(o, "rejected")}
                  disabled={busy}
                >
                  Reject
                </AdminBtn>
                <AdminBtn
                  size="sm"
                  variant="primary"
                  onClick={() => setPoStatus(o, "approved")}
                  disabled={busy}
                >
                  Approve
                </AdminBtn>
              </>
            ) : null}
            {status === "approved" ? (
              <AdminBtn
                size="sm"
                variant="primary"
                onClick={() => setPoStatus(o, "fulfilled")}
                disabled={busy}
              >
                Mark fulfilled
              </AdminBtn>
            ) : null}
            {status === "rejected" ? (
              <AdminBtn
                size="sm"
                onClick={() => setPoStatus(o, "submitted")}
                disabled={busy}
              >
                Reopen
              </AdminBtn>
            ) : null}
            <AdminBtn
              size="sm"
              href={`/admin/orders/${encodeURIComponent(o.id)}`}
            >
              Order
            </AdminBtn>
          </div>
        );
      }
    }
  ];

  const showingQuotes = view === "quotes" || view === "templates";
  const tableRows =
    view === "templates"
      ? templates.filter((t) => {
          const q = query.trim().toLowerCase();
          return (
            !q ||
            t.quoteNumber.toLowerCase().includes(q) ||
            t.templateName.toLowerCase().includes(q) ||
            t.customerName.toLowerCase().includes(q)
          );
        })
      : filteredQuotes;

  return (
    <>
      <PageHead
        eyebrow="Operations"
        title="Quotes"
        desc="The quote pipeline — draft, send, template, and convert customer quotes into invoiced jobs."
        action={
          <AdminBtn variant="primary" href="/admin/quotes/new">
            <Ico.plus size={14} /> New quote
          </AdminBtn>
        }
      />

      {!configured ? (
        <Notice tone="warn">
          Supabase is not configured — quotes are not yet persisted. The pipeline
          will appear empty until the database is connected.
        </Notice>
      ) : null}
      {message ? <Notice tone="good">{message}</Notice> : null}

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))"
        }}
      >
        <Kpi
          label="Pipeline value"
          value={fmt(kpis.pipeline, { cents: false })}
          hint="open quotes"
        />
        <Kpi label="Total quotes" value={kpis.count} hint="all statuses" />
        <Kpi label="Open" value={kpis.open} hint="draft + sent" tone="safety" />
        <Kpi
          label="Customer POs"
          value={purchaseOrders.length}
          hint="awaiting approval"
          tone="pine"
        />
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <FilterChips
          value={view}
          options={[
            { id: "quotes", label: `Quotes (${quotes.length})` },
            { id: "templates", label: `Templates (${templates.length})` },
            {
              id: "purchase-orders",
              label: `Customer POs (${purchaseOrders.length})`
            }
          ]}
          onChange={setView}
        />
      </div>

      {view === "templates" ? (
        <Panel title="Start a quote from a template">
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              flexWrap: "wrap"
            }}
          >
            <div style={{ width: 320, maxWidth: "100%" }}>
              <SelectInput
                value={templateChoice}
                onChange={(event) => setTemplateChoice(event.target.value)}
              >
                <option value="">Select a template…</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.templateName || template.quoteNumber} (
                    {template.items.length} items)
                  </option>
                ))}
              </SelectInput>
            </div>
            <AdminBtn
              variant="primary"
              onClick={handleStartFromTemplate}
              disabled={busy || !templateChoice}
            >
              <Ico.plus size={14} /> Start quote
            </AdminBtn>
          </div>
        </Panel>
      ) : null}

      <Panel
        title={
          view === "purchase-orders"
            ? "Customer purchase orders"
            : view === "templates"
              ? "Quote templates"
              : "Quote pipeline"
        }
        meta={
          ready
            ? showingQuotes
              ? `${tableRows.length} of ${
                  view === "templates" ? templates.length : quotes.length
                } records`
              : `${filteredPurchaseOrders.length} of ${purchaseOrders.length} purchase orders`
            : "Loading…"
        }
        action={
          <div style={{ width: 260, maxWidth: "100%" }}>
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                view === "purchase-orders"
                  ? "Search PO, order, customer…"
                  : "Search quote, customer, SKU…"
              }
              style={{ height: 34, fontSize: 12 }}
            />
          </div>
        }
        pad={false}
      >
        {view === "quotes" ? (
          <div
            style={{ padding: "12px 16px", borderBottom: `1px solid ${wf.hairline}` }}
          >
            <FilterChips value={tab} options={STATUS_TABS} onChange={setTab} />
          </div>
        ) : null}

        {view === "purchase-orders" ? (
          <DataTable
            columns={poColumns}
            rows={filteredPurchaseOrders}
            getKey={(o) => o.id}
            onRowHref={(o) => `/admin/orders/${encodeURIComponent(o.id)}`}
            empty={
              ordersLoaded
                ? "No customer purchase orders yet."
                : "Loading purchase orders…"
            }
          />
        ) : (
          <DataTable
            columns={quoteColumns}
            rows={tableRows}
            getKey={(q) => q.id}
            onRowHref={(q) => `/admin/quotes/${encodeURIComponent(q.id)}`}
            empty={
              ready
                ? view === "templates"
                  ? "No templates yet. Save a quote as a template from the quote detail."
                  : "No quotes match the current filters."
                : "Loading quotes…"
            }
          />
        )}
      </Panel>
    </>
  );
}
