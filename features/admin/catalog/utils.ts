import type { Product } from "@/lib/types";

export function getProductStock(product: Product) {
  return product.variants.reduce(
    (total, variant) => total + variant.inventoryQuantity,
    0
  );
}

export function cleanQuantity(value: number) {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}
