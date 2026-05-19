// Wayfinder admin — inventory board. Bootstraps from server-built InventoryRow
// data, then refreshes from the real `/api/admin/inventory` GET. Stock edits
// post `adjust` mutations to `/api/admin/inventory`; unit-price (cost-facing)
// edits PATCH `/api/admin/products` update_variant. Aisle/bay framing comes
// straight from the inventory location/bin codes — the warehouse-wayfinding
// theme fits the stock floor.
"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  InventoryRow,
  InventoryStatus,
  InventorySummary
} from "@/features/admin/inventory/inventory-data";
import { fmt } from "../kit";
import {
  AdminBtn,
  DataTable,
  Field,
  Ico,
  Kpi,
  Mono,
  Notice,
  Panel,
  PageHead,
  Pill,
  FilterChips,
  TextInput,
  SelectInput,
  monoFont,
  wf,
  type Column
} from "./admin-kit";
import { ProductListCell } from "./product-list-cell";

type StockTab = "all" | "in_stock" | "low_stock" | "out_of_stock";

const STOCK_TABS: { id: StockTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_stock", label: "In stock" },
  { id: "low_stock", label: "Low" },
  { id: "out_of_stock", label: "Out" }
];

const STATUS_PILL: Record<InventoryStatus, "active" | "warn" | "stop"> = {
  in_stock: "active",
  low_stock: "warn",
  out_of_stock: "stop"
};

const STATUS_LABEL: Record<InventoryStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock"
};

type EditField = "quantityOnHand" | "unitCost" | "unitPrice";

type EditState = { rowId: string; field: EditField; value: string } | null;

