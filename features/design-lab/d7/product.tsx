"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CreditCard,
  Layers,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Truck
} from "lucide-react";
import {
  Breadcrumb,
  Card,
  D7DesignBadge,
  D7Page,
  Eyebrow,
  LEDGER,
  Pill,
  formatUsd
} from "./kit";
import { featuredProduct, getRelatedProducts } from "@/features/design-lab/live-data";
import { useCartStore } from "@/lib/cart-store";
import type { ProductVariant } from "@/lib/types";

/* d7 "Ledger" product detail — the real Adjust-O-Matic Latch.
 * Marketing: surfaces volume breaks + net-terms to frame the buy as a
 * procurement decision. Finance: an explicit price-tier table makes
 * the unit economics of larger quantities legible. Add-to-cart wires
 * the selected variant into the real cart store. */

/* Volume-break tiers — a presentation layer over the real unit price.
 * Larger commitments unlock a lower effective per-unit cost. */
const VOLUME_TIERS = [
  { min: 1, label: "1 – 23", discount: 0 },
  { min: 24, label: "24 – 95", discount: 0.06 },
  { min: 96, label: "96 – 239", discount: 0.11 },
  { min: 240, label: "240+", discount: 0.15 }
];

function tierFor(quantity: number) {
  return [...VOLUME_TIERS].reverse().find((tier) => quantity >= tier.min) ?? VOLUME_TIERS[0];
}

function variantLabel(variant: ProductVariant): string {
  const parts = [variant.options.length, variant.options.finish].filter(
    (part) => part && part !== "Standard"
  );
  return parts.length ? parts.join(" · ") : variant.sku;
}

const GALLERY = featuredProduct.images.length
  ? featuredProduct.images.map((image) => image.url)
  : featuredProduct.variants.map((variant) => variant.image);

const SPECS = Object.entries(featuredProduct.specifications);

const RELATED = getRelatedProducts(featuredProduct, 4);

