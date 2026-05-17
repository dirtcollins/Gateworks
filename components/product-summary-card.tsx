import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { QuickAddToCartButton } from "@/components/quick-add-to-cart-button";
import type { Product } from "@/lib/types";
import { getProductImageForSize } from "@/lib/product-image";
import { cn, formatCurrency } from "@/lib/utils";

type ProductSummaryCardProps = {
  product: Product;
  layout?: "grid" | "list";
};

export function ProductSummaryCard({ product, layout = "grid" }: ProductSummaryCardProps) {
  const imageSource = product.images[0]?.url || product.variants[0]?.image || "/assets/logo.svg";
  const image = getProductImageForSize(imageSource, "card");
  const defaultVariant = product.variants[0];
  const isList = layout === "list";
  const priceLabel = product.price > 0 ? formatCurrency(product.price) : "Quote required";
  const quickAddItem = defaultVariant && defaultVariant.inventory === "in_stock"
    ? {
        productId: product.id,
        variantId: defaultVariant.id,
        title: product.title,
        sku: defaultVariant.sku,
        image: defaultVariant.image || image,
        price: defaultVariant.price,
        weightLbs: defaultVariant.calculated_weight_lb,
        cwtPrice: defaultVariant.steel_cwt_price,
        pricingMethod: defaultVariant.pricing_method,
        quantity: 1,
        options: defaultVariant.options
      }
    : null;

  return (
    <article
      className={cn(
        "group grid min-h-full overflow-hidden rounded-lg border border-black/10 bg-white transition hover:border-black/20",
        isList
          ? "grid-cols-[132px_1fr] sm:grid-cols-[180px_1fr]"
          : "grid-rows-[auto_1fr]"
      )}
    >
      <Link href={`/products/${product.slug}`} className={cn(isList ? "contents" : "block")} tabIndex={-1}>
        <div
          className={cn(
            "relative bg-[#fafaf8]",
            isList ? "min-h-36 border-r border-black/10 sm:min-h-44" : "aspect-[4/3]"
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
      </Link>
      <div className={cn("flex flex-col gap-2 border-t border-black/10 p-4", isList && "border-t-0")}>
        <Link href={`/products/${product.slug}`} className="grid gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-industrial-muted">
            {product.category.name}
          </p>
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-industrial-ink">
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
        </Link>
        <div className="mt-auto">
          <Link href={`/products/${product.slug}`} tabIndex={-1}>
            <p className="text-2xl font-semibold text-industrial-ink">{priceLabel}</p>
            <p className="text-xs font-medium text-jobsite-pine">
              {defaultVariant?.inventoryQuantity != null ? `${defaultVariant.inventoryQuantity} in stock` : "In stock"} - {product.variants.length} option
              {product.variants.length === 1 ? "" : "s"}
            </p>
          </Link>
          <div className="mt-3">
            <QuickAddToCartButton item={quickAddItem} />
          </div>
        </div>
      </div>
    </article>
  );
}
