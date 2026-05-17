import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package } from "lucide-react";
import { LEDGER, formatUsd } from "./kit";
import type { Product } from "@/lib/types";

/* Catalog product card — used across home rails, search results, and
 * category landings so the storefront stays visually consistent. */
export function LedgerProductCard({
  product,
  size = "md"
}: {
  product: Product;
  size?: "sm" | "md";
}) {
  const variant = product.variants[0];
  const image = product.images[0]?.url ?? variant?.image;
  const imageHeight = size === "sm" ? "h-32" : "h-44";

  return (
    <Link
      className="group flex flex-col overflow-hidden rounded-2xl transition"
      href={`/ledger/products/${product.slug}`}
      style={{
        backgroundColor: LEDGER.surface,
        border: `1px solid ${LEDGER.line}`
      }}
    >
      <div
        className={`flex ${imageHeight} items-center justify-center`}
        style={{ backgroundColor: LEDGER.canvas }}
      >
        {image ? (
          <Image
            alt={product.title}
            className="h-full w-full object-contain p-4"
            height={300}
            quality={75}
            src={image}
            width={300}
          />
        ) : (
          <Package className="h-10 w-10" style={{ color: LEDGER.muted }} />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span
            className="truncate text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{ color: LEDGER.muted }}
          >
            SKU {variant?.sku ?? product.id}
          </span>
          {product.variants.length > 1 ? (
            <span
              className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: LEDGER.indigoSoft,
                color: LEDGER.indigo
              }}
            >
              {product.variants.length} variants
            </span>
          ) : null}
        </div>
        <p
          className="mt-1.5 flex-1 text-[14px] font-semibold leading-snug"
          style={{ color: LEDGER.ink }}
        >
          {product.title}
        </p>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p
              className="text-base font-semibold tracking-tight"
              style={{ color: LEDGER.ink }}
            >
              {product.price > 0 ? formatUsd(product.price) : "Quote required"}
            </p>
            <p className="text-[11px] font-medium" style={{ color: LEDGER.muted }}>
              {product.category.name}
            </p>
          </div>
          <span
            className="flex items-center gap-1 text-[12px] font-semibold transition group-hover:gap-1.5"
            style={{ color: LEDGER.indigo }}
          >
            Details <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