export function D7Product() {
  const addItem = useCartStore((state) => state.addItem);
  const [activeImage, setActiveImage] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [qty, setQty] = useState(24);
  const [added, setAdded] = useState(false);

  const variant = featuredProduct.variants[variantIndex];
  const tier = useMemo(() => tierFor(qty), [qty]);
  const unitPrice = (variant?.price ?? 0) * (1 - tier.discount);
  const lineTotal = unitPrice * qty;
  const listLineTotal = (variant?.price ?? 0) * qty;
  const savings = listLineTotal - lineTotal;

  function handleAddToCart() {
    if (!variant) return;
    addItem({
      productId: featuredProduct.id,
      variantId: variant.id,
      title: featuredProduct.title,
      sku: variant.sku,
      image: variant.image,
      price: Number(unitPrice.toFixed(2)),
      weightLbs: variant.calculated_weight_lb,
      cwtPrice: variant.steel_cwt_price,
      pricingMethod: variant.pricing_method,
      quantity: qty,
      options: variant.options
    });
    setAdded(true);
  }

  return (
    <D7Page>
      <div className="pt-5">
        <D7DesignBadge />
      </div>

      <div className="py-5">
        <Breadcrumb
          trail={[
            { label: "Overview", href: "/design-lab/d7/home" },
            { label: featuredProduct.category.name, href: "/design-lab/d7/category" },
            { label: featuredProduct.title }
          ]}
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-12">
        {/* Gallery */}
        <div className="lg:col-span-7">
          <Card className="overflow-hidden">
            <div
              className="flex aspect-[4/3] items-center justify-center"
              style={{ backgroundColor: LEDGER.canvas }}
            >
              {GALLERY[activeImage] ? (
                <Image
                  alt={featuredProduct.title}
                  className="h-full w-full object-contain p-10"
                  height={900}
                  priority
                  quality={75}
                  src={GALLERY[activeImage]}
                  width={900}
                />
              ) : (
                <Package className="h-20 w-20" style={{ color: LEDGER.muted }} />
              )}
            </div>
          </Card>
          {GALLERY.length > 1 ? (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {GALLERY.slice(0, 5).map((image, index) => (
                <button
                  key={image || index}
                  className="flex aspect-square items-center justify-center rounded-xl transition"
                  onClick={() => setActiveImage(index)}
                  style={{
                    backgroundColor: LEDGER.surface,
                    border: `1px solid ${
                      activeImage === index ? LEDGER.indigo : LEDGER.line
                    }`
                  }}
                  type="button"
                >
                  {image ? (
                    <Image
                      alt={`${featuredProduct.title} view ${index + 1}`}
                      className="h-full w-full object-contain p-2"
                      height={160}
                      quality={75}
                      src={image}
                      width={160}
                    />
                  ) : (
                    <Package className="h-5 w-5" style={{ color: LEDGER.muted }} />
                  )}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Buy box */}
        <div className="lg:col-span-5">
          <Eyebrow>{featuredProduct.category.name}</Eyebrow>
          <h1
            className="mt-2 text-3xl font-semibold leading-tight tracking-tight"
            style={{ color: LEDGER.ink }}
          >
            {featuredProduct.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill bg={LEDGER.mintSoft} fg={LEDGER.mint}>
              In stock &middot; {variant?.inventoryQuantity ?? 0} units
            </Pill>
            <span
              className="text-[12px] font-medium"
              style={{ color: LEDGER.muted }}
            >
              SKU {variant?.sku}
            </span>
          </div>

          <div
            className="mt-4 flex items-end gap-2 rounded-xl p-4"
            style={{ backgroundColor: LEDGER.indigoSoft }}
          >
            <span
              className="text-3xl font-semibold tracking-tight"
              style={{ color: LEDGER.ink }}
            >
              {formatUsd(unitPrice)}
            </span>
            <span
              className="pb-1 text-[12px] font-medium"
              style={{ color: LEDGER.indigo }}
            >
              effective unit price at {qty} ea
              {tier.discount > 0
                ? ` · tier ${(tier.discount * 100).toFixed(0)}% off`
                : " · list price"}
            </span>
          </div>

          <p
            className="mt-4 text-[14px] leading-relaxed"
            style={{ color: LEDGER.body }}
          >
            {featuredProduct.description}
          </p>

          {/* Variant select */}
          {featuredProduct.variants.length > 1 ? (
            <div className="mt-5">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: LEDGER.muted }}
              >
                Select variant
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {featuredProduct.variants.map((option, index) => {
                  const active = variantIndex === index;
                  return (
                    <button
                      key={option.id}
                      className="rounded-xl px-3 py-2.5 text-left transition"
                      onClick={() => {
                        setVariantIndex(index);
                        setAdded(false);
                      }}
                      style={{
                        backgroundColor: active ? LEDGER.indigo : LEDGER.surface,
                        border: `1px solid ${active ? LEDGER.indigo : LEDGER.line}`
                      }}
                      type="button"
                    >
                      <span
                        className="block text-[13px] font-semibold"
                        style={{ color: active ? "#ffffff" : LEDGER.ink }}
                      >
                        {variantLabel(option)}
                      </span>
                      <span
                        className="text-[12px] font-medium"
                        style={{
                          color: active
                            ? "rgba(255,255,255,0.72)"
                            : LEDGER.muted
                        }}
                      >
                        {formatUsd(option.price)} list
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Volume tier table */}
          <div className="mt-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Volume pricing
            </p>
            <div
              className="mt-2 overflow-hidden rounded-xl"
              style={{ border: `1px solid ${LEDGER.line}` }}
            >
              {VOLUME_TIERS.map((row, index) => {
                const active = row.min === tier.min;
                return (
                  <div
                    key={row.label}
                    className="flex items-center justify-between px-3.5 py-2 text-[13px]"
                    style={{
                      backgroundColor: active ? LEDGER.indigoSoft : LEDGER.surface,
                      borderTop:
                        index === 0 ? "none" : `1px solid ${LEDGER.line}`
                    }}
                  >
                    <span
                      className="font-medium"
                      style={{ color: active ? LEDGER.indigo : LEDGER.body }}
                    >
                      {row.label} units
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: active ? LEDGER.indigo : LEDGER.ink }}
                    >
                      {row.discount === 0
                        ? "List price"
                        : `${(row.discount * 100).toFixed(0)}% off`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Qty + add */}
          <div className="mt-5 flex gap-3">
            <div
              className="flex items-center rounded-xl"
              style={{ border: `1px solid ${LEDGER.line}` }}
            >
              <button
                aria-label="Decrease quantity"
                className="grid h-12 w-11 place-items-center"
                onClick={() => {
                  setQty((value) => Math.max(1, value - 1));
                  setAdded(false);
                }}
                style={{ color: LEDGER.body }}
                type="button"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span
                className="grid h-12 w-14 place-items-center text-base font-semibold"
                style={{
                  color: LEDGER.ink,
                  borderLeft: `1px solid ${LEDGER.line}`,
                  borderRight: `1px solid ${LEDGER.line}`
                }}
              >
                {qty}
              </span>
              <button
                aria-label="Increase quantity"
                className="grid h-12 w-11 place-items-center"
                onClick={() => {
                  setQty((value) => value + 1);
                  setAdded(false);
                }}
                style={{ color: LEDGER.body }}
                type="button"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition"
              onClick={handleAddToCart}
              style={{ backgroundColor: LEDGER.indigo }}
              type="button"
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Added &mdash; {formatUsd(lineTotal)}
                </>
              ) : (
                <>Add to purchase order &mdash; {formatUsd(lineTotal)}</>
              )}
            </button>
          </div>

          {savings > 0 ? (
            <p
              className="mt-2 text-[12px] font-medium"
              style={{ color: LEDGER.mint }}
            >
              Volume tier saves {formatUsd(savings)} on this line vs. list price.
            </p>
          ) : null}

          {added ? (
            <Link
              className="mt-3 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition"
              href="/design-lab/d7/cart"
              style={{ backgroundColor: LEDGER.indigoSoft, color: LEDGER.indigo }}
            >
              Review purchase order <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}

          {/* Procurement assurances */}
          <div className="mt-5 grid gap-2">
            {[
              { icon: CreditCard, text: "Bills to your Net-30 account — no card needed" },
              { icon: Truck, text: "Same-day will-call if ordered before 11am" },
              { icon: RotateCcw, text: "Saved to reorder lists for recurring jobs" }
            ].map((row) => (
              <div
                key={row.text}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                style={{ backgroundColor: LEDGER.surface, border: `1px solid ${LEDGER.line}` }}
              >
                <row.icon className="h-4 w-4 shrink-0" style={{ color: LEDGER.indigo }} />
                <span className="text-[13px] font-medium" style={{ color: LEDGER.body }}>
                  {row.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section className="py-12">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" style={{ color: LEDGER.indigo }} />
          <h2
            className="text-xl font-semibold tracking-tight"
            style={{ color: LEDGER.ink }}
          >
            Specifications
          </h2>
        </div>
        <Card className="mt-4 overflow-hidden">
          <dl className="grid sm:grid-cols-2">
            {SPECS.map(([label, value], index) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
                style={{
                  borderTop:
                    index < 2 ? "none" : `1px solid ${LEDGER.line}`,
                  borderLeft:
                    index % 2 === 1 ? `1px solid ${LEDGER.line}` : "none"
                }}
              >
                <dt className="text-[13px] font-medium" style={{ color: LEDGER.muted }}>
                  {label}
                </dt>
                <dd
                  className="truncate text-[13px] font-semibold"
                  style={{ color: LEDGER.ink }}
                  title={value}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      {/* Related */}
      <section className="pb-12">
        <div className="flex items-end justify-between">
          <h2
            className="text-xl font-semibold tracking-tight"
            style={{ color: LEDGER.ink }}
          >
            Often ordered together
          </h2>
          <Link
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition hover:underline"
            href="/design-lab/d7/category"
            style={{ color: LEDGER.indigo }}
          >
            Browse catalog <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((product) => {
            const relVariant = product.variants[0];
            const image = product.images[0]?.url ?? relVariant?.image;
            return (
              <Link
                key={product.id}
                className="flex flex-col overflow-hidden rounded-2xl transition"
                href="/design-lab/d7/product"
                style={{
                  backgroundColor: LEDGER.surface,
                  border: `1px solid ${LEDGER.line}`
                }}
              >
                <div
                  className="flex h-32 items-center justify-center"
                  style={{ backgroundColor: LEDGER.canvas }}
                >
                  {image ? (
                    <Image
                      alt={product.title}
                      className="h-full w-full object-contain p-3"
                      height={220}
                      quality={75}
                      src={image}
                      width={220}
                    />
                  ) : (
                    <Package className="h-8 w-8" style={{ color: LEDGER.muted }} />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3.5">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: LEDGER.muted }}
                  >
                    {relVariant?.sku ?? product.id}
                  </p>
                  <p
                    className="mt-1 flex-1 text-[13px] font-semibold leading-snug"
                    style={{ color: LEDGER.ink }}
                  >
                    {product.title}
                  </p>
                  <span
                    className="mt-2 text-sm font-semibold tracking-tight"
                    style={{ color: LEDGER.ink }}
                  >
                    {formatUsd(product.price)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </D7Page>
  );
}
