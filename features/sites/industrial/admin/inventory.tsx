"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Boxes, Search } from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminCard,
  AdminEmptyState,
  AdminField,
  AdminHeader,
  AdminPill,
  AdminStatGrid,
  AdminTabs,
  adminInputClass
} from "@/features/sites/industrial/admin/kit";
import type {
  InventoryRow,
  InventoryStatus,
  InventorySummary
} from "@/features/admin/inventory/inventory-data";
import {
  getInventoryCategories,
  getInventorySummary
} from "@/features/admin/inventory/inventory-data";
import type { InventoryMutationAction } from "@/lib/inventory-repository";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin inventory. Reads the live inventory rows
 * from /api/admin/inventory, falls back to the server-built seed rows,
 * and posts receive / adjust / cost mutations back to the API.
 * ------------------------------------------------------------------ */

type InventoryTab = "all" | "low_stock" | "out_of_stock" | "in_stock";

const TABS: Array<{ id: InventoryTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "in_stock", label: "In stock" },
  { id: "low_stock", label: "Low stock" },
  { id: "out_of_stock", label: "Out" }
];

const STATUS_TONE: Record<InventoryStatus, "pine" | "amber" | "red"> = {
  in_stock: "pine",
  low_stock: "amber",
  out_of_stock: "red"
};

const STATUS_LABEL: Record<InventoryStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock"
};

type AdjustDraft = {
  action: InventoryMutationAction;
  quantity: string;
  reason: string;
};

