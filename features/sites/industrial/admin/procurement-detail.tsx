"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, Search, Trash2 } from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminCard,
  AdminField,
  AdminPill,
  AdminSection,
  adminInputClass,
  adminTextareaClass
} from "@/features/sites/industrial/admin/kit";
import type { Product } from "@/lib/types";
import {
  deleteProcurementOrder,
  fetchProcurementOrders,
  receiveProcurementItems,
  saveProcurementOrder,
  type ProcurementOrder,
  type ProcurementOrderItem,
  type ProcurementStatus
} from "@/lib/quotes-data";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin procurement detail. Edit a supplier PO,
 * add/remove line items from the catalog, send the PO, and receive
 * inbound items via `receiveProcurementItems`.
 * ------------------------------------------------------------------ */

const STATUS_OPTIONS: ProcurementStatus[] = [
  "draft",
  "sent",
  "partial",
  "received",
  "closed"
];

const STATUS_TONE: Record<
  ProcurementStatus,
  "neutral" | "amber" | "pine" | "ink"
> = {
  draft: "amber",
  sent: "neutral",
  partial: "amber",
  received: "pine",
  closed: "ink"
};

type EditableItem = {
  key: string;
  id: string | null; // DB id when the item already exists
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  receiveNow: number;
};

function pickVariant(product: Product) {
  return (
    product.variants.find((variant) => variant.inventory === "in_stock") ||
    product.variants[0]
  );
}

function toEditable(item: ProcurementOrderItem, index: number): EditableItem {
  return {
    key: `${item.id || item.variantId}-${index}`,
    id: item.id || null,
    productId: item.productId,
    variantId: item.variantId,
    sku: item.sku,
    title: item.title,
    quantityOrdered: item.quantityOrdered,
    quantityReceived: item.quantityReceived,
    unitCost: item.unitCost,
    receiveNow: 0
  };
}

