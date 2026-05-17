"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Truck
} from "lucide-react";
import { Beacon, Button, Chip, FO, Panel, Shell, Stamp } from "./kit";
import {
  featuredProduct,
  getRelatedProducts,
  money,
  primaryVariant,
  variantLabel
} from "./data";
import { useCartStore } from "@/lib/cart-store";

const PRODUCT_HREF = "/design-lab/d5/product";
const CATEGORY_HREF = "/design-lab/d5/category";
const CART_HREF = "/design-lab/d5/cart";

const GALLERY = featuredProduct.images.length
  ? featuredProduct.images.map((image) => image.url)
  : featuredProduct.variants.map((variant) => variant.image);

const RELATED = getRelatedProducts(featuredProduct, 4);
const SPECS = Object.entries(featuredProduct.specifications);

export default function D5Product() {
  const addItem = useCartStore((state) => state.addItem);

  const variants = featuredProduct.variants;
  const [variantIndex, setVariantIndex] = useState(0);
  const [thumb, setThumb] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = variants[variantIndex] ?? primaryVariant(featuredProduct);
  const galleryImage = GALLERY[thumb] ?? selected?.image;

  function handleAdd() {
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
    <Shell crumb="Gear / spec sheet" wide>
      {/* Breadcrumb */}
      <nav
        className="flex flex-wrap items-center gap-1.5 pb-5 text-[10px] font-black uppercase tracking-[0.14em]"
        style={{ color: FO.faint }}
      >
        <Link href="/design-lab/d5/home" style={{ color: FO.dim }}>
          Base
        </Link>
        <ChevronRight size={12} />
        <Link href={CATEGORY_HREF} style={{ color: FO.dim }}>
          {featuredProduct.category.name}
        </Link>
        <ChevronRight size={12} />
        <span style={{ color: FO.hi }}>{featuredProduct.title}</span>
      </nav>

      <div className="grid gap-px lg:grid-cols-[1.05fr_1fr]" style={{ background: FO.line }}>
        {/* Gallery */}
        <div className="flex flex-col gap-px" style={{ background: FO.line }}>
          <div
            className="flex aspect-[4/3] items-center justify-center"
            style={{ background: "#f4f1e9" }}
          >
            {galleryImage ? (
              <Image
                alt={featuredProduct.title}
                src={galleryImage}
                width={920}
                height={920}
                priority
                quality={75}
                className="h-full w-full object-contain p-8"
              />
            ) : (
              <span className="text-8xl font-black" style={{ color: "rgba(22,20,15,0.1)" }}>
                GW
              </span>
            )}
          </div>
          {GALLERY.length > 1 ? (
            <div className="grid grid-cols-4 gap-px" style={{ background: FO.line }}>
              {GALLERY.slice(0, 4).map((image, index) => (
                <button
                  key={image || index}
                  type="button"
                  onClick={() => setThumb(index)}
                  className="flex aspect-square items-center justify-center"
                  style={{
                    background: "#f4f1e9",
                    outline:
                      thumb === index ? `3px solid ${FO.hi}` : "3px solid transparent",
                    outlineOffset: "-3px"
                  }}
                >
                  {image ? (
                    <Image
                      alt={`${featuredProduct.title} view ${index + 1}`}
                      src={image}
                      width={200}
                      height={200}
                      quality={75}
                      className="h-full w-full object-contain p-2.5"
                    />
                  ) : (
                    <span className="text-xl font-black" style={{ color: "rgba(22,20,15,0.16)" }}>
                      {index + 1}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Buy box */}
        <div className="flex flex-col gap-5 p-6 sm:p-7" style={{ background: FO.panel }}>
          <div className="flex items-center justify-between">
            <Stamp>{featuredProduct.category.name}</Stamp>
            <span
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em]"
              style={{ color: selected?.inventory === "in_stock" ? FO.go : FO.stop }}
            >
              <Beacon tone={selected?.inventory === "in_stock" ? "go" : "stop"} />
              {selected?.inventory === "in_stock" ? "In stock" : "Backordered"}
            </span>
          </div>

          <h1
            className="text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-4xl"
            style={{ color: FO.ink }}
          >
            {featuredProduct.title}
          </h1>

          <div
            className="flex items-end gap-3 py-3"
            style={{ borderTop: `2px solid ${FO.line}`, borderBottom: `2px solid ${FO.line}` }}
          >
            <span className="text-4xl font-black" style={{ color: FO.hi }}>
              {money(selected?.price ?? featuredProduct.price)}
            </span>
            <Chip tone="hi">Trade price</Chip>
            <span
              className="ml-auto text-[10px] font-black uppercase tracking-[0.12em]"
              style={{ color: FO.faint }}
            >
              SKU {selected?.sku}
            </span>
          </div>

          <p className="text-sm font-semibold leading-relaxed" style={{ color: FO.dim }}>
            {featuredProduct.description}
          </p>

          {/* Variant select */}
          {variants.length > 1 ? (
            <div>
              <p
                className="mb-2 text-[11px] font-black uppercase tracking-[0.16em]"
                style={{ color: FO.ink }}
              >
                Configuration
              </p>
              <div className="grid grid-cols-2 gap-px" style={{ background: FO.line }}>
                {variants.map((variant, index) => {
                  const active = index === variantIndex;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setVariantIndex(index);
                        setAdded(false);
                      }}
                      className="flex flex-col gap-0.5 p-3 text-left"
                      style={{
                        background: active ? FO.hi : FO.panelHi,
                        color: active ? FO.black : FO.ink
                      }}
                    >
                      <span className="text-[12px] font-black uppercase leading-tight">
                        {variantLabel(variant)}
                      </span>
                      <span
                        className="text-[11px] font-black"
                        style={{ color: active ? FO.black : FO.hi }}
                      >
                        {money(variant.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Qty */}
          <div>
            <p
              className="mb-2 text-[11px] font-black uppercase tracking-[0.16em]"
              style={{ color: FO.ink }}
            >
              Quantity
            </p>
            <div className="flex items-stretch" style={{ border: `2px solid ${FO.line}` }}>
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((value) => Math.max(1, value - 1))}
                className="grid w-14 place-items-center"
                style={{ background: FO.panelHi, color: FO.ink, height: "3.25rem" }}
              >
                <Minus size={18} strokeWidth={3} />
              </button>
              <span
                className="grid flex-1 place-items-center text-xl font-black"
                style={{ color: FO.ink, borderLeft: `2px solid ${FO.line}`, borderRight: `2px solid ${FO.line}` }}
              >
                {qty}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((value) => value + 1)}
                className="grid w-14 place-items-center"
                style={{ background: FO.panelHi, color: FO.ink, height: "3.25rem" }}
              >
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Add to cart */}
          <Button full size="lg" variant="primary" onClick={handleAdd}>
            Add to cart — {money((selected?.price ?? 0) * qty)}
          </Button>

          {added ? (
            <Link
              href={CART_HREF}
              className="flex items-center justify-center gap-2 px-4 py-3 text-[12px] font-black uppercase tracking-[0.12em]"
              style={{ background: FO.goSoft, color: FO.go }}
            >
              <Check size={15} strokeWidth={3} /> Added — view cart
              <ArrowRight size={14} strokeWidth={2.75} />
            </Link>
          ) : null}

          {/* Logistics */}
          <div className="grid gap-px" style={{ background: FO.line }}>
            {[
              {
                icon: Package,
                text: `${selected?.inventoryQuantity ?? 0} units staged at will-call`
              },
              { icon: Truck, text: "Same-day pickup if ordered before 11am" },
              { icon: ShieldCheck, text: "Contractor-grade — backed by full warranty" }
            ].map((row) => (
              <p
                key={row.text}
                className="flex items-center gap-2.5 p-3 text-[12px] font-bold"
                style={{ background: FO.panelHi, color: FO.ink }}
              >
                <row.icon size={16} strokeWidth={2.5} style={{ color: FO.hi }} />
                {row.text}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Specs */}
      <section className="mt-8">
        <Panel title="Spec sheet" kicker="// technical detail">
          <dl className="grid gap-px sm:grid-cols-2 lg:grid-cols-3" style={{ background: FO.line }}>
            {SPECS.map(([label, value]) => (
              <div key={label} className="p-4" style={{ background: FO.panel }}>
                <dt
                  className="text-[10px] font-black uppercase tracking-[0.16em]"
                  style={{ color: FO.faint }}
                >
                  {label}
                </dt>
                <dd
                  className="mt-1 break-words text-[13px] font-black"
                  style={{ color: FO.ink }}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      </section>

      {/* Details */}
      {featuredProduct.details.length ? (
        <section className="mt-6">
          <Panel title="Field notes" kicker="// what to know">
            <ul className="grid gap-px sm:grid-cols-2" style={{ background: FO.line }}>
              {featuredProduct.details.map((detail) => (
                <li
                  key={detail}
                  className="flex items-start gap-2.5 p-4 text-[13px] font-semibold"
                  style={{ background: FO.panel, color: FO.dim }}
                >
                  <span
                    className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center"
                    style={{ background: FO.hiSoft, color: FO.hi }}
                  >
                    <Check size={12} strokeWidth={3.5} />
                  </span>
                  {detail}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      ) : null}

      {/* Related */}
      {RELATED.length ? (
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <Stamp>Pairs with</Stamp>
              <h2
                className="mt-2 text-2xl font-black uppercase tracking-tight"
                style={{ color: FO.ink }}
              >
                Round out the kit
              </h2>
            </div>
            <Link
              href={CATEGORY_HREF}
              className="hidden items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.12em] sm:flex"
              style={{ color: FO.hi }}
            >
              More gear <ArrowRight size={14} strokeWidth={2.75} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {RELATED.map((product) => {
              const variant = primaryVariant(product);
              const image = product.images[0]?.url ?? variant?.image;
              return (
                <Link
                  key={product.id}
                  href={PRODUCT_HREF}
                  className="flex flex-col"
                  style={{ background: FO.panel, border: `2px solid ${FO.line}` }}
                >
                  <div
                    className="flex aspect-square items-center justify-center"
                    style={{ background: "#f4f1e9" }}
                  >
                    {image ? (
                      <Image
                        alt={product.title}
                        src={image}
                        width={300}
                        height={300}
                        quality={75}
                        className="h-full w-full object-contain p-4"
                      />
                    ) : (
                      <span className="text-4xl font-black" style={{ color: "rgba(22,20,15,0.12)" }}>
                        GW
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3.5">
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.14em]"
                      style={{ color: FO.faint }}
                    >
                      {variant?.sku ?? product.id}
                    </span>
                    <span
                      className="line-clamp-2 flex-1 text-[12px] font-black uppercase leading-tight"
                      style={{ color: FO.ink }}
                    >
                      {product.title}
                    </span>
                    <span className="mt-1.5 text-lg font-black" style={{ color: FO.hi }}>
                      {money(product.price)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </Shell>
  );
}
