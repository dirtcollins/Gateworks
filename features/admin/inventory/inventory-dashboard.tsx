"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ClipboardCheck,
  Download,
  Check,
  History,
  PackageCheck,
  Plus,
  Pencil,
  Search,
  ShoppingCart,
  X,
  TriangleAlert,
  Upload,
  Warehouse,
  Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";
import type {
  InventoryAuditEvent,
  InventoryEventType,
  InventoryRow,
  InventoryStatus,
  InventorySummary
} from "@/features/admin/inventory/inventory-data";
import { getInventorySummary } from "@/features/admin/inventory/inventory-data";
import { formatCurrency } from "@/lib/utils";
import { getProductImageForSize } from "@/lib/product-image";

type InventoryDashboardProps = {
  categories: Array<{ slug: string; name: string }>;
  rows: InventoryRow[];
  summary: InventorySummary;
};

type OperationMode =
  | "add_item"
  | "add_stock"
  | "remove_stock"
  | "adjust_stock"
  | "mark_damaged"
  | "mark_returned"
  | "reserve"
  | "release"
  | "transfer"
  | "edit"
  | "threshold"
  | "supplier"
  | "bin"
  | "history"
  | "receive"
  | "purchase_order"
  | "audit";

type OperationState = {
  mode: OperationMode;
  rowId?: string;
};

type OperationForm = {
  quantity: string;
  reason: string;
  orderNumber: string;
  locationCode: string;
  binCode: string;
  supplier: string;
  reorderPoint: string;
  productTitle: string;
  sku: string;
  category: string;
  categorySlug: string;
  size: string;
  material: string;
  finish: string;
  unitCost: string;
  unitPrice: string;
};

type QuickEditField = "quantityOnHand" | "unitPrice";
type QuickEditState = {
  rowId: string;
  field: QuickEditField;
  value: string;
} | null;

type InventoryApiPayload = {
  inventory?: InventoryRow[];
  persisted?: boolean;
};

type InventoryMutationResponse = {
  ok?: boolean;
  persisted?: boolean;
  item?: InventoryRow;
  reason?: string;
};

const statusLabels: Record<InventoryStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock"
};

const statusClasses: Record<InventoryStatus, string> = {
  in_stock: "border-emerald-200 bg-emerald-50 text-emerald-800",
  low_stock: "border-amber-200 bg-amber-50 text-amber-900",
  out_of_stock: "border-red-200 bg-red-50 text-red-800"
};

const actionLinkClass =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 border px-3 text-xs font-black uppercase tracking-[0.08em] transition";

const operationLabels: Record<OperationMode, string> = {
  add_item: "Add new inventory item",
  add_stock: "Add stock",
  remove_stock: "Remove stock",
  adjust_stock: "Adjust quantity",
  mark_damaged: "Mark damaged",
  mark_returned: "Mark returned",
  reserve: "Reserve inventory",
  release: "Release reserved",
  transfer: "Transfer location",
  edit: "Edit item",
  threshold: "Set low-stock threshold",
  supplier: "Assign supplier",
  bin: "Assign rack/bin",
  history: "Inventory history",
  receive: "Receive inventory",
  purchase_order: "Create purchase order",
  audit: "Run inventory audit"
};

const rowActions: Array<{ mode: OperationMode; label: string }> = [
  { mode: "add_stock", label: "Add" },
  { mode: "remove_stock", label: "Remove" },
  { mode: "adjust_stock", label: "Adjust" },
  { mode: "mark_damaged", label: "Damaged" },
  { mode: "mark_returned", label: "Returned" },
  { mode: "reserve", label: "Reserve" },
  { mode: "release", label: "Release" },
  { mode: "transfer", label: "Transfer" },
  { mode: "edit", label: "Edit SKU" },
  { mode: "threshold", label: "Threshold" },
  { mode: "supplier", label: "Supplier" },
  { mode: "bin", label: "Rack/bin" },
  { mode: "history", label: "History" }
];

function getRowThumbnail(row: InventoryRow) {
  if (row.productImage) {
    return row.productImage.sizes?.thumb || getProductImageForSize(row.productImage.url, "thumb");
  }
  return "/assets/logo.svg";
}

