"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  featuredProduct,
  getRelatedProducts
} from "@/features/design-lab/live-data";
import { useCartStore } from "@/lib/cart-store";
import {
  Card,
  Kbd,
  Pill,
  SIGNAL,
  SectionHead,
  SignalShell,
  formatUsd
} from "./kit";

// d10 "Signal" — product. featuredProduct with selectable variants, image
// gallery, specs, and smart pairings (getRelatedProducts) framed as an
// attach-rate cross-sell. Add to cart writes the selected variant.

const product = featuredProduct;
const related = getRelatedProducts(product, 4);

function variantLabel(options: { length?: string; finish?: string }): string {
  const parts = [options.length, options.finish].filter(
    (part) => part && part !== "Standard"
  );
  return parts.length ? parts.join(" · ") : "Standard";
}

export function D10Product() {
  const addItem = useCartStore((state) => state.addItem);

  const gallery = useMemo(() => {
    const urls = Array.from(
      new Set([
        ...product.images.map((image) => image.url),
        ...product.variants.map((variant) => variant.image)
      ])
    ).filter((url): url is string => Boolean(url));
    return urls.length ? urls : ["/assets/logo.svg"];
  }, []);

  const [activeImage, setActiveImage] = useState(0);
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant =
    product.variants.find((item) => item.id === variantId) ??
    product.variants[0];
  const unit = variant?.price ?? product.price;
  const inStock = variant?.inventory === "in_stock";
  const stock = variant?.inventoryQuantity ?? 0;
  const specs = Object.entries(product.specifications);

  function handleAdd() {
    if (!variant) return;
    addItem({
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      sku: variant.sku,
      image: variant.image || gallery[0],
      price: variant.price,
      quantity: qty,
      options: variant.options
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <SignalShell active="product">
      <div className="mx-auto max-w-6xl px-5 py-5">
        {/* breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-[12px]"
          style={{ color: SIGNAL.sub }}
        >
          <Link href="/design-lab/d10/home" className="hover:underline">
            Home
          </Link>
          <span>/</span>
          <Link href="/design-lab/d10/category" className="hover:underline">
            {product.category.name}
          </Link>
          <span>/</span>
          <span style={{ color: SIGNAL.ink }}>{product.title}</span>
        </nav>

        <div className="mt-5 grid gap-7 lg:grid-cols-[1.05fr_1fr]">
          {/* gallery */}
          <div>
            <Card className="overflow-hidden">
              <div
                className="relative aspect-square"
                style={{ background: SIGNAL.canvas }}
              >
                <Image
                  src={gallery[activeImage] ?? gallery[0]}
                  alt={product.title}
                  fill
                  quality={85}
                  sizes="(max-width: 1024px) 100vw, 540px"
                  className="object-contain p-10"
                  priority
                />
              </div>
            </Card>
            {gallery.length > 1 ? (
              <div className="mt-3 flex gap-2.5">
                {gallery.slice(0, 5).map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Image ${index + 1}`}
                    className="relative h-16 w-16 overflow-hidden rounded-[9px] border transition-colors"
                    style={{
                      borderColor:
                        activeImage === index ? SIGNAL.accent : SIGNAL.line,
                      background: SIGNAL.canvas
                    }}
                  >
                    <Image
                      src={url}
                      alt={`${product.title} ${index + 1}`}
                      fill
                      quality={55}
                      sizes="64px"
                      className="object-contain p-1.5"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* buy box */}
          <div>
            <div className="flex items-center gap-2">
              <Pill tone="accent">{product.specifications.Brand ?? "Gateworks"}</Pill>
              {inStock ? (
                <Pill tone="good">{stock} in stock</Pill>
              ) : (
                <Pill tone="warn">Out of stock</Pill>
              )}
            </div>
            <h1
              className="mt-3 text-[26px] font-semibold leading-tight tracking-tight"
              style={{ color: SIGNAL.ink }}
            >
              {product.title}
            </h1>
            <p className="mt-2 text-[12px]" style={{ color: SIGNAL.sub }}>
              SKU {variant?.sku ?? product.id} · {product.category.name}
            </p>

            <div className="mt-4 flex items-baseline gap-2">
              <span
                className="text-[30px] font-semibold tabular-nums"
                style={{ color: SIGNAL.ink }}
              >
                {formatUsd(unit)}
              </span>
              <span className="text-[12px]" style={{ color: SIGNAL.sub }}>
                per unit · price locked 24h
              </span>
            </div>

            {/* variants */}
            {product.variants.length > 1 ? (
              <div className="mt-5">
                <p
                  className="mb-2 text-[12px] font-semibold"
                  style={{ color: SIGNAL.ink }}
                >
                  Configuration
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((item) => {
                    const on = item.id === variantId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setVariantId(item.id)}
                        className="rounded-[8px] border px-3 py-2 text-[12px] font-medium transition-colors"
                        style={{
                          borderColor: on ? SIGNAL.accent : SIGNAL.line,
                          background: on ? SIGNAL.accentSoft : SIGNAL.surface,
                          color: on ? SIGNAL.accent : SIGNAL.ink
                        }}
                      >
                        {variantLabel(item.options)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* qty + add */}
            <div className="mt-5 flex items-center gap-3">
              <div
                className="flex items-center rounded-[8px] border"
                style={{ borderColor: SIGNAL.line }}
              >
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((value) => Math.max(1, value - 1))}
                  className="grid h-10 w-10 place-items-center text-[16px]"
                  style={{ color: SIGNAL.sub }}
                >
                  −
                </button>
                <span
                  className="w-10 text-center text-[14px] font-semibold tabular-nums"
                  style={{ color: SIGNAL.ink }}
                >
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQty((value) => value + 1)}
                  className="grid h-10 w-10 place-items-center text-[16px]"
                  style={{ color: SIGNAL.sub }}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!inStock}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[8px] text-[13px] font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: SIGNAL.accent }}
              >
                {added ? "Added ✓" : "Add to cart"}
                {!added ? <Kbd>↵</Kbd> : null}
              </button>
            </div>
            <p
              className="mt-2 text-[12px]"
              style={{ color: SIGNAL.sub }}
            >
              Line total{" "}
              <span
                className="font-semibold tabular-nums"
                style={{ color: SIGNAL.ink }}
              >
                {formatUsd(unit * qty)}
              </span>{" "}
              · free same-day pickup
            </p>

            {/* details */}
            {product.details.length ? (
              <Card className="mt-5 p-4">
                <p
                  className="mb-2 text-[12px] font-semibold"
                  style={{ color: SIGNAL.ink }}
                >
                  Why pros pick it
                </p>
                <ul className="space-y-1.5">
                  {product.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex gap-2 text-[12px] leading-relaxed"
                      style={{ color: SIGNAL.sub }}
                    >
                      <span style={{ color: SIGNAL.accent }}>▸</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </div>
        </div>

        {/* specs */}
        <section className="mt-9">
          <SectionHead
            eyebrow="Reference"
            title="Specifications"
            hint="Full spec sheet — searchable, copy-ready."
          />
          <Card className="overflow-hidden">
            <dl className="grid sm:grid-cols-2">
              {specs.map(([key, value], index) => (
                <div
                  key={key}
                  className="flex justify-between gap-4 border-b px-4 py-2.5"
                  style={{
                    borderColor: SIGNAL.line,
                    borderRight:
                      index % 2 === 0 ? `1px solid ${SIGNAL.line}` : "none"
                  }}
                >
                  <dt className="text-[12px]" style={{ color: SIGNAL.sub }}>
                    {key}
                  </dt>
                  <dd
                    className="text-right text-[12px] font-medium"
                    style={{ color: SIGNAL.ink }}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        </section>

        {/* smart pairings */}
        {related.length ? (
          <section className="mt-9">
            <SectionHead
              eyebrow="Smart pairings"
              title="Frequently bought for the same job"
              hint="Recommendations from the same category — raises attach rate per order."
            />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {related.map((item) => (
                <Link
                  key={item.id}
                  href="/design-lab/d10/product"
                  className="group block overflow-hidden rounded-[12px] border bg-white transition-all hover:-translate-y-0.5"
                  style={{ borderColor: SIGNAL.line }}
                >
                  <div
                    className="relative aspect-square"
                    style={{ background: SIGNAL.canvas }}
                  >
                    <Image
                      src={
                        item.images[0]?.url ??
                        item.variants[0]?.image ??
                        "/assets/logo.svg"
                      }
                      alt={item.title}
                      fill
                      quality={70}
                      sizes="(max-width: 1024px) 50vw, 220px"
                      className="object-contain p-5"
                    />
                  </div>
                  <div className="border-t p-3" style={{ borderColor: SIGNAL.line }}>
                    <p
                      className="line-clamp-2 min-h-[34px] text-[12px] font-medium leading-tight"
                      style={{ color: SIGNAL.ink }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="mt-1.5 text-[13px] font-semibold tabular-nums"
                      style={{ color: SIGNAL.accent }}
                    >
                      {formatUsd(item.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </SignalShell>
  );
}
