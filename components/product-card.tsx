"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Star } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import type { Product } from "@/lib/types";
import { getProductImageForSize } from "@/lib/product-image";
import { cn, formatCurrency } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
  layout?: "grid" | "list" | "rail";
};

export function ProductCard({ product, layout = "grid" }: ProductCardProps) {
  const imageSource = product.images[0]?.url || product.variants[0]?.image || "/assets/logo.svg";
  const image = getProductImageForSize(imageSource, "card");
  const defaultVariant = product.variants[0];
  const isList = layout === "list";
  const isRail = layout === "rail";
  const priceLabel = product.price > 0 ? formatCurrency(product.price) : "Quote required";
  const addItem = useCartStore((state) => state.addItem);
  const [justAdded, setJustAdded] = useState(false);

  function addDefaultVariantToCart(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!defaultVariant || defaultVariant.inventory !== "in_stock") {
      return;
    }

    addItem({
      productId: product.id,
      variantId: defaultVariant.id,
      title: product.title,
      sku: defaultVariant.sku,
      image: defaultVariant.image,
      price: defaultVariant.price,
      weightLbs: defaultVariant.calculated_weight_lb,
      cwtPrice: defaultVariant.steel_cwt_price,
      pricingMethod: defaultVariant.pricing_method,
      quantity: 1,
      options: defaultVariant.options
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  }

  const imageContent = (
    <div
      className={cn(
        "relative bg-[#fafaf8]",
        isRail
          ? "h-[150px]"
          : isList
            ? "min-h-36 border-r border-black/10 sm:min-h-44"
            : "aspect-[4/3]"
      )}
    >
      <Image
        alt={product.title}
        className={cn(
          "object-contain",
          isRail ? "p-3" : isList ? "p-4" : "p-5"
        )}
        fill
        quality={75}
        sizes={isRail ? "220px" : isList ? "180px" : "(max-width: 768px) 50vw, 25vw"}
        src={image}
      />
    </div>
  );

  const detailsContent = (
    <div
      className={cn(
        "flex flex-col border-t border-black/10",
        isRail ? "gap-1 p-3" : "gap-2 p-4",
        isList && "border-t-0"
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-industrial-muted">
        {product.category.name}
      </p>
      <h3
        className={cn(
          "line-clamp-2 font-semibold text-industrial-ink",
          isRail ? "min-h-10 text-xs leading-5" : "text-sm leading-5"
        )}
      >
        {product.title}
      </h3>
      <div className="flex items-center gap-1 text-industrial-ink/80">
        <span aria-label="Rated 5 out of 5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} size={13} fill="currentColor" aria-hidden="true" />
          ))}
        </span>
        <span className="ml-1 text-xs font-medium text-industrial-muted">
          ({120 + product.variants.length})
        </span>
      </div>
      <div className="mt-auto">
        <p
          className={cn(
            "font-extrabold text-jobsite-ink",
            isRail ? "text-lg" : "text-2xl"
          )}
        >
          {priceLabel}
        </p>
        <p className="text-xs font-medium text-jobsite-pine">
          {defaultVariant?.inventoryQuantity != null ? `${defaultVariant.inventoryQuantity} in stock` : "In stock"} - {product.variants.length} option
          {product.variants.length === 1 ? "" : "s"}
        </p>
        {isRail ? (
          <button
            className={cn(
              "truewerk-cta mt-2 flex h-9 w-full items-center justify-center gap-1 rounded-md border text-xs font-semibold uppercase tracking-[0.08em] transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:border-black/10 disabled:text-industrial-muted",
              justAdded
                ? "is-added animate-button-confirm border-jobsite-pine bg-jobsite-ink text-white"
                : "border-jobsite-ink bg-white text-jobsite-ink hover:text-white"
            )}
            disabled={!defaultVariant || defaultVariant.inventory !== "in_stock"}
            type="button"
            onClick={addDefaultVariantToCart}
          >
            <span className="inline-flex items-center gap-1">
              {justAdded ? <Check size={15} /> : null}
              {justAdded ? "Added" : "+ ADD"}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );

  if (isRail) {
    return (
      <div
        className="group grid min-h-full w-[220px] grid-rows-[150px_1fr] overflow-hidden rounded-lg border border-black/10 bg-white/84 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white hover:shadow-toolbar"
      >
        <Link href={`/products/${product.slug}`}>{imageContent}</Link>
        {detailsContent}
      </div>
    );
  }

  return (
    <Link
      className={cn(
        "group grid min-h-full overflow-hidden rounded-lg border border-black/10 bg-white/84 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white hover:shadow-toolbar",
        isList
          ? "grid-cols-[132px_1fr] sm:grid-cols-[180px_1fr]"
          : "grid-rows-[auto_1fr]"
      )}
      href={`/products/${product.slug}`}
    >
      {imageContent}
      {detailsContent}
    </Link>
  );
}
