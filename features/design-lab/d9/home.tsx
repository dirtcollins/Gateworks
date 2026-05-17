"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
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
import {
  featuredProduct,
  getCategoryProducts,
  newArrivals,
  popularProducts,
  topCategories
} from "@/features/design-lab/live-data";

/* DESIGN 9 — "Showroom" — Home. Every figure is real catalog data. */

/* Real departments with live product counts. */
const COLLECTIONS = topCategories.map((category) => ({
  name: category.name,
  count: getCategoryProducts(category.slug).length,
  slug: category.slug
}));

/* Real flagship hero object. */
const HERO_IMAGE =
  featuredProduct.images[0]?.url ?? featuredProduct.variants[0]?.image;
const HERO_PRICE = featuredProduct.price;
const HERO_SKU = featuredProduct.variants[0]?.sku ?? featuredProduct.id;

/* Real curated rails. */
const SIGNATURE = (popularProducts.length ? popularProducts : newArrivals).slice(0, 6);
const ARRIVALS = newArrivals.slice(0, 3);

const HOUSE_NOTES = [
  {
    head: "Specified, not sold",
    body: "Every flagship object is documented with mill data, finish detail, and an install template — chosen by architects and master fabricators."
  },
  {
    head: "The atelier standard",
    body: "Hot-rolled steel, weather-guarded finishes, and a five-year carriage warranty. We stock depth so the counter is never the bottleneck."
  },
  {
    head: "White-glove delivery",
    body: "Flagship orders ship crated and concierge-scheduled. Trade clients receive a dedicated specification advisor."
  }
];

