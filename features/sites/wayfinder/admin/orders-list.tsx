// Wayfinder admin — orders list. Reads the real order store (lib/order-store),
// bootstraps it from /api/orders, and supports search, status filtering, the
// warehouse workflow advance action, and CSV export. Status changes write back
// to the store and PATCH the orders API (best-effort).
"use client";

import { useEffect, useMemo, useState } from "react";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import { fmt } from "../kit";
import {
  AdminBtn,
  DataTable,
  Ico,
  Mono,
  Panel,
  PageHead,
  Pill,
  FilterChips,
  Field,
  SelectInput,
  TextInput,
  monoFont,
  wf,
  type Column
} from "./admin-kit";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDate,
  formatTime,
  nextWorkflowStep,
  orderAmountDue,
  orderStatusTone,
  paymentStatusTone
} from "./order-helpers";

type StatusTab =
  | "all"
  | "draft"
  | "pending"
  | "processing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

type PaymentFilter = "all" | "unpaid" | "partial" | "paid" | "overpaid" | "refunded" | "failed";
type FulfillmentFilter = "all" | "queued" | "picking" | "ready" | "delivering" | "closed";
type MethodFilter = "all" | "pickup" | "delivery";
type AssignedFilter = "all" | "counter" | "warehouse" | "driver";
type OrderTagFilter = "all" | "unpaid" | "balance_due" | "pickup" | "delivery" | "active" | "closed";
type SavedView = "all" | "will_call_unpaid" | "delivery_active" | "needs_action";

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "pending", label: "Pending" },
  { id: "processing", label: "Processing" },
  { id: "ready_for_pickup", label: "Will-call" },
  { id: "out_for_delivery", label: "Delivery" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" }
];

const PAYMENT_FILTERS: { id: PaymentFilter; label: string }[] = [
  { id: "all", label: "All payment" },
  { id: "unpaid", label: "Unpaid" },
  { id: "partial", label: "Partial" },
  { id: "paid", label: "Paid" },
  { id: "overpaid", label: "Overpaid" },
  { id: "refunded", label: "Refunded" },
  { id: "failed", label: "Failed" }
];

const FULFILLMENT_FILTERS: { id: FulfillmentFilter; label: string }[] = [
  { id: "all", label: "All fulfillment" },
  { id: "queued", label: "Queued" },
  { id: "picking", label: "Picking" },
  { id: "ready", label: "Ready" },
  { id: "delivering", label: "Delivering" },
  { id: "closed", label: "Closed" }
];

const METHOD_FILTERS: { id: MethodFilter; label: string }[] = [
  { id: "all", label: "Pickup + delivery" },
  { id: "pickup", label: "Pickup" },
  { id: "delivery", label: "Delivery" }
];

const ASSIGNED_FILTERS: { id: AssignedFilter; label: string }[] = [
  { id: "all", label: "All employees" },
  { id: "counter", label: "Counter staff" },
  { id: "warehouse", label: "Warehouse" },
  { id: "driver", label: "Driver" }
];

const TAG_FILTERS: { id: OrderTagFilter; label: string }[] = [
  { id: "all", label: "All tags" },
  { id: "unpaid", label: "Unpaid" },
  { id: "balance_due", label: "Balance due" },
  { id: "pickup", label: "Pickup" },
  { id: "delivery", label: "Delivery" },
  { id: "active", label: "Active" },
  { id: "closed", label: "Closed" }
];

const SAVED_VIEWS: { id: SavedView; label: string }[] = [
  { id: "all", label: "All orders" },
  { id: "will_call_unpaid", label: "Will-call unpaid" },
  { id: "delivery_active", label: "Active delivery" },
  { id: "needs_action", label: "Needs action" }
];

function matchesTab(order: OrderRecord, tab: StatusTab) {
  if (tab === "all") return true;
  if (tab === "draft") return order.status === "draft";
  if (tab === "pending") return order.status === "submitted";
  if (tab === "processing") return ["confirmed", "picking"].includes(order.status);
  return order.status === tab;
}

function fulfillmentBucket(order: OrderRecord): FulfillmentFilter {
  if (order.status === "completed" || order.status === "cancelled") return "closed";
  if (order.status === "ready_for_pickup") return "ready";
  if (order.status === "out_for_delivery") return "delivering";
  if (order.status === "picking") return "picking";
  return "queued";
}

function assignedBucket(order: OrderRecord): AssignedFilter {
  if (order.status === "out_for_delivery") return "driver";
  if (order.status === "confirmed" || order.status === "picking" || order.status === "ready_for_pickup") {
    return "warehouse";
  }
  return "counter";
}

