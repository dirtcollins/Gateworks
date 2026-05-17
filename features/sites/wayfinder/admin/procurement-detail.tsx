// Wayfinder admin — procurement (supplier PO) detail. Reads / writes the
// Supabase-backed procurement API (@/lib/quotes-data): edit supplier, expected
// date and notes, add / adjust / remove line items from the real catalog,
// send the PO, and receive items into the warehouse (receiveProcurementItems).
// Each line shows a deterministic receiving aisle/bay framing for the dock.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { products } from "@/lib/catalog";
import {
  fetchProcurementOrders,
  receiveProcurementItems,
  saveProcurementOrder,
  type ProcurementOrder,
  type ProcurementOrderItemInput,
  type ProcurementStatus
} from "@/lib/quotes-data";
import type { Product } from "@/lib/types";
import { fmt, wayfinding } from "../kit";
import {
  AdminBtn,
  Field,
  Ico,
  Mono,
  Notice,
  Panel,
  PageHead,
  Pill,
  SelectInput,
  TextArea,
  TextInput,
  monoFont,
  wf
} from "./admin-kit";
import { formatDate } from "./order-helpers";

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

type DraftItem = {
  id: string;
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
};

type Draft = {
  id: string;
  poNumber: string;
  supplierName: string;
  status: ProcurementStatus;
  expectedAt: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: DraftItem[];
};

function draftFromOrder(order: ProcurementOrder): Draft {
  return {
    id: order.id,
    poNumber: order.poNumber,
    supplierName: order.supplierName,
    status: (order.status as ProcurementStatus) || "draft",
    expectedAt: order.expectedAt ? order.expectedAt.slice(0, 10) : "",
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku,
      title: item.title,
      quantityOrdered: item.quantityOrdered,
      quantityReceived: item.quantityReceived,
      unitCost: item.unitCost
    }))
  };
}

function pickVariant(product: Product) {
  return (
    product.variants.find((variant) => variant.inventory === "in_stock") ||
    product.variants[0]
  );
}

