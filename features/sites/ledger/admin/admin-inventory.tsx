"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Check,
  FileDown,
  Loader2,
  Search,
  TriangleAlert,
  Warehouse
} from "lucide-react";
import { LEDGER, formatUsd, formatUsd0 } from "@/features/sites/ledger/kit";
import type {
  InventoryRow,
  InventorySummary
} from "@/features/admin/inventory/inventory-data";
import {
  AdminCard,
  AdminEmpty,
  AdminGhostButton,
  AdminHeading,
  StatTile,
  StatusPill,
  formatAdminDate
} from "./admin-kit";

/* Ledger admin — inventory. Reads stock rows from the real
 * /api/admin/inventory route (Supabase-backed) and falls back to the
 * server-seeded rows passed as props. Stock adjustments POST the
 * "adjust" mutation; unit cost edits PATCH /api/admin/products. */

type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

type RowEditState = {
  rowId: string;
  field: "quantity" | "cost";
  value: string;
};

type MutationResponse = {
  ok?: boolean;
  item?: InventoryRow;
  reason?: string;
  persisted?: boolean;
};

function statusMeta(status: InventoryRow["status"]): {
  tone: "mint" | "amber" | "rose";
  label: string;
} {
  if (status === "out_of_stock") return { tone: "rose", label: "Out of stock" };
  if (status === "low_stock") return { tone: "amber", label: "Low stock" };
  return { tone: "mint", label: "In stock" };
}

function summarize(rows: InventoryRow[]): InventorySummary {
  return rows.reduce<InventorySummary>(
    (summary, row) => ({
      skuCount: summary.skuCount + 1,
      onHand: summary.onHand + row.quantityOnHand,
      reserved: summary.reserved + row.quantityReserved,
      available: summary.available + row.quantityAvailable,
      lowStock: summary.lowStock + (row.status === "low_stock" ? 1 : 0),
      outOfStock: summary.outOfStock + (row.status === "out_of_stock" ? 1 : 0),
      damaged: summary.damaged + row.quantityDamaged,
      stockValue: summary.stockValue + row.quantityOnHand * row.unitCost
    }),
    {
      skuCount: 0,
      onHand: 0,
      reserved: 0,
      available: 0,
      lowStock: 0,
      outOfStock: 0,
      damaged: 0,
      stockValue: 0
    }
  );
}