const eventTypeByMode: Partial<Record<OperationMode, InventoryEventType>> = {
  add_item: "created",
  add_stock: "added",
  remove_stock: "removed",
  adjust_stock: "adjusted",
  mark_damaged: "damaged",
  mark_returned: "returned",
  reserve: "reserved",
  release: "released",
  transfer: "transferred",
  edit: "edited",
  threshold: "edited",
  supplier: "edited",
  bin: "transferred",
  receive: "received",
  purchase_order: "created",
  audit: "adjusted"
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function calculateAvailable(row: InventoryRow) {
  return Math.max(0, row.quantityOnHand - row.quantityReserved - row.quantityDamaged);
}

function getStatus(quantityAvailable: number, reorderPoint: number): InventoryStatus {
  if (quantityAvailable <= 0) return "out_of_stock";
  if (quantityAvailable <= reorderPoint) return "low_stock";
  return "in_stock";
}

function normalizeRow(row: InventoryRow): InventoryRow {
  const quantityAvailable = calculateAvailable(row);
  return {
    ...row,
    quantityAvailable,
    status: getStatus(quantityAvailable, row.reorderPoint)
  };
}

function createForm(row?: InventoryRow): OperationForm {
  return {
    quantity: "",
    reason: "",
    orderNumber: "",
    locationCode: row?.locationCode || "A-01",
    binCode: row?.binCode || "A-01-01-01",
    supplier: row?.supplier || "Primary supplier",
    reorderPoint: String(row?.reorderPoint ?? 12),
    productTitle: row?.productTitle || "",
    sku: row?.sku || "",
    category: row?.category || "Gate Hardware",
    categorySlug: row?.categorySlug || "gate-hardware",
    size: row?.size || "Standard",
    material: row?.material || "Steel",
    finish: row?.finish || "Standard",
    unitCost: String(row?.unitCost ?? ""),
    unitPrice: String(row?.unitPrice ?? "")
  };
}

function buildAuditEvent(
  row: InventoryRow,
  nextRow: InventoryRow,
  mode: OperationMode,
  quantityChange: number,
  reason: string
): InventoryAuditEvent {
  const now = new Date().toISOString();
  return {
    id: `${row.id}:${now}:${mode}`,
    inventoryItemId: row.id,
    type: eventTypeByMode[mode] || "adjusted",
    quantityChange,
    previousOnHand: row.quantityOnHand,
    newOnHand: nextRow.quantityOnHand,
    previousReserved: row.quantityReserved,
    newReserved: nextRow.quantityReserved,
    previousLocation: row.binCode,
    newLocation: nextRow.binCode,
    reason,
    staffName: "Admin user",
    createdAt: now
  };
}

function csvEscape(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function InventoryDashboard({ categories, rows, summary }: InventoryDashboardProps) {
  const [items, setItems] = useState(rows);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [supplier, setSupplier] = useState("all");
  const [location, setLocation] = useState("all");
  const [status, setStatus] = useState<"all" | InventoryStatus>("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [outOnly, setOutOnly] = useState(false);
  const [damagedOnly, setDamagedOnly] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(220);
  const [operation, setOperation] = useState<OperationState | null>(null);
  const [form, setForm] = useState(createForm());
  const [formError, setFormError] = useState("");
  const [quickEdit, setQuickEdit] = useState<QuickEditState>(null);
  const [quickEditError, setQuickEditError] = useState("");
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadPersistedInventory() {
      const response = await fetch("/api/admin/inventory", { cache: "no-store" });
      if (!response.ok) return;

      const payload = (await response.json()) as InventoryApiPayload;
      if (payload.persisted && payload.inventory?.length) {
        setItems(payload.inventory);
      }
    }

    void loadPersistedInventory();
  }, []);

  const currentSummary = useMemo(() => getInventorySummary(items), [items]);
  const displayedSummary = items.length ? currentSummary : summary;
  const suppliers = useMemo(
    () => Array.from(new Set(items.map((item) => item.supplier))).sort(),
    [items]
  );
  const locations = useMemo(
    () => Array.from(new Set(items.map((item) => item.locationCode))).sort(),
    [items]
  );

  const selectedRow = useMemo(
    () => items.find((item) => item.id === operation?.rowId),
    [items, operation]
  );

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return items.filter((row) => {
      const matchesSearch =
        !normalized ||
        row.productTitle.toLowerCase().includes(normalized) ||
        row.sku.toLowerCase().includes(normalized) ||
        row.category.toLowerCase().includes(normalized) ||
        row.supplier.toLowerCase().includes(normalized) ||
        row.binCode.toLowerCase().includes(normalized);
      const matchesCategory = category === "all" || row.categorySlug === category;
      const matchesSupplier = supplier === "all" || row.supplier === supplier;
      const matchesLocation = location === "all" || row.locationCode === location;
      const matchesStatus = status === "all" || row.status === status;
      const matchesLow = !lowOnly || row.status === "low_stock";
      const matchesOut = !outOnly || row.status === "out_of_stock";
      const matchesDamaged = !damagedOnly || row.quantityDamaged > 0;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSupplier &&
        matchesLocation &&
        matchesStatus &&
        matchesLow &&
        matchesOut &&
        matchesDamaged
      );
    });
  }, [category, damagedOnly, items, location, lowOnly, outOnly, query, status, supplier]);

  useEffect(() => {
    setVisibleLimit(220);
  }, [category, damagedOnly, location, lowOnly, outOnly, query, status, supplier]);

  const visibleRows = useMemo(
    () => filteredRows.slice(0, visibleLimit),
    [filteredRows, visibleLimit]
  );

  const hasMoreRows = visibleRows.length < filteredRows.length;

  const lowStockRows = useMemo(
    () =>
      items
        .filter((row) => row.status !== "in_stock")
        .sort((a, b) => a.quantityAvailable - b.quantityAvailable)
        .slice(0, 8),
    [items]
  );

  function openOperation(mode: OperationMode, row?: InventoryRow) {
    setOperation({ mode, rowId: row?.id });
    setForm(createForm(row));
    setFormError("");
  }

  function closeOperation() {
    setOperation(null);
    setForm(createForm());
    setFormError("");
  }

  function requireReason(mode: OperationMode) {
    return !["history", "purchase_order"].includes(mode);
  }

  function startQuickEdit(row: InventoryRow, field: QuickEditField) {
    setQuickEdit({
      rowId: row.id,
      field,
      value: field === "quantityOnHand" ? String(row.quantityOnHand) : String(row.unitPrice)
    });
    setQuickEditError("");
  }

  function cancelQuickEdit() {
    setQuickEdit(null);
    setQuickEditError("");
  }

  function parseQuickValue(value: string) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function persistQuickQuantity(row: InventoryRow, nextQuantity: number) {
    void fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "adjust",
        inventoryItemId: row.id,
        variantId: row.variantId,
        locationCode: row.locationCode,
        binCode: row.binCode,
        quantity: nextQuantity,
        reason: "Quick edit"
      })
    })
      .then((response) => response.json() as Promise<InventoryMutationResponse>)
      .then((payload) => {
        if (payload.item) {
          const updatedItem = payload.item;
          setItems((current) =>
            current.map((item) =>
              item.id === row.id ||
              (updatedItem.variantId && item.variantId === updatedItem.variantId)
                ? updatedItem
                : item
            )
          );
          return;
        }

        if (payload.reason) {
          setQuickEditError(payload.reason);
        } else {
          setQuickEditError("Could not save quantity edit to inventory database.");
        }
      })
      .catch(() => {
        setQuickEditError("Could not save quantity edit. Please retry.");
      });
  }

  function persistQuickPrice(row: InventoryRow, nextPrice: number) {
    if (!row.variantId || !row.sku) {
      setQuickEditError("Price edits require a catalog variant to be loaded.");
      return;
    }
    void fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_variant",
        variantId: row.variantId,
        sku: row.sku,
        changes: {
          price: nextPrice
        }
      })
    })
      .then((response) => response.json() as Promise<{ ok?: boolean; reason?: string }>)
      .then((payload) => {
        if (payload.ok) {
          setItems((current) =>
            current.map((item) =>
              item.id === row.id || item.variantId === row.variantId
                ? { ...item, unitPrice: nextPrice }
                : item
            )
          );
          return;
        }
        setQuickEditError(payload.reason || "Could not save price edit.");
      })
      .catch(() => {
        setQuickEditError("Could not save price edit. Please retry.");
      });
  }

  function submitQuickEdit() {
    if (!quickEdit) return;

    const row = items.find((item) => item.id === quickEdit.rowId);
    if (!row) {
      cancelQuickEdit();
      return;
    }

    const value = parseQuickValue(quickEdit.value);
    if (Number.isNaN(value)) {
      setQuickEditError("Please enter a valid number.");
      return;
    }

    if (quickEdit.field === "quantityOnHand") {
      const nextQuantity = Math.max(0, Math.floor(value));
      if (nextQuantity !== row.quantityOnHand) {
        persistQuickQuantity(row, nextQuantity);
      }
      setQuickEdit(null);
      return;
    }

    const nextPrice = Number(value.toFixed(2));
    if (nextPrice < 0) {
      setQuickEditError("Price cannot be negative.");
      return;
    }
    if (nextPrice !== row.unitPrice) {
      persistQuickPrice(row, nextPrice);
    }
    setQuickEdit(null);
  }

  function updateQuickValue(nextValue: string) {
    setQuickEdit((current) =>
      current ? { ...current, value: nextValue } : current
    );
  }

  function parseQuantity(defaultValue = 0) {
    const quantity = Number(form.quantity || defaultValue);
    return Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
  }

  function getBackendAction(mode: OperationMode) {
    if (mode === "add_stock") return "add";
    if (mode === "receive") return "receive";
    if (mode === "remove_stock" || mode === "mark_damaged") return "remove";
    if (mode === "adjust_stock") return "adjust";
    if (mode === "reserve") return "reserve";
    if (mode === "release") return "release";
    if (mode === "transfer" || mode === "bin") return "transfer";
    if (mode === "audit") return "cycle_count";
    return null;
  }

  function persistInventoryOperation(
    mode: OperationMode,
    row: InventoryRow,
    quantity: number,
    reason: string
  ) {
    const action = getBackendAction(mode);
    if (!action) return;

    void fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        inventoryItemId: row.id,
        variantId: row.variantId,
        sku: row.sku,
        quantity,
        reason,
        locationCode: form.locationCode || row.locationCode,
        binCode: form.binCode || row.binCode
      })
    })
      .then((response) => response.json() as Promise<InventoryMutationResponse>)
      .then((payload) => {
        if (payload.persisted && payload.item) {
          setItems((current) =>
            current.map((item) => (item.id === payload.item?.id ? payload.item : item))
          );
        }
      })
      .catch(() => null);
  }

  function applyOperation() {
    if (!operation) return;
    const mode = operation.mode;
    const quantity = parseQuantity(mode === "adjust_stock" ? selectedRow?.quantityOnHand : 0);
    const reason = form.reason.trim() || operationLabels[mode];

    if (requireReason(mode) && !form.reason.trim()) {
      setFormError("A reason is required so the inventory audit log is useful.");
      return;
    }

    if (mode === "add_item") {
      const now = new Date().toISOString();
      const row = normalizeRow({
        id: `manual:${form.sku || crypto.randomUUID()}`,
        productId: `manual:${form.sku || crypto.randomUUID()}`,
        variantId: `manual:${form.sku || crypto.randomUUID()}`,
        productSlug: "#",
        productTitle: form.productTitle || "New inventory item",
        sku: form.sku || "NEW-SKU",
        category: form.category || "Gate Hardware",
        categorySlug: form.categorySlug || "gate-hardware",
        material: form.material || "Steel",
        finish: form.finish || "Standard",
        size: form.size || "Standard",
        supplier: form.supplier || "Primary supplier",
        locationCode: form.locationCode || "A-01",
        binCode: form.binCode || "A-01-01-01",
        quantityOnHand: quantity,
        quantityReserved: 0,
        quantityDamaged: 0,
        quantityAvailable: quantity,
        reorderPoint: Number(form.reorderPoint) || 12,
        status: "in_stock",
        unitCost: Number(form.unitCost) || 0,
        unitPrice: Number(form.unitPrice) || 0,
        lastUpdated: now,
        history: []
      });
      row.history = [buildAuditEvent(row, row, mode, quantity, reason)];
      setItems((current) => [row, ...current]);
      closeOperation();
      return;
    }

    if (!selectedRow) return;

    let nextRow: InventoryRow = { ...selectedRow, lastUpdated: new Date().toISOString() };
    let quantityChange = 0;

    if (mode === "add_stock" || mode === "receive" || mode === "mark_returned") {
      nextRow.quantityOnHand += quantity;
      quantityChange = quantity;
    }

    if (mode === "remove_stock") {
      if (quantity > selectedRow.quantityAvailable) {
        setFormError("Cannot remove more than available inventory.");
        return;
      }
      nextRow.quantityOnHand -= quantity;
      quantityChange = -quantity;
    }

    if (mode === "adjust_stock") {
      nextRow.quantityOnHand = quantity;
      quantityChange = quantity - selectedRow.quantityOnHand;
    }

    if (mode === "mark_damaged") {
      if (quantity > selectedRow.quantityAvailable) {
        setFormError("Cannot mark more damaged than available inventory.");
        return;
      }
      nextRow.quantityDamaged += quantity;
      quantityChange = -quantity;
    }

    if (mode === "reserve") {
      if (quantity > selectedRow.quantityAvailable) {
        setFormError("Cannot reserve more than available inventory.");
        return;
      }
      nextRow.quantityReserved += quantity;
      quantityChange = quantity;
    }

    if (mode === "release") {
      if (quantity > selectedRow.quantityReserved) {
        setFormError("Cannot release more than reserved inventory.");
        return;
      }
      nextRow.quantityReserved -= quantity;
      quantityChange = -quantity;
    }

    if (mode === "transfer" || mode === "bin") {
      nextRow.locationCode = form.locationCode || nextRow.locationCode;
      nextRow.binCode = form.binCode || nextRow.binCode;
    }

    if (mode === "supplier") {
      nextRow.supplier = form.supplier || nextRow.supplier;
    }

    if (mode === "threshold") {
      nextRow.reorderPoint = Number(form.reorderPoint) || nextRow.reorderPoint;
    }

    if (mode === "edit") {
      nextRow = {
        ...nextRow,
        productTitle: form.productTitle || nextRow.productTitle,
        sku: form.sku || nextRow.sku,
        category: form.category || nextRow.category,
        categorySlug: form.categorySlug || nextRow.categorySlug,
        size: form.size || nextRow.size,
        material: form.material || nextRow.material,
        finish: form.finish || nextRow.finish,
        supplier: form.supplier || nextRow.supplier,
        locationCode: form.locationCode || nextRow.locationCode,
        binCode: form.binCode || nextRow.binCode,
        reorderPoint: Number(form.reorderPoint) || nextRow.reorderPoint,
        unitCost: Number(form.unitCost) || nextRow.unitCost,
        unitPrice: Number(form.unitPrice) || nextRow.unitPrice
      };
    }

    nextRow = normalizeRow(nextRow);
    const event = buildAuditEvent(selectedRow, nextRow, mode, quantityChange, reason);
    nextRow.history = [event, ...selectedRow.history];

    setItems((current) => current.map((item) => (item.id === selectedRow.id ? nextRow : item)));
    persistInventoryOperation(mode, selectedRow, quantity, reason);
    closeOperation();
  }

  function exportCsv() {
    const columns = [
      "Product",
      "SKU",
      "Category",
      "Size",
      "On hand",
      "Reserved",
      "Available",
      "Reorder point",
      "Supplier",
      "Cost",
      "Sale price",
      "Rack/bin",
      "Last updated",
      "Status"
    ];
    const body = filteredRows.map((row) =>
      [
        row.productTitle,
        row.sku,
        row.category,
        row.size,
        row.quantityOnHand,
        row.quantityReserved,
        row.quantityAvailable,
        row.reorderPoint,
        row.supplier,
        row.unitCost,
        row.unitPrice,
        row.binCode,
        row.lastUpdated,
        statusLabels[row.status]
      ]
        .map(csvEscape)
        .join(",")
    );
    const blob = new Blob([[columns.join(","), ...body].join("\n")], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "gateworks-inventory.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function topActionClass(active = false) {
    return active
      ? "border-industrial-ink bg-industrial-ink text-white hover:bg-industrial-pine"
      : "border-industrial-rail bg-white text-industrial-ink hover:border-industrial-ink";
  }

  return (
    <PageShell
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            className={`${actionLinkClass} border-industrial-rail bg-white text-industrial-ink hover:border-industrial-ink`}
            href="/admin"
          >
            <ArrowLeft size={15} />
            Operations
          </Link>
          <Link
            className={`${actionLinkClass} border-industrial-ink bg-industrial-ink text-white hover:bg-industrial-pine`}
            href="/admin/catalog"
          >
            Catalog
          </Link>
        </div>
      }
      description="Operational SKU control for on-hand stock, reservations, receiving, rack/bin movement, damaged material, reorder points, supplier assignment, and audit history."
      eyebrow="Gateworks Operations"
      title="Inventory management"
    >
      <div className="grid gap-5">
        <StatGrid
          className="grid-cols-2 overflow-hidden bg-white lg:grid-cols-7"
          stats={[
            { label: "SKUs", value: formatNumber(displayedSummary.skuCount) },
            { label: "On hand", value: formatNumber(displayedSummary.onHand) },
            { label: "Reserved", value: formatNumber(displayedSummary.reserved) },
            { label: "Available", value: formatNumber(displayedSummary.available) },
            { label: "Low stock", value: formatNumber(displayedSummary.lowStock) },
            { label: "Out", value: formatNumber(displayedSummary.outOfStock) },
            { label: "Value", value: formatCurrency(displayedSummary.stockValue) }
          ]}
        />

        <Card>
          <CardHeader>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                Admin Actions
              </p>
              <h2 className="text-xl font-black text-industrial-ink">
                Inventory control center
              </h2>
            </div>
          </CardHeader>
          <CardBody className="flex flex-wrap gap-2">
            <Button onClick={() => openOperation("add_item")} size="sm" variant="primary">
              <Plus size={15} />
              Add new item
            </Button>
            <Button onClick={() => importInputRef.current?.click()} size="sm">
              <Upload size={15} />
              Import CSV
            </Button>
            <Button onClick={exportCsv} size="sm">
              <Download size={15} />
              Export CSV
            </Button>
            <Button onClick={() => openOperation("purchase_order")} size="sm">
              <ShoppingCart size={15} />
              Create PO
            </Button>
            <Button onClick={() => openOperation("receive")} size="sm">
              <ArrowDownToLine size={15} />
              Receive
            </Button>
            <Button onClick={() => openOperation("audit")} size="sm">
              <ClipboardCheck size={15} />
              Run audit
            </Button>
            <Button onClick={() => setLowOnly((value) => !value)} size="sm">
              <TriangleAlert size={15} />
              Low stock
            </Button>
            <Button onClick={() => setOutOnly((value) => !value)} size="sm">
              <PackageCheck size={15} />
              Out of stock
            </Button>
            <Button onClick={() => setDamagedOnly((value) => !value)} size="sm">
              <Wrench size={15} />
              Damaged
            </Button>
            <input
              className="hidden"
              onChange={(event) => {
                if (event.target.files?.[0]) {
                  openOperation("audit");
                  setForm((current) => ({
                    ...current,
                    reason: `Imported CSV file: ${event.target.files?.[0]?.name}`
                  }));
                }
              }}
              ref={importInputRef}
              type="file"
              accept=".csv"
            />
          </CardBody>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Stock Ledger
                </p>
                <h2 className="text-xl font-black text-industrial-ink">
                  Operational SKU table
                </h2>
              </div>
              <div className="text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                {formatNumber(filteredRows.length)} rows
                <span className="ml-2 font-black normal-case text-jobsite-steel">
                  (showing {formatNumber(visibleRows.length)})
                </span>
              </div>
            </CardHeader>
            <CardBody className="grid gap-4">
              <div className="grid gap-3 xl:grid-cols-[1.2fr_180px_180px_160px_160px]">
                <label className="relative">
                  <span className="sr-only">Search inventory</span>
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted"
                    size={16}
                  />
                  <Input
                    className="pl-9"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search product, SKU, supplier, rack/bin"
                    value={query}
                  />
                </label>
                <Select
                  aria-label="Filter by category"
                  onChange={(event) => setCategory(event.target.value)}
                  value={category}
                >
                  <option value="all">All categories</option>
                  {categories.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.name}
                    </option>
                  ))}
                </Select>
                <Select
                  aria-label="Filter by supplier"
                  onChange={(event) => setSupplier(event.target.value)}
                  value={supplier}
                >
                  <option value="all">All suppliers</option>
                  {suppliers.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
                <Select
                  aria-label="Filter by stock status"
                  onChange={(event) => setStatus(event.target.value as "all" | InventoryStatus)}
                  value={status}
                >
                  <option value="all">All statuses</option>
                  <option value="in_stock">In stock</option>
                  <option value="low_stock">Low stock</option>
                  <option value="out_of_stock">Out of stock</option>
                </Select>
                <Select
                  aria-label="Filter by rack or bin location"
                  onChange={(event) => setLocation(event.target.value)}
                  value={location}
                >
                  <option value="all">All locations</option>
                  {locations.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  ["Low stock only", lowOnly, setLowOnly],
                  ["Out of stock only", outOnly, setOutOnly],
                  ["Damaged only", damagedOnly, setDamagedOnly]
                ].map(([label, value, setValue]) => (
                  <button
                    className={`${actionLinkClass} ${
                      topActionClass(Boolean(value))
                    }`}
                    key={String(label)}
                    onClick={() => (setValue as (next: boolean) => void)(!value)}
                    type="button"
                  >
                    {label as string}
                  </button>
                ))}
              </div>
              {quickEditError ? (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-800">
                  {quickEditError}
                </p>
              ) : null}

              <div className="overflow-x-auto border border-industrial-rail">
                <table className="min-w-[1320px] divide-y divide-industrial-rail text-left text-sm">
                  <thead className="bg-industrial-paper text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                    <tr>
                      <th className="px-3 py-3">Product / SKU</th>
                      <th className="px-3 py-3">Category / Size</th>
                      <th className="px-3 py-3 text-right">On hand</th>
                      <th className="px-3 py-3 text-right">Reserved</th>
                      <th className="px-3 py-3 text-right">Available</th>
                      <th className="px-3 py-3">Supplier</th>
                      <th className="px-3 py-3">Cost / Price</th>
                      <th className="px-3 py-3">Rack/bin</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Controls</th>
                    </tr>
                  </thead>
              <tbody className="divide-y divide-industrial-rail bg-white">
                    {visibleRows.map((row) => (
                      <tr className="align-top" key={row.id}>
                        <td className="px-3 py-3">
                          <Link
                            className="flex items-start gap-3 font-black text-industrial-ink hover:underline"
                            href={`/products/${row.productSlug}`}
                          >
                            <span className="relative size-11 shrink-0 rounded-md border border-industrial-rail bg-white p-1">
                              <Image
                                alt={row.productImage?.alt || row.productTitle}
                                className="object-contain"
                                width={44}
                                height={44}
                                decoding="async"
                                quality={45}
                                sizes="44px"
                                src={getRowThumbnail(row)}
                              />
                            </span>
                            <span>
                              <span>{row.productTitle}</span>
                              <span className="mt-1 block text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                                {row.sku}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-semibold text-industrial-ink">{row.category}</p>
                          <p className="mt-1 text-xs text-industrial-steel">
                            {row.size} / {row.material} / {row.finish}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-right font-black">
                          {quickEdit?.rowId === row.id &&
                          quickEdit.field === "quantityOnHand" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Input
                                autoFocus
                                className="h-8 w-24 text-right"
                                inputMode="numeric"
                                min={0}
                                onBlur={submitQuickEdit}
                                onChange={(event) => updateQuickValue(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    submitQuickEdit();
                                  }
                                  if (event.key === "Escape") {
                                    cancelQuickEdit();
                                  }
                                }}
                                step={1}
                                type="number"
                                value={quickEdit.value}
                              />
                              <button
                                className="rounded border border-industrial-rail px-2 py-1 text-[11px] font-black uppercase tracking-[0.06em] text-industrial-ink transition hover:border-industrial-ink hover:bg-industrial-paper"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={submitQuickEdit}
                                type="button"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                className="rounded border border-industrial-rail px-2 py-1 text-[11px] font-black uppercase tracking-[0.06em] text-industrial-ink transition hover:border-industrial-ink hover:bg-industrial-paper"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={cancelQuickEdit}
                                type="button"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <button
                              className="flex w-full items-center justify-end gap-1.5 hover:text-industrial-ink/85"
                              onClick={() => startQuickEdit(row, "quantityOnHand")}
                              type="button"
                            >
                              <span>{formatNumber(row.quantityOnHand)}</span>
                              <Pencil size={13} />
                            </button>
                          )}
                          {row.quantityDamaged > 0 && (
                            <p className="mt-1 text-xs text-red-700">
                              {row.quantityDamaged} damaged
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-black">
                          {formatNumber(row.quantityReserved)}
                        </td>
                        <td className="px-3 py-3 text-right font-black text-industrial-pine">
                          {formatNumber(row.quantityAvailable)}
                        </td>
                        <td className="px-3 py-3 text-xs font-semibold text-industrial-steel">
                          {row.supplier}
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-black text-industrial-ink">
                            {formatCurrency(row.unitCost)}
                          </p>
                          <p className="mt-1 text-xs text-industrial-steel">
                            {quickEdit?.rowId === row.id && quickEdit.field === "unitPrice" ? (
                              <span className="inline-flex items-center gap-1.5">
                                <Input
                                  autoFocus
                                  className="h-7 w-24 text-right text-xs"
                                  inputMode="decimal"
                                  min={0}
                                  onBlur={submitQuickEdit}
                                  onChange={(event) => updateQuickValue(event.target.value)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault();
                                      submitQuickEdit();
                                    }
                                    if (event.key === "Escape") {
                                      cancelQuickEdit();
                                    }
                                  }}
                                  step={0.01}
                                  type="number"
                                  value={quickEdit.value}
                                />
                                <button
                                  className="rounded border border-industrial-rail px-2 py-1 text-[11px] font-black uppercase tracking-[0.06em] text-industrial-ink transition hover:border-industrial-ink hover:bg-industrial-paper"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={submitQuickEdit}
                                  type="button"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  className="rounded border border-industrial-rail px-2 py-1 text-[11px] font-black uppercase tracking-[0.06em] text-industrial-ink transition hover:border-industrial-ink hover:bg-industrial-paper"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={cancelQuickEdit}
                                  type="button"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ) : (
                              <button
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-industrial-steel transition hover:text-industrial-ink/85"
                                onClick={() => startQuickEdit(row, "unitPrice")}
                                type="button"
                              >
                                Sale {formatCurrency(row.unitPrice)}
                                <Pencil size={13} />
                              </button>
                            )}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-black text-industrial-ink">
                            {row.locationCode}
                          </p>
                          <p className="mt-1 text-xs text-industrial-steel">
                            {row.binCode}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex border px-2 py-1 text-xs font-black uppercase tracking-[0.08em] ${statusClasses[row.status]}`}
                          >
                            {statusLabels[row.status]}
                          </span>
                          <p className="mt-2 text-xs font-semibold text-industrial-muted">
                            Reorder {row.reorderPoint}
                          </p>
                          <p className="mt-1 text-xs text-industrial-steel">
                            Updated {formatDate(row.lastUpdated)}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex w-[250px] flex-wrap gap-1.5">
                            {rowActions.map((action) => (
                              <button
                                className="border border-industrial-rail bg-white px-2 py-1 text-[11px] font-black uppercase tracking-[0.06em] text-industrial-ink transition hover:border-industrial-ink hover:bg-industrial-paper"
                                key={action.mode}
                                onClick={() => openOperation(action.mode, row)}
                                type="button"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {hasMoreRows ? (
                  <button
                    className="mt-3 border border-industrial-rail bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.06em] text-industrial-ink transition hover:border-industrial-ink hover:bg-industrial-paper"
                    onClick={() => setVisibleLimit((current) => current + 220)}
                    type="button"
                  >
                    Load more rows
                  </button>
                ) : null}
              </div>
            </CardBody>
          </Card>

          <aside className="grid content-start gap-5">
            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Exceptions
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">
                    Action queue
                  </h2>
                </div>
                <TriangleAlert className="text-amber-600" size={20} />
              </CardHeader>
              <CardBody className="grid gap-3">
                {lowStockRows.map((row) => (
                  <button
                    className="grid gap-2 border border-industrial-rail p-3 text-left transition hover:border-industrial-ink"
                    key={row.id}
                    onClick={() => openOperation("receive", row)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-industrial-ink">
                          {row.sku}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-industrial-muted">
                          {row.productTitle}
                        </p>
                      </div>
                      <span
                        className={`border px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${statusClasses[row.status]}`}
                      >
                        {statusLabels[row.status]}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      <span>Available: {formatNumber(row.quantityAvailable)}</span>
                      <span>Reorder: {row.reorderPoint}</span>
                      <span>Bin: {row.binCode}</span>
                      <span>{row.supplier}</span>
                    </div>
                  </button>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Inventory Rules
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">
                    Enforced in UI state
                  </h2>
                </div>
                <Warehouse size={20} />
              </CardHeader>
              <CardBody className="grid gap-3 text-sm leading-6 text-industrial-steel">
                <p>Available quantity is always on hand minus reserved minus damaged.</p>
                <p>Reserve and remove actions block quantities above available stock.</p>
                <p>Every stock change records an audit event with staff, time, reason, and before/after quantity.</p>
              </CardBody>
            </Card>
          </aside>
        </div>
      </div>

      {operation && (
        <div className="fixed inset-0 z-50 grid bg-black/30 p-4 lg:place-items-center">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-industrial-rail bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-industrial-rail p-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Inventory Operation
                </p>
                <h2 className="text-xl font-black text-industrial-ink">
                  {operationLabels[operation.mode]}
                </h2>
                {selectedRow && (
                  <p className="mt-1 text-sm text-industrial-steel">
                    {selectedRow.productTitle} / {selectedRow.sku}
                  </p>
                )}
              </div>
              <Button onClick={closeOperation} size="sm" variant="ghost">
                Close
              </Button>
            </div>

            <div className="grid gap-4 p-4">
              {operation.mode === "history" && selectedRow ? (
                <div className="grid gap-3">
                  {selectedRow.history.map((event) => (
                    <div className="border border-industrial-rail p-3" key={event.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-black capitalize text-industrial-ink">
                          {event.type.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs font-bold text-industrial-muted">
                          {formatDate(event.createdAt)} / {event.staffName}
                        </p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-industrial-steel">
                        {event.reason}
                      </p>
                      <div className="mt-3 grid gap-2 text-xs font-bold text-industrial-muted sm:grid-cols-3">
                        <span>
                          On hand: {event.previousOnHand} {"->"} {event.newOnHand}
                        </span>
                        <span>
                          Reserved: {event.previousReserved} {"->"} {event.newReserved}
                        </span>
                        <span>
                          Location: {event.previousLocation} {"->"} {event.newLocation}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {["add_item", "edit"].includes(operation.mode) && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        onChange={(event) =>
                          setForm((current) => ({ ...current, productTitle: event.target.value }))
                        }
                        placeholder="Product name"
                        value={form.productTitle}
                      />
                      <Input
                        onChange={(event) =>
                          setForm((current) => ({ ...current, sku: event.target.value }))
                        }
                        placeholder="SKU"
                        value={form.sku}
                      />
                      <Input
                        onChange={(event) =>
                          setForm((current) => ({ ...current, category: event.target.value }))
                        }
                        placeholder="Category"
                        value={form.category}
                      />
                      <Input
                        onChange={(event) =>
                          setForm((current) => ({ ...current, size: event.target.value }))
                        }
                        placeholder="Size or dimensions"
                        value={form.size}
                      />
                      <Input
                        onChange={(event) =>
                          setForm((current) => ({ ...current, material: event.target.value }))
                        }
                        placeholder="Material"
                        value={form.material}
                      />
                      <Input
                        onChange={(event) =>
                          setForm((current) => ({ ...current, finish: event.target.value }))
                        }
                        placeholder="Finish"
                        value={form.finish}
                      />
                    </div>
                  )}

                  {[
                    "add_item",
                    "add_stock",
                    "remove_stock",
                    "adjust_stock",
                    "mark_damaged",
                    "mark_returned",
                    "reserve",
                    "release",
                    "receive"
                  ].includes(operation.mode) && (
                    <Input
                      min="0"
                      onChange={(event) =>
                        setForm((current) => ({ ...current, quantity: event.target.value }))
                      }
                      placeholder={
                        operation.mode === "adjust_stock"
                          ? "New on-hand quantity"
                          : "Quantity"
                      }
                      type="number"
                      value={form.quantity}
                    />
                  )}

                  {["reserve", "release"].includes(operation.mode) && (
                    <Input
                      onChange={(event) =>
                        setForm((current) => ({ ...current, orderNumber: event.target.value }))
                      }
                      placeholder="Order number"
                      value={form.orderNumber}
                    />
                  )}

                  {["add_item", "transfer", "bin", "edit"].includes(operation.mode) && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        onChange={(event) =>
                          setForm((current) => ({ ...current, locationCode: event.target.value }))
                        }
                        placeholder="Location code"
                        value={form.locationCode}
                      />
                      <Input
                        onChange={(event) =>
                          setForm((current) => ({ ...current, binCode: event.target.value }))
                        }
                        placeholder="Rack/bin"
                        value={form.binCode}
                      />
                    </div>
                  )}

                  {["add_item", "supplier", "edit"].includes(operation.mode) && (
                    <Input
                      onChange={(event) =>
                        setForm((current) => ({ ...current, supplier: event.target.value }))
                      }
                      placeholder="Supplier"
                      value={form.supplier}
                    />
                  )}

                  {["add_item", "threshold", "edit"].includes(operation.mode) && (
                    <Input
                      min="0"
                      onChange={(event) =>
                        setForm((current) => ({ ...current, reorderPoint: event.target.value }))
                      }
                      placeholder="Low-stock threshold"
                      type="number"
                      value={form.reorderPoint}
                    />
                  )}

                  {["add_item", "edit"].includes(operation.mode) && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        min="0"
                        onChange={(event) =>
                          setForm((current) => ({ ...current, unitCost: event.target.value }))
                        }
                        placeholder="Unit cost"
                        type="number"
                        value={form.unitCost}
                      />
                      <Input
                        min="0"
                        onChange={(event) =>
                          setForm((current) => ({ ...current, unitPrice: event.target.value }))
                        }
                        placeholder="Sale price"
                        type="number"
                        value={form.unitPrice}
                      />
                    </div>
                  )}

                  {operation.mode === "purchase_order" && (
                    <div className="border border-industrial-rail bg-industrial-paper p-4 text-sm leading-6 text-industrial-steel">
                      Purchase order creation is staged here for the supplier module. Use the
                      low-stock queue or selected SKU to generate PO lines once purchase orders are
                      connected to Supabase.
                    </div>
                  )}

                  {operation.mode === "audit" && (
                    <div className="border border-industrial-rail bg-industrial-paper p-4 text-sm leading-6 text-industrial-steel">
                      Audit mode records cycle count notes and import activity. Manual count
                      changes should be applied from each SKU row so every item gets its own ledger
                      event.
                    </div>
                  )}

                  <Textarea
                    onChange={(event) =>
                      setForm((current) => ({ ...current, reason: event.target.value }))
                    }
                    placeholder="Reason for audit log"
                    value={form.reason}
                  />

                  {formError && (
                    <p className="border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">
                      {formError}
                    </p>
                  )}

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button onClick={closeOperation} variant="ghost">
                      Cancel
                    </Button>
                    <Button onClick={applyOperation} variant="primary">
                      <History size={16} />
                      Save audit event
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
