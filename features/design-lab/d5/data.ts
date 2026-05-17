/**
 * DESIGN 5 — data layer.
 * All exports are derived from the REAL catalog/order/reports data via the
 * shared Design Lab live-data layer. No fake sample arrays remain.
 */

import {
  categories,
  featuredCategoryProducts,
  featuredCategorySlug,
  featuredProduct,
  getCategoryProducts,
  getProduct,
  getRelatedProducts,
  newArrivals,
  popularProducts,
  products,
  searchProducts,
  topCategories
} from "@/features/design-lab/live-data";
import type { Product as CatalogProduct, ProductVariant } from "@/lib/types";

export {
  categories,
  featuredCategoryProducts,
  featuredCategorySlug,
  featuredProduct,
  getCategoryProducts,
  getProduct,
  getRelatedProducts,
  newArrivals,
  popularProducts,
  products,
  searchProducts,
  topCategories
};

export type { CatalogProduct, ProductVariant };

/** Currency formatter — kept because every d5 component uses it. */
export const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/* ------------------------------------------------------------------ */
/* Derived view helpers — turn the rich catalog Product into the lean  */
/* shapes d5's terminal-style components consume.                      */
/* ------------------------------------------------------------------ */

/** Stable swatch color derived from a product id, for d5's dense rows. */
const SWATCHES = [
  "#6b7180",
  "#7a808d",
  "#5ee6a8",
  "#3f4450",
  "#2b2f38",
  "#c98b3a",
  "#8b919c",
  "#6aa6ff"
];

export function swatchFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return SWATCHES[hash % SWATCHES.length];
}

export type Row = {
  product: CatalogProduct;
  variant: ProductVariant;
  sku: string;
  name: string;
  category: string;
  categorySlug: string;
  spec: string;
  price: number;
  stock: number;
  swatch: string;
  inStock: boolean;
};

function variantSpec(variant: ProductVariant) {
  const parts = [
    variant.options.length && variant.options.length !== "Standard"
      ? variant.options.length
      : undefined,
    variant.options.material && variant.options.material !== "Standard"
      ? variant.options.material
      : undefined,
    variant.options.finish && variant.options.finish !== "Standard"
      ? variant.options.finish
      : undefined
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Standard configuration";
}

/** Lean row view of a catalog product (uses its primary variant). */
export function toRow(product: CatalogProduct): Row {
  const variant =
    product.variants.find((candidate) => candidate.inventory === "in_stock") ||
    product.variants[0];
  return {
    product,
    variant,
    sku: variant?.sku ?? product.id,
    name: product.title,
    category: product.category.name,
    categorySlug: product.category.slug,
    spec: variant ? variantSpec(variant) : product.category.name,
    price: product.price,
    stock: variant?.inventoryQuantity ?? 0,
    swatch: swatchFor(product.id),
    inStock: variant ? variant.inventory === "in_stock" : false
  };
}