export function IndustrialInventory({
  initialRows,
  initialSummary
}: {
  initialRows: InventoryRow[];
  initialSummary: InventorySummary;
}) {
  const [rows, setRows] = useState<InventoryRow[]>(initialRows);
  const [summary, setSummary] = useState<InventorySummary>(initialSummary);
  const [persisted, setPersisted] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<InventoryTab>("all");
  const [categorySlug, setCategorySlug] = useState("all");
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdjustDraft>({
    action: "receive",
    quantity: "",
    reason: ""
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadInventory() {
      try {
        const response = await fetch("/api/admin/inventory", {
          cache: "no-store"
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          inventory?: InventoryRow[];
          persisted?: boolean;
        };
        if (payload.persisted && payload.inventory && payload.inventory.length) {
          setRows(payload.inventory);
          setSummary(getInventorySummary(payload.inventory));
          setPersisted(true);
        }
      } catch {
        // keep seed rows
      }
    }

    void loadInventory();
  }, []);

  const categories = useMemo(() => getInventoryCategories(rows), [rows]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        !term ||
        row.productTitle.toLowerCase().includes(term) ||
        row.sku.toLowerCase().includes(term) ||
        row.binCode.toLowerCase().includes(term);
      const matchesCategory =
        categorySlug === "all" || row.categorySlug === categorySlug;
      const matchesTab = tab === "all" || row.status === tab;
      return matchesQuery && matchesCategory && matchesTab;
    });
  }, [rows, query, tab, categorySlug]);

  const tabsWithCount = TABS.map((entry) => ({
    ...entry,
    count:
      entry.id === "all"
        ? rows.length
        : rows.filter((row) => row.status === entry.id).length
  }));

  const stats = [
    { label: "Tracked SKUs", value: String(summary.skuCount) },
    {
      label: "On hand",
      value: String(summary.onHand),
      hint: `${summary.reserved} reserved`
    },
    {
      label: "Low / out",
      value: `${summary.lowStock} / ${summary.outOfStock}`
    },
    { label: "Stock value", value: formatUsd(summary.stockValue) }
  ];

  function openAdjust(rowId: string) {
    setActiveRowId((current) => (current === rowId ? null : rowId));
    setDraft({ action: "receive", quantity: "", reason: "" });
    setMessage(null);
  }

  async function submitAdjustment(row: InventoryRow) {
    const quantity = Number(draft.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage("Enter a quantity greater than zero.");
      return;
    }
    setMessage("Saving inventory change…");
    try {
      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: draft.action,
          inventoryItemId: row.id,
          variantId: row.variantId,
          sku: row.sku,
          quantity,
          reason: draft.reason.trim() || `Admin ${draft.action}`
        })
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        item?: InventoryRow;
        reason?: string;
        persisted?: boolean;
      } | null;

      if (response.ok && result?.ok && result.item) {
        const updatedRows = rows.map((entry) =>
          entry.id === row.id ? result.item! : entry
        );
        setRows(updatedRows);
        setSummary(getInventorySummary(updatedRows));
        setMessage("Inventory change saved.");
        setActiveRowId(null);
      } else {
        setMessage(result?.reason || "Inventory change was not saved.");
      }
    } catch {
      setMessage("Inventory change failed.");
    }
  }

  return (
    <div className="grid gap-8">
      <AdminHeader
        eyebrow="Merchandising"
        title="Inventory"
        description="Live stock levels, reorder thresholds, and stock adjustments."
      />

      {!persisted ? (
        <p className="border border-d1-line bg-d1-card px-4 py-3 text-[12px] font-semibold text-d1-steel">
          Showing seed inventory. Connect the Supabase service role to manage live
          stock.
        </p>
      ) : null}

      <AdminStatGrid stats={stats} />

      <section className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-d1-ink pb-3">
        <AdminTabs tabs={tabsWithCount} active={tab} onSelect={setTab} />
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter by category"
            className="h-9 border border-d1-line bg-white px-3 text-[12px] font-bold uppercase tracking-[0.06em] text-d1-ink outline-none focus:border-d1-ink"
            onChange={(event) => setCategorySlug(event.target.value)}
            value={categorySlug}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 border border-d1-line bg-white px-3">
            <Search className="h-4 w-4 text-d1-steel" />
            <input
              aria-label="Search inventory"
              className="h-9 w-52 bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search SKU, product, bin"
              value={query}
            />
          </div>
        </div>
      </section>

      {filtered.length ? (
        <section className="overflow-x-auto border border-d1-line bg-d1-card">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Bin</th>
                <th className="px-4 py-3 text-right">On hand</th>
                <th className="px-4 py-3 text-right">Reserved</th>
                <th className="px-4 py-3 text-right">Available</th>
                <th className="px-4 py-3 text-right">Reorder</th>
                <th className="px-4 py-3 text-right">Unit cost</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-d1-line">
              {filtered.map((row) => (
                <Fragment key={row.id}>
                  <tr className="transition hover:bg-d1-paper">
                    <td className="px-4 py-3.5">
                      <span className="block text-sm font-extrabold text-d1-ink">
                        {row.productTitle}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                        {row.sku} · {row.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-d1-steel">
                      {row.binCode}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                      {row.quantityOnHand}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-semibold text-d1-steel">
                      {row.quantityReserved}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-bold text-d1-ink">
                      {row.quantityAvailable}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-semibold text-d1-steel">
                      {row.reorderPoint}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-semibold text-d1-steel">
                      {formatUsd(row.unitCost)}
                    </td>
                    <td className="px-4 py-3.5">
                      <AdminPill tone={STATUS_TONE[row.status]}>
                        {STATUS_LABEL[row.status]}
                      </AdminPill>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end">
                        <button
                          className="border border-d1-line bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-d1-ink transition hover:border-d1-ink"
                          onClick={() => openAdjust(row.id)}
                          type="button"
                        >
                          {activeRowId === row.id ? "Close" : "Adjust"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {activeRowId === row.id ? (
                    <tr>
                      <td className="px-4 py-4" colSpan={9}>
                        <AdminCard className="grid gap-4 p-4">
                          <div className="grid gap-4 sm:grid-cols-[160px_140px_1fr_auto] sm:items-end">
                            <AdminField label="Action">
                              <select
                                className={adminInputClass}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    action: event.target
                                      .value as InventoryMutationAction
                                  }))
                                }
                                value={draft.action}
                              >
                                <option value="receive">Receive stock</option>
                                <option value="add">Add (adjust up)</option>
                                <option value="remove">Remove (adjust down)</option>
                                <option value="cycle_count">Cycle count</option>
                              </select>
                            </AdminField>
                            <AdminField label="Quantity">
                              <input
                                className={adminInputClass}
                                inputMode="numeric"
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    quantity: event.target.value
                                  }))
                                }
                                value={draft.quantity}
                              />
                            </AdminField>
                            <AdminField label="Reason / note">
                              <input
                                className={adminInputClass}
                                onChange={(event) =>
                                  setDraft((current) => ({
                                    ...current,
                                    reason: event.target.value
                                  }))
                                }
                                placeholder="e.g. PO-1042 receipt"
                                value={draft.reason}
                              />
                            </AdminField>
                            <button
                              className="inline-flex items-center justify-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
                              onClick={() => submitAdjustment(row)}
                              type="button"
                            >
                              Save change
                            </button>
                          </div>
                          {message ? (
                            <p className="text-[12px] font-semibold text-d1-steel">
                              {message}
                            </p>
                          ) : null}
                        </AdminCard>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <AdminEmptyState
          icon={<Boxes className="h-8 w-8" />}
          title="No inventory matches this view"
          description="Adjust the filters to see stock."
        />
      )}

      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
        Showing {filtered.length} of {rows.length} SKUs
      </p>
    </div>
  );
}
