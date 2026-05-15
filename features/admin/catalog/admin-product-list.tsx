"use client";

import Image from "next/image";
import type { KeyboardEvent } from "react";
import { PackageSearch, Search } from "lucide-react";
import { formatPricingMethod } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { getProductImageForSize } from "@/lib/product-image";
import { cn, formatCurrency } from "@/lib/utils";
import { getProductStock } from "@/features/admin/catalog/utils";

type AdminProductListProps = {
  filteredProducts: Product[];
  query: string;
  selectedProductId?: string;
  onQueryChange: (query: string) => void;
  onSelectProduct: (productId: string) => void;
  onProductKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => void;
};

export function AdminProductList({
  filteredProducts,
  query,
  selectedProductId,
  onQueryChange,
  onSelectProduct,
  onProductKeyDown
}: AdminProductListProps) {
  return (
    <aside className="grid min-h-0 grid-rows-[auto_1fr] border border-jobsite-rail bg-white">
      <div className="border-b border-jobsite-rail p-4">
        <label className="relative block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-jobsite-steel"
            size={18}
          />
          <input
            className="h-11 w-full border border-jobsite-rail bg-jobsite-paper pl-10 pr-3 text-sm outline-none focus:border-jobsite-ink"
            placeholder="Search products or SKU"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
      </div>

      <div className="min-h-0 overflow-auto">
        {filteredProducts.map((product, index) => {
          const isSelected = selectedProductId === product.id;
          const image = getProductImageForSize(
            product.images[0]?.url || product.variants[0]?.image || "/assets/logo.svg",
            "card"
          );
          const variant = product.variants[0];

          return (
            <button
              key={product.id}
              data-product-row={index}
              className={cn(
                "grid w-full grid-cols-[64px_1fr] gap-3 border-b border-jobsite-rail p-3 text-left outline-none hover:bg-jobsite-paper focus:ring-2 focus:ring-inset focus:ring-jobsite-ink",
                isSelected && "bg-jobsite-amber"
              )}
              type="button"
              onClick={() => onSelectProduct(product.id)}
              onKeyDown={(event) => onProductKeyDown(event, index)}
            >
              <div className="relative aspect-square border border-jobsite-rail bg-white">
                <Image
                  alt={product.title}
                  className="object-contain p-1"
                  fill
                  quality={45}
                  sizes="64px"
                  src={image}
                />
              </div>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-jobsite-ink">
                  {product.title}
                </span>
                <span className="mt-1 block text-xs font-semibold text-jobsite-steel">
                  {product.category.name} / {product.variants.length} SKU
                  {product.variants.length === 1 ? "" : "s"}
                </span>
                <span className="mt-1 block text-xs font-black text-jobsite-pine">
                  {formatCurrency(product.final_price ?? product.price)} /{" "}
                  {formatPricingMethod(product.pricing_method || variant?.pricing_method)}
                </span>
                {variant?.pricing_method === "cwt_calculated" ? (
                  <span className="mt-1 block text-xs font-semibold text-jobsite-steel">
                    {variant.calculated_weight_lb?.toFixed(2)} lb / CWT{" "}
                    {formatCurrency(variant.steel_cwt_price || 0)}
                  </span>
                ) : (
                  <span className="mt-1 block text-xs font-black text-jobsite-pine">
                    {getProductStock(product)} units available
                  </span>
                )}
              </span>
            </button>
          );
        })}

        {!filteredProducts.length ? (
          <div className="grid place-items-center gap-2 p-10 text-center text-jobsite-steel">
            <PackageSearch size={28} />
            <p className="text-sm font-semibold">No products found.</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
