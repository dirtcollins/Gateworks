"use client";

// Shared helpers for the Ledger DB-backed quote + procurement surfaces.
// Bridges the catalog (variant lookup by SKU) and the quotes-data contract.

import { products } from "@/lib/catalog";
import type { Product, ProductVariant } from "@/lib/types";
import type { QuoteItemInput } from "@/lib/quotes-data";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

export function formatLedgerDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

/* Pick the most sensible variant for a product — prefers in-stock. */
export function pickVariant(product: Product): ProductVariant | undefined {
  return (
    product.variants.find((variant) => variant.inventory === "in_stock") ||
    product.variants[0]
  );
}

/* Build a valid QuoteItemInput from a catalog product. Conversion to an
 * order resolves variants by SKU, so the SKU must be carried. */
export function catalogItemToQuoteInput(
  product: Product,
  variant: ProductVariant,
  quantity = 1
): QuoteItemInput {
  return {
    productId: product.id,
    variantId: variant.id,
    sku: variant.sku,
    title: product.title,
    options: variant.options,
    quantity,
    unitPrice: variant.price,
    lineTotal: Number((variant.price * quantity).toFixed(2))
  };
}

/* Catalog search for the quick-add picker. */
export function searchCatalog(query: string, limit = 24): Product[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return products.slice(0, 8);
  return products
    .filter(
      (product) =>
        product.title.toLowerCase().includes(normalized) ||
        product.category.name.toLowerCase().includes(normalized) ||
        product.variants.some((variant) =>
          variant.sku.toLowerCase().includes(normalized)
        )
    )
    .slice(0, limit);
}