export function IndustrialAdminProcurementDetail({
  poId,
  catalogProducts
}: {
  poId: string;
  catalogProducts: Product[];
}) {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [order, setOrder] = useState<ProcurementOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [supplierName, setSupplierName] = useState("");
  const [status, setStatus] = useState<ProcurementStatus>("draft");
  const [expectedAt, setExpectedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<EditableItem[]>([]);
  const [query, setQuery] = useState("");

  function applyOrder(next: ProcurementOrder) {
    setOrder(next);
    setSupplierName(next.supplierName);
    setStatus(next.status);
    setExpectedAt(next.expectedAt ? next.expectedAt.slice(0, 10) : "");
    setNotes(next.notes);
    setItems(next.items.map(toEditable));
  }

  useEffect(() => {
    let active = true;
    fetchProcurementOrders().then((result) => {
      if (!active) return;
      setConfigured(result.configured);
      const found = result.orders.find((entry) => entry.id === poId);
      if (found) applyOrder(found);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [poId]);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 3200);
    return () => window.clearTimeout(handle);
  }, [message]);

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return catalogProducts
      .filter(
        (product) =>
          product.title.toLowerCase().includes(term) ||
          product.variants.some((variant) =>
            variant.sku.toLowerCase().includes(term)
          )
      )
      .slice(0, 8);
  }, [catalogProducts, query]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.unitCost * item.quantityOrdered,
        0
      ),
    [items]
  );

  if (!ready || !order) {
    return (
      <div className="grid gap-6">
        <Link
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-pine hover:underline"
          href="/industrial/admin/procurement"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All purchase orders
        </Link>
        <div className="border-2 border-d1-ink bg-d1-card p-12 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-d1-ink">
            {!ready ? "Loading purchase order…" : "Purchase order not found"}
          </h1>
          {ready ? (
            <p className="mt-2 text-sm text-d1-steel">
              {configured
                ? "It may have been deleted."
                : "Supabase / procurement tables are not configured."}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  function addProduct(product: Product) {
    const variant = pickVariant(product);
    if (!variant) return;
    setItems((current) => {
      const existing = current.find((item) => item.variantId === variant.id);
      if (existing) {
        return current.map((item) =>
          item.variantId === variant.id
            ? { ...item, quantityOrdered: item.quantityOrdered + 1 }
            : item
        );
      }
      return [
        {
          key: `${variant.id}-${Date.now()}`,
          id: null,
          productId: product.id,
          variantId: variant.id,
          sku: variant.sku,
          title: product.title,
          quantityOrdered: 1,
          quantityReceived: 0,
          unitCost: variant.price,
          receiveNow: 0
        },
        ...current
      ];
    });
    setQuery("");
  }

  function updateItem(key: string, patch: Partial<EditableItem>) {
    setItems((current) =>
      current.map((item) =>
        item.key === key ? { ...item, ...patch } : item
      )
    );
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  async function persist(nextStatus?: ProcurementStatus) {
    if (!order) return null;
    const effectiveStatus = nextStatus || status;
    const { order: saved, persisted } = await saveProcurementOrder({
      id: order.id,
      supplierName: supplierName.trim(),
      status: effectiveStatus,
      expectedAt: expectedAt || null,
      notes,
      subtotal,
      total: subtotal,
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        title: item.title,
        quantityOrdered: item.quantityOrdered,
        quantityReceived: item.quantityReceived,
        unitCost: item.unitCost,
        lineTotal: Number((item.unitCost * item.quantityOrdered).toFixed(2))
      }))
    });
    if (!persisted) {
      setMessage("Procurement tables are not configured — changes not saved.");
      return null;
    }
    if (saved) applyOrder(saved);
    return saved;
  }

  async function handleSave() {
    if (busy) return;
    setBusy(true);
    try {
      const saved = await persist();
      if (saved) setMessage("Purchase order saved.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSend() {
    if (busy) return;
    if (!items.length) {
      setMessage("Add line items before sending the PO.");
      return;
    }
    setBusy(true);
    try {
      const saved = await persist("sent");
      if (saved) setMessage("Purchase order sent to the supplier.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReceive() {
    if (busy || !order) return;

    const pendingReceipts = items
      .filter((item) => item.receiveNow > 0)
      .map((item) => ({ variantId: item.variantId, qty: item.receiveNow }));

    if (!pendingReceipts.length) {
      setMessage("Enter a receive quantity on at least one line item first.");
      return;
    }

    setBusy(true);
    try {
      // Persist field/item edits first. Saving REPLACES line items, so the
      // DB ids change — re-map the receive quantities onto the saved items
      // by variantId, then send the delta (the API adds it to the total).
      const saved = await persist();
      if (!saved) return;

      const receipts = saved.items
        .map((savedItem) => {
          const pending = pendingReceipts.find(
            (entry) => entry.variantId === savedItem.variantId
          );
          if (!pending) return null;
          const outstanding =
            savedItem.quantityOrdered - savedItem.quantityReceived;
          const qty = Math.min(pending.qty, Math.max(0, outstanding));
          return qty > 0 ? { itemId: savedItem.id, quantityReceived: qty } : null;
        })
        .filter((receipt): receipt is { itemId: string; quantityReceived: number } =>
          receipt !== null
        );

      if (!receipts.length) {
        setMessage("Nothing left to receive on those line items.");
        return;
      }

      const { order: received, persisted } = await receiveProcurementItems(
        saved.id,
        receipts
      );
      if (!persisted) {
        setMessage("Procurement tables are not configured — receipt not saved.");
        return;
      }
      if (received) applyOrder(received);
      setMessage("Inbound items received.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (busy || !order) return;
    setBusy(true);
    const { persisted } = await deleteProcurementOrder(order.id);
    setBusy(false);
    if (persisted) {
      router.push("/industrial/admin/procurement");
    } else {
      setMessage("Could not delete the purchase order.");
    }
  }

  const orderedUnits = items.reduce(
    (sum, item) => sum + item.quantityOrdered,
    0
  );
  const receivedUnits = items.reduce(
    (sum, item) => sum + item.quantityReceived,
    0
  );

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <Link
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-pine hover:underline"
          href="/industrial/admin/procurement"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All purchase orders
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-d1-ink pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                {order.poNumber || "Draft PO"}
              </span>
              <AdminPill tone={STATUS_TONE[status]}>{status}</AdminPill>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-d1-ink sm:text-4xl">
              {supplierName || "New supplier PO"}
            </h1>
            <p className="mt-1 text-sm text-d1-steel">
              {receivedUnits}/{orderedUnits} units received
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 border border-d1-red bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-red transition hover:bg-d1-red hover:text-d1-paper disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy}
              onClick={handleDelete}
              type="button"
            >
              Delete
            </button>
            <button
              className="inline-flex items-center gap-2 border border-d1-ink bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy}
              onClick={handleSend}
              type="button"
            >
              Send PO
            </button>
            <button
              className="inline-flex items-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine disabled:cursor-not-allowed disabled:opacity-50"
              disabled={busy}
              onClick={handleSave}
              type="button"
            >
              Save PO
            </button>
          </div>
        </div>
        {!configured ? (
          <p className="border border-d1-amber bg-d1-amber/10 px-4 py-3 text-[12px] font-bold text-d1-ink">
            Procurement is not yet persisted — Supabase / procurement tables
            are not configured.
          </p>
        ) : null}
        {message ? (
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-d1-pine">
            {message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="grid gap-8 lg:col-span-8">
          <AdminSection title="Add products">
            <div className="relative">
              <div className="flex items-center gap-2 border border-d1-line bg-white px-3">
                <Search className="h-4 w-4 text-d1-steel" />
                <input
                  aria-label="Search the catalog"
                  className="h-11 w-full bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search the catalog by name or SKU"
                  value={query}
                />
              </div>
              {searchResults.length ? (
                <div className="mt-1 divide-y divide-d1-line border border-d1-line bg-d1-card">
                  {searchResults.map((product) => {
                    const variant = pickVariant(product);
                    if (!variant) return null;
                    return (
                      <button
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-d1-paper"
                        key={product.id}
                        onClick={() => addProduct(product)}
                        type="button"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-d1-ink">
                            {product.title}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                            {variant.sku}
                          </span>
                        </span>
                        <Plus className="h-4 w-4 text-d1-pine" />
                      </button>
                    );
                  })}
                </div>
              ) : query.trim() ? (
                <p className="mt-2 text-sm font-semibold text-d1-steel">
                  No catalog matches for &ldquo;{query}&rdquo;.
                </p>
              ) : null}
            </div>
          </AdminSection>

          <AdminSection title={`Line items (${orderedUnits} units)`}>
            {items.length ? (
              <AdminCard className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left">
                  <thead>
                    <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3 text-center">Ordered</th>
                      <th className="px-4 py-3 text-right">Unit cost</th>
                      <th className="px-4 py-3 text-center">Received</th>
                      <th className="px-4 py-3 text-center">Receive now</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-d1-line">
                    {items.map((item) => {
                      const outstanding =
                        item.quantityOrdered - item.quantityReceived;
                      return (
                        <tr key={item.key}>
                          <td className="px-4 py-3.5">
                            <span className="block text-sm font-bold text-d1-ink">
                              {item.title}
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                              {item.sku}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="mx-auto flex w-fit items-center border border-d1-line">
                              <button
                                aria-label="Decrease ordered"
                                className="grid h-8 w-8 place-items-center text-d1-steel transition hover:bg-d1-paper"
                                onClick={() =>
                                  updateItem(item.key, {
                                    quantityOrdered: Math.max(
                                      1,
                                      item.quantityOrdered - 1
                                    )
                                  })
                                }
                                type="button"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <input
                                aria-label="Quantity ordered"
                                className="h-8 w-12 border-x border-d1-line bg-white text-center text-sm font-bold text-d1-ink outline-none"
                                min={1}
                                onChange={(event) =>
                                  updateItem(item.key, {
                                    quantityOrdered:
                                      Math.max(1, Number(event.target.value) || 1)
                                  })
                                }
                                type="number"
                                value={item.quantityOrdered}
                              />
                              <button
                                aria-label="Increase ordered"
                                className="grid h-8 w-8 place-items-center text-d1-steel transition hover:bg-d1-paper"
                                onClick={() =>
                                  updateItem(item.key, {
                                    quantityOrdered: item.quantityOrdered + 1
                                  })
                                }
                                type="button"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <input
                              aria-label="Unit cost"
                              className="h-8 w-24 border border-d1-line bg-white px-2 text-right text-sm font-semibold text-d1-ink outline-none focus:border-d1-ink"
                              min={0}
                              onChange={(event) =>
                                updateItem(item.key, {
                                  unitCost:
                                    Math.max(0, Number(event.target.value) || 0)
                                })
                              }
                              step="0.01"
                              type="number"
                              value={item.unitCost}
                            />
                          </td>
                          <td className="px-4 py-3.5 text-center text-sm font-bold text-d1-ink">
                            {item.quantityReceived}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <input
                              aria-label="Receive now"
                              className="h-8 w-16 border border-d1-line bg-white px-2 text-center text-sm font-semibold text-d1-ink outline-none focus:border-d1-ink disabled:bg-d1-paper disabled:text-d1-steel"
                              disabled={outstanding <= 0}
                              max={outstanding}
                              min={0}
                              onChange={(event) =>
                                updateItem(item.key, {
                                  receiveNow: Math.min(
                                    outstanding,
                                    Math.max(0, Number(event.target.value) || 0)
                                  )
                                })
                              }
                              type="number"
                              value={item.receiveNow}
                            />
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              aria-label={`Remove ${item.title}`}
                              className="grid h-8 w-8 place-items-center border border-d1-line text-d1-steel transition hover:border-d1-red hover:text-d1-red"
                              onClick={() => removeItem(item.key)}
                              type="button"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </AdminCard>
            ) : (
              <AdminCard className="px-6 py-12 text-center">
                <p className="text-sm font-bold text-d1-ink">
                  No items on this PO
                </p>
                <p className="mt-1 text-sm text-d1-steel">
                  Search the catalog above to add inbound material.
                </p>
              </AdminCard>
            )}
          </AdminSection>
        </div>

        <div className="grid gap-8 lg:col-span-4">
          <AdminSection title="Receive inbound">
            <AdminCard className="grid gap-3 p-4">
              <p className="text-sm text-d1-steel">
                Enter receive quantities on the line items, then record the
                receipt against the PO.
              </p>
              <button
                className="w-full bg-d1-pine px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-ink disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busy}
                onClick={handleReceive}
                type="button"
              >
                Receive items
              </button>
            </AdminCard>
          </AdminSection>

          <AdminSection title="PO details">
            <AdminCard className="grid gap-4 p-4">
              <AdminField label="Supplier name">
                <input
                  className={adminInputClass}
                  onChange={(event) => setSupplierName(event.target.value)}
                  placeholder="Supplier or vendor"
                  value={supplierName}
                />
              </AdminField>
              <AdminField label="Status">
                <select
                  className={adminInputClass}
                  onChange={(event) =>
                    setStatus(event.target.value as ProcurementStatus)
                  }
                  value={status}
                >
                  {STATUS_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="Expected arrival">
                <input
                  className={adminInputClass}
                  onChange={(event) => setExpectedAt(event.target.value)}
                  type="date"
                  value={expectedAt}
                />
              </AdminField>
              <AdminField label="Notes">
                <textarea
                  className={adminTextareaClass}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Receiving instructions, freight terms"
                  rows={3}
                  value={notes}
                />
              </AdminField>
              <div className="border-t border-d1-line pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-d1-steel">PO total</span>
                  <span className="font-extrabold text-d1-ink">
                    {formatUsd(subtotal)}
                  </span>
                </div>
              </div>
            </AdminCard>
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
