import type { Product } from "@/lib/types";
import { getImageSet } from "@/lib/product-image";

export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";
export type InventoryEventType =
  | "created"
  | "received"
  | "added"
  | "removed"
  | "adjusted"
  | "damaged"
  | "returned"
  | "reserved"
  | "released"
  | "transferred"
  | "edited";

export type InventoryAuditEvent = {
  id: string;
  inventoryItemId: string;
  type: InventoryEventType;
  quantityChange: number;
  previousOnHand: number;
  newOnHand: number;
  previousReserved: number;
  newReserved: number;
  previousLocation: string;
  newLocation: string;
  reason: string;
  staffName: string;
  createdAt: string;
};

export type InventoryRow = {
  id: string;
  productId: string;
  variantId: string;
  productTitle: string;
  productSlug: string;
  sku: string;
  category: string;
  categorySlug: string;
  material: string;
  finish: string;
  size: string;
  supplier: string;
  locationCode: string;
  binCode: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityDamaged: number;
  quantityAvailable: number;
  reorderPoint: number;
  status: InventoryStatus;
  unitCost: number;
  unitPrice: number;
  lastUpdated: string;
  productImage?: {
    id: string;
    productId: string;
    variantId?: string;
    url: string;
    alt: string;
    sortOrder: number;
    sizes: {
      thumb: string;
      card: string;
      medium: string;
      full: string;
    };
  };
  history: InventoryAuditEvent[];
};

export type InventorySummary = {
  skuCount: number;
  onHand: number;
  reserved: number;
  available: number;
  lowStock: number;
  outOfStock: number;
  damaged: number;
  stockValue: number;
};

// Offline-seed fallback only. The local product catalog ships no cost data, so
// stock value is estimated from price for demo purposes. Real per-variant cost
// comes from Supabase `product_variants.cost` (see lib/inventory-repository.ts).
const ESTIMATED_COST_RATIO = 0.58;

const locationByCategory: Record<string, string> = {
  "gate-hinges": "A-01",
  "gate-latches-locks": "A-02",
  "cane-bolts": "A-03",
  "gate-hardware": "A-04",
  "fence-materials": "B-01",
  "ornamental-iron": "B-02",
  "sheet-metal": "C-01",
  "square-tubing": "C-02",
  "round-tubing": "C-03",
  "rectangle-tubing": "C-04",
  "angle-iron": "D-01",
  "flat-bar": "D-02",
  "gate-motors": "E-01",
  "welding-supplies": "F-01"
};

function getSupplier(product: Product) {
  return (
    product.specifications.Brand ||
    product.specifications["Retail Source"] ||
    product.specifications.Supplier ||
    "Primary supplier"
  );
}

function getReorderPoint(categorySlug: string, unitPrice: number) {
  if (categorySlug.includes("metal") || categorySlug.includes("tubing")) return 20;
  if (categorySlug.includes("motor")) return 2;
  if (unitPrice >= 250) return 3;
  if (unitPrice >= 75) return 6;
  return 12;
}

function getReservedQuantity(quantityOnHand: number, productIndex: number, variantIndex: number) {
  if (quantityOnHand <= 0) return 0;
  const simulatedDemand = (productIndex + variantIndex) % 5;
  return Math.min(quantityOnHand, simulatedDemand);
}

function getBinCode(categorySlug: string, productIndex: number, variantIndex: number) {
  const location = locationByCategory[categorySlug] || "GEN";
  const shelf = String((productIndex % 8) + 1).padStart(2, "0");
  const bin = String((variantIndex % 12) + 1).padStart(2, "0");
  return `${location}-${shelf}-${bin}`;
}

function getStatus(quantityAvailable: number, reorderPoint: number): InventoryStatus {
  if (quantityAvailable <= 0) return "out_of_stock";
  if (quantityAvailable <= reorderPoint) return "low_stock";
  return "in_stock";
}

function getLastUpdated(productIndex: number, variantIndex: number) {
  const date = new Date("2026-05-14T08:00:00.000Z");
  date.setHours(date.getHours() - ((productIndex * 3 + variantIndex) % 72));
  return date.toISOString();
}

function getInitialHistory(row: Omit<InventoryRow, "history">): InventoryAuditEvent[] {
  return [
    {
      id: `${row.id}:created`,
      inventoryItemId: row.id,
      type: "created",
      quantityChange: row.quantityOnHand,
      previousOnHand: 0,
      newOnHand: row.quantityOnHand,
      previousReserved: 0,
      newReserved: row.quantityReserved,
      previousLocation: "Unassigned",
      newLocation: row.binCode,
      reason: "Initial catalog inventory import",
      staffName: "System import",
      createdAt: row.lastUpdated
    }
  ];
}

export function buildInventoryRows(products: Product[]): InventoryRow[] {
  return products.flatMap((product, productIndex) =>
    product.variants.map((variant, variantIndex) => {
      const quantityOnHand =
        variant.inventory === "out_of_stock" ? 0 : Math.max(0, variant.inventoryQuantity);
      const quantityReserved = getReservedQuantity(
        quantityOnHand,
        productIndex,
        variantIndex
      );
      const quantityDamaged = productIndex % 19 === 0 && variantIndex === 0 ? 1 : 0;
      const quantityAvailable = Math.max(0, quantityOnHand - quantityReserved - quantityDamaged);
      const reorderPoint = getReorderPoint(product.category.slug, variant.price);
      const status = getStatus(quantityAvailable, reorderPoint);
      const row = {
        id: `${product.id}:${variant.id}`,
        productId: product.id,
        variantId: variant.id,
        productTitle: product.title,
        productSlug: product.slug,
        sku: variant.sku,
        category: product.category.name,
        categorySlug: product.category.slug,
        material: variant.options.material || "Steel",
        finish: variant.options.finish || "Standard",
        size: variant.options.length || "Standard",
        supplier: getSupplier(product),
        locationCode: locationByCategory[product.category.slug] || "GEN",
        binCode: getBinCode(product.category.slug, productIndex, variantIndex),
        quantityOnHand,
        quantityReserved,
        quantityDamaged,
        quantityAvailable,
        reorderPoint,
        status,
        unitCost: Number((variant.price * ESTIMATED_COST_RATIO).toFixed(2)),
        unitPrice: variant.price,
        productImage: {
          id: `${product.id}-image-${variant.id}`,
          productId: product.id,
          variantId: variant.id,
          url: variant.image,
          alt: `${product.title} ${variant.sku}`.trim(),
          sortOrder: 1,
          sizes: getImageSet(variant.image)
        },
        lastUpdated: getLastUpdated(productIndex, variantIndex)
      };

      return {
        ...row,
        history: getInitialHistory(row)
      };
    })
  );
}

export function getInventorySummary(rows: InventoryRow[]): InventorySummary {
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

export function getInventoryCategories(rows: InventoryRow[]) {
  return Array.from(
    rows.reduce<Map<string, string>>((categories, row) => {
      categories.set(row.categorySlug, row.category);
      return categories;
    }, new Map())
  )
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getInventorySuppliers(rows: InventoryRow[]) {
  return Array.from(new Set(rows.map((row) => row.supplier))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export function getInventoryLocations(rows: InventoryRow[]) {
  return Array.from(new Set(rows.map((row) => row.locationCode))).sort((a, b) =>
    a.localeCompare(b)
  );
}
