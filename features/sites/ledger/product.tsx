"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ClipboardList,
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
  Eyebrow,
  LedgerPage,
  LEDGER,
  Pill,
  formatUsd
} from "./kit";
import { LedgerProductCard } from "./product-card";
import { useCartStore } from "@/lib/cart-store";
import { useQuoteStore } from "@/lib/quote-store";
import type { Product, ProductVariant } from "@/lib/types";

/* Ledger product detail — fully functional. Variant / option selection
 * updates the live price, SKU, and image. Add-to-cart writes the real
 * useCartStore; request-a-quote writes the real useQuoteStore. Volume
 * tiers are a presentation layer over the real unit price. */

const VOLUME_TIERS = [
  { min: 1, label: "1 – 23", discount: 0 },
  { min: 24, label: "24 – 95", discount: 0.06 },
  { min: 96, label: "96 – 239", discount: 0.11 },
  { min: 240, label: "240+", discount: 0.15 }
];

function tierFor(quantity: number) {
  return (
    [...VOLUME_TIERS].reverse().find((tier) => quantity >= tier.min) ??
    VOLUME_TIERS[0]
  );
}

const optionLabels: Array<keyof ProductVariant["options"]> = [
  "length",
  "material",
  "finish",
  "color"
];

export function LedgerProductView({
  product,
  relatedProducts
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const addItem = useCartStore((state) => state.addItem);
  const addQuoteItem = useQuoteStore((state) => state.addItem);
  const activeQuoteId = useQuoteStore((state) => state.activeQuoteId);

  const firstAvailable =
    product.variants.find((variant) => variant.inventory === "in_stock") ??
    product.variants[0];

  const [selectedVariant, setSelectedVariant] = useState(firstAvailable);
  const [activeImage, setActiveImage] = useState(
    firstAvailable?.image ?? product.images[0]?.url ?? ""
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [quoted, setQuoted] = useState(false);

  useEffect(() => {
    void useCartStore.persist.rehydrate();
    void useQuoteStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (selectedVariant?.image) {
      setActiveImage(selectedVariant.image);
    }
  }, [selectedVariant]);

  const gallery = useMemo(() => {
    const urls = Array.from(
      new Set(
        [
          ...product.images.map((image) => image.url),
          ...product.variants.map((variant) => variant.image)
        ].filter((url): url is string => Boolean(url))
      )
    );
    return urls.length ? urls : [""];
  }, [product]);

  // Real option-driven variant selection — mirrors the production
  // product page logic but restyled for Ledger.
  const optionValues = useMemo(() => {
    return optionLabels.reduce<Record<string, string[]>>((values, option) => {
      values[option] = Array.from(
        new Set(
          product.variants
            .map((variant) => variant.options[option])
            .filter((value): value is string => Boolean(value))
        )
      );
      return values;
    }, {});
  }, [product.variants]);

  const configurableOptions = useMemo(
    () => optionLabels.filter((option) => (optionValues[option]?.length ?? 0) > 1),
    [optionValues]
  );

  function selectOption(
    option: keyof ProductVariant["options"],
    value: string
  ) {
    const nextOptions = { ...selectedVariant.options, [option]: value };
    const exact = product.variants.find((variant) =>
      configurableOptions.every(
        (configurable) => variant.options[configurable] === nextOptions[configurable]
      )
    );
    const fallback = product.variants
      .filter((variant) => variant.options[option] === value)
      .sort((a, b) => {
        const score = (candidate: ProductVariant) =>
          configurableOptions.filter(
            (configurable) =>
              candidate.options[configurable] === selectedVariant.options[configurable]
          ).length;
        return score(b) - score(a);
      })[0];

    setSelectedVariant(exact ?? fallback ?? selectedVariant);
    setAdded(false);
    setQuoted(false);
  }

  const tier = useMemo(() => tierFor(qty), [qty]);
  const listUnitPrice = selectedVariant?.price ?? 0;
  const unitPrice = Number((listUnitPrice * (1 - tier.discount)).toFixed(2));
  const lineTotal = unitPrice * qty;
  const savings = listUnitPrice * qty - lineTotal;
  const hasPrice = listUnitPrice > 0;

  function cartItem() {
    return {
      productId: product.id,
      variantId: selectedVariant.id,
      title: product.title,
      sku: selectedVariant.sku,
      image: selectedVariant.image,
      price: unitPrice,
      weightLbs: selectedVariant.calculated_weight_lb,
      cwtPrice: selectedVariant.steel_cwt_price,
      pricingMethod: selectedVariant.pricing_method,
      quantity: qty,
      options: selectedVariant.options
    };
  }

  function handleAddToCart() {
    if (!selectedVariant) return;
    addItem(cartItem());
    setAdded(true);
  }

  function handleAddToQuote() {
    if (!selectedVariant) return;
    addQuoteItem({ ...cartItem(), price: listUnitPrice }, activeQuoteId);
    setQuoted(true);
  }

  const specs = Object.entries(product.specifications);
  const inStock = selectedVariant?.inventory === "in_stock";

  return (
    <LedgerPage>
      <div className="py-5">
        <Breadcrumb
          trail={[
            { label: "Overview", href: "/ledger" },
            {
              label: product.category.name,
              href: `/ledger/categories/${product.category.slug}`
            },
            { label: product.title }
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
              {activeImage ? (
                <Image
                  alt={product.title}
                  className="h-full w-full object-contain p-10"
                  height={900}
                  priority
                  quality={75}
                  src={activeImage}
                  width={900}
                />
              ) : (
                <Package className="h-20 w-20" style={{ color: LEDGER.muted }} />
              )}
            </div>
          </Card>
          {gallery.length > 1 ? (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {gallery.slice(0, 5).map((image, index) => (
                <button
                  key={image || index}
                  className="flex aspect-square items-center justify-center rounded-xl transition"
                  onClick={() => setActiveImage(image)}
                  style={{
                    backgroundColor: LEDGER.surface,
                    border: `1px solid ${
                      activeImage === image ? LEDGER.indigo : LEDGER.line
                    }`
                  }}
                  type="button"
                >
                  {image ? (
                    <Image
                      alt={`${product.title} view ${index + 1}`}
                      className="h-full w-full object-contain p-2"
                      height={160}
                      quality={60}
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
          <Eyebrow>{product.category.name}</Eyebrow>
          <h1
            className="mt-2 text-3xl font-semibold leading-tight tracking-tight"
            style={{ color: LEDGER.ink }}
          >
            {product.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill
              bg={inStock ? LEDGER.mintSoft : LEDGER.roseSoft}
              fg={inStock ? LEDGER.mint : LEDGER.rose}
            >
              {inStock
                ? `In stock · ${selectedVariant?.inventoryQuantity ?? 0} units`
                : "Out of stock"}
            </Pill>
            <span className="text-[12px] font-medium" style={{ color: LEDGER.muted }}>
              SKU {selectedVariant?.sku}
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
              {hasPrice ? formatUsd(unitPrice) : "Quote required"}
            </span>
            {hasPrice ? (
              <span
                className="pb-1 text-[12px] font-medium"
                style={{ color: LEDGER.indigo }}
              >
                effective unit price at {qty} ea
                {tier.discount > 0
                  ? ` · tier ${(tier.discount * 100).toFixed(0)}% off`
                  : " · list price"}
              </span>
            ) : (
              <span
                className="pb-1 text-[12px] font-medium"
                style={{ color: LEDGER.indigo }}
              >
                request a quote for account pricing
              </span>
            )}
          </div>

          <p className="mt-4 text-[14px] leading-relaxed" style={{ color: LEDGER.body }}>
            {product.description}
          </p>

          {/* Real option selectors */}
          {configurableOptions.map((option) => (
            <div key={option} className="mt-5">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: LEDGER.muted }}
              >
                {option}
                <span className="ml-1.5 normal-case" style={{ color: LEDGER.body }}>
                  {selectedVariant.options[option]}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {optionValues[option].map((value) => {
                  const active = selectedVariant.options[option] === value;
                  return (
                    <button
                      key={`${option}-${value}`}
                      className="rounded-lg px-3.5 py-2 text-[13px] font-semibold transition"
                      onClick={() => selectOption(option, value)}
                      style={{
                        backgroundColor: active ? LEDGER.indigo : LEDGER.surface,
                        color: active ? "#ffffff" : LEDGER.ink,
                        border: `1px solid ${active ? LEDGER.indigo : LEDGER.line}`
                      }}
                      type="button"
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Volume tier table */}
          {hasPrice ? (
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
                        borderTop: index === 0 ? "none" : `1px solid ${LEDGER.line}`
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
          ) : null}

          {/* Qty + add to cart */}
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
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
              disabled={!inStock || !hasPrice}
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

          {/* Request a quote */}
          <button
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition"
            onClick={handleAddToQuote}
            style={{
              backgroundColor: quoted ? LEDGER.mintSoft : LEDGER.surface,
              color: quoted ? LEDGER.mint : LEDGER.ink,
              border: `1px solid ${quoted ? LEDGER.mint : LEDGER.line}`
            }}
            type="button"
          >
            {quoted ? (
              <>
                <Check className="h-4 w-4" /> Added to your quote
              </>
            ) : (
              <>
                <ClipboardList className="h-4 w-4" /> Request a quote on this line
              </>
            )}
          </button>

          {savings > 0 ? (
            <p className="mt-2 text-[12px] font-medium" style={{ color: LEDGER.mint }}>
              Volume tier saves {formatUsd(savings)} on this line vs. list price.
            </p>
          ) : null}

          {(added || quoted) ? (
            <Link
              className="mt-3 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition"
              href={added ? "/ledger/cart" : "/ledger/quote"}
              style={{ backgroundColor: LEDGER.indigoSoft, color: LEDGER.indigo }}
            >
              {added ? "Review purchase order" : "Review your quote"}
              <ArrowRight className="h-3.5 w-3.5" />
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
                style={{
                  backgroundColor: LEDGER.surface,
                  border: `1px solid ${LEDGER.line}`
                }}
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
            {specs.map(([label, value], index) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 px-5 py-3.5"
                style={{
                  borderTop: index < 2 ? "none" : `1px solid ${LEDGER.line}`,
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

        {product.details.length ? (
          <Card className="mt-3 p-6">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Product details
            </p>
            <ul className="mt-3 grid gap-2 text-[14px]" style={{ color: LEDGER.body }}>
              {product.details.map((detail) => (
                <li key={detail} className="flex gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: LEDGER.indigo }}
                  />
                  {detail}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </section>

      {/* Related products */}
      {relatedProducts.length ? (
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
              href={`/ledger/categories/${product.category.slug}`}
              style={{ color: LEDGER.indigo }}
            >
              Browse {product.category.name} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.slice(0, 4).map((related) => (
              <LedgerProductCard key={related.id} product={related} size="sm" />
            ))}
          </div>
        </section>
      ) : null}
    </LedgerPage>
  );
}
