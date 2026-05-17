"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Heart,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck
} from "lucide-react";
import {
  featuredProduct,
  getRelatedProducts
} from "@/features/design-lab/live-data";
import { useCartStore } from "@/lib/cart-store";
import { D4Shell, D4Stars, brandClasses } from "./shell";

const product = featuredProduct;
const related = getRelatedProducts(product, 4);
const galleryTints = [
  "from-amber-200 to-amber-50",
  "from-orange-200 to-orange-50",
  "from-slate-200 to-slate-50",
  "from-amber-100 to-white"
];
const relatedTints = [
  "from-sky-200 to-sky-50",
  "from-emerald-200 to-emerald-50",
  "from-violet-200 to-violet-50",
  "from-rose-200 to-rose-50"
];

export function D4Product() {
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
  const [variantId, setVariantId] = useState(
    product.variants[0]?.id ?? ""
  );
  const [qty, setQty] = useState(1);
  const [saved, setSaved] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const selectedVariant =
    product.variants.find((variant) => variant.id === variantId) ??
    product.variants[0];

  const unit = selectedVariant?.price ?? product.price;
  const total = unit * qty;
  const stock = selectedVariant?.inventoryQuantity ?? 0;
  const inStock = selectedVariant?.inventory === "in_stock";
  const specs = Object.entries(product.specifications);

  function handleAddToCart() {
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
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  }

  return (
    <D4Shell active="product">
      {/* breadcrumb */}
      <div className="mx-auto max-w-6xl px-5 pt-5">
        <nav className="flex items-center gap-1 text-xs text-slate-400">
          <Link href="/design-lab/d4/home" className="hover:text-orange-600">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/design-lab/d4/category" className="hover:text-orange-600">
            {product.category.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-slate-600">{product.title}</span>
        </nav>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-6 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div
            className={`relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br ${galleryTints[active % galleryTints.length]} ring-1 ring-slate-100`}
          >
            <Image
              alt={product.title}
              src={galleryImages[active] ?? galleryImages[0]}
              fill
              quality={90}
              sizes="(max-width: 1024px) 100vw, 44vw"
              className="object-contain p-8"
              priority
            />
            <button
              type="button"
              onClick={() => setSaved((v) => !v)}
              aria-label="Save item"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-400 shadow-sm transition hover:text-rose-500"
            >
              <Heart
                className={`h-5 w-5 ${saved ? "fill-rose-500 text-rose-500" : ""}`}
              />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {galleryImages.slice(0, 4).map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                className={`relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br ${galleryTints[i % galleryTints.length]} ring-2 transition ${
                  active === i ? "ring-orange-500" : "ring-transparent hover:ring-slate-200"
                }`}
              >
                <Image
                  alt={`${product.title} thumbnail ${i + 1}`}
                  src={url}
                  fill
                  quality={60}
                  sizes="120px"
                  className="object-contain p-2"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Buy box */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
            {product.specifications.Brand ?? "Gateworks"}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {product.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <D4Stars value={4.8} size="md" />
              <span className="text-sm font-bold text-slate-700">4.8</span>
            </span>
            <span className="text-sm text-slate-400">
              {120 + product.variants.length} reviews
            </span>
            <span className="text-xs font-semibold text-slate-400">
              SKU {selectedVariant?.sku ?? product.id}
            </span>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-4xl font-extrabold text-slate-900">
              ${unit.toFixed(2)}
            </span>
          </div>

          {/* stock */}
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <Check className="h-4 w-4" />
            {stock} in stock · free pickup today at Yard #2
          </p>

          {/* variant */}
          {product.variants.length > 1 ? (
            <div className="mt-6">
              <p className="text-sm font-bold text-slate-900">Variant</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const label =
                    [v.options.length, v.options.finish]
                      .filter((part) => part && part !== "Standard")
                      .join(" · ") || v.sku;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariantId(v.id)}
                      className={`rounded-xl px-3.5 py-2 text-sm font-semibold ring-1 transition ${
                        variantId === v.id
                          ? "bg-orange-50 text-orange-600 ring-orange-300"
                          : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* quantity */}
          <div className="mt-6 flex items-center gap-4">
            <p className="text-sm font-bold text-slate-900">Quantity</p>
            <div className="flex items-center rounded-xl ring-1 ring-slate-200">
              <button
                type="button"
                aria-label="Decrease"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-10 w-10 place-items-center text-slate-500 hover:text-orange-600"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-bold text-slate-900">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Increase"
                onClick={() => setQty((q) => q + 1)}
                className="grid h-10 w-10 place-items-center text-slate-500 hover:text-orange-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-sm text-slate-400">
              Subtotal{" "}
              <span className="font-bold text-slate-900">
                ${total.toFixed(2)}
              </span>
            </span>
          </div>

          {/* CTA */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!inStock}
              className={`${brandClasses.btn} flex-1 px-5 py-3.5 text-base disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400`}
            >
              {justAdded ? (
                <>
                  <Check className="h-5 w-5" /> Added to cart
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" /> Add to cart
                </>
              )}
            </button>
            <Link
              href="/design-lab/d4/cart"
              className="grid place-items-center rounded-xl bg-slate-900 px-6 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              View cart
            </Link>
          </div>

          {/* assurances */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Truck, t: "Free pickup", s: "Ready in 1 hr" },
              { icon: RotateCcw, t: "90-day returns", s: "No restock fee" },
              { icon: ShieldCheck, t: "Pro warranty", s: "Structural" }
            ].map(({ icon: Icon, t, s }) => (
              <div
                key={t}
                className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-100"
              >
                <Icon className="mx-auto h-5 w-5 text-orange-500" />
                <p className="mt-1.5 text-xs font-bold text-slate-800">{t}</p>
                <p className="text-[11px] text-slate-400">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Details + specs */}
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">
            About this product
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {product.description}
          </p>
          {product.details.length ? (
            <ul className="mt-4 space-y-2">
              {product.details.map((detail) => (
                <li
                  key={detail}
                  className="flex items-start gap-2 text-sm text-slate-600"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {detail}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className={`${brandClasses.card} p-5`}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Package className="h-5 w-5 text-orange-500" /> Specifications
          </h2>
          <dl className="mt-3 divide-y divide-slate-100 text-sm">
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-400">{k}</dt>
                <dd className="text-right font-semibold text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Reviews snapshot */}
      <div className="mx-auto max-w-6xl px-5 py-4">
        <div className={`${brandClasses.card} p-6`}>
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-slate-900">4.8</p>
              <D4Stars value={4.8} size="md" />
              <p className="mt-1 text-xs text-slate-400">
                {120 + product.variants.length} reviews
              </p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[
                [5, 82],
                [4, 12],
                [3, 4],
                [2, 1],
                [1, 1]
              ].map(([star, pct]) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-8 text-xs font-semibold text-slate-500">
                    {star}★
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-orange-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs text-slate-400">
                    {pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              {
                a: "Jordan K.",
                q: "Exactly the part I needed, picked up same day. Quality is solid for the price."
              },
              {
                a: "Lena M.",
                q: "Latches automatically every time. Reversible install made it a quick job."
              }
            ].map((r) => (
              <div key={r.a} className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                  <span className="text-sm font-bold text-slate-900">
                    {r.a}
                  </span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    Verified
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{r.q}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length ? (
        <div className="mx-auto max-w-6xl px-5 py-10">
          <h2 className="text-xl font-bold text-slate-900">Pairs well with</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((r, index) => (
              <Link
                key={r.id}
                href="/design-lab/d4/product"
                className="group overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-100"
              >
                <div
                  className={`relative aspect-square bg-gradient-to-br ${relatedTints[index % relatedTints.length]}`}
                >
                  <Image
                    alt={r.title}
                    src={r.images[0]?.url ?? r.variants[0]?.image ?? "/assets/logo.svg"}
                    fill
                    quality={75}
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-contain p-6"
                  />
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-orange-600">
                    {r.title}
                  </p>
                  <p className="mt-1 text-base font-extrabold text-slate-900">
                    ${r.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Sticky add-to-cart */}
      <div className="sticky bottom-0 z-30 border-t border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <div className="relative hidden h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-slate-50 sm:block">
            <Image
              alt={product.title}
              src={selectedVariant?.image || galleryImages[0]}
              fill
              quality={60}
              sizes="44px"
              className="object-contain p-1"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">
              {product.title}
            </p>
            <p className="text-xs font-semibold text-emerald-600">
              In stock · free pickup today
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold text-slate-900">
              ${total.toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-400">qty {qty}</p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`${brandClasses.btn} px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400`}
          >
            <ShoppingCart className="h-4 w-4" />
            {justAdded ? "Added" : "Add to cart"}
          </button>
        </div>
      </div>
    </D4Shell>
  );
}
