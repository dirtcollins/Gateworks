// Wayfinder admin — procurement (supplier purchase orders). Reads the
// Supabase-backed procurement API (@/lib/quotes-data via /api/procurement):
// the inbound supplier-PO list, create a PO, send a PO, and delete a PO.
// Receiving against a PO happens on the detail page. Framed in the warehouse
// inbound-receiving theme — every PO lands at the receiving dock.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteProcurementOrder,
  fetchProcurementOrders,
  saveProcurementOrder,
  type ProcurementOrder,
  type ProcurementStatus
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
  TextInput,
  monoFont,
  wf,
  type Column
} from "./admin-kit";
import { formatDate } from "./order-helpers";

type StatusTab = "all" | ProcurementStatus;

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "partial", label: "Partial" },
  { id: "received", label: "Received" },
  { id: "closed", label: "Closed" }
];

const STATUS_LABEL: Record<ProcurementStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  partial: "Partial receipt",
  received: "Received",
  closed: "Closed"
};

const STATUS_TONE: Record<ProcurementStatus, "open" | "warn" | "active" | "done" | "neutral"> = {
  draft: "open",
  sent: "warn",
  partial: "active",
  received: "done",
  closed: "neutral"
};

export function WayfinderProcurementList() {
  const router = useRouter();
  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [configured, setConfigured] = useState(true);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const result = await fetchProcurementOrders();
    setOrders(result.orders);
    setConfigured(result.configured);
    setReady(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 3200);
    return () => window.clearTimeout(handle);
  }, [message]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((order) => {
        const status = (order.status as ProcurementStatus) || "draft";
        const hit =
          !q ||
          order.poNumber.toLowerCase().includes(q) ||
          order.supplierName.toLowerCase().includes(q) ||
          order.items.some((item) => item.sku.toLowerCase().includes(q));
        return hit && (tab === "all" || status === tab);
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      );
  }, [orders, query, tab]);

  const kpis = useMemo(() => {
    const inbound = orders.filter(
      (o) => o.status === "sent" || o.status === "partial"
    );
    const onOrder = inbound.reduce((sum, o) => sum + o.total, 0);
    const unitsExpected = orders
      .filter((o) => o.status !== "closed")
      .reduce(
        (sum, o) =>
          sum +
          o.items.reduce(
            (count, item) =>
              count +
              Math.max(0, item.quantityOrdered - item.quantityReceived),
            0
          ),
        0
      );
    return { count: orders.length, inbound: inbound.length, onOrder, unitsExpected };
  }, [orders]);

  async function handleCreate() {
    if (busy) return;
    setBusy(true);
    const result = await saveProcurementOrder({
      supplierName: "New supplier",
      status: "draft",
      items: []
    });
    setBusy(false);
    if (result.order) {
      router.push(
        `/admin/procurement/${encodeURIComponent(result.order.id)}`
      );
    } else {
      setMessage("Could not create the PO — Supabase is not configured.");
    }
  }

  async function handleSend(order: ProcurementOrder) {
    if (busy) return;
    setBusy(true);
    const result = await saveProcurementOrder({
      id: order.id,
      status: "sent"
    });
    setBusy(false);
    if (result.order) {
      void load();
      setMessage(`${order.poNumber} marked sent to ${order.supplierName}.`);
    } else {
      setMessage("Could not update the PO.");
    }
  }

  async function handleDelete(order: ProcurementOrder) {
    if (busy) return;
    if (!window.confirm(`Delete ${order.poNumber}?`)) return;
    setBusy(true);
    const result = await deleteProcurementOrder(order.id);
    if (result.persisted) {
      setOrders((current) => current.filter((o) => o.id !== order.id));
      setMessage("Purchase order deleted.");
    } else {
      setMessage("Could not delete the PO.");
    }
    setBusy(false);
  }

  const columns: Column<ProcurementOrder>[] = [
    {
      key: "po",
      header: "PO number",
      render: (o) => (
        <div style={{ display: "grid", gap: 2 }}>
          <Mono style={{ fontWeight: 700, fontSize: 12 }}>{o.poNumber}</Mono>
          <span style={{ fontSize: 11, color: wf.muted }}>
            {o.items.length} line{o.items.length === 1 ? "" : "s"}
          </span>
        </div>
      )
    },
    {
      key: "supplier",
      header: "Supplier",
      render: (o) => (
        <span style={{ fontWeight: 700 }}>{o.supplierName || "—"}</span>
      )
    },
    {
      key: "expected",
      header: "Expected",
      render: (o) => (
        <span style={{ fontFamily: monoFont, fontSize: 11, color: wf.steel }}>
          {o.expectedAt ? formatDate(o.expectedAt) : "Not scheduled"}
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (o) => (
        <Pill tone={STATUS_TONE[(o.status as ProcurementStatus) || "draft"]}>
          {STATUS_LABEL[(o.status as ProcurementStatus) || "draft"]}
        </Pill>
      )
    },
    {
      key: "received",
      header: "Received",
      align: "right",
      render: (o) => {
        const ordered = o.items.reduce(
          (sum, item) => sum + item.quantityOrdered,
          0
        );
        const received = o.items.reduce(
          (sum, item) => sum + item.quantityReceived,
          0
        );
        return (
          <Mono style={{ fontSize: 11 }}>
            {received} / {ordered}
          </Mono>
        );
      }
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
      render: (o) => (
        <div style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}>
          {o.status === "draft" ? (
            <AdminBtn
              size="sm"
              onClick={() => handleSend(o)}
              disabled={busy}
              title="Send the PO to the supplier"
            >
              Send
            </AdminBtn>
          ) : null}
          <AdminBtn
            size="sm"
            variant="danger"
            onClick={() => handleDelete(o)}
            disabled={busy}
            title="Delete PO"
          >
            <Ico.x size={12} />
          </AdminBtn>
          <AdminBtn
            size="sm"
            variant="primary"
            href={`/admin/procurement/${encodeURIComponent(o.id)}`}
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
        eyebrow="Receiving dock"
        title="Procurement"
        desc="Supplier purchase orders inbound to the Bakersfield warehouse — draft, send, and receive stock into aisle and bay."
        action={
          <AdminBtn variant="primary" onClick={handleCreate} disabled={busy}>
            <Ico.plus size={14} /> New supplier PO
          </AdminBtn>
        }
      />

      {!configured ? (
        <Notice tone="warn">
          Supabase is not configured — procurement orders are not yet persisted.
          The receiving dock will appear empty until the database is connected.
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
        <Kpi label="Supplier POs" value={kpis.count} hint="all statuses" />
        <Kpi
          label="Inbound"
          value={kpis.inbound}
          hint="sent + partial"
          tone="safety"
        />
        <Kpi
          label="On order"
          value={fmt(kpis.onOrder, { cents: false })}
          hint="inbound value"
        />
        <Kpi
          label="Units expected"
          value={kpis.unitsExpected}
          hint="not yet received"
          tone="pine"
        />
      </div>

      <Panel
        title="Inbound purchase orders"
        meta={ready ? `${filtered.length} of ${orders.length} POs` : "Loading…"}
        action={
          <div style={{ width: 260, maxWidth: "100%" }}>
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search PO, supplier, SKU…"
              style={{ height: 34, fontSize: 12 }}
            />
          </div>
        }
        pad={false}
      >
        <div
          style={{ padding: "12px 16px", borderBottom: `1px solid ${wf.hairline}` }}
        >
          <FilterChips value={tab} options={STATUS_TABS} onChange={setTab} />
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          getKey={(o) => o.id}
          onRowHref={(o) => `/admin/procurement/${encodeURIComponent(o.id)}`}
          empty={
            ready
              ? "No purchase orders match the current filters."
              : "Loading the receiving dock…"
          }
        />
      </Panel>
    </>
  );
}