export function D9Home() {
  return (
    <D9Page>
      <D9DesignBadge />

      {/* ---- Hero — flagship object presented reverently ---- */}
      <section className="mx-auto max-w-[1240px] px-6 pb-8 pt-16 sm:px-8 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <Eyebrow>The 2026 Flagship</Eyebrow>
            <h1
              className="mt-7 text-[2.9rem] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[4.4rem]"
              style={{ ...serif, color: d9.ink }}
            >
              Hardware,
              <br />
              regarded as a
              <br />
              <span style={{ color: d9.bronze }}>covetable object.</span>
            </h1>
            <p
              className="mt-7 max-w-md text-[0.98rem] leading-relaxed"
              style={{ color: d9.graphite }}
            >
              The Gateworks Atelier presents architectural gate hardware,
              structural steel, and ornamental ironwork the way a gallery
              presents its collection — slowly, deliberately, and with
              reverence for craft.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                className="inline-flex items-center gap-2.5 px-8 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.2em] transition-colors"
                href="/design-lab/d9/product"
                style={{ background: d9.ink, color: d9.bone }}
              >
                View the flagship <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                className="inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em]"
                href="/design-lab/d9/category"
                style={{ color: d9.bronze }}
              >
                Browse the collection
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <dl
              className="mt-12 grid max-w-md grid-cols-3 gap-px"
              style={{ background: d9.rule }}
            >
              {[
                { value: "1986", label: "Established" },
                { value: `${COLLECTIONS.length}`, label: "Collections" },
                { value: featuredProduct.variants.length.toString(), label: "Flagship variants" }
              ].map((stat) => (
                <div key={stat.label} className="px-5 py-4" style={{ background: d9.bone }}>
                  <dt className="text-2xl" style={{ ...serif, color: d9.ink }}>
                    {stat.value}
                  </dt>
                  <dd
                    className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: d9.haze }}
                  >
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Flagship object plinth */}
          <Link
            className="group relative block"
            href="/design-lab/d9/product"
            style={{ background: d9.card, border: `1px solid ${d9.rule}` }}
          >
            <div
              className="flex aspect-[5/6] items-center justify-center overflow-hidden"
              style={{ background: d9.linen }}
            >
              {HERO_IMAGE ? (
                <Image
                  alt={featuredProduct.title}
                  className="h-full w-full object-contain p-14 transition-transform duration-700 group-hover:scale-[1.04]"
                  height={1100}
                  priority
                  quality={75}
                  src={HERO_IMAGE}
                  width={1100}
                />
              ) : (
                <span className="text-8xl" style={{ ...serif, color: d9.rule }}>
                  GW
                </span>
              )}
            </div>
            <div
              className="flex items-end justify-between gap-4 px-8 py-7"
              style={{ borderTop: `1px solid ${d9.rule}` }}
            >
              <div>
                <span
                  className="text-[0.6rem] font-semibold uppercase tracking-[0.26em]"
                  style={{ color: d9.bronze }}
                >
                  Flagship · {HERO_SKU}
                </span>
                <p
                  className="mt-2 max-w-xs text-xl leading-snug"
                  style={{ ...serif, color: d9.ink }}
                >
                  {featuredProduct.title}
                </p>
              </div>
              <span className="text-2xl" style={{ ...serif, color: d9.ink }}>
                {formatUsd(HERO_PRICE)}
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* ---- House notes — trust as quiet confidence ---- */}
      <section className="mx-auto max-w-[1240px] px-6 py-20 sm:px-8">
        <div
          className="grid gap-px"
          style={{ background: d9.rule, border: `1px solid ${d9.rule}` }}
        >
          <div className="grid md:grid-cols-3" style={{ gap: "1px", background: d9.rule }}>
            {HOUSE_NOTES.map((note, index) => (
              <div key={note.head} className="px-8 py-10" style={{ background: d9.card }}>
                <span className="text-3xl" style={{ ...serif, color: d9.bronze }}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-4 text-lg" style={{ ...serif, color: d9.ink }}>
                  {note.head}
                </p>
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: d9.graphite }}
                >
                  {note.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Collections — real categories with live counts ---- */}
      <section className="mx-auto max-w-[1240px] px-6 py-12 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>Browse by collection</Eyebrow>
            <Display className="mt-4 text-[2.2rem] sm:text-[2.8rem]">
              The collections
            </Display>
          </div>
          <Link
            className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em]"
            href="/design-lab/d9/category"
            style={{ color: d9.bronze }}
          >
            Enter the gallery <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div
          className="mt-10 grid gap-px sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: d9.rule, border: `1px solid ${d9.rule}` }}
        >
          {COLLECTIONS.map((collection, index) => (
            <Link
              key={collection.slug}
              className="group flex flex-col justify-between px-7 py-9 transition-colors"
              href="/design-lab/d9/category"
              style={{ background: d9.card }}
            >
              <div className="flex items-start justify-between">
                <span
                  className="grid h-12 w-12 place-items-center text-base transition-colors"
                  style={{ ...serif, border: `1px solid ${d9.ink}`, color: d9.ink }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className="text-[0.6rem] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: d9.haze }}
                >
                  {collection.count} pieces
                </span>
              </div>
              <div className="mt-14">
                <p className="text-xl leading-snug" style={{ ...serif, color: d9.ink }}>
                  {collection.name}
                </p>
                <p
                  className="mt-2 flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: d9.bronze }}
                >
                  View collection <ArrowRight className="h-3 w-3" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- Signature objects — real popular products ---- */}
      <section className="mx-auto max-w-[1240px] px-6 py-12 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>Most coveted</Eyebrow>
            <Display className="mt-4 text-[2.2rem] sm:text-[2.8rem]">
              Signature objects
            </Display>
          </div>
          <Link
            className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em]"
            href="/design-lab/d9/category"
            style={{ color: d9.bronze }}
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SIGNATURE.map((product, index) => (
            <GalleryCard
              key={product.id}
              badge={index === 0 ? "Most coveted" : index < 3 ? "House favorite" : undefined}
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

      {/* ---- New arrivals — editorial split rows ---- */}
      <section className="mx-auto max-w-[1240px] px-6 py-12 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <Eyebrow>Recently acquired</Eyebrow>
            <Display className="mt-4 text-[2.2rem] sm:text-[2.8rem]">
              New to the showroom
            </Display>
          </div>
        </div>
        <div
          className="mt-10 grid gap-px"
          style={{ background: d9.rule, border: `1px solid ${d9.rule}` }}
        >
          {ARRIVALS.map((product, index) => (
            <Link
              key={product.id}
              className="group grid items-center gap-8 px-8 py-8 transition-colors sm:grid-cols-[140px_1fr_auto]"
              href="/design-lab/d9/product"
              style={{ background: d9.card }}
            >
              <div
                className="flex aspect-square items-center justify-center overflow-hidden"
                style={{ background: d9.linen }}
              >
                {product.images[0]?.url ?? product.variants[0]?.image ? (
                  <Image
                    alt={product.title}
                    className="h-full w-full object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                    height={280}
                    quality={75}
                    src={(product.images[0]?.url ?? product.variants[0]?.image) as string}
                    width={280}
                  />
                ) : (
                  <span className="text-3xl" style={{ ...serif, color: d9.rule }}>
                    {index + 1}
                  </span>
                )}
              </div>
              <div>
                <span
                  className="text-[0.6rem] font-semibold uppercase tracking-[0.24em]"
                  style={{ color: d9.bronze }}
                >
                  {product.category.name} · {product.variants[0]?.sku ?? product.id}
                </span>
                <p className="mt-2 text-2xl leading-snug" style={{ ...serif, color: d9.ink }}>
                  {product.title}
                </p>
                <p
                  className="mt-2 max-w-xl text-sm leading-relaxed"
                  style={{ color: d9.graphite }}
                >
                  {product.description}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl" style={{ ...serif, color: d9.ink }}>
                  {formatUsd(product.price)}
                </span>
                <p
                  className="mt-2 flex items-center justify-end gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: d9.bronze }}
                >
                  View piece <ArrowRight className="h-3 w-3" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- Trade atelier CTA ---- */}
      <section className="mx-auto max-w-[1240px] px-6 py-16 sm:px-8">
        <div
          className="grid items-center gap-10 px-10 py-16 sm:px-16 md:grid-cols-[1.3fr_1fr]"
          style={{ background: d9.ink, color: d9.bone }}
        >
          <div>
            <span
              className="text-[0.62rem] font-semibold uppercase tracking-[0.3em]"
              style={{ color: d9.bronzeLite }}
            >
              The Trade Atelier
            </span>
            <h2
              className="mt-5 text-[2rem] leading-tight sm:text-[2.6rem]"
              style={{ ...serif, color: d9.bone }}
            >
              A private advisor for architects, fabricators, and estates.
            </h2>
            <p
              className="mt-4 max-w-md text-sm leading-relaxed"
              style={{ color: "rgba(243,237,225,0.6)" }}
            >
              Trade clients receive specification support, preferred pricing,
              net terms, and concierge-scheduled white-glove delivery.
            </p>
            <Link
              className="mt-8 inline-flex items-center gap-2.5 px-8 py-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em]"
              href="/design-lab/d9/orders"
              style={{ background: d9.bronze, color: d9.bone }}
            >
              Request an introduction <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-px" style={{ background: "rgba(243,237,225,0.1)" }}>
            {[
              "Dedicated specification advisor",
              "Preferred trade pricing & net terms",
              "Crated, concierge white-glove delivery"
            ].map((line) => (
              <p
                key={line}
                className="px-6 py-5 text-sm"
                style={{ background: d9.espresso, color: "rgba(243,237,225,0.82)" }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </section>
    </D9Page>
  );
}
