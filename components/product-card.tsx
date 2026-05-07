"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Star } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";
import type { Product } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
  layout?: "grid" | "list" | "rail";
};

export function ProductCard({ product, layout = "grid" }: ProductCardProps) {
  const image = product.images[0]?.url || product.variants[0]?.image || "/assets/logo.svg";
  const defaultVariant = product.variants[0];
  const isList = layout === "list";
  const isRail = layout === "rail";
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
      quantity: 1,
      options: defaultVariant.options
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  }

  const imageContent = (
    <div
      className={cn(
        "relative bg-white",
        isRail
          ? "h-[150px]"
          : isList
            ? "min-h-36 border-r border-jobsite-rail sm:min-h-44"
            : "aspect-square"
      )}
    >
      <Image
        alt={product.title}
        className={cn(
          "object-contain",
          isRail ? "p-3" : isList ? "p-4" : "p-5"
        )}
        fill
        sizes={isRail ? "220px" : isList ? "180px" : "(max-width: 768px) 50vw, 25vw"}
        src={image}
      />
    </div>
  );

  const detailsContent = (
    <div
      className={cn(
        "flex flex-col border-t border-jobsite-rail",
        isRail ? "gap-1 p-3" : "gap-2 p-4",
        isList && "border-t-0"
      )}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-jobsite-steel">
        {product.category.name}
      </p>
      <h3
        className={cn(
          "line-clamp-2 font-semibold text-jobsite-ink",
          isRail ? "min-h-10 text-xs leading-5" : "text-sm leading-5"
        )}
      >
        {product.title}
      </h3>
      <div className="flex items-center gap-1 text-jobsite-safety">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} size={13} fill="currentColor" />
        ))}
        <span className="ml-1 text-xs font-semibold text-jobsite-steel">
          ({120 + product.variants.length})
        </span>
      </div>
      <div className="mt-auto">
        <p
          className={cn(
            "font-extrabold text-jobsite-ink",
            isRail ? "text-xl" : "text-2xl"
          )}
        >
          {formatCurrency(product.price)}
        </p>
        <p className="text-xs font-semibold text-jobsite-pine">
          {defaultVariant?.inventoryQuantity ?? 100} in stock - {product.variants.length} option
          {product.variants.length === 1 ? "" : "s"}
        </p>
        {isRail ? (
          <button
            className={cn(
              "truewerk-cta mt-2 flex h-9 w-full items-center justify-center gap-1 border text-xs font-black uppercase tracking-[0.1em] transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:border-jobsite-rail disabled:text-jobsite-steel",
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
        className="group grid min-h-full w-[220px] grid-rows-[150px_1fr] border border-jobsite-rail bg-white transition hover:border-jobsite-ink"
      >
        <Link href={`/products/${product.slug}`}>{imageContent}</Link>
        {detailsContent}
      </div>
    );
  }

  return (
    <Link
      className={cn(
        "group grid min-h-full border border-jobsite-rail bg-white transition hover:shadow-toolbar",
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