export function LedgerAdminInventory({
  initialRows,
  initialSummary
}: {
  initialRows: InventoryRow[];
  initialSummary: InventorySummary;
}) {
  const [rows, setRows] = useState<InventoryRow[]>(initialRows);
  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [edit, setEdit] = useState<RowEditState | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; message: string } | null>(
    null
  );
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/inventory", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          inventory?: InventoryRow[];
          persisted?: boolean;
        };
        if (mounted && payload.persisted && payload.inventory?.length) {
          setRows(payload.inventory);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const summary = useMemo(
    () => (rows === initialRows ? initialSummary : summarize(rows)),
    [rows, initialRows, initialSummary]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        !normalized ||
        row.productTitle.toLowerCase().includes(normalized) ||
        row.sku.toLowerCase().includes(normalized) ||
        row.category.toLowerCase().includes(normalized) ||
        row.binCode.toLowerCase().includes(normalized);
      const matchesStock = stockFilter === "all" || row.status === stockFilter;
      return matchesQuery && matchesStock;
    });
  }, [rows, query, stockFilter]);

  function startEdit(row: InventoryRow, field: "quantity" | "cost") {
    setNotice(null);
    setEdit({
      rowId: row.id,
      field,
      value: field === "quantity" ? String(row.quantityOnHand) : String(row.unitCost)
    });
  }

  async function commitEdit() {
    if (!edit) return;
    const row = rows.find((entry) => entry.id === edit.rowId);
    if (!row) {
      setEdit(null);
      return;
    }
    const parsed = Number(edit.value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setNotice({ tone: "error", message: "Enter a valid non-negative number." });
      return;
    }
    setSavingRowId(row.id);

    if (edit.field === "quantity") {
      const nextQuantity = Math.max(0, Math.floor(parsed));
      try {
        const response = await fetch("/api/admin/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "adjust",
            inventoryItemId: row.id,
            variantId: row.variantId,
            locationCode: row.locationCode,
            binCode: row.binCode,
            quantity: nextQuantity,
            reason: "Ledger admin stock adjustment"
          })
        });
        const payload = (await response.json().catch(() => null)) as MutationResponse | null;
        if (payload?.item) {
          const updated = payload.item;
          setRows((current) =>
            current.map((entry) => (entry.id === row.id ? updated : entry))
          );
          setNotice({ tone: "ok", message: `${row.sku} on-hand set to ${nextQuantity}.` });
        } else if (payload?.ok) {
          setRows((current) =>
            current.map((entry) =>
              entry.id === row.id
                ? {
                    ...entry,
                    quantityOnHand: nextQuantity,
                    quantityAvailable: Math.max(
                      0,
                      nextQuantity - entry.quantityReserved - entry.quantityDamaged
                    )
                  }
                : entry
            )
          );
          setNotice({ tone: "ok", message: `${row.sku} stock adjusted.` });
        } else {
          setNotice({
            tone: "error",
            message: payload?.reason || "Stock adjustment was not saved."
          });
        }
      } catch {
        setNotice({ tone: "error", message: "Network error — stock not saved." });
      }
    } else {
      const nextCost = Number(parsed.toFixed(2));
      if (!row.variantId || !row.sku) {
        setNotice({ tone: "error", message: "Cost edits require a catalog variant." });
        setSavingRowId(null);
        setEdit(null);
        return;
      }
      try {
        const response = await fetch("/api/admin/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_variant",
            variantId: row.variantId,
            sku: row.sku,
            changes: { cost: nextCost }
          })
        });
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; reason?: string }
          | null;
        if (response.ok && payload?.ok) {
          setRows((current) =>
            current.map((entry) =>
              entry.id === row.id ? { ...entry, unitCost: nextCost } : entry
            )
          );
          setNotice({ tone: "ok", message: `${row.sku} unit cost set to ${formatUsd(nextCost)}.` });
        } else {
          setNotice({
            tone: "error",
            message: payload?.reason || "Unit cost was not saved."
          });
        }
      } catch {
        setNotice({ tone: "error", message: "Network error — cost not saved." });
      }
    }

    setSavingRowId(null);
    setEdit(null);
  }

  function exportCsv() {
    const headers = [
      "Product",
      "SKU",
      "Category",
      "Bin",
      "On hand",
      "Reserved",
      "Available",
      "Reorder point",
      "Unit cost",
      "Status"
    ];
    const csvRows = filtered.map((row) =>
      [
        row.productTitle,
        row.sku,
        row.category,
        row.binCode,
        row.quantityOnHand,
        row.quantityReserved,
        row.quantityAvailable,
        row.reorderPoint,
        formatUsd(row.unitCost),
        statusMeta(row.status).label
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ledger-inventory-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  const editInputStyle = {
    border: `1px solid ${LEDGER.indigo}`,
    color: LEDGER.ink,
    backgroundColor: LEDGER.surface
  } as const;

  return (
    <div className="grid gap-6">
      <AdminHeading
        eyebrow="Fulfillment"
        title="Inventory"
        description="Stock levels, unit cost, and low-stock exposure across every warehouse SKU."
        action={
          <AdminGhostButton onClick={exportCsv}>
            <FileDown className="h-4 w-4" /> Export
          </AdminGhostButton>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="SKUs tracked" value={String(summary.skuCount)} sub="Inventory items" />
        <StatTile
          label="Units on hand"
          value={summary.onHand.toLocaleString("en-US")}
          sub={`${summary.available.toLocaleString("en-US")} available`}
        />
        <StatTile
          label="Low / out of stock"
          value={String(summary.lowStock + summary.outOfStock)}
          sub={`${summary.outOfStock} out of stock`}
          accent={summary.lowStock + summary.outOfStock > 0 ? LEDGER.amber : LEDGER.mint}
        />
        <StatTile
          label="Stock value"
          value={formatUsd0(summary.stockValue)}
          sub="At unit cost"
        />
      </section>

      {notice ? (
        <div
          className="rounded-xl px-4 py-2.5 text-[13px] font-medium"
          style={{
            backgroundColor: notice.tone === "error" ? LEDGER.roseSoft : LEDGER.mintSoft,
            color: notice.tone === "error" ? LEDGER.rose : LEDGER.mint
          }}
        >
          {notice.message}
        </div>
      ) : null}

      <AdminCard>
        <div
          className="flex flex-wrap items-center justify-between gap-3 p-4"
          style={{ borderBottom: `1px solid ${LEDGER.line}` }}
        >
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: "all", label: "All" },
                { id: "in_stock", label: "In stock" },
                { id: "low_stock", label: "Low stock" },
                { id: "out_of_stock", label: "Out of stock" }
              ] as Array<{ id: StockFilter; label: string }>
            ).map((option) => {
              const active = stockFilter === option.id;
              return (
                <button
                  key={option.id}
                  className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
                  onClick={() => setStockFilter(option.id)}
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
              aria-label="Search inventory"
              className="w-44 bg-transparent text-[13px] outline-none sm:w-60"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, SKU, or bin"
              style={{ color: LEDGER.ink }}
              value={query}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead>
              <tr
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: LEDGER.muted, borderBottom: `1px solid ${LEDGER.line}` }}
              >
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Bin</th>
                <th className="px-5 py-3 text-right">On hand</th>
                <th className="px-5 py-3 text-right">Reserved</th>
                <th className="px-5 py-3 text-right">Available</th>
                <th className="px-5 py-3 text-right">Unit cost</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => {
                const meta = statusMeta(row.status);
                const editingQuantity =
                  edit?.rowId === row.id && edit.field === "quantity";
                const editingCost = edit?.rowId === row.id && edit.field === "cost";
                const rowSaving = savingRowId === row.id;
                return (
                  <tr
                    key={row.id}
                    style={{ borderTop: index === 0 ? "none" : `1px solid ${LEDGER.line}` }}
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-semibold" style={{ color: LEDGER.ink }}>
                        {row.productTitle}
                      </p>
                      <p
                        className="text-[11px] font-medium uppercase tracking-[0.06em]"
                        style={{ color: LEDGER.muted }}
                      >
                        {row.sku} · {row.category}
                      </p>
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12px] font-medium"
                      style={{ color: LEDGER.body }}
                    >
                      {row.binCode}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {editingQuantity ? (
                        <input
                          aria-label="On-hand quantity"
                          autoFocus
                          className="w-20 rounded-lg px-2 py-1 text-right text-[13px] outline-none"
                          onBlur={commitEdit}
                          onChange={(event) =>
                            setEdit({ ...edit, value: event.target.value })
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") commitEdit();
                            if (event.key === "Escape") setEdit(null);
                          }}
                          style={editInputStyle}
                          type="number"
                          value={edit.value}
                        />
                      ) : (
                        <button
                          className="text-[13px] font-semibold transition hover:underline"
                          disabled={rowSaving}
                          onClick={() => startEdit(row, "quantity")}
                          style={{ color: LEDGER.indigo }}
                          type="button"
                        >
                          {row.quantityOnHand}
                        </button>
                      )}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13px] font-medium"
                      style={{ color: LEDGER.body }}
                    >
                      {row.quantityReserved}
                    </td>
                    <td
                      className="px-5 py-3.5 text-right text-[13px] font-semibold"
                      style={{ color: LEDGER.ink }}
                    >
                      {row.quantityAvailable}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {editingCost ? (
                        <input
                          aria-label="Unit cost"
                          autoFocus
                          className="w-24 rounded-lg px-2 py-1 text-right text-[13px] outline-none"
                          onBlur={commitEdit}
                          onChange={(event) =>
                            setEdit({ ...edit, value: event.target.value })
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") commitEdit();
                            if (event.key === "Escape") setEdit(null);
                          }}
                          step="0.01"
                          style={editInputStyle}
                          type="number"
                          value={edit.value}
                        />
                      ) : (
                        <button
                          className="text-[13px] font-semibold transition hover:underline"
                          disabled={rowSaving}
                          onClick={() => startEdit(row, "cost")}
                          style={{ color: LEDGER.indigo }}
                          type="button"
                        >
                          {formatUsd(row.unitCost)}
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill tone={meta.tone}>
                        {rowSaving ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : meta.tone === "mint" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <TriangleAlert className="h-3 w-3" />
                        )}
                        {meta.label}
                      </StatusPill>
                    </td>
                    <td
                      className="px-5 py-3.5 text-[12px] font-medium"
                      style={{ color: LEDGER.muted }}
                    >
                      {formatAdminDate(row.lastUpdated)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loading && rows.length === 0 ? (
          <p
            className="px-5 py-14 text-center text-sm font-medium"
            style={{ color: LEDGER.muted }}
          >
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
            Loading inventory…
          </p>
        ) : filtered.length === 0 ? (
          <AdminEmpty
            icon={<Warehouse className="h-9 w-9" />}
            title="No inventory in this view"
            description="Adjust the search or stock filter to see warehouse SKUs."
          />
        ) : null}
      </AdminCard>

      {filtered.length ? (
        <p className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: LEDGER.muted }}>
          <ArrowDownToLine className="h-3.5 w-3.5" />
          Showing {filtered.length} of {rows.length} SKUs · click any on-hand or unit-cost
          value to edit inline.
        </p>
      ) : null}
    </div>
  );
}
