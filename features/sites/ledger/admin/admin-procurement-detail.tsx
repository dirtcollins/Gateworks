"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileX,
  PackageCheck,
  Plus,
  Search,
  Send,
  Trash2
} from "lucide-react";
import { LEDGER, formatUsd } from "@/features/sites/ledger/kit";
import {
  formatLedgerDate,
  pickVariant,
  searchCatalog
} from "@/features/sites/ledger/quote-helpers";
import {
  deleteProcurementOrder,
  fetchProcurementOrders,
  receiveProcurementItems,
  saveProcurementOrder,
  type ProcurementOrder,
  type ProcurementOrderInput,
  type ProcurementOrderItemInput,
  type ProcurementStatus
} from "@/lib/quotes-data";
import {
  AdminCard,
  AdminGhostButton,
  AdminHeading,
  AdminPrimaryButton,
  StatusPill,
  titleCase
} from "./admin-kit";

function procurementTone(
  status: ProcurementStatus
): "indigo" | "amber" | "mint" | "neutral" {
  if (status === "draft") return "amber";
  if (status === "sent") return "indigo";
  if (status === "partial") return "amber";
  if (status === "closed") return "neutral";
  return "mint";
}

type WorkingItem = {
  id?: string;
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
};

function toWorkingItems(order: ProcurementOrder): WorkingItem[] {
  return order.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    sku: item.sku,
    title: item.title,
    quantityOrdered: item.quantityOrdered,
    quantityReceived: item.quantityReceived,
    unitCost: item.unitCost
  }));
}

/* Ledger admin procurement detail — create / edit a supplier PO, add
 * line items from the catalog, send the PO, and receive inbound items
 * against the procurement_orders resource. */
