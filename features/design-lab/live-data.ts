import {
  categories,
  getProduct,
  getRelatedProducts,
  products,
  searchProducts
} from "@/lib/catalog";
import type { Product } from "@/lib/types";

export { categories, getProduct, getRelatedProducts, products, searchProducts };

// A consistent showcase product + category so all five Design Lab versions
// present the same real catalog data and can be compared fairly.
export function getFeaturedProduct(): Product {
  return getProduct("21-adjust-o-matic-latch") ?? products[0];
}

export const featuredProduct: Product = getFeaturedProduct();
export const featuredCategorySlug: string = featuredProduct.category.slug;

export function getCategoryProducts(slug: string): Product[] {
  return searchProducts("", slug);
}

export const featuredCategoryProducts: Product[] = getCategoryProducts(featuredCategorySlug);

// Curated rails for the home pages, derived from the real catalog.
export const popularProducts: Product[] = [...products]
  .sort((left, right) => right.variants.length - left.variants.length)
  .slice(0, 12);

export const newArrivals: Product[] = products.slice(0, 12);

export const topCategories = categories
  .filter((category) => searchProducts("", category.slug).length > 0)
  .slice(0, 8);
