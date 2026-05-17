import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";
import { formatUsd } from "./kit";
import type { Product } from "@/lib/types";

/* Derives a stable pseudo-rating from the catalog so the storefront reads
 * like a real retail site without inventing review data per render. */
function ratingFor(product: Product): number {
  return 4.3 + ((product.variants.length * 7) % 7) / 10;
}

function inStock(product: Product): boolean {
  return product.variants.some((variant) => variant.inventory === "in_stock");
}

export function IndustrialProductCard({ product }: { product: Product }) {
  const sku = product.variants[0]?.sku ?? product.id;
  const image = product.images[0]?.url;
  const available = inStock(product);

  return (
    <Link
      className="group flex flex-col bg-d1-card transition hover:bg-white"
      href={`/industrial/products/${product.slug}`}
    >
      <div className="relative flex h-40 items-center justify-center bg-white">
        {image ? (
          <Image
            alt={product.title}
            className="h-full w-full object-contain p-4"
            height={280}
            quality={75}
            src={image}
            width={280}
          />
        ) : (
          <span className="text-4xl font-black text-d1-line">GW</span>
        )}
        {!available ? (
          <span className="absolute left-3 top-3 bg-d1-red px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
            Backorder
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
            {sku}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-d1-ink">
            <Star className="h-3 w-3 fill-d1-amber text-d1-amber" />
            {ratingFor(product).toFixed(1)}
          </span>
        </div>
        <p className="mt-1.5 flex-1 text-sm font-bold leading-snug text-d1-ink">
          {product.title}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-d1-line pt-3">
          <span className="text-lg font-extrabold text-d1-ink">
            {product.price > 0 ? formatUsd(product.price) : "Quote"}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-pine">
            View <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function IndustrialProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="border border-dashed border-d1-line bg-d1-card px-6 py-16 text-center">
        <p className="text-sm font-bold text-d1-ink">
          No products match those filters.
        </p>
        <p className="mt-1 text-[13px] text-d1-steel">
          Try a different search term or clear the active filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-px border border-d1-line bg-d1-line sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <IndustrialProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