function orderTags(order: OrderRecord): OrderTagFilter[] {
  const tags: OrderTagFilter[] = [];
  if (order.paymentStatus === "unpaid") tags.push("unpaid");
  if (orderAmountDue(order) > 0) tags.push("balance_due");
  tags.push(order.fulfillmentMethod);
  tags.push(order.status === "completed" || order.status === "cancelled" ? "closed" : "active");
  return tags;
}

function matchesDateRange(order: OrderRecord, from: string, to: string) {
  const created = order.createdAt.slice(0, 10);
  if (from && created < from) return false;
  if (to && created > to) return false;
  return true;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };
    return entities[character] || character;
  });
}

export function WayfinderOrdersList() {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const removeOrder = useOrderStore((state) => state.removeOrder);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StatusTab>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentFilter>("all");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [assignedFilter, setAssignedFilter] = useState<AssignedFilter>("all");
  const [tagFilter, setTagFilter] = useState<OrderTagFilter>("all");
  const [savedView, setSavedView] = useState<SavedView>("all");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    useOrderStore.persist.rehydrate();
    async function load() {
      try {
        const res = await fetch("/api/orders?limit=250&includeItems=false", {
          cache: "no-store"
        });
        if (res.ok) {
          const payload = (await res.json()) as { orders?: OrderRecord[]; persisted?: boolean };
          if (payload.persisted && payload.orders) setOrders(payload.orders);
        }
      } finally {
        setLoaded(true);
      }
    }
    void load();
  }, [setOrders]);

  const orders = useMemo(
    () => storedOrders.filter((order) => !order.isQuoteRequest),
    [storedOrders]
  );

  const customerOptions = useMemo(() => {
    const names = Array.from(
      new Set(orders.map((order) => order.companyName || order.customerName).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    return ["all", ...names];
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((order) => {
        const hit =
          !q ||
          order.orderNumber.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          order.companyName.toLowerCase().includes(q) ||
          order.jobName.toLowerCase().includes(q);
        const customerName = order.companyName || order.customerName;
        return (
          hit &&
          matchesTab(order, tab) &&
          matchesDateRange(order, dateFrom, dateTo) &&
          (customerFilter === "all" || customerName === customerFilter) &&
          (paymentFilter === "all" || order.paymentStatus === paymentFilter) &&
          (fulfillmentFilter === "all" || fulfillmentBucket(order) === fulfillmentFilter) &&
          (methodFilter === "all" || order.fulfillmentMethod === methodFilter) &&
          (assignedFilter === "all" || assignedBucket(order) === assignedFilter) &&
          (tagFilter === "all" || orderTags(order).includes(tagFilter))
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [
    assignedFilter,
    customerFilter,
    dateFrom,
    dateTo,
    fulfillmentFilter,
    methodFilter,
    orders,
    paymentFilter,
    query,
    tab,
    tagFilter
  ]);

  const selectedOrders = useMemo(
    () => filtered.filter((order) => selectedOrderIds.includes(order.id)),
    [filtered, selectedOrderIds]
  );

  function advance(order: OrderRecord) {
    const step = nextWorkflowStep(order);
    if (!step) return;
    updateOrderStatus(order.id, step.next, step.detail);
    void fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, status: step.next })
    }).catch(() => null);
  }

  async function deleteOrder(order: OrderRecord) {
    if (
      !window.confirm(
        `Delete ${order.orderNumber}? This permanently removes the order.`
      )
    ) {
      return;
    }
    removeOrder(order.id);
    await fetch(`/api/orders?orderId=${encodeURIComponent(order.id)}`, {
      method: "DELETE"
    }).catch(() => null);
  }

  async function discardAllDrafts() {
    const drafts = orders.filter((order) => order.status === "draft");
    if (!drafts.length) return;
    if (
      !window.confirm(
        `Discard all ${drafts.length} draft order${drafts.length === 1 ? "" : "s"}? This cannot be undone.`
      )
    ) {
      return;
    }
    const draftIds = new Set(drafts.map((order) => order.id));
    setOrders(storedOrders.filter((order) => !draftIds.has(order.id)));
    await fetch("/api/orders?scope=drafts", { method: "DELETE" }).catch(() => null);
  }

  function exportCsv(rows: OrderRecord[] = filtered) {
    const headers = [
      "Order",
      "Customer",
      "Status",
      "Payment",
      "Fulfillment",
      "Total",
      "Placed"
    ];
    const csvRows = rows.map((order) =>
      [
        order.orderNumber,
        order.companyName || order.customerName,
        ORDER_STATUS_LABELS[order.status],
        PAYMENT_STATUS_LABELS[order.paymentStatus],
        order.fulfillmentMethod,
        order.total.toFixed(2),
        formatDate(order.createdAt)
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `wayfinder-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  function applySavedView(view: SavedView) {
    setSavedView(view);
    setDateFrom("");
    setDateTo("");
    setCustomerFilter("all");
    setAssignedFilter("all");
    setTagFilter("all");
    if (view === "will_call_unpaid") {
      setTab("ready_for_pickup");
      setPaymentFilter("unpaid");
      setFulfillmentFilter("ready");
      setMethodFilter("pickup");
      return;
    }
    if (view === "delivery_active") {
      setTab("all");
      setPaymentFilter("all");
      setFulfillmentFilter("delivering");
      setMethodFilter("delivery");
      setTagFilter("active");
      return;
    }
    if (view === "needs_action") {
      setTab("all");
      setPaymentFilter("unpaid");
      setFulfillmentFilter("queued");
      setMethodFilter("all");
      setTagFilter("balance_due");
      return;
    }
    setTab("all");
    setPaymentFilter("all");
    setFulfillmentFilter("all");
    setMethodFilter("all");
  }

  function toggleSelected(orderId: string) {
    setSelectedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId]
    );
  }

  function toggleAllVisible() {
    const visibleIds = filtered.map((order) => order.id);
    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedOrderIds.includes(id));
    setSelectedOrderIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]))
    );
  }

  function printSelectedOrders() {
    if (!selectedOrders.length) return;

    const rows = selectedOrders
      .map(
        (order) => `
          <tr>
            <td><strong>${escapeHtml(order.orderNumber)}</strong><br><span>${formatDate(order.createdAt)}</span></td>
            <td><strong>${escapeHtml(order.companyName || order.customerName)}</strong><br><span>${escapeHtml(order.jobName || order.email || "")}</span></td>
            <td>${ORDER_STATUS_LABELS[order.status]}<br><span>${PAYMENT_STATUS_LABELS[order.paymentStatus]}</span></td>
            <td>${order.fulfillmentMethod}</td>
            <td class="num">${fmt(order.total)}</td>
            <td class="num">${fmt(orderAmountDue(order))}</td>
          </tr>`
      )
      .join("");
    const printWindow = window.open("", "gateworks-print-orders", "width=960,height=720");
    if (!printWindow) return;

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <title>Selected Gateworks Orders</title>
          <style>
            body { font-family: Inter, Arial, sans-serif; color: #15181f; margin: 28px; }
            h1 { font-size: 22px; margin: 0 0 4px; }
            p { margin: 0 0 18px; color: #5f6678; font-size: 12px; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th { text-align: left; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #5f6678; border-bottom: 1px solid #cfd7e3; padding: 9px; }
            td { border-bottom: 1px solid #e7ebf2; padding: 10px 9px; vertical-align: top; }
            span { color: #687083; font-size: 11px; }
            .num { text-align: right; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: nowrap; }
            @media print { body { margin: 18px; } }
          </style>
        </head>
        <body>
          <h1>Selected orders</h1>
          <p>${selectedOrders.length} order${selectedOrders.length === 1 ? "" : "s"} printed from Gateworks on ${new Date().toLocaleString()}.</p>
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Method</th>
                <th class="num">Total</th>
                <th class="num">Due</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((order) => selectedOrderIds.includes(order.id));

  const columns: Column<OrderRecord>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={toggleAllVisible}
          aria-label="Select all visible orders"
        />
      ),
      width: 42,
      render: (o) => (
        <input
          type="checkbox"
          checked={selectedOrderIds.includes(o.id)}
          onChange={() => toggleSelected(o.id)}
          aria-label={`Select ${o.orderNumber}`}
        />
      )
    },
    {
      key: "number",
      header: "Order",
      render: (o) => (
        <div style={{ display: "grid", gap: 2 }}>
          <Mono style={{ fontWeight: 700, fontSize: 12 }}>{o.orderNumber}</Mono>
          <span
            style={{
              fontSize: 10,
              fontFamily: monoFont,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: wf.muted
            }}
          >
            {o.fulfillmentMethod}
          </span>
        </div>
      )
    },
    {
      key: "customer",
      header: "Customer",
      render: (o) => (
        <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 800 }}>
            {o.companyName || o.customerName || "Unknown"}
          </span>
          <span style={{ fontSize: 11, color: wf.muted }}>
            {o.jobName || o.email || "—"}
          </span>
        </div>
      )
    },
    {
      key: "placed",
      header: "Placed",
      render: (o) => (
        <span style={{ fontFamily: monoFont, fontSize: 11, color: wf.steel }}>
          {formatDate(o.createdAt)}
          <br />
          <span style={{ color: wf.muted }}>{formatTime(o.createdAt)}</span>
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (o) => (
        <Pill tone={orderStatusTone(o.status)}>{ORDER_STATUS_LABELS[o.status]}</Pill>
      )
    },
    {
      key: "payment",
      header: "Payment",
      render: (o) => (
        <Pill tone={paymentStatusTone(o.paymentStatus)}>
          {PAYMENT_STATUS_LABELS[o.paymentStatus]}
        </Pill>
      )
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (o) => (
        <div style={{ display: "grid", gap: 2 }}>
          <Mono style={{ fontWeight: 700 }}>{fmt(o.total)}</Mono>
          <span style={{ fontSize: 10, color: wf.muted, fontFamily: monoFont }}>
            Due {fmt(orderAmountDue(o))}
          </span>
        </div>
      )
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (o) => {
        const step = nextWorkflowStep(o);
        return (
          <div
            style={{ display: "inline-flex", gap: 6, justifyContent: "flex-end" }}
          >
            {step ? (
              <AdminBtn size="sm" onClick={() => advance(o)} title={step.detail}>
                {step.label}
              </AdminBtn>
            ) : null}
            {o.status === "draft" || o.status === "cancelled" ? (
              <AdminBtn
                size="sm"
                variant="danger"
                onClick={() => deleteOrder(o)}
                title="Delete this order"
              >
                Delete
              </AdminBtn>
            ) : null}
            <AdminBtn
              size="sm"
              variant="primary"
              href={`/admin/orders/${encodeURIComponent(o.id)}`}
            >
              Open
            </AdminBtn>
          </div>
        );
      }
    }
  ];

  return (
    <>
      <PageHead
        eyebrow="Operations"
        title="Orders"
        desc="Every order moving through the warehouse — confirm, pick, stage for will-call, and dispatch delivery."
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <AdminBtn onClick={() => exportCsv()}>
              <Ico.receipt size={14} /> Export CSV
            </AdminBtn>
            <AdminBtn href="/admin/orders/new" variant="primary">
              <Ico.plus size={14} /> New order
            </AdminBtn>
          </div>
        }
      />

      <Panel
        title="Order queue"
        meta={loaded ? `${filtered.length} of ${orders.length} orders` : "Loading…"}
        action={
          <div style={{ width: 260, maxWidth: "100%" }}>
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order, customer, job…"
              style={{ height: 34, fontSize: 12 }}
            />
          </div>
        }
        pad={false}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${wf.hairline}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          <FilterChips value={tab} options={STATUS_TABS} onChange={setTab} />
          {tab === "draft" && orders.some((order) => order.status === "draft") ? (
            <AdminBtn size="sm" variant="danger" onClick={discardAllDrafts}>
              <Ico.x size={13} /> Discard all drafts
            </AdminBtn>
          ) : null}
        </div>
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${wf.hairline}`,
            display: "grid",
            gap: 12
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <Field label="Date from">
              <TextInput type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </Field>
            <Field label="Date to">
              <TextInput type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </Field>
            <Field label="Customer">
              <SelectInput value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)}>
                <option value="all">All customers</option>
                {customerOptions
                  .filter((name) => name !== "all")
                  .map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
              </SelectInput>
            </Field>
            <Field label="Payment">
              <SelectInput value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value as PaymentFilter)}>
                {PAYMENT_FILTERS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Fulfillment">
              <SelectInput value={fulfillmentFilter} onChange={(event) => setFulfillmentFilter(event.target.value as FulfillmentFilter)}>
                {FULFILLMENT_FILTERS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Pickup / delivery">
              <SelectInput value={methodFilter} onChange={(event) => setMethodFilter(event.target.value as MethodFilter)}>
                {METHOD_FILTERS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Assigned employee">
              <SelectInput value={assignedFilter} onChange={(event) => setAssignedFilter(event.target.value as AssignedFilter)}>
                {ASSIGNED_FILTERS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Order tag">
              <SelectInput value={tagFilter} onChange={(event) => setTagFilter(event.target.value as OrderTagFilter)}>
                {TAG_FILTERS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <span
              style={{
                color: wf.muted,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase"
              }}
            >
              Saved views
            </span>
            <FilterChips value={savedView} options={SAVED_VIEWS} onChange={applySavedView} />
          </div>
        </div>
        <div
          style={{
            padding: "10px 16px",
            borderBottom: `1px solid ${wf.hairline}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            fontSize: 12,
            color: wf.steel
          }}
        >
          <span>{selectedOrders.length} selected</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <AdminBtn size="sm" disabled={!selectedOrders.length} onClick={() => exportCsv(selectedOrders)}>
              <Ico.receipt size={13} /> Export selected
            </AdminBtn>
            <AdminBtn size="sm" disabled={!selectedOrders.length} onClick={printSelectedOrders}>
              <Ico.clipboard size={13} /> Print selected
            </AdminBtn>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          getKey={(o) => o.id}
          onRowHref={(o) => `/admin/orders/${encodeURIComponent(o.id)}`}
          empty={
            loaded
              ? "No orders match the current filters."
              : "Loading orders from the warehouse…"
          }
        />
      </Panel>
    </>
  );
}
