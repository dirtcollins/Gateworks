"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, ChevronRight, Minus, Plus } from "lucide-react";
import {
  D9DesignBadge,
  D9Page,
  Display,
  Eyebrow,
  GalleryCard,
  d9,
  formatUsd,
  serif
} from "./kit";
import { featuredProduct, getRelatedProducts } from "@/features/design-lab/live-data";
import { useCartStore } from "@/lib/cart-store";
import type { ProductVariant } from "@/lib/types";

/* DESIGN 9 — "Showroom" — Product. The real "Adjust-O-Matic Latch". */

const GALLERY = featuredProduct.images.length
  ? featuredProduct.images.map((image) => image.url)
  : featuredProduct.variants.map((variant) => variant.image);

const SPECS = Object.entries(featuredProduct.specifications);
const RELATED = getRelatedProducts(featuredProduct, 3);

function variantLabel(variant: ProductVariant): string {
  const parts = [variant.options.length, variant.options.finish].filter(
    (part) => part && part !== "Standard"
  );
  return parts.length ? parts.join(" · ") : variant.sku;
}

export function D9Product() {
  const addItem = useCartStore((state) => state.addItem);
  const [activeImage, setActiveImage] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = featuredProduct.variants[variantIndex];

  function handleAddToCart() {
    if (!selected) return;
    addItem({
      productId: featuredProduct.id,
      variantId: selected.id,
      title: featuredProduct.title,
      sku: selected.sku,
      image: selected.image,
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
    <D9Page>
      <D9DesignBadge />

      {/* Breadcrumb */}
      <nav
        className="mx-auto flex max-w-[1240px] items-center gap-2 px-6 py-6 text-[0.62rem] font-semibold uppercase tracking-[0.16em] sm:px-8"
        style={{ color: d9.haze }}
      >
        <Link href="/design-lab/d9/home" style={{ color: d9.haze }}>
          Showroom
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/design-lab/d9/category" style={{ color: d9.haze }}>
          {featuredProduct.category.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span style={{ color: d9.ink }}>{featuredProduct.title}</span>
      </nav>

      {/* ---- Gallery + Buy box ---- */}
      <section className="mx-auto max-w-[1240px] px-6 pb-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Large image gallery */}
          <div>
            <div
              className="flex aspect-square items-center justify-center overflow-hidden"
              style={{ background: d9.linen, border: `1px solid ${d9.rule}` }}
            >
              {GALLERY[activeImage] ? (
                <Image
                  alt={featuredProduct.title}
                  className="h-full w-full object-contain p-16"
                  height={1100}
                  priority
                  quality={75}
                  src={GALLERY[activeImage]}
                  width={1100}
                />
              ) : (
                <span className="text-8xl" style={{ ...serif, color: d9.rule }}>
                  GW
                </span>
              )}
            </div>
            {GALLERY.length > 1 ? (
              <div className="mt-4 grid grid-cols-4 gap-4">
                {GALLERY.slice(0, 4).map((image, index) => (
                  <button
                    key={image || index}
                    className="flex aspect-square items-center justify-center overflow-hidden transition-colors"
                    onClick={() => setActiveImage(index)}
                    style={{
                      background: d9.linen,
                      border: `1px solid ${activeImage === index ? d9.bronze : d9.rule}`
                    }}
                    type="button"
                  >
                    {image ? (
                      <Image
                        alt={`${featuredProduct.title} view ${index + 1}`}
                        className="h-full w-full object-contain p-3"
                        height={240}
                        quality={75}
                        src={image}
                        width={240}
                      />
                    ) : (
                      <span style={{ ...serif, color: d9.rule }}>{index + 1}</span>
                    )}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Buy box */}
          <div>
            <Eyebrow>Flagship · {featuredProduct.category.name}</Eyebrow>
            <h1
              className="mt-6 text-[2.4rem] font-semibold leading-[1.08] tracking-[-0.015em] sm:text-[3rem]"
              style={{ ...serif, color: d9.ink }}
            >
              {featuredProduct.title}
            </h1>

            <div
              className="mt-7 flex items-end gap-4 pb-7"
              style={{ borderBottom: `1px solid ${d9.rule}` }}
            >
              <span className="text-4xl" style={{ ...serif, color: d9.ink }}>
                {formatUsd(selected?.price ?? featuredProduct.price)}
              </span>
              <span
                className="pb-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.2em]"
                style={{ color: d9.bronze }}
              >
                Atelier pricing
              </span>
            </div>

            <p
              className="mt-6 text-[0.96rem] leading-relaxed"
              style={{ color: d9.graphite }}
            >
              {featuredProduct.description}
            </p>

            {/* Variant selection */}
            {featuredProduct.variants.length > 1 ? (
              <div className="mt-8">
                <p
                  className="text-[0.62rem] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: d9.haze }}
                >
                  Select edition — {selected?.sku}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {featuredProduct.variants.map((option, index) => {
                    const active = variantIndex === index;
                    return (
                      <button
                        key={option.id}
                        className="px-5 py-4 text-left transition-colors"
                        onClick={() => {
                          setVariantIndex(index);
                          setActiveImage(0);
                          setAdded(false);
                        }}
                        style={{
                          background: active ? d9.ink : d9.card,
                          border: `1px solid ${active ? d9.ink : d9.rule}`,
                          color: active ? d9.bone : d9.ink
                        }}
                        type="button"
                      >
                        <span className="block text-sm" style={serif}>
                          {variantLabel(option)}
                        </span>
                        <span
                          className="mt-0.5 block text-[0.74rem]"
                          style={{ color: active ? "rgba(243,237,225,0.66)" : d9.haze }}
                        >
                          {formatUsd(option.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Quantity + add */}
            <div className="mt-8 flex flex-wrap gap-4">
              <div
                className="flex items-center"
                style={{ border: `1px solid ${d9.ink}` }}
              >
                <button
                  aria-label="Decrease quantity"
                  className="grid h-14 w-14 place-items-center transition-colors"
                  onClick={() => setQty((value) => Math.max(1, value - 1))}
                  style={{ color: d9.ink }}
                  type="button"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span
                  className="grid h-14 w-14 place-items-center text-lg"
                  style={{ ...serif, borderLeft: `1px solid ${d9.ink}`, borderRight: `1px solid ${d9.ink}` }}
                >
                  {qty}
                </span>
                <button
                  aria-label="Increase quantity"
                  className="grid h-14 w-14 place-items-center transition-colors"
                  onClick={() => setQty((value) => value + 1)}
                  style={{ color: d9.ink }}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                className="flex flex-1 items-center justify-center gap-2.5 px-8 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.2em] transition-colors"
                onClick={handleAddToCart}
                style={{ background: d9.ink, color: d9.bone }}
                type="button"
              >
                Add to cart — {formatUsd((selected?.price ?? 0) * qty)}
              </button>
            </div>

            {added ? (
              <Link
                className="mt-4 flex items-center justify-center gap-2 px-5 py-3.5 text-[0.66rem] font-semibold uppercase tracking-[0.18em] transition-colors"
                href="/design-lab/d9/cart"
                style={{ border: `1px solid ${d9.bronze}`, color: d9.bronze }}
              >
                Added to your cart — review <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}

            <div
              className="mt-7 grid gap-px"
              style={{ background: d9.rule, border: `1px solid ${d9.rule}` }}
            >
              {[
                {
                  head: "Atelier stock",
                  body: `${selected?.inventoryQuantity ?? 0} pieces held at the showroom`
                },
                { head: "Delivery", body: "White-glove, concierge-scheduled" },
                { head: "Assurance", body: "Five-year carriage warranty included" }
              ].map((row) => (
                <div key={row.head} className="px-6 py-4" style={{ background: d9.card }}>
                  <p
                    className="text-[0.58rem] font-semibold uppercase tracking-[0.22em]"
                    style={{ color: d9.bronze }}
                  >
                    {row.head}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: d9.ink }}>
                    {row.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Specifications + details ---- */}
      <section
        className="py-20"
        style={{ background: d9.linen, borderTop: `1px solid ${d9.rule}`, borderBottom: `1px solid ${d9.rule}` }}
      >
        <div className="mx-auto grid max-w-[1240px] gap-12 px-6 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow>The detail</Eyebrow>
            <Display className="mt-4 text-[2rem] sm:text-[2.4rem]">
              Documented to
              <br />
              the last fixing.
            </Display>
            <p
              className="mt-5 max-w-sm text-sm leading-relaxed"
              style={{ color: d9.graphite }}
            >
              Every flagship object ships with full hardware, an install
              template, and mill data on request. Considered design,
              specified for the long term.
            </p>
            {featuredProduct.details.length ? (
              <ul className="mt-7 space-y-3">
                {featuredProduct.details.map((detail) => (
                  <li
                    key={detail}
                    className="flex gap-3 text-sm leading-relaxed"
                    style={{ color: d9.graphite }}
                  >
                    <span style={{ color: d9.bronze }}>—</span>
                    {detail}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <dl
            className="grid gap-px self-start sm:grid-cols-2"
            style={{ background: d9.rule, border: `1px solid ${d9.rule}` }}
          >
            {SPECS.map(([label, value]) => (
              <div key={label} className="px-6 py-5" style={{ background: d9.card }}>
                <dt
                  className="text-[0.58rem] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: d9.haze }}
                >
                  {label}
                </dt>
                <dd
                  className="mt-1.5 break-words text-sm"
                  style={{ ...serif, color: d9.ink }}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---- Related — pairs from the collection ---- */}
      {RELATED.length ? (
        <section className="mx-auto max-w-[1240px] px-6 py-20 sm:px-8">
          <Eyebrow>From the same collection</Eyebrow>
          <Display className="mt-4 text-[2rem] sm:text-[2.6rem]">
            Considered companions
          </Display>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {RELATED.map((product, index) => (
              <GalleryCard
                key={product.id}
                href="/design-lab/d9/product"
                image={product.images[0]?.url ?? product.variants[0]?.image}
                index={index}
                price={product.price}
                sku={product.variants[0]?.sku ?? product.id}
                title={product.title}
              />
            ))}
          </div>
        </section>
      ) : null}
    </D9Page>
  );
}
