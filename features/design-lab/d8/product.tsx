"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Minus,
  Package,
  Plus,
  ShoppingCart
} from "lucide-react";
import {
  featuredProduct,
  getRelatedProducts
} from "@/features/design-lab/live-data";
import { useCartStore } from "@/lib/cart-store";
import {
  BlueprintCard,
  D8Shell,
  Dimension,
  DraftingMark,
  ink,
  mono,
  usd
} from "./kit";

const product = featuredProduct;
const related = getRelatedProducts(product, 4);

export function D8Product() {
  const addItem = useCartStore((state) => state.addItem);

  const galleryImages = useMemo(() => {
    const urls = Array.from(
      new Set([
        ...product.images.map((image) => image.url),
        ...product.variants.map((variant) => variant.image)
      ])
    ).filter((url): url is string => Boolean(url));
    return urls.length ? urls : ["/assets/logo.svg"];
  }, []);

  const [active, setActive] = useState(0);
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedVariant =
    product.variants.find((variant) => variant.id === variantId) ??
    product.variants[0];

  const unit = selectedVariant?.price ?? product.price;
  const lineTotal = unit * qty;
  const stock = selectedVariant?.inventoryQuantity ?? 0;
  const inStock = selectedVariant?.inventory === "in_stock";
  const specs = Object.entries(product.specifications);

  function handleAdd() {
    if (!selectedVariant) return;
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      title: product.title,
      sku: selectedVariant.sku,
      image: selectedVariant.image || galleryImages[0],
      price: selectedVariant.price,
      quantity: qty,
      options: selectedVariant.options
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <D8Shell active="product">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-6xl px-5 pt-6">
        <nav
          className={`${mono} flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em]`}
          style={{ color: ink.chalkFaint }}
        >
          <Link href="/design-lab/d8/home" style={{ color: ink.cyan }}>
            Projects
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/design-lab/d8/category" style={{ color: ink.cyan }}>
            {product.category.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span>Spec sheet</span>
        </nav>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-7 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <BlueprintCard className="overflow-hidden">
            <div
              className="flex items-center justify-between border-b px-4 py-2.5"
              style={{ borderColor: ink.lineSoft }}
            >
              <DraftingMark label="Detail view" />
              <span
                className={`${mono} text-[10px] uppercase tracking-[0.22em]`}
                style={{ color: ink.chalkFaint }}
              >
                Plate {String(active + 1).padStart(2, "0")} /{" "}
                {String(galleryImages.length).padStart(2, "0")}
              </span>
            </div>
            <div
              className="relative aspect-square"
              style={{ backgroundColor: ink.panelSoft }}
            >
              <Image
                alt={product.title}
                src={galleryImages[active] ?? galleryImages[0]}
                fill
                quality={75}
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-contain p-10"
                priority
              />
            </div>
          </BlueprintCard>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {galleryImages.slice(0, 4).map((url, index) => (
              <button
                key={url}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`View plate ${index + 1}`}
                className="relative aspect-square rounded-sm border transition"
                style={{
                  borderColor: active === index ? ink.cyan : ink.lineSoft,
                  backgroundColor: ink.panelSoft
                }}
              >
                <Image
                  alt={`${product.title} plate ${index + 1}`}
                  src={url}
                  fill
                  quality={75}
                  sizes="120px"
                  className="object-contain p-2"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Spec / buy block */}
        <div>
          <DraftingMark label={`Part ${selectedVariant?.sku ?? product.id}`} />
          <h1
            className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl"
            style={{ color: ink.chalk }}
          >
            {product.title}
          </h1>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: ink.chalkDim }}
          >
            Shown in context of a swing-gate build — this is the keystone latch
            in the {product.category.name} component set.
          </p>

          <div
            className="mt-5 flex items-center justify-between rounded-sm border px-4 py-3"
            style={{ borderColor: ink.line, backgroundColor: ink.groundDeep }}
          >
            <div>
              <p
                className={`${mono} text-[10px] uppercase tracking-[0.24em]`}
                style={{ color: ink.chalkFaint }}
              >
                Unit price
              </p>
              <p
                className={`${mono} text-3xl font-semibold`}
                style={{ color: ink.cyan }}
              >
                {usd(unit)}
              </p>
            </div>
            <span
              className={`${mono} inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em]`}
              style={{
                borderColor: ink.lineSoft,
                color: inStock ? ink.cyan : ink.amber
              }}
            >
              <Check className="h-3.5 w-3.5" />
              {inStock ? `${stock} on shelf` : "Backordered"}
            </span>
          </div>

          {/* Variants */}
          {product.variants.length > 1 ? (
            <div className="mt-6">
              <p
                className={`${mono} text-[11px] uppercase tracking-[0.22em]`}
                style={{ color: ink.chalkDim }}
              >
                Specify variant
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const label =
                    [variant.options.length, variant.options.finish]
                      .filter((part) => part && part !== "Standard")
                      .join(" · ") || variant.sku;
                  const isActive = variantId === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setVariantId(variant.id)}
                      className={`${mono} rounded-sm border px-3 py-2 text-[12px] transition`}
                      style={{
                        borderColor: isActive ? ink.cyan : ink.lineSoft,
                        color: isActive ? ink.cyan : ink.chalkDim,
                        backgroundColor: isActive ? ink.panel : "transparent"
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Quantity */}
          <div className="mt-6 flex items-center gap-4">
            <p
              className={`${mono} text-[11px] uppercase tracking-[0.22em]`}
              style={{ color: ink.chalkDim }}
            >
              Qty
            </p>
            <div
              className="flex items-center rounded-sm border"
              style={{ borderColor: ink.line }}
            >
              <button
                type="button"
                aria-label="Decrease"
                onClick={() => setQty((value) => Math.max(1, value - 1))}
                className="grid h-10 w-10 place-items-center"
                style={{ color: ink.chalkDim }}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span
                className={`${mono} w-12 text-center text-sm font-semibold`}
                style={{ color: ink.chalk }}
              >
                {String(qty).padStart(2, "0")}
              </span>
              <button
                type="button"
                aria-label="Increase"
                onClick={() => setQty((value) => value + 1)}
                className="grid h-10 w-10 place-items-center"
                style={{ color: ink.chalkDim }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Dimension value={usd(lineTotal)} hint="line total" />
          </div>

          {/* CTA */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!inStock}
              className={`${mono} flex flex-1 items-center justify-center gap-2 rounded-sm px-5 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em] transition disabled:opacity-50`}
              style={{ backgroundColor: ink.cyan, color: ink.groundDeep }}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Added to BOM
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" /> Add to bill of materials
                </>
              )}
            </button>
            <Link
              href="/design-lab/d8/cart"
              className={`${mono} grid place-items-center rounded-sm border px-5 text-[12px] font-semibold uppercase tracking-[0.18em]`}
              style={{ borderColor: ink.line, color: ink.chalkDim }}
            >
              View BOM
            </Link>
          </div>

          {/* Spec table */}
          <BlueprintCard className="mt-7">
            <div
              className="flex items-center gap-2 border-b px-4 py-2.5"
              style={{ borderColor: ink.lineSoft }}
            >
              <Package className="h-4 w-4" style={{ color: ink.cyan }} />
              <span
                className={`${mono} text-[11px] uppercase tracking-[0.22em]`}
                style={{ color: ink.chalkDim }}
              >
                Specification schedule
              </span>
            </div>
            <dl className="px-4 py-2">
              {specs.map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between gap-4 border-b py-2 last:border-0"
                  style={{ borderColor: ink.lineSoft }}
                >
                  <dt
                    className={`${mono} text-[11px] uppercase tracking-[0.14em]`}
                    style={{ color: ink.chalkFaint }}
                  >
                    {key}
                  </dt>
                  <dd
                    className="max-w-[60%] truncate text-right text-xs font-semibold"
                    style={{ color: ink.chalk }}
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </BlueprintCard>
        </div>
      </div>

      {/* Description / notes */}
      <div className="mx-auto max-w-6xl px-5 pb-4">
        <BlueprintCard>
          <div className="p-5">
            <DraftingMark label="General notes" />
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: ink.chalkDim }}
            >
              {product.description}
            </p>
            {product.details.length ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {product.details.map((detail) => (
                  <li
                    key={detail}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: ink.chalkDim }}
                  >
                    <span
                      className={`${mono} mt-0.5 shrink-0`}
                      style={{ color: ink.cyan }}
                    >
                      ▸
                    </span>
                    {detail}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </BlueprintCard>
      </div>

      {/* Related — also needed for this build */}
      {related.length ? (
        <div className="mx-auto max-w-6xl px-5 py-10">
          <DraftingMark label="Companion parts" />
          <h2
            className="mt-3 text-xl font-semibold tracking-tight"
            style={{ color: ink.chalk }}
          >
            Also needed for this build
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((item) => {
              const variant = item.variants[0];
              return (
                <Link key={item.id} href="/design-lab/d8/product">
                  <BlueprintCard className="group h-full overflow-hidden transition hover:-translate-y-0.5">
                    <div
                      className="relative aspect-square"
                      style={{ backgroundColor: ink.panelSoft }}
                    >
                      <Image
                        alt={item.title}
                        src={
                          item.images[0]?.url ??
                          variant?.image ??
                          "/assets/logo.svg"
                        }
                        fill
                        quality={75}
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="object-contain p-5"
                      />
                    </div>
                    <div
                      className="border-t p-3"
                      style={{ borderColor: ink.lineSoft }}
                    >
                      <p
                        className="line-clamp-2 text-xs font-semibold leading-snug"
                        style={{ color: ink.chalk }}
                      >
                        {item.title}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span
                          className={`${mono} text-sm font-semibold`}
                          style={{ color: ink.cyan }}
                        >
                          {usd(item.price)}
                        </span>
                        <ArrowRight
                          className="h-3.5 w-3.5"
                          style={{ color: ink.chalkFaint }}
                        />
                      </div>
                    </div>
                  </BlueprintCard>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </D8Shell>
  );
}
