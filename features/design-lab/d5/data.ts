/**
 * DESIGN 5 — "FIELD OPS" data helpers.
 *
 * Every page in this design is wired directly to the shared Design Lab
 * live-data layer (real catalog / orders / reports). This file contains NO
 * fake product/order/cart arrays — only re-exports of the live data layer and
 * a few small presentation helpers (currency, variant labels).
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
import type { CartItem, Product, ProductVariant } from "@/lib/types";

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

export type { Product, ProductVariant };

/** USD currency formatter used across every Field Ops page. */
export function money(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** Short, scannable variant label (size · finish) for dense Field Ops rows. */
export function variantLabel(variant: ProductVariant): string {
  const parts = [variant.options.length, variant.options.finish].filter(
    (part) => part && part !== "Standard"
  );
  return parts.length ? parts.join(" · ") : variant.sku;
}

/** Variant summary from a cart line item. */
export function cartItemSummary(item: CartItem): string {
  const parts = [item.options.length, item.options.finish].filter(
    (part) => part && part !== "Standard"
  );
  return parts.length ? parts.join(" · ") : "Standard config";
}

/** Best primary variant for a product (prefers in-stock). */
export function primaryVariant(product: Product): ProductVariant | undefined {
  return (
    product.variants.find((variant) => variant.inventory === "in_stock") ??
    product.variants[0]
  );
}

/** Count of in-catalog products for a category slug. */
export function categoryCount(slug: string): number {
  return getCategoryProducts(slug).length;
}