export function LedgerAdminProcurementDetail({ poId }: { poId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<ProcurementOrder | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [configured, setConfigured] = useState(true);

  const [supplierName, setSupplierName] = useState("");
  const [expectedAt, setExpectedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<WorkingItem[]>([]);
  const [receipts, setReceipts] = useState<Record<string, number>>({});

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const hydrateFrom = useCallback((next: ProcurementOrder) => {
    setOrder(next);
    setSupplierName(next.supplierName);
    setExpectedAt(next.expectedAt ? next.expectedAt.slice(0, 10) : "");
    setNotes(next.notes);
    setItems(toWorkingItems(next));
    setReceipts({});
  }, []);

  const load = useCallback(async () => {
    const result = await fetchProcurementOrders();
    setConfigured(result.configured);
    const found = result.orders.find((entry) => entry.id === poId) ?? null;
    if (found) hydrateFrom(found);
    else setOrder(null);
    setLoaded(true);
  }, [poId, hydrateFrom]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(""), 2800);
    return () => window.clearTimeout(handle);
  }, [message]);

  const results = useMemo(() => searchCatalog(search), [search]);

  const status: ProcurementStatus = order?.status ?? "draft";
  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.unitCost * item.quantityOrdered, 0),
    [items]
  );
  const closed = status === "closed";

  function buildInput(overrides: Partial<ProcurementOrderInput> = {}) {
    return {
      id: order?.id,
      poNumber: order?.poNumber,
      supplierName,
      status,
      expectedAt: expectedAt || null,
      notes,
      subtotal,
      total: subtotal,
      items: items.map<ProcurementOrderItemInput>((item) => ({
        productId: item.productId || undefined,
        variantId: item.variantId || undefined,
        sku: item.sku,
        title: item.title,
        quantityOrdered: item.quantityOrdered,
        quantityReceived: item.quantityReceived,
        unitCost: item.unitCost,
        lineTotal: Number((item.unitCost * item.quantityOrdered).toFixed(2))
      })),
      ...overrides
    } satisfies ProcurementOrderInput;
  }

  async function persist(
    overrides: Partial<ProcurementOrderInput>,
    note: string
  ) {
    if (busy) return;
    setBusy(true);
    try {
      const result = await saveProcurementOrder(buildInput(overrides));
      if (result.order) hydrateFrom(result.order);
      setConfigured(result.persisted);
      setMessage(
        result.persisted
          ? note
          : "Saved locally — procurement database not configured."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleReceive() {
    if (!order || busy) return;
    const payload = items
      .filter((item) => item.id && (receipts[item.id] ?? 0) > 0)
      .map((item) => ({
        itemId: item.id as string,
        quantityReceived:
          item.quantityReceived + (receipts[item.id as string] ?? 0)
      }));
    if (!payload.length) {
      setMessage("Enter received quantities first.");
      return;
    }
    setBusy(true);
    try {
      const result = await receiveProcurementItems(order.id, payload);
      if (result.order) hydrateFrom(result.order);
      setConfigured(result.persisted);
      setMessage(
        result.persisted
          ? "Inbound items received."
          : "Receipt not persisted — procurement database not configured."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!order || busy) return;
    if (!window.confirm("Delete this supplier PO?")) return;
    setBusy(true);
    try {
      await deleteProcurementOrder(order.id);
      router.push("/ledger/admin/procurement");
    } finally {
      setBusy(false);
    }
  }

  function addCatalogItem(productId: string) {
    const product = results.find((entry) => entry.id === productId);
    if (!product) return;
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
          productId: product.id,
          variantId: variant.id,
          sku: variant.sku,
          title: product.title,
          quantityOrdered: 1,
          quantityReceived: 0,
          unitCost: variant.price
        },
        ...current
      ];
    });
    setMessage(`Added ${product.title}.`);
  }

  function updateItem(variantId: string, patch: Partial<WorkingItem>) {
    setItems((current) =>
      current.map((item) =>
        item.variantId === variantId ? { ...item, ...patch } : item
      )
    );
  }

  function removeItem(variantId: string) {
    setItems((current) =>
      current.filter((item) => item.variantId !== variantId)
    );
  }

  if (loaded && !order) {
    return (
      <div className="grid gap-6">
        <AdminHeading eyebrow="Operations" title="Supplier PO" />
        <AdminCard className="px-5 py-16 text-center">
          <FileX className="mx-auto h-10 w-10" style={{ color: LEDGER.muted }} />
          <p
            className="mt-3 text-sm font-semibold"
            style={{ color: LEDGER.ink }}
          >
            {configured
              ? "Supplier PO not found"
              : "Procurement database not configured"}
          </p>
          <Link
            className="mt-4 inline-block text-[13px] font-semibold transition hover:underline"
            href="/ledger/admin/procurement"
            style={{ color: LEDGER.indigo }}
          >
            Back to procurement
          </Link>
        </AdminCard>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="grid gap-6">
        <AdminHeading eyebrow="Operations" title="Supplier PO" />
        <AdminCard className="px-5 py-16 text-center">
          <p className="text-sm font-semibold" style={{ color: LEDGER.muted }}>
            Loading supplier PO…
          </p>
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Link
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition hover:underline"
        href="/ledger/admin/procurement"
        style={{ color: LEDGER.muted }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All supplier POs
      </Link>

      <AdminHeading
        eyebrow="Supplier PO"
        title={order.poNumber || "Draft supplier PO"}
        description={`Created ${formatLedgerDate(order.createdAt)} · ${
          supplierName || "Unassigned supplier"
        }`}
        action={
          <div className="flex flex-wrap gap-2">
            <AdminGhostButton disabled={busy} onClick={handleDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </AdminGhostButton>
            <AdminGhostButton
              disabled={busy}
              onClick={() => persist({}, "Supplier PO saved.")}
            >
              Save
            </AdminGhostButton>
            {status === "draft" ? (
              <AdminPrimaryButton
                disabled={busy}
                onClick={() => persist({ status: "sent" }, "Supplier PO sent.")}
              >
                <Send className="h-4 w-4" /> Send PO
              </AdminPrimaryButton>
            ) : null}
          </div>
        }
      />

      {!configured ? (
        <div
          className="rounded-xl px-4 py-3 text-[12px] font-semibold"
          style={{ backgroundColor: LEDGER.amberSoft, color: LEDGER.amber }}
        >
          The procurement database is not configured. Changes are not
          persisted.
        </div>
      ) : null}
      {message ? (
        <div
          className="flex items-center gap-1.5 rounded-xl px-4 py-3 text-[12px] font-semibold"
          style={{ backgroundColor: LEDGER.mintSoft, color: LEDGER.mint }}
        >
          <CheckCircle2 className="h-4 w-4" /> {message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: line items + receiving */}
        <div className="grid gap-4">
          <AdminCard>
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${LEDGER.line}` }}
            >
              <p
                className="text-[13px] font-semibold"
                style={{ color: LEDGER.ink }}
              >
                Line items ({items.length})
              </p>
              <div className="flex items-center gap-2">
                <StatusPill tone={procurementTone(status)}>
                  {titleCase(status)}
                </StatusPill>
                {!closed ? (
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition"
                    onClick={() => setShowAdd((value) => !value)}
                    style={{
                      backgroundColor: LEDGER.indigoSoft,
                      color: LEDGER.indigo
                    }}
                    type="button"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add item
                  </button>
                ) : null}
              </div>
            </div>

            {showAdd && !closed ? (
              <div
                className="p-5"
                style={{ borderBottom: `1px solid ${LEDGER.line}` }}
              >
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ border: `1px solid ${LEDGER.line}` }}
                >
                  <Search className="h-4 w-4" style={{ color: LEDGER.muted }} />
                  <input
                    aria-label="Search products"
                    autoFocus
                    className="w-full bg-transparent text-[13px] outline-none"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products by name or SKU"
                    style={{ color: LEDGER.ink }}
                    value={search}
                  />
                </div>
                <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
                  {results.map((product) => {
                    const variant = pickVariant(product);
                    if (!variant) return null;
                    return (
                      <button
                        key={product.id}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-[#fafbfc]"
                        onClick={() => addCatalogItem(product.id)}
                        type="button"
                      >
                        <span
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                          style={{ backgroundColor: LEDGER.canvas }}
                        >
                          <Image
                            alt={product.title}
                            className="h-full w-full object-contain p-1.5"
                            height={80}
                            quality={75}
                            src={
                              variant.image ||
                              product.images[0]?.url ||
                              "/assets/logo.svg"
                            }
                            width={80}
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className="block truncate text-[13px] font-semibold"
                            style={{ color: LEDGER.ink }}
                          >
                            {product.title}
                          </span>
                          <span
                            className="text-[11px]"
                            style={{ color: LEDGER.muted }}
                          >
                            SKU {variant.sku}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                  {!results.length ? (
                    <p
                      className="px-3 py-6 text-center text-[13px]"
                      style={{ color: LEDGER.muted }}
                    >
                      No products match this search.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {items.length ? (
              <div>
                {items.map((item) => {
                  const pending = item.id ? receipts[item.id] ?? 0 : 0;
                  const outstanding = Math.max(
                    0,
                    item.quantityOrdered - item.quantityReceived
                  );
                  return (
                    <div
                      key={item.variantId}
                      className="grid gap-2 px-5 py-3"
                      style={{ borderBottom: `1px solid ${LEDGER.line}` }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className="truncate text-[13px] font-semibold"
                            style={{ color: LEDGER.ink }}
                          >
                            {item.title}
                          </p>
                          <p
                            className="text-[11px] font-medium"
                            style={{ color: LEDGER.muted }}
                          >
                            {item.sku} · received {item.quantityReceived}/
                            {item.quantityOrdered}
                          </p>
                        </div>
                        {!closed ? (
                          <button
                            aria-label="Remove line"
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg transition"
                            onClick={() => removeItem(item.variantId)}
                            style={{
                              border: `1px solid ${LEDGER.line}`,
                              color: LEDGER.muted
                            }}
                            type="button"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <label className="grid gap-1">
                          <span
                            className="text-[11px] font-semibold"
                            style={{ color: LEDGER.muted }}
                          >
                            Qty ordered
                          </span>
                          <input
                            className="rounded-lg px-2.5 py-1.5 text-[13px] outline-none"
                            disabled={closed}
                            inputMode="numeric"
                            onChange={(event) =>
                              updateItem(item.variantId, {
                                quantityOrdered: Math.max(
                                  1,
                                  Math.round(Number(event.target.value)) || 1
                                )
                              })
                            }
                            style={{
                              border: `1px solid ${LEDGER.line}`,
                              color: LEDGER.ink
                            }}
                            value={item.quantityOrdered}
                          />
                        </label>
                        <label className="grid gap-1">
                          <span
                            className="text-[11px] font-semibold"
                            style={{ color: LEDGER.muted }}
                          >
                            Unit cost
                          </span>
                          <input
                            className="rounded-lg px-2.5 py-1.5 text-[13px] outline-none"
                            disabled={closed}
                            inputMode="decimal"
                            onChange={(event) =>
                              updateItem(item.variantId, {
                                unitCost: Math.max(
                                  0,
                                  Number(event.target.value) || 0
                                )
                              })
                            }
                            style={{
                              border: `1px solid ${LEDGER.line}`,
                              color: LEDGER.ink
                            }}
                            value={item.unitCost}
                          />
                        </label>
                        <label className="grid gap-1">
                          <span
                            className="text-[11px] font-semibold"
                            style={{ color: LEDGER.muted }}
                          >
                            Receive now
                          </span>
                          <input
                            className="rounded-lg px-2.5 py-1.5 text-[13px] outline-none disabled:opacity-50"
                            disabled={!item.id || outstanding === 0 || closed}
                            inputMode="numeric"
                            max={outstanding}
                            min={0}
                            onChange={(event) => {
                              if (!item.id) return;
                              const next = Math.max(
                                0,
                                Math.min(
                                  outstanding,
                                  Math.round(Number(event.target.value)) || 0
                                )
                              );
                              setReceipts((current) => ({
                                ...current,
                                [item.id as string]: next
                              }));
                            }}
                            placeholder="0"
                            style={{
                              border: `1px solid ${LEDGER.line}`,
                              color: LEDGER.ink
                            }}
                            value={pending || ""}
                          />
                        </label>
                      </div>
                      <p
                        className="text-right text-[12px] font-semibold"
                        style={{ color: LEDGER.body }}
                      >
                        Line {formatUsd(item.unitCost * item.quantityOrdered)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p
                className="px-5 py-10 text-center text-[13px]"
                style={{ color: LEDGER.body }}
              >
                No line items yet. Add stock to order from a supplier.
              </p>
            )}

            <div className="flex items-center justify-between px-5 py-4">
              <span
                className="text-[14px] font-semibold"
                style={{ color: LEDGER.ink }}
              >
                PO total
              </span>
              <span
                className="text-[16px] font-semibold tracking-tight"
                style={{ color: LEDGER.ink }}
              >
                {formatUsd(subtotal)}
              </span>
            </div>
          </AdminCard>

          {order.items.length && !closed ? (
            <AdminCard className="p-5">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: LEDGER.muted }}
              >
                Receive inbound material
              </p>
              <p className="mt-1 text-[13px]" style={{ color: LEDGER.body }}>
                Enter received quantities in the lines above, then record the
                receipt.
              </p>
              <AdminPrimaryButton disabled={busy} onClick={handleReceive}>
                <PackageCheck className="h-4 w-4" /> Record receipt
              </AdminPrimaryButton>
            </AdminCard>
          ) : null}
        </div>

        {/* Right: supplier details */}
        <div className="grid gap-4">
          <AdminCard className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Supplier details
            </p>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1">
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: LEDGER.body }}
                >
                  Supplier name
                </span>
                <input
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  disabled={closed}
                  onChange={(event) => setSupplierName(event.target.value)}
                  style={{
                    border: `1px solid ${LEDGER.line}`,
                    color: LEDGER.ink
                  }}
                  value={supplierName}
                />
              </label>
              <label className="grid gap-1">
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: LEDGER.body }}
                >
                  Expected delivery
                </span>
                <input
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  disabled={closed}
                  onChange={(event) => setExpectedAt(event.target.value)}
                  style={{
                    border: `1px solid ${LEDGER.line}`,
                    color: LEDGER.ink
                  }}
                  type="date"
                  value={expectedAt}
                />
              </label>
              <label className="grid gap-1">
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: LEDGER.body }}
                >
                  Notes
                </span>
                <textarea
                  className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                  disabled={closed}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  style={{
                    border: `1px solid ${LEDGER.line}`,
                    color: LEDGER.ink
                  }}
                  value={notes}
                />
              </label>
            </div>
          </AdminCard>

          <AdminCard className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              PO status
            </p>
            <div className="mt-3 grid gap-1.5">
              {(
                ["draft", "sent", "partial", "received", "closed"] as ProcurementStatus[]
              ).map((flowStatus) => {
                const active = status === flowStatus;
                return (
                  <button
                    key={flowStatus}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-semibold transition disabled:opacity-50"
                    disabled={busy || closed}
                    onClick={() =>
                      persist(
                        { status: flowStatus },
                        `Status set to ${flowStatus}.`
                      )
                    }
                    style={{
                      backgroundColor: active ? LEDGER.indigo : LEDGER.canvas,
                      color: active ? "#ffffff" : LEDGER.body
                    }}
                    type="button"
                  >
                    {titleCase(flowStatus)}
                    {active ? (
                      <span className="text-[11px]">Current</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[12px]" style={{ color: LEDGER.muted }}>
              Updated {formatLedgerDate(order.updatedAt)}
            </p>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
