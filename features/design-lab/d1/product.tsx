"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Heart,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Star,
  Truck
} from "lucide-react";
import { D1DesignBadge, D1Page, Eyebrow, formatUsd } from "./kit";
import { featuredProduct, getRelatedProducts } from "@/features/design-lab/live-data";
import { useCartStore } from "@/lib/cart-store";
import type { ProductVariant } from "@/lib/types";

/* Live catalog product — the real "Adjust-O-Matic Latch". */
const RELATED_TONES = ["#6c685c", "#2f6f4e", "#16150f", "#d6a93f"];

function variantLabel(variant: ProductVariant): string {
  const parts = [variant.options.length, variant.options.finish].filter(
    (part) => part && part !== "Standard"
  );
  return parts.length ? parts.join(" · ") : variant.sku;
}

const PRODUCT = {
  name: featuredProduct.title,
  category: featuredProduct.category.name,
  listPrice: featuredProduct.price * 1.18,
  rating: 4.8,
  reviews: 64,
  blurb: featuredProduct.description,
  specs: Object.entries(featuredProduct.specifications),
  variants: featuredProduct.variants
};

const GALLERY = featuredProduct.images.length
  ? featuredProduct.images.map((image) => image.url)
  : featuredProduct.variants.map((variant) => variant.image);

const RELATED = getRelatedProducts(featuredProduct, 4).map((product, index) => ({
  name: product.title,
  sku: product.variants[0]?.sku ?? product.id,
  price: product.price,
  tone: RELATED_TONES[index] ?? "#16150f",
  image: product.images[0]?.url
}));

