"use client";

/* DESIGN 2 — "MONO" — Object / product detail, wired to cart + catalog. */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Label,
  MONO,
  MonoButton,
  MonoPage,
  Pill,
  ProductImage,
  Section,
  formatUsd
} from "./kit";
import {
  featuredProduct,
  getRelatedProducts
} from "@/features/design-lab/live-data";
import { useCartStore } from "@/lib/cart-store";
import type { ProductVariant } from "@/lib/types";

const PRODUCT = featuredProduct;
const RELATED = getRelatedProducts(PRODUCT, 4);

// Real catalog image set for the gallery (deduplicated, capped at five).
const GALLERY: string[] = Array.from(
  new Set([
    ...PRODUCT.images.map((image) => image.url),
    ...PRODUCT.variants.map((variant) => variant.image)
  ])
).filter((url): url is string => Boolean(url)).slice(0, 5);

const SPECS: Array<[string, string]> = Object.entries(PRODUCT.specifications)
  .filter(([, value]) => Boolean(value) && !String(value).startsWith("http"));

function variantLabel(variant: ProductVariant): string {
  const parts = [variant.options.length, variant.options.finish].filter(
    (part) => part && part !== "Standard"
  );
  return parts.length ? parts.join(" / ") : variant.sku;
}

export function D2Product() {
  const addItem = useCartStore((state) => state.addItem);
  const firstAvailable =
    PRODUCT.variants.find((variant) => variant.inventory === "in_stock") ??
    PRODUCT.variants[0];

  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "");
  const [view, setView] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = useMemo(
    () =>
      PRODUCT.variants.find((variant) => variant.id === variantId) ??
      firstAvailable,
    [variantId, firstAvailable]
  );

  const unit = selected?.price ?? PRODUCT.price;
  const heroImage = GALLERY[view] ?? selected?.image;

  function handleAddToCart() {
    if (!selected) return;
    addItem({
      productId: PRODUCT.id,
      variantId: selected.id,
      title: PRODUCT.title,
      sku: selected.sku,
      image: selected.image || PRODUCT.images[0]?.url || "/assets/logo.svg",
      price: selected.price,
      weightLbs: selected.calculated_weight_lb,
      cwtPrice: selected.steel_cwt_price,
      pricingMethod: selected.pricing_method,
      quantity: qty,
      options: selected.options
    });
    setAdded(true);
  }

  return (
    <MonoPage active="Object">
      {/* Breadcrumb */}
      <Section
        className="py-4"
        style={{ borderBottom: `1px solid ${MONO.line}` }}
      >
        <nav className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em]">
          <Link
            className="hover:underline"
            href="/design-lab/d2/home"
            style={{ color: MONO.muted }}
          >
            Index
          </Link>
          <span style={{ color: MONO.line }}>/</span>
          <Link
            className="hover:underline"
            href="/design-lab/d2/category"
            style={{ color: MONO.muted }}
          >
            {PRODUCT.category.name}
          </Link>
          <span style={{ color: MONO.line }}>/</span>
          <span>{firstAvailable?.sku ?? PRODUCT.id}</span>
        </nav>
      </Section>

      {/* Main — gallery + buy box */}
      <Section
        className="pt-10 pb-14"
        style={{ borderBottom: `1px solid ${MONO.line}` }}
      >
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Gallery */}
          <div className="lg:col-span-7">
            <div style={{ border: `1px solid ${MONO.lineStrong}` }}>
              <ProductImage
                alt={PRODUCT.title}
                className="aspect-[4/3]"
                pad="p-10"
                priority
                sizes="(max-width: 1024px) 100vw, 720px"
                src={heroImage}
              />
            </div>
            {GALLERY.length > 1 ? (
              <div
                className="mt-3 grid grid-cols-5"
                style={{ borderLeft: `1px solid ${MONO.line}` }}
              >
                {GALLERY.map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setView(index)}
                    className="transition-colors"
                    style={{
                      borderRight: `1px solid ${MONO.line}`,
                      borderTop: `1px solid ${MONO.line}`,
                      borderBottom: `1px solid ${MONO.line}`,
                      outline:
                        index === view
                          ? `2px solid ${MONO.lineStrong}`
                          : undefined,
                      outlineOffset: "-2px"
                    }}
                  >
                    <ProductImage
                      alt={`${PRODUCT.title} view ${index + 1}`}
                      className="aspect-square"
                      pad="p-3"
                      sizes="120px"
                      src={url}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Buy box */}
          <div className="lg:col-span-5">
            <Label index="OBJ">{PRODUCT.category.name}</Label>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.04] tracking-[-0.03em]">
              {PRODUCT.title}
            </h1>

            <div
              className="mt-6 flex items-baseline gap-3 py-5"
              style={{
                borderTop: `1px solid ${MONO.lineStrong}`,
                borderBottom: `1px solid ${MONO.line}`
              }}
            >
              <span className="text-[40px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                {formatUsd(unit)}
              </span>
              <span
                className="text-[12px] uppercase tracking-[0.14em]"
                style={{ color: MONO.muted }}
              >
                per unit
              </span>
              <span className="ml-auto">
                {selected?.inventory === "in_stock" ? (
                  <Pill>In stock — {selected.inventoryQuantity}</Pill>
                ) : (
                  <Pill>Backorder</Pill>
                )}
              </span>
            </div>

            <p
              className="mt-5 text-[13px] leading-relaxed"
              style={{ color: MONO.steel }}
            >
              {PRODUCT.description}
            </p>

            {/* Variants */}
            {PRODUCT.variants.length > 1 ? (
              <div className="mt-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em]">
                  Variant — {selected?.sku}
                </p>
                <div
                  className="mt-3 grid grid-cols-2"
                  style={{ borderLeft: `1px solid ${MONO.line}` }}
                >
                  {PRODUCT.variants.map((variant) => {
                    const on = variant.id === selected?.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => {
                          setVariantId(variant.id);
                          setAdded(false);
                        }}
                        className="flex flex-col gap-1 px-4 py-3 text-left transition-colors"
                        style={{
                          borderRight: `1px solid ${MONO.line}`,
                          borderBottom: `1px solid ${MONO.line}`,
                          background: on ? MONO.ink : MONO.paper,
                          color: on ? MONO.paper : MONO.ink
                        }}
                      >
                        <span className="text-[12px] font-semibold tracking-[-0.01em]">
                          {variantLabel(variant)}
                        </span>
                        <span
                          className="text-[12px] tabular-nums"
                          style={{
                            color: on
                              ? "rgba(255,255,255,0.6)"
                              : MONO.steel
                          }}
                        >
                          {formatUsd(variant.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Quantity + add */}
            <div className="mt-7 flex flex-wrap gap-3">
              <div
                className="flex items-stretch"
                style={{ border: `1px solid ${MONO.lineStrong}` }}
              >
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-[50px] w-12 place-items-center text-[18px] transition-colors hover:bg-[#0a0a0a] hover:text-white"
                >
                  &minus;
                </button>
                <span
                  className="grid h-[50px] w-14 place-items-center text-[15px] font-semibold tabular-nums"
                  style={{
                    borderLeft: `1px solid ${MONO.line}`,
                    borderRight: `1px solid ${MONO.line}`
                  }}
                >
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => q + 1)}
                  className="grid h-[50px] w-12 place-items-center text-[18px] transition-colors hover:bg-[#0a0a0a] hover:text-white"
                >
                  +
                </button>
              </div>
              <div className="flex-1">
                <MonoButton full onClick={handleAddToCart}>
                  Add to cart — {formatUsd(unit * qty)}
                </MonoButton>
              </div>
            </div>

            {added ? (
              <Link
                href="/design-lab/d2/cart"
                className="mt-3 flex items-center justify-between px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ border: `1px solid ${MONO.lineStrong}` }}
              >
                <span>Added to cart</span>
                <span className="underline underline-offset-4">
                  View cart →
                </span>
              </Link>
            ) : null}

            <div
              className="mt-7 grid grid-cols-3 text-[10px]"
              style={{ border: `1px solid ${MONO.line}` }}
            >
              {[
                ["Dispatch", "Same day"],
                ["Returns", "30 days"],
                ["Docs", "Mill certs"]
              ].map(([k, v], index) => (
                <div
                  key={k}
                  className="px-3 py-3"
                  style={{
                    borderLeft:
                      index === 0 ? undefined : `1px solid ${MONO.line}`
                  }}
                >
                  <p
                    className="font-semibold uppercase tracking-[0.18em]"
                    style={{ color: MONO.muted }}
                  >
                    {k}
                  </p>
                  <p className="mt-1 text-[12px] font-medium">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Specifications */}
      <Section
        className="pt-12 pb-14"
        style={{ borderBottom: `1px solid ${MONO.line}` }}
      >
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Label index="SPEC">Technical detail</Label>
            <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.025em]">
              Specifications
            </h2>
            {PRODUCT.details.length ? (
              <ul className="mt-5 flex flex-col gap-2.5">
                {PRODUCT.details.map((detail) => (
                  <li
                    key={detail}
                    className="flex gap-2.5 text-[13px] leading-relaxed"
                    style={{ color: MONO.steel }}
                  >
                    <span style={{ color: MONO.ink }}>—</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="lg:col-span-8">
            <dl
              className="grid sm:grid-cols-2"
              style={{
                borderTop: `1px solid ${MONO.lineStrong}`,
                borderLeft: `1px solid ${MONO.line}`
              }}
            >
              {SPECS.map(([label, value]) => (
                <div
                  key={label}
                  className="px-4 py-3.5"
                  style={{
                    borderRight: `1px solid ${MONO.line}`,
                    borderBottom: `1px solid ${MONO.line}`
                  }}
                >
                  <dt
                    className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: MONO.muted }}
                  >
                    {label}
                  </dt>
                  <dd className="mt-1 text-[13px] font-medium tracking-[-0.01em]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Section>

      {/* Related */}
      {RELATED.length ? (
        <Section className="pt-12 pb-16">
          <div
            className="flex items-end justify-between pb-5"
            style={{ borderBottom: `1px solid ${MONO.lineStrong}` }}
          >
            <div>
              <Label index="REL">Same department</Label>
              <h2 className="mt-2.5 text-[26px] font-semibold tracking-[-0.025em]">
                Pairs well with
              </h2>
            </div>
            <Link
              href="/design-lab/d2/category"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4"
            >
              More
            </Link>
          </div>
          <div
            className="mt-px grid grid-cols-2 lg:grid-cols-4"
            style={{ borderLeft: `1px solid ${MONO.line}` }}
          >
            {RELATED.map((product) => (
              <Link
                key={product.id}
                href="/design-lab/d2/product"
                className="group flex flex-col"
                style={{
                  borderRight: `1px solid ${MONO.line}`,
                  borderBottom: `1px solid ${MONO.line}`
                }}
              >
                <ProductImage
                  alt={product.title}
                  className="aspect-square transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="(max-width: 1024px) 50vw, 280px"
                  src={product.images[0]?.url ?? product.variants[0]?.image}
                />
                <div
                  className="flex flex-1 flex-col gap-2 p-4"
                  style={{ borderTop: `1px solid ${MONO.line}` }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: MONO.muted }}
                  >
                    {product.variants[0]?.sku ?? product.id}
                  </p>
                  <p className="flex-1 text-[13px] font-medium leading-snug">
                    {product.title}
                  </p>
                  <span className="text-[15px] font-semibold tabular-nums">
                    {formatUsd(product.price)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      ) : null}
    </MonoPage>
  );
}
