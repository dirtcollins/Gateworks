// Wayfinder — catalog data helpers. Thin selectors over the real
// @/lib/catalog layer. No data is rebuilt here; this only derives the
// department/aisle entry points and product rails the storefront pages need.
import { categories, products, searchProducts } from "@/lib/catalog";
import type { Category, Product } from "@/lib/types";
import { aisleFor } from "./kit";

export type Department = {
  slug: string;
  name: string;
  aisle: string;
  count: number;
};

// Categories that actually have products, ranked by stock depth.
function categoriesWithProducts(): Category[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    counts.set(
      product.category.slug,
      (counts.get(product.category.slug) ?? 0) + 1
    );
  }
  return categories
    .filter((category) => counts.has(category.slug))
    .sort(
      (left, right) =>
        (counts.get(right.slug) ?? 0) - (counts.get(left.slug) ?? 0)
    );
}

// The aisle-coded departments shown in the header strip and home grid.
export function departments(limit?: number): Department[] {
  const list = categoriesWithProducts().map((category) => ({
    slug: category.slug,
    name: category.name,
    aisle: aisleFor(category.slug),
    count: searchProducts("", category.slug).length
  }));
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

// Featured product — the deepest-stocked single product, used for the home hero.
export function featuredProduct(): Product {
  return (
    [...products].sort(
      (left, right) => right.variants.length - left.variants.length
    )[0] ?? products[0]
  );
}

// Most-pulled hardware — products with the most variant SKUs (proxy for popular).
export function popularProducts(limit = 8): Product[] {
  return [...products]
    .sort((left, right) => right.variants.length - left.variants.length)
    .slice(1, limit + 1);
}

// New arrivals — a stable slice from the tail of the catalog.
export function newArrivals(limit = 8): Product[] {
  return products.slice(-limit).reverse();
}

export function categoryProducts(slug: string): Product[] {
  return searchProducts("", slug);
}

export function findCategory(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}