export function D1Product() {
  const addItem = useCartStore((state) => state.addItem);
  const [activeThumb, setActiveThumb] = useState(0);
  const [variant, setVariant] = useState(
    PRODUCT.variants.length > 2 ? 2 : 0
  );
  const [qty, setQty] = useState(1);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);

  const selected = PRODUCT.variants[variant];

  function handleAddToCart() {
    if (!selected) return;
    addItem({
      productId: featuredProduct.id,
      variantId: selected.id,
      title: PRODUCT.name,
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
    <D1Page>
      <div className="pt-5">
        <D1DesignBadge />
      </div>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 py-5 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
        <Link className="hover:text-d1-ink" href="/design-lab/d1/home">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link className="hover:text-d1-ink" href="/design-lab/d1/category">
          {PRODUCT.category}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-d1-ink">{PRODUCT.name}</span>
      </nav>

      <section className="grid gap-10 border-t border-d1-line py-8 lg:grid-cols-12">
        {/* Gallery */}
        <div className="lg:col-span-7">
          <div className="flex aspect-[4/3] items-center justify-center border-2 border-d1-ink bg-white">
            {GALLERY[activeThumb] ? (
              <Image
                alt={PRODUCT.name}
                className="h-full w-full object-contain p-8"
                height={900}
                priority
                quality={75}
                src={GALLERY[activeThumb]}
                width={900}
              />
            ) : (
              <span
                className="text-8xl font-black"
                style={{ color: "rgba(22,21,15,0.12)" }}
              >
                GW
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {GALLERY.slice(0, 4).map((image, index) => (
              <button
                key={image || index}
                className={`flex aspect-square items-center justify-center border-2 bg-white transition ${
                  activeThumb === index
                    ? "border-d1-pine"
                    : "border-d1-line hover:border-d1-ink"
                }`}
                onClick={() => setActiveThumb(index)}
                type="button"
              >
                {image ? (
                  <Image
                    alt={`${PRODUCT.name} thumbnail ${index + 1}`}
                    className="h-full w-full object-contain p-2"
                    height={200}
                    quality={75}
                    src={image}
                    width={200}
                  />
                ) : (
                  <span className="text-xl font-black text-d1-line">
                    {index + 1}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Buy box */}
        <div className="lg:col-span-5">
          <Eyebrow>{PRODUCT.category}</Eyebrow>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-d1-ink">
            {PRODUCT.name}
          </h1>
          <div className="mt-3 flex items-center gap-4">
            <span className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`h-4 w-4 ${
                    index < Math.round(PRODUCT.rating)
                      ? "fill-d1-amber text-d1-amber"
                      : "text-d1-line"
                  }`}
                />
              ))}
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-d1-steel">
              {PRODUCT.rating} &middot; {PRODUCT.reviews} reviews
            </span>
          </div>

          <div className="mt-5 flex items-end gap-3 border-y border-d1-line py-4">
            <span className="text-4xl font-extrabold text-d1-ink">
              {formatUsd(selected?.price ?? 0)}
            </span>
            <span className="pb-1 text-base font-semibold text-d1-steel line-through">
              {formatUsd(PRODUCT.listPrice)}
            </span>
            <span className="mb-1 ml-auto bg-d1-pine px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white">
              Trade price
            </span>
          </div>

          <p className="mt-4 text-[14px] leading-relaxed text-d1-steel">
            {PRODUCT.blurb}
          </p>

          {/* Variant select */}
          {PRODUCT.variants.length > 1 ? (
            <div className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-d1-ink">
                Option &mdash; {selected?.sku}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-px border border-d1-line bg-d1-line">
                {PRODUCT.variants.map((option, index) => (
                  <button
                    key={option.id}
                    className={`px-3 py-3 text-left transition ${
                      variant === index
                        ? "bg-d1-ink text-d1-paper"
                        : "bg-d1-card text-d1-ink hover:bg-white"
                    }`}
                    onClick={() => {
                      setVariant(index);
                      setAdded(false);
                    }}
                    type="button"
                  >
                    <span className="block text-sm font-bold">
                      {variantLabel(option)}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        variant === index ? "text-d1-paper/70" : "text-d1-steel"
                      }`}
                    >
                      {formatUsd(option.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Qty + add */}
          <div className="mt-6 flex gap-3">
            <div className="flex items-center border border-d1-ink">
              <button
                aria-label="Decrease quantity"
                className="grid h-12 w-12 place-items-center text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                onClick={() => setQty((value) => Math.max(1, value - 1))}
                type="button"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="grid h-12 w-14 place-items-center border-x border-d1-ink text-base font-extrabold">
                {qty}
              </span>
              <button
                aria-label="Increase quantity"
                className="grid h-12 w-12 place-items-center text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                onClick={() => setQty((value) => value + 1)}
                type="button"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              className="flex flex-1 items-center justify-center gap-2 bg-d1-ink px-5 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
              onClick={handleAddToCart}
              type="button"
            >
              Add to cart &mdash; {formatUsd((selected?.price ?? 0) * qty)}
            </button>
            <button
              aria-label="Save item"
              className={`grid h-12 w-12 place-items-center border transition ${
                saved
                  ? "border-d1-red bg-d1-red text-white"
                  : "border-d1-ink text-d1-ink hover:bg-d1-ink hover:text-d1-paper"
              }`}
              onClick={() => setSaved((value) => !value)}
              type="button"
            >
              <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
            </button>
          </div>

          {added ? (
            <Link
              className="mt-3 flex items-center justify-center gap-2 border border-d1-pine bg-d1-pine/10 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-pine transition hover:bg-d1-pine hover:text-white"
              href="/design-lab/d1/cart"
            >
              Added to cart &mdash; view cart <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}

          <div className="mt-5 grid gap-px border border-d1-line bg-d1-line text-[13px]">
            {[
              {
                icon: Package,
                text: `In stock — ${selected?.inventoryQuantity ?? 0} units at Will-Call`
              },
              { icon: Truck, text: "Same-day pickup if ordered by 11am" },
              { icon: ShieldCheck, text: "5-year carriage warranty included" }
            ].map((row) => (
              <p
                key={row.text}
                className="flex items-center gap-2.5 bg-d1-card px-4 py-2.5 font-semibold text-d1-ink"
              >
                <row.icon className="h-4 w-4 shrink-0 text-d1-pine" />
                {row.text}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Specs */}
      <section className="grid gap-10 border-t border-d1-line py-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow>Technical detail</Eyebrow>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-d1-ink">
            Specifications
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-d1-steel">
            Every Gateworks kit ships counter-ready with full hardware and
            an install template. Mill test reports available on request for
            commercial projects.
          </p>
          <p className="mt-5 flex items-center gap-2 text-sm font-bold text-d1-pine">
            <BadgeCheck className="h-4 w-4" /> Verified contractor-grade
          </p>
        </div>
        <div className="lg:col-span-7">
          <dl className="grid gap-px border border-d1-line bg-d1-line sm:grid-cols-2">
            {PRODUCT.specs.map(([label, value]) => (
              <div key={label} className="bg-d1-card px-4 py-3.5">
                <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                  {label}
                </dt>
                <dd className="mt-0.5 text-sm font-bold text-d1-ink">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Related */}
      <section className="border-t border-d1-line py-12">
        <div className="flex items-end justify-between border-b-2 border-d1-ink pb-3">
          <h2 className="text-2xl font-extrabold tracking-tight text-d1-ink">
            Pairs well with
          </h2>
          <Link
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-d1-pine hover:underline"
            href="/design-lab/d1/category"
          >
            More hardware <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-6 grid gap-px border border-d1-line bg-d1-line sm:grid-cols-2 lg:grid-cols-4">
          {RELATED.map((item) => (
            <Link
              key={item.sku}
              className="group flex flex-col bg-d1-card transition hover:bg-white"
              href="/design-lab/d1/product"
            >
              <div
                className="flex h-36 items-center justify-center"
                style={{ backgroundColor: item.image ? "#ffffff" : item.tone }}
              >
                {item.image ? (
                  <Image
                    alt={item.name}
                    className="h-full w-full object-contain p-3"
                    height={260}
                    quality={75}
                    src={item.image}
                    width={260}
                  />
                ) : (
                  <span
                    className="text-4xl font-black"
                    style={{ color: "rgba(246,243,236,0.16)" }}
                  >
                    GW
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                  {item.sku}
                </p>
                <p className="mt-1 flex-1 text-sm font-bold leading-snug text-d1-ink">
                  {item.name}
                </p>
                <span className="mt-3 text-lg font-extrabold text-d1-ink">
                  {formatUsd(item.price)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </D1Page>
  );
}
