"use client";

import Link from "next/link";
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

const PRODUCT = {
  name: "Heavy-Duty Cantilever Roller Kit",
  sku: "GW-CR-2400",
  category: "Gate Hardware",
  price: 289.0,
  listPrice: 339.0,
  rating: 4.8,
  reviews: 64,
  blurb:
    "A complete bolt-on roller assembly for cantilever slide gates up to 24 ft. Sealed bearings, powder-coated steel carriage and adjustable truck assemblies — engineered for daily commercial cycling.",
  specs: [
    ["Gate span", "Up to 24 ft"],
    ["Carriage", "Powder-coated steel"],
    ["Bearings", "Sealed, greaseable"],
    ["Track gauge", "2-3/8 in round"],
    ["Finish", "Matte black RAL 9005"],
    ["Weight", "31 lb / kit"]
  ],
  variants: [
    { label: "16 ft span", sku: "GW-CR-1600", price: 239.0 },
    { label: "20 ft span", sku: "GW-CR-2000", price: 264.0 },
    { label: "24 ft span", sku: "GW-CR-2400", price: 289.0 },
    { label: "30 ft span", sku: "GW-CR-3000", price: 348.0 }
  ]
};

const THUMBS = ["#16150f", "#2f6f4e", "#6c685c", "#d6a93f"];

const RELATED = [
  { name: "Cantilever Track — 21 ft", sku: "GW-CT-2100", price: 178.0, tone: "#6c685c" },
  { name: "Slide Gate Latch — Lockable", sku: "GW-SL-440", price: 52.0, tone: "#2f6f4e" },
  { name: "Internal Track Roller Set", sku: "GW-IR-090", price: 88.5, tone: "#16150f" },
  { name: "Gate End Caps — Pair", sku: "GW-EC-020", price: 14.25, tone: "#d6a93f" }
];

export function D1Product() {
  const [activeThumb, setActiveThumb] = useState(0);
  const [variant, setVariant] = useState(2);
  const [qty, setQty] = useState(1);
  const [saved, setSaved] = useState(false);

  const selected = PRODUCT.variants[variant];

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
          <div
            className="flex aspect-[4/3] items-center justify-center border-2 border-d1-ink"
            style={{ backgroundColor: THUMBS[activeThumb] }}
          >
            <span
              className="text-8xl font-black"
              style={{ color: "rgba(246,243,236,0.16)" }}
            >
              GW
            </span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {THUMBS.map((tone, index) => (
              <button
                key={tone}
                className={`flex aspect-square items-center justify-center border-2 transition ${
                  activeThumb === index
                    ? "border-d1-pine"
                    : "border-d1-line hover:border-d1-ink"
                }`}
                onClick={() => setActiveThumb(index)}
                style={{ backgroundColor: tone }}
                type="button"
              >
                <span
                  className="text-xl font-black"
                  style={{ color: "rgba(246,243,236,0.22)" }}
                >
                  {index + 1}
                </span>
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
              {formatUsd(selected.price)}
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
          <div className="mt-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-d1-ink">
              Gate span &mdash; {selected.sku}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-px border border-d1-line bg-d1-line">
              {PRODUCT.variants.map((option, index) => (
                <button
                  key={option.sku}
                  className={`px-3 py-3 text-left transition ${
                    variant === index
                      ? "bg-d1-ink text-d1-paper"
                      : "bg-d1-card text-d1-ink hover:bg-white"
                  }`}
                  onClick={() => setVariant(index)}
                  type="button"
                >
                  <span className="block text-sm font-bold">
                    {option.label}
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
            <Link
              className="flex flex-1 items-center justify-center gap-2 bg-d1-ink px-5 text-sm font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
              href="/design-lab/d1/cart"
            >
              Add to cart &mdash; {formatUsd(selected.price * qty)}
            </Link>
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

          <div className="mt-5 grid gap-px border border-d1-line bg-d1-line text-[13px]">
            {[
              { icon: Package, text: "In stock — 142 units at Will-Call" },
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
                style={{ backgroundColor: item.tone }}
              >
                <span
                  className="text-4xl font-black"
                  style={{ color: "rgba(246,243,236,0.16)" }}
                >
                  GW
                </span>
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