function computeSummary(rows: InventoryRow[]): InventorySummary {
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

export function WayfinderInventoryBoard({
  rows,
  summary
}: {
  rows: InventoryRow[];
  summary: InventorySummary;
}) {
  const [items, setItems] = useState(rows);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<StockTab>("all");
  const [aisle, setAisle] = useState("all");
  const [edit, setEdit] = useState<EditState>(null);
  const [notice, setNotice] = useState<
    { tone: "info" | "warn" | "good"; message: string } | null
  >(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/inventory", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          inventory?: InventoryRow[];
          persisted?: boolean;
        };
        if (payload.persisted && payload.inventory?.length) {
          setItems(payload.inventory);
        }
      } catch {
        // server-built rows remain as the fallback
      }
    }
    void load();
  }, []);

  const liveSummary = useMemo(
    () => (items.length ? computeSummary(items) : summary),
    [items, summary]
  );

  const aisles = useMemo(
    () => Array.from(new Set(items.map((row) => row.locationCode))).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((row) => {
      const hit =
        !q ||
        row.productTitle.toLowerCase().includes(q) ||
        row.sku.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.binCode.toLowerCase().includes(q);
      const matchTab = tab === "all" || row.status === tab;
      const matchAisle = aisle === "all" || row.locationCode === aisle;
      return hit && matchTab && matchAisle;
    });
  }, [items, query, tab, aisle]);

  const lowStock = useMemo(
    () =>
      items
        .filter((row) => row.status !== "in_stock")
        .sort((a, b) => a.quantityAvailable - b.quantityAvailable)
        .slice(0, 6),
    [items]
  );

  function startEdit(row: InventoryRow, field: EditField) {
    const value =
      field === "quantityOnHand"
        ? String(row.quantityOnHand)
        : field === "unitCost"
          ? String(row.unitCost)
          : String(row.unitPrice);
    setEdit({ rowId: row.id, field, value });
    setNotice(null);
  }

  async function commitEdit() {
    if (!edit) return;
    const row = items.find((item) => item.id === edit.rowId);
    if (!row) {
      setEdit(null);
      return;
    }
    const numeric = Number(edit.value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      setNotice({ tone: "warn", message: "Enter a valid non-negative number." });
      return;
    }

    if (edit.field === "quantityOnHand") {
      const next = Math.floor(numeric);
      setItems((current) =>
        current.map((item) =>
          item.id === row.id
            ? {
                ...item,
                quantityOnHand: next,
                quantityAvailable: Math.max(
                  0,
                  next - item.quantityReserved - item.quantityDamaged
                )
              }
            : item
        )
      );
      setEdit(null);
      try {
        const response = await fetch("/api/admin/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "adjust",
            inventoryItemId: row.id,
            variantId: row.variantId,
            sku: row.sku,
            quantity: next,
            reason: "Wayfinder quick edit",
            locationCode: row.locationCode,
            binCode: row.binCode
          })
        });
        const payload = (await response.json()) as {
          persisted?: boolean;
          item?: InventoryRow;
          reason?: string;
        };
        if (payload.persisted && payload.item) {
          setItems((current) =>
            current.map((item) => (item.id === payload.item?.id ? payload.item : item))
          );
          setNotice({ tone: "good", message: `${row.sku} on-hand updated to ${next}.` });
        } else if (payload.reason) {
          setNotice({ tone: "warn", message: payload.reason });
        }
      } catch {
        setNotice({ tone: "warn", message: "Stock edit could not be saved." });
      }
      return;
    }

    // unitCost / unitPrice — both write to the catalog variant (cost + price).
    const rounded = Number(numeric.toFixed(2));
    setItems((current) =>
      current.map((item) =>
        item.id === row.id ? { ...item, [edit.field]: rounded } : item
      )
    );
    setEdit(null);
    if (!row.variantId || !row.sku) {
      setNotice({ tone: "warn", message: "Price/cost edits require a catalog variant." });
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
          changes:
            edit.field === "unitCost"
              ? { cost: rounded }
              : { price: rounded }
        })
      });
      const payload = (await response.json()) as { ok?: boolean; reason?: string };
      if (payload.ok) {
        setNotice({
          tone: "good",
          message: `${row.sku} ${edit.field === "unitCost" ? "cost" : "price"} updated to ${fmt(rounded)}.`
        });
      } else {
        setNotice({ tone: "warn", message: payload.reason || "Edit could not be saved." });
      }
    } catch {
      setNotice({ tone: "warn", message: "Edit could not be saved." });
    }
  }

  function editableCell(row: InventoryRow, field: EditField, display: string) {
    const active = edit?.rowId === row.id && edit.field === field;
    if (active) {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <TextInput
            autoFocus
            type="number"
            min={0}
            step={field === "quantityOnHand" ? 1 : 0.01}
            value={edit.value}
            onChange={(event) =>
              setEdit((current) => (current ? { ...current, value: event.target.value } : current))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") void commitEdit();
              if (event.key === "Escape") setEdit(null);
            }}
            style={{ height: 30, width: 96, fontSize: 12, fontFamily: monoFont }}
          />
          <AdminBtn size="sm" onClick={() => void commitEdit()}>
            <Ico.check size={12} />
          </AdminBtn>
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={() => startEdit(row, field)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: monoFont,
          fontWeight: 700,
          fontSize: 13,
          color: wf.ink
        }}
      >
        {display}
        <Ico.search size={11} />
      </button>
    );
  }

  const columns: Column<InventoryRow>[] = [
    {
      key: "product",
      header: "Product / SKU",
      render: (row) => (
        <ProductListCell
          title={row.productTitle}
          subtitle={row.sku}
          meta={`${row.finish} · ${row.size}`}
          image={row.productImage?.sizes.thumb || row.productImage?.url}
          imageAlt={row.productImage?.alt || row.productTitle}
        />
      )
    },
    {
      key: "location",
      header: "Aisle / Bay",
      render: (row) => (
        <div style={{ display: "grid", gap: 2 }}>
          <Mono style={{ fontSize: 12, fontWeight: 700 }}>{row.locationCode}</Mono>
          <Mono style={{ fontSize: 10, color: wf.muted }}>Bay {row.binCode}</Mono>
        </div>
      )
    },
    {
      key: "onHand",
      header: "On hand",
      align: "right",
      render: (row) => editableCell(row, "quantityOnHand", String(row.quantityOnHand))
    },
    {
      key: "available",
      header: "Available",
      align: "right",
      render: (row) => (
        <Mono style={{ fontWeight: 700, color: wf.pine }}>{row.quantityAvailable}</Mono>
      )
    },
    {
      key: "reorder",
      header: "Reorder pt",
      align: "right",
      render: (row) => <Mono style={{ color: wf.muted }}>{row.reorderPoint}</Mono>
    },
    {
      key: "cost",
      header: "Unit cost",
      align: "right",
      render: (row) => editableCell(row, "unitCost", fmt(row.unitCost))
    },
    {
      key: "price",
      header: "Sale price",
      align: "right",
      render: (row) => editableCell(row, "unitPrice", fmt(row.unitPrice))
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Pill tone={STATUS_PILL[row.status]}>{STATUS_LABEL[row.status]}</Pill>
    }
  ];

  return (
    <>
      <PageHead
        eyebrow="Catalog & Stock"
        title="Inventory"
        desc="Stock levels by aisle and bay. Quick-edit on-hand counts and unit cost/price — changes write back to the inventory and catalog databases."
      />

      {notice ? <Notice tone={notice.tone}>{notice.message}</Notice> : null}

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))"
        }}
      >
        <Kpi label="SKUs" value={liveSummary.skuCount} />
        <Kpi label="On hand" value={liveSummary.onHand} />
        <Kpi label="Available" value={liveSummary.available} tone="pine" />
        <Kpi label="Low stock" value={liveSummary.lowStock} tone="safety" />
        <Kpi label="Out of stock" value={liveSummary.outOfStock} tone="red" />
        <Kpi label="Stock value" value={fmt(liveSummary.stockValue)} hint="On hand × cost" />
      </div>

      {lowStock.length ? (
        <Panel title="Reorder queue" meta={`${lowStock.length} SKUs at or below reorder point`}>
          <div
            style={{
              display: "grid",
              gap: 8,
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))"
            }}
          >
            {lowStock.map((row) => (
              <div
                key={row.id}
                style={{
                  border: `1px solid ${wf.rail}`,
                  padding: "10px 12px",
                  display: "grid",
                  gap: 4
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "center"
                  }}
                >
                  <ProductListCell
                    title={row.productTitle}
                    subtitle={row.sku}
                    image={row.productImage?.sizes.thumb || row.productImage?.url}
                    imageAlt={row.productImage?.alt || row.productTitle}
                  />
                  <Pill tone={STATUS_PILL[row.status]}>{STATUS_LABEL[row.status]}</Pill>
                </div>
                <Mono style={{ fontSize: 10, color: wf.steel }}>
                  {row.locationCode} · Bay {row.binCode} · {row.quantityAvailable} avail / reorder{" "}
                  {row.reorderPoint}
                </Mono>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel
        title="Stock ledger"
        meta={`${filtered.length} of ${items.length} SKUs`}
        action={
          <div style={{ width: 260, maxWidth: "100%" }}>
            <TextInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search product, SKU, bay…"
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
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <FilterChips value={tab} options={STOCK_TABS} onChange={setTab} />
          <div style={{ width: 200 }}>
            <SelectInput
              value={aisle}
              onChange={(event) => setAisle(event.target.value)}
              style={{ height: 34, fontSize: 12, fontFamily: monoFont }}
            >
              <option value="all">All aisles</option>
              {aisles.map((code) => (
                <option key={code} value={code}>
                  Aisle {code}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          getKey={(row) => row.id}
          onRowHref={(row) => `/admin/products/${encodeURIComponent(row.productId)}/edit`}
          empty="No inventory rows match the current filters."
        />
      </Panel>
    </>
  );
}
