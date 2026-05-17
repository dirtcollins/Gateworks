"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Minus,
  Plus,
  Ruler,
  ShieldCheck,
  Truck
} from "lucide-react";
import {
  featuredProduct,
  getRelatedProducts
} from "@/features/design-lab/live-data";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/utils";
import { D3Shell, Eyebrow, MaterialBlock, d3, serif } from "./shared";

/** DESIGN 3 — "Editorial Catalog" — Product detail. Real catalog product. */

const product = featuredProduct;
const relatedTones = ["steel", "ink", "brass", "rust"] as const;
const relatedProducts = getRelatedProducts(product, 3);

// Gallery sources — real product images, falling back to variant images.
const galleryImages = Array.from(
  new Set([
    ...product.images.map((image) => image.url),
    ...product.variants.map((variant) => variant.image)
  ])
).filter(Boolean);

const specEntries = Object.entries(product.specifications);

export function D3Product() {
  const addItem = useCartStore((state) => state.addItem);

  const [activeImage, setActiveImage] = useState(
    product.variants[0]?.image || galleryImages[0]
  );
  const [variant, setVariant] = useState(product.variants[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const total = useMemo(
    () => formatCurrency((variant?.price ?? product.price) * qty),
    [variant, qty]
  );

  function addToCart() {
    if (!variant) return;
    addItem({
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      sku: variant.sku,
      image: variant.image || product.images[0]?.url || "",
      price: variant.price,
      pricingMethod: variant.pricing_method,
      quantity: qty,
      options: variant.options
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <D3Shell active="Product">
      {/* breadcrumb */}
      <div className="mx-auto max-w-[1280px] px-5 pt-8 sm:px-8">
        <nav
          className="flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em]"
          style={{ color: d3.haze }}
        >
          <Link href="/design-lab/d3/home">Catalog</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/design-lab/d3/category">{product.category.name}</Link>
          <ChevronRight className="h-3 w-3" />
          <span style={{ color: d3.ink }}>{product.title}</span>
        </nav>
      </div>

      {/* HERO — gallery + buy column */}
      <section className="mx-auto max-w-[1280px] px-5 pt-6 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          {/* gallery */}
          <div>
            <div
              className="relative aspect-[5/4] w-full overflow-hidden"
              style={{ background: d3.card }}
            >
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={product.title}
                  fill
                  priority
                  quality={75}
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-contain p-8"
                />
              ) : (
                <MaterialBlock tone="steel" className="h-full w-full" />
              )}
            </div>
            {galleryImages.length > 1 ? (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {galleryImages.slice(0, 4).map((image, i) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImage(image)}
                    className="block"
                    aria-label={`View image ${i + 1}`}
                  >
                    <div
                      className="relative aspect-square w-full overflow-hidden"
                      style={{ background: d3.card }}
                    >
                      <Image
                        src={image}
                        alt={`${product.title} view ${i + 1}`}
                        fill
                        quality={60}
                        sizes="160px"
                        className="object-contain p-2"
                      />
                    </div>
                    <span
                      className="mt-1.5 block text-[0.64rem] uppercase tracking-[0.16em]"
                      style={{
                        color: image === activeImage ? d3.ink : d3.haze,
                        borderTop: `2px solid ${
                          image === activeImage ? d3.brass : "transparent"
                        }`,
                        paddingTop: 4
                      }}
                    >
                      Plate {i + 1}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* buy column */}
          <div className="lg:pt-2">
            <Eyebrow>{product.category.name}</Eyebrow>
            <h1
              className={`${serif} mt-3 text-[2.3rem] font-semibold leading-[1.08] tracking-[-0.01em] sm:text-[2.9rem]`}
            >
              {product.title}
            </h1>
            <p
              className="mt-4 max-w-md text-[0.95rem] leading-relaxed"
              style={{ color: d3.graphite }}
            >
              {product.description}
            </p>

            <div
              className="mt-6 flex items-baseline gap-3 border-t pt-6"
              style={{ borderColor: d3.rule }}
            >
              <span className={`${serif} text-4xl font-semibold`}>
                {formatCurrency(variant?.price ?? product.price)}
              </span>
              <span
                className="text-[0.74rem] uppercase tracking-[0.16em]"
                style={{ color: d3.haze }}
              >
                per length · trade tier B
              </span>
            </div>

            {/* variant selector */}
            {product.variants.length > 1 ? (
              <div className="mt-7">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em]" style={{ color: d3.graphite }}>
                  Variant
                </p>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {product.variants.map((v) => {
                    const sel = v.id === variant?.id;
                    const label =
                      [v.options.length, v.options.finish]
                        .filter((opt) => opt && opt !== "Standard")
                        .join(" · ") || v.sku;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setVariant(v);
                          if (v.image) setActiveImage(v.image);
                        }}
                        className="rounded-full border px-5 py-2.5 text-[0.78rem] font-semibold transition-colors"
                        style={{
                          borderColor: sel ? d3.ink : d3.rule,
                          background: sel ? d3.ink : "transparent",
                          color: sel ? d3.paper : d3.ink
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <p
              className="mt-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em]"
              style={{ color: d3.haze }}
            >
              SKU {variant?.sku ?? product.id}
            </p>

            {/* quantity + add */}
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <div
                className="flex items-center gap-4 rounded-full border px-3 py-2"
                style={{ borderColor: d3.rule }}
              >
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-8 w-8 place-items-center rounded-full"
                  style={{ background: d3.paper }}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className={`${serif} w-8 text-center text-xl`}>{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="grid h-8 w-8 place-items-center rounded-full"
                  style={{ background: d3.paper }}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={addToCart}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-7 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-white transition-transform hover:-translate-y-0.5"
                style={{ background: added ? d3.brassDeep : d3.ink }}
              >
                {added ? (
                  <>
                    <Check className="h-4 w-4" /> Added to cart
                  </>
                ) : (
                  <>Add to cart — {total}</>
                )}
              </button>
            </div>

            <Link
              href="/design-lab/d3/cart"
              className="mt-4 inline-block text-[0.76rem] font-semibold uppercase tracking-[0.16em] underline underline-offset-[6px]"
              style={{ color: d3.graphite }}
            >
              View cart & checkout
            </Link>

            {/* assurances */}
            <div
              className="mt-7 grid grid-cols-3 gap-3 border-t pt-6"
              style={{ borderColor: d3.rule }}
            >
              {[
                { icon: Truck, t: "Will-call", n: "Ready in 2 hrs" },
                { icon: Ruler, t: "Cut service", n: "± 1/16 in" },
                { icon: ShieldCheck, t: "Mill cert", n: "On request" }
              ].map((a) => (
                <div key={a.t}>
                  <a.icon className="h-5 w-5" style={{ color: d3.brass }} />
                  <p className="mt-2 text-[0.78rem] font-semibold">{a.t}</p>
                  <p className="text-[0.7rem]" style={{ color: d3.haze }}>
                    {a.n}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SPEC SHEET — editorial two-column */}
      <section className="mx-auto max-w-[1280px] px-5 pt-24 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[0.42fr_0.58fr]">
          <div>
            <Eyebrow>The Spec Sheet</Eyebrow>
            <h2 className={`${serif} mt-3 text-3xl font-semibold leading-tight`}>
              Measured, certified, and honest about its gauge.
            </h2>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: d3.graphite }}>
              Every dimension below is verified against the mill test report.
              No nominal rounding, no surprises at the saw.
            </p>
          </div>
          <dl
            className="divide-y border-t"
            style={{ borderColor: d3.rule }}
          >
            {specEntries.map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-6 py-4"
                style={{ borderColor: d3.rule }}
              >
                <dt
                  className="text-[0.74rem] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: d3.haze }}
                >
                  {k}
                </dt>
                <dd className={`${serif} text-right text-lg`}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* RELATED — pairs well with */}
      {relatedProducts.length ? (
        <section className="mx-auto max-w-[1280px] px-5 pt-24 sm:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <Eyebrow>Composed With</Eyebrow>
              <h2 className={`${serif} mt-3 text-3xl font-semibold`}>
                Pairs well on the same order
              </h2>
            </div>
            <Link
              href="/design-lab/d3/category"
              className="hidden shrink-0 text-[0.78rem] font-semibold uppercase tracking-[0.16em] underline underline-offset-[6px] sm:inline"
            >
              Full department
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {relatedProducts.map((r, i) => {
              const image = r.images[0]?.url;
              return (
                <Link key={r.id} href="/design-lab/d3/product" className="group block">
                  <div
                    className="relative aspect-[4/3] w-full overflow-hidden"
                    style={{ background: d3.card }}
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt={r.title}
                        fill
                        quality={75}
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <MaterialBlock
                        tone={relatedTones[i % relatedTones.length]}
                        className="h-full w-full"
                      />
                    )}
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <h3 className={`${serif} text-lg font-semibold`}>{r.title}</h3>
                    <ArrowUpRight
                      className="mt-1 h-4 w-4 shrink-0"
                      style={{ color: d3.brass }}
                    />
                  </div>
                  <p className="mt-1 text-sm font-semibold">
                    {formatCurrency(r.price)}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </D3Shell>
  );
}
