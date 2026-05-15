import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type ProductSummaryCardProps = {
  product: Product;
  layout?: "grid" | "list";
};

export function ProductSummaryCard({ product, layout = "grid" }: ProductSummaryCardProps) {
  const image = product.images[0]?.url || product.variants[0]?.image || "/assets/logo.svg";
  const defaultVariant = product.variants[0];
  const isList = layout === "list";
  const priceLabel = product.price > 0 ? formatCurrency(product.price) : "Quote required";

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
      <div
        className={cn(
          "relative bg-white",
          isList ? "min-h-36 border-r border-jobsite-rail sm:min-h-44" : "aspect-square"
        )}
      >
        <Image
          alt={product.title}
          className={cn("object-contain", isList ? "p-4" : "p-5")}
          fill
          quality={75}
          sizes={isList ? "180px" : "(max-width: 768px) 50vw, 25vw"}
          src={image}
        />
      </div>
      <div className={cn("flex flex-col gap-2 border-t border-jobsite-rail p-4", isList && "border-t-0")}>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-jobsite-steel">
          {product.category.name}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-jobsite-ink">
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
          <p className="text-2xl font-extrabold text-jobsite-ink">{priceLabel}</p>
          <p className="text-xs font-semibold text-jobsite-pine">
            {defaultVariant?.inventoryQuantity ?? 100} in stock - {product.variants.length} option
            {product.variants.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </Link>
  );
}