export function WayfinderProcurementDetail({ poId }: { poId: string }) {
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [receipts, setReceipts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setReady(false);
    setNotFound(false);
    const result = await fetchProcurementOrders();
    setConfigured(result.configured);
    const found = result.orders.find((order) => order.id === poId);
    if (found) {
      setDraft(draftFromOrder(found));
      setReceipts({});
    } else {
      setNotFound(true);
    }
    setReady(true);
  }, [poId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 3200);
    return () => window.clearTimeout(handle);
  }, [message]);

  const searchResults = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return products.slice(0, 8);
    return products
      .filter(
        (product) =>
          product.title.toLowerCase().includes(normalized) ||
          product.variants.some((variant) =>
            variant.sku.toLowerCase().includes(normalized)
          )
      )
      .slice(0, 20);
  }, [search]);

  if (!ready) {
    return (
      <>
        <PageHead eyebrow="Receiving dock" title="Purchase order" />
        <Panel>
          <p style={{ margin: 0, color: wf.muted, fontSize: 13 }}>
            Loading purchase order…
          </p>
        </Panel>
      </>
    );
  }

  if (notFound || !draft) {
    return (
      <>
        <PageHead
          eyebrow="Receiving dock"
          title="Purchase order not found"
          action={
            <AdminBtn href="/wayfinder/admin/procurement">
              Back to procurement
            </AdminBtn>
          }
        />
        <Panel>
          <p style={{ margin: 0, color: wf.muted, fontSize: 13 }}>
            {configured
              ? `No purchase order matches ${poId}.`
              : "Supabase is not configured — procurement orders cannot be loaded."}
          </p>
        </Panel>
      </>
    );
  }

  const current = draft;
  const subtotal = current.items.reduce(
    (sum, item) => sum + item.unitCost * item.quantityOrdered,
    0
  );

  function updateDraft(patch: Partial<Draft>) {
    setDraft((value) => (value ? { ...value, ...patch } : value));
  }

  function buildItemInputs(items: DraftItem[]): ProcurementOrderItemInput[] {
    return items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku,
      title: item.title,
      quantityOrdered: item.quantityOrdered,
      quantityReceived: item.quantityReceived,
      unitCost: item.unitCost,
      lineTotal: Number((item.unitCost * item.quantityOrdered).toFixed(2))
    }));
  }

  function addCatalogItem(product: Product) {
    const variant = pickVariant(product);
    if (!variant) return;
    setDraft((value) => {
      if (!value) return value;
      const existing = value.items.find(
        (item) => item.variantId === variant.id
      );
      if (existing) {
        return {
          ...value,
          items: value.items.map((item) =>
            item.variantId === variant.id
              ? { ...item, quantityOrdered: item.quantityOrdered + 1 }
              : item
          )
        };
      }
      return {
        ...value,
        items: [
          ...value.items,
          {
            id: `new-${variant.id}`,
            productId: product.id,
            variantId: variant.id,
            sku: variant.sku,
            title: product.title,
            quantityOrdered: 1,
            quantityReceived: 0,
            unitCost: variant.price
          }
        ]
      };
    });
  }

  function updateItem(variantId: string, patch: Partial<DraftItem>) {
    setDraft((value) =>
      value
        ? {
            ...value,
            items: value.items.map((item) =>
              item.variantId === variantId ? { ...item, ...patch } : item
            )
          }
        : value
    );
  }

  function removeItem(variantId: string) {
    setDraft((value) =>
      value
        ? {
            ...value,
            items: value.items.filter((item) => item.variantId !== variantId)
          }
        : value
    );
  }

  async function persist(status?: ProcurementStatus) {
    const result = await saveProcurementOrder({
      id: current.id,
      supplierName: current.supplierName,
      status: status ?? current.status,
      expectedAt: current.expectedAt || null,
      notes: current.notes,
      subtotal,
      total: subtotal,
      items: buildItemInputs(current.items)
    });
    setConfigured(result.persisted);
    return result.order;
  }

  async function handleSave(status?: ProcurementStatus) {
    if (busy) return;
    setBusy(true);
    const saved = await persist(status);
    setBusy(false);
    if (saved) {
      setDraft(draftFromOrder(saved));
      setReceipts({});
      setMessage(
        status && status !== current.status
          ? `Purchase order ${STATUS_LABEL[status].toLowerCase()}.`
          : "Purchase order saved."
      );
    } else {
      setMessage("Purchase order not persisted — Supabase is not configured.");
    }
  }

  async function handleReceive() {
    if (busy) return;
    const payload = Object.entries(receipts)
      .map(([itemId, raw]) => ({
        itemId,
        quantityReceived: Number(raw) || 0
      }))
      .filter((entry) => entry.quantityReceived > 0);
    if (!payload.length) {
      setMessage("Enter a received quantity on at least one line.");
      return;
    }
    // New (unsaved) items have no DB id yet — save the PO first.
    if (payload.some((entry) => entry.itemId.startsWith("new-"))) {
      setMessage("Save the purchase order before receiving new lines.");
      return;
    }
    setBusy(true);
    const result = await receiveProcurementItems(current.id, payload);
    setBusy(false);
    if (result.order) {
      setDraft(draftFromOrder(result.order));
      setReceipts({});
      setMessage("Received stock booked into the warehouse.");
    } else {
      setMessage("Could not record the receipt — Supabase is not configured.");
    }
  }

  const allReceived =
    current.items.length > 0 &&
    current.items.every(
      (item) => item.quantityReceived >= item.quantityOrdered
    );

  return (
    <>
      <PageHead
        eyebrow={
          <Link href="/wayfinder/admin/procurement" style={{ color: wf.steel }}>
            ← Procurement
          </Link>
        }
        title={<Mono style={{ fontSize: 24 }}>{current.poNumber}</Mono>}
        desc={`${current.supplierName || "Unassigned supplier"} · ${
          current.items.length
        } line items`}
        action={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {current.status === "draft" ? (
              <AdminBtn onClick={() => handleSave("sent")} disabled={busy}>
                <Ico.truck size={13} /> Send PO
              </AdminBtn>
            ) : null}
            <AdminBtn
              variant="primary"
              onClick={() => handleSave()}
              disabled={busy}
            >
              <Ico.check size={14} /> Save PO
            </AdminBtn>
          </div>
        }
      />

      {!configured ? (
        <Notice tone="warn">
          Supabase is not configured — saving will not persist this purchase
          order.
        </Notice>
      ) : null}
      {message ? <Notice tone="good">{message}</Notice> : null}

      <div
        style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}
      >
        <Pill tone={STATUS_TONE[current.status]}>
          {STATUS_LABEL[current.status]}
        </Pill>
        {allReceived ? <Pill tone="done">All lines received</Pill> : null}
        <span style={{ fontSize: 11, color: wf.muted, fontFamily: monoFont }}>
          Created {formatDate(current.createdAt)} · updated{" "}
          {formatDate(current.updatedAt)}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)"
        }}
        className="wf-admin-proc-grid"
      >
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel
            title="Receiving lines"
            meta={`${current.items.length} SKUs · Bay 7 inbound`}
            action={
              <AdminBtn size="sm" onClick={() => setShowAdd((open) => !open)}>
                <Ico.plus size={12} /> Add item
              </AdminBtn>
            }
            pad={false}
          >
            {showAdd ? (
              <div
                style={{
                  padding: 14,
                  borderBottom: `1px solid ${wf.hairline}`,
                  background: wf.bone
                }}
              >
                <TextInput
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products by name or SKU"
                  style={{ height: 34, fontSize: 12 }}
                />
                <div
                  style={{
                    marginTop: 8,
                    maxHeight: 240,
                    overflowY: "auto",
                    border: `1px solid ${wf.rail}`,
                    background: "#fff"
                  }}
                >
                  {searchResults.map((product, index) => {
                    const variant = pickVariant(product);
                    if (!variant) return null;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addCatalogItem(product)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          width: "100%",
                          textAlign: "left",
                          padding: "8px 12px",
                          background: "#fff",
                          border: "none",
                          borderTop:
                            index > 0 ? `1px solid ${wf.hairline}` : "none",
                          cursor: "pointer"
                        }}
                      >
                        <span style={{ minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              display: "block"
                            }}
                          >
                            {product.title}
                          </span>
                          <Mono style={{ fontSize: 11, color: wf.muted }}>
                            SKU {variant.sku}
                          </Mono>
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 800 }}>
                          {fmt(variant.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {current.items.length ? (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13
                  }}
                >
                  <thead>
                    <tr style={{ background: wf.bone }}>
                      {[
                        "SKU / Bay",
                        "Item",
                        "Ordered",
                        "Unit cost",
                        "Received",
                        "Receive now",
                        ""
                      ].map((h, i) => (
                        <th
                          key={h || "x"}
                          style={{
                            textAlign: i >= 2 && i <= 5 ? "right" : "left",
                            padding: "9px 14px",
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: wf.steel,
                            borderBottom: `1px solid ${wf.rail}`
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {current.items.map((item) => {
                      const place = wayfinding(item.variantId || item.sku);
                      const outstanding = Math.max(
                        0,
                        item.quantityOrdered - item.quantityReceived
                      );
                      return (
                        <tr key={item.variantId}>
                          <td style={td()}>
                            <Mono style={{ fontSize: 11 }}>{item.sku}</Mono>
                            <Mono
                              style={{
                                fontSize: 10,
                                color: wf.muted,
                                display: "block"
                              }}
                            >
                              Aisle {place.aisle} · Bay {place.bay}
                            </Mono>
                          </td>
                          <td style={td()}>
                            <span style={{ fontWeight: 700 }}>{item.title}</span>
                          </td>
                          <td style={td("right")}>
                            <input
                              type="number"
                              min={1}
                              value={item.quantityOrdered}
                              onChange={(event) =>
                                updateItem(item.variantId, {
                                  quantityOrdered:
                                    Math.max(1, Number(event.target.value) || 1)
                                })
                              }
                              style={cellInput}
                            />
                          </td>
                          <td style={td("right")}>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={item.unitCost}
                              onChange={(event) =>
                                updateItem(item.variantId, {
                                  unitCost: Math.max(
                                    0,
                                    Number(event.target.value) || 0
                                  )
                                })
                              }
                              style={cellInput}
                            />
                          </td>
                          <td style={td("right")}>
                            <Mono>
                              {item.quantityReceived} / {item.quantityOrdered}
                            </Mono>
                          </td>
                          <td style={td("right")}>
                            <input
                              type="number"
                              min={0}
                              max={outstanding}
                              placeholder="0"
                              value={receipts[item.id] ?? ""}
                              disabled={outstanding === 0}
                              onChange={(event) =>
                                setReceipts((current) => ({
                                  ...current,
                                  [item.id]: event.target.value
                                }))
                              }
                              style={{
                                ...cellInput,
                                background:
                                  outstanding === 0 ? wf.bone : "#fff"
                              }}
                            />
                          </td>
                          <td style={td("right")}>
                            <button
                              type="button"
                              onClick={() => removeItem(item.variantId)}
                              aria-label="Remove item"
                              style={{
                                background: "none",
                                border: `1px solid ${wf.rail}`,
                                color: wf.red,
                                cursor: "pointer",
                                padding: 4,
                                lineHeight: 0
                              }}
                            >
                              <Ico.x size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                style={{
                  padding: "32px 14px",
                  textAlign: "center",
                  color: wf.muted,
                  fontSize: 13,
                  fontFamily: monoFont
                }}
              >
                No line items. Use “Add item” to build this purchase order.
              </div>
            )}
            <div
              style={{
                borderTop: `1px solid ${wf.hairline}`,
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap"
              }}
            >
              <AdminBtn
                onClick={handleReceive}
                disabled={busy || !current.items.length}
                title="Book the entered quantities into the warehouse"
              >
                <Ico.truck size={13} /> Receive entered lines
              </AdminBtn>
              <div style={{ display: "flex", gap: 28, fontSize: 14 }}>
                <span style={{ color: wf.ink, fontWeight: 800 }}>PO total</span>
                <Mono
                  style={{ fontWeight: 800, minWidth: 90, textAlign: "right" }}
                >
                  {fmt(subtotal)}
                </Mono>
              </div>
            </div>
          </Panel>
        </div>

        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <Panel title="Purchase order">
            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Supplier">
                <TextInput
                  value={current.supplierName}
                  onChange={(event) =>
                    updateDraft({ supplierName: event.target.value })
                  }
                />
              </Field>
              <Field label="Status">
                <SelectInput
                  value={current.status}
                  onChange={(event) =>
                    updateDraft({
                      status: event.target.value as ProcurementStatus
                    })
                  }
                >
                  {(
                    [
                      "draft",
                      "sent",
                      "partial",
                      "received",
                      "closed"
                    ] as ProcurementStatus[]
                  ).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Expected at receiving dock">
                <TextInput
                  type="date"
                  value={current.expectedAt}
                  onChange={(event) =>
                    updateDraft({ expectedAt: event.target.value })
                  }
                />
              </Field>
              <Field label="Receiving notes">
                <TextArea
                  value={current.notes}
                  onChange={(event) =>
                    updateDraft({ notes: event.target.value })
                  }
                  placeholder="Dock door, pallet count, inspection notes"
                />
              </Field>
            </div>
          </Panel>
        </div>
      </div>
      <style>{`
        @media (max-width: 880px) {
          .wf-admin-proc-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

const cellInput: React.CSSProperties = {
  width: 72,
  height: 30,
  textAlign: "center",
  border: `1px solid ${wf.rail}`,
  fontFamily: monoFont,
  fontWeight: 700,
  fontSize: 12
};

function td(align: "left" | "right" = "left"): React.CSSProperties {
  return {
    textAlign: align,
    padding: "9px 14px",
    borderBottom: `1px solid ${wf.hairline}`,
    color: wf.ink
  };
}
