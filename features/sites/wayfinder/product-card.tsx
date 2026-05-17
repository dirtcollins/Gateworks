// Wayfinder — product card + grid. Hairline tiles with mono SKU labels and
// the warehouse stock/aisle tag. Used by the home rails, search results, and
// category landing pages. Links into the real /wayfinder/products/[slug].
"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import {
  Btn,
  Ico,
  Mono,
  ProductImage,
  StockTag,
  Tag,
  fmt,
  wf
} from "./kit";

export function ProductCard({
  product,
  showCta = true
}: {
  product: Product;
  showCta?: boolean;
}) {
  const variant = product.variants[0];
  const hasOptions = product.variants.length > 1;
  const href = `/wayfinder/products/${product.slug}`;

  return (
    <div style={{ background: "#fff", padding: 14, display: "grid", gap: 8 }}>
      <Link href={href}>
        <ProductImage product={product} ratio={1} sizes="240px" />
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Mono style={{ fontSize: 9, color: wf.muted, textTransform: "uppercase" }}>
          {product.specifications.Brand ?? "Gateworks"}
        </Mono>
        {hasOptions ? (
          <Tag tone="solid" style={{ fontSize: 8, padding: "1px 5px" }}>
            {product.variants.length} options
          </Tag>
        ) : null}
      </div>
      <Link
        href={href}
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: wf.ink,
          lineHeight: 1.3,
          minHeight: 38
        }}
      >
        {product.title}
      </Link>
      <Mono style={{ fontSize: 10, color: wf.steel }}>
        SKU {variant?.sku ?? product.id}
      </Mono>
      <div
        style={{
          fontSize: 18,
          fontWeight: 900,
          color: wf.ink,
          letterSpacing: "-0.01em"
        }}
      >
        {product.price > 0 ? fmt(product.price) : "Quote"}
      </div>
      <StockTag product={product} />
      {showCta ? (
        <Btn href={href} variant="primary" size="sm" block>
          <Ico.arrowRight size={14} /> View product
        </Btn>
      ) : null}
    </div>
  );
}

export function ProductGrid({
  products,
  showCta = true,
  minTile = 240
}: {
  products: Product[];
  showCta?: boolean;
  minTile?: number;
}) {
  if (products.length === 0) {
    return (
      <div
        style={{
          background: "#fff",
          border: `1px solid ${wf.rail}`,
          padding: 48,
          textAlign: "center"
        }}
      >
        <Mono style={{ fontSize: 12, color: wf.muted }}>
          No products match this aisle.
        </Mono>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${minTile}px, 1fr))`,
        gap: 1,
        background: wf.rail,
        border: `1px solid ${wf.rail}`
      }}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} showCta={showCta} />
      ))}
    </div>
  );
}
