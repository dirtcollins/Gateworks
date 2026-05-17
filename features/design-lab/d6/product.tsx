"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  Zap
} from "lucide-react";
import {
  ApexButton,
  D6DesignBadge,
  D6Page,
  Eyebrow,
  Mono,
  Panel,
  ProductStage,
  apex,
  formatUsd
} from "./kit";
import {
  featuredProduct,
  getRelatedProducts
} from "@/features/design-lab/live-data";
import { useCartStore } from "@/lib/cart-store";
import type { ProductVariant } from "@/lib/types";

/* Live catalog product — the real "Adjust-O-Matic Latch". */
function variantLabel(variant: ProductVariant): string {
  const parts = [variant.options.length, variant.options.finish].filter(
    (part) => part && part !== "Standard"
  );
  return parts.length ? parts.join(" · ") : variant.sku;
}

const SPECS = Object.entries(featuredProduct.specifications);
const VARIANTS = featuredProduct.variants;
const GALLERY = (
  featuredProduct.images.length
    ? featuredProduct.images.map((image) => image.url)
    : VARIANTS.map((variant) => variant.image)
).filter(Boolean);

const RELATED = getRelatedProducts(featuredProduct, 4).map((product) => ({
  name: product.title,
  sku: product.variants[0]?.sku ?? product.id,
  price: product.price,
  image: product.images[0]?.url
}));

export function D6Product() {
  const addItem = useCartStore((state) => state.addItem);
  const [activeThumb, setActiveThumb] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = VARIANTS[variantIndex];

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
    <D6Page wide>
      <div className="pt-6">
        <D6DesignBadge />
      </div>

      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-2 py-7"
        style={{ color: apex.faint }}
      >
        <Link href="/design-lab/d6/home">
          <Mono style={{ color: apex.faint }}>Home</Mono>
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/design-lab/d6/category">
          <Mono style={{ color: apex.faint }}>
            {featuredProduct.category.name}
          </Mono>
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Mono style={{ color: apex.accent }}>{featuredProduct.title}</Mono>
      </nav>

      <section className="grid gap-10 pb-16 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Panel className="overflow-hidden p-3" glow>
            <ProductStage
              alt={featuredProduct.title}
              className="aspect-square rounded-xl"
              priority
              quality={90}
              size="hero"
              src={GALLERY[activeThumb]}
            />
          </Panel>
          {GALLERY.length > 1 ? (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {GALLERY.slice(0, 4).map((image, index) => {
                const active = activeThumb === index;
                return (
                  <button
                    key={image || index}
                    className="overflow-hidden rounded-xl border p-1 transition-all"
                    onClick={() => setActiveThumb(index)}
                    style={{
                      borderColor: active ? apex.accent : apex.line,
                      boxShadow: active
                        ? `0 0 18px -4px ${apex.accentGlow}`
                        : "none"
                    }}
                    type="button"
                  >
                    <ProductStage
                      alt={`${featuredProduct.title} view ${index + 1}`}
                      className="aspect-square rounded-lg"
                      quality={60}
                      size="thumb"
                      src={image}
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Buy box */}
        <div className="flex flex-col">
          <Eyebrow>{featuredProduct.category.name}</Eyebrow>
          <h1
            className="mt-5 text-[2.4rem] font-medium leading-[1.05] tracking-[-0.035em] sm:text-[3rem]"
            style={{ color: apex.text }}
          >
            {featuredProduct.title}
          </h1>
          <p
            className="mt-5 max-w-lg text-[14px] leading-relaxed"
            style={{ color: apex.mute }}
          >
            {featuredProduct.description}
          </p>

          <div
            className="mt-7 flex items-end gap-4 border-y py-6"
            style={{ borderColor: apex.line }}
          >
            <span
              className="text-[2.6rem] font-medium leading-none tracking-[-0.03em]"
              style={{ color: apex.text }}
            >
              {formatUsd(selected?.price ?? featuredProduct.price)}
            </span>
            <span
              className="mb-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1"
              style={{
                background: "rgba(91,157,255,0.1)",
                color: apex.accent
              }}
            >
              <Zap className="h-3 w-3" />
              <Mono style={{ color: apex.accent }}>Trade price</Mono>
            </span>
          </div>

          {/* Variant selector */}
          {VARIANTS.length > 1 ? (
            <div className="mt-7">
              <div className="flex items-center justify-between">
                <Mono style={{ color: apex.faint }}>
                  Configuration · {selected?.sku}
                </Mono>
              </div>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {VARIANTS.map((variant, index) => {
                  const active = index === variantIndex;
                  return (
                    <button
                      key={variant.id}
                      className="rounded-xl border px-4 py-3.5 text-left transition-all"
                      onClick={() => {
                        setVariantIndex(index);
                        setAdded(false);
                      }}
                      style={{
                        borderColor: active ? apex.accent : apex.line,
                        background: active
                          ? "rgba(91,157,255,0.08)"
                          : "rgba(255,255,255,0.02)",
                        boxShadow: active
                          ? `0 0 22px -10px ${apex.accentGlow}`
                          : "none"
                      }}
                      type="button"
                    >
                      <span
                        className="block text-[13px] font-medium"
                        style={{ color: apex.text }}
                      >
                        {variantLabel(variant)}
                      </span>
                      <span
                        className="text-[12px]"
                        style={{
                          color: active ? apex.accent : apex.mute
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

          {/* Qty + add */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div
              className="flex items-center rounded-full border"
              style={{ borderColor: apex.line }}
            >
              <button
                aria-label="Decrease quantity"
                className="grid h-12 w-12 place-items-center rounded-l-full transition-colors hover:bg-white/5"
                onClick={() => setQty((value) => Math.max(1, value - 1))}
                style={{ color: apex.text }}
                type="button"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span
                className="grid h-12 w-12 place-items-center text-base font-medium"
                style={{ color: apex.text }}
              >
                {qty}
              </span>
              <button
                aria-label="Increase quantity"
                className="grid h-12 w-12 place-items-center rounded-r-full transition-colors hover:bg-white/5"
                onClick={() => setQty((value) => value + 1)}
                style={{ color: apex.text }}
                type="button"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <ApexButton className="flex-1" onClick={handleAddToCart}>
              Add to cart — {formatUsd((selected?.price ?? 0) * qty)}
            </ApexButton>
          </div>

          {added ? (
            <Link
              className="mt-3 flex items-center justify-center gap-2 rounded-full border px-5 py-3 transition-colors hover:bg-white/5"
              href="/design-lab/d6/cart"
              style={{
                borderColor: apex.accent,
                background: "rgba(91,157,255,0.07)"
              }}
            >
              <Check className="h-4 w-4" style={{ color: apex.accent }} />
              <Mono style={{ color: apex.accent }}>
                Added — review cart
              </Mono>
              <ArrowRight className="h-3.5 w-3.5" style={{ color: apex.accent }} />
            </Link>
          ) : null}

          <div
            className="mt-7 grid gap-px overflow-hidden rounded-2xl border"
            style={{ borderColor: apex.line, background: apex.line }}
          >
            {[
              {
                icon: Zap,
                text: `In stock — ${selected?.inventoryQuantity ?? 0} units at will-call`
              },
              { icon: Truck, text: "Same-day pickup if ordered by 11:00" },
              { icon: ShieldCheck, text: "5-year carriage warranty included" }
            ].map((row) => (
              <p
                key={row.text}
                className="flex items-center gap-3 px-5 py-3.5 text-[13px]"
                style={{ background: apex.surface, color: apex.text }}
              >
                <row.icon
                  className="h-4 w-4 shrink-0"
                  style={{ color: apex.accent }}
                />
                {row.text}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section
        className="grid gap-10 border-t py-16 lg:grid-cols-[0.85fr_1.15fr]"
        style={{ borderColor: apex.line }}
      >
        <div>
          <Eyebrow>Technical detail</Eyebrow>
          <h2
            className="mt-5 text-[2rem] font-medium leading-[1.1] tracking-[-0.03em]"
            style={{ color: apex.text }}
          >
            Specifications
          </h2>
          <p
            className="mt-4 max-w-sm text-[14px] leading-relaxed"
            style={{ color: apex.mute }}
          >
            Every Apex kit ships counter-ready with full hardware and an
            install template. Mill test reports are available on request for
            commercial projects.
          </p>
        </div>
        <div
          className="grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-2"
          style={{ borderColor: apex.line, background: apex.line }}
        >
          {SPECS.length ? (
            SPECS.map(([label, value]) => (
              <div
                key={label}
                className="px-5 py-4"
                style={{ background: apex.surface }}
              >
                <Mono style={{ color: apex.faint }}>{label}</Mono>
                <p
                  className="mt-1.5 text-[14px] font-medium"
                  style={{ color: apex.text }}
                >
                  {value}
                </p>
              </div>
            ))
          ) : (
            <div
              className="px-5 py-8 text-center text-[13px]"
              style={{ background: apex.surface, color: apex.mute }}
            >
              No specifications listed for this product.
            </div>
          )}
        </div>
      </section>

      {/* Related */}
      {RELATED.length ? (
        <section
          className="border-t py-16"
          style={{ borderColor: apex.line }}
        >
          <div className="flex items-end justify-between">
            <div>
              <Eyebrow>Pairs with</Eyebrow>
              <h2
                className="mt-4 text-[1.8rem] font-medium tracking-[-0.03em]"
                style={{ color: apex.text }}
              >
                Complete the assembly
              </h2>
            </div>
            <Link
              className="flex items-center gap-2 transition-colors hover:opacity-80"
              href="/design-lab/d6/category"
              style={{ color: apex.accent }}
            >
              <Mono style={{ color: apex.accent }}>More hardware</Mono>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {RELATED.map((item) => (
              <Link key={item.sku} href="/design-lab/d6/product">
                <Panel
                  className="group h-full overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
                  style={{ borderColor: "rgba(255,255,255,0.14)" }}
                >
                  <div className="p-2.5">
                    <ProductStage
                      alt={item.name}
                      className="h-44 rounded-xl"
                      imgClassName="transition-transform duration-500 group-hover:scale-[1.07]"
                      size="card"
                      src={item.image}
                    />
                  </div>
                  <div
                    className="border-t p-4"
                    style={{ borderColor: apex.line }}
                  >
                    <Mono style={{ color: apex.mute }}>{item.sku}</Mono>
                    <p
                      className="mt-1.5 text-[14px] font-semibold leading-snug"
                      style={{ color: apex.text }}
                    >
                      {item.name}
                    </p>
                    <span
                      className="mt-3 block text-[16px] font-semibold tracking-[-0.02em]"
                      style={{ color: apex.text }}
                    >
                      {formatUsd(item.price)}
                    </span>
                  </div>
                </Panel>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </D6Page>
  );
}
