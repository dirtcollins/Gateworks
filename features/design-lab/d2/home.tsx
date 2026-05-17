"use client";

import Link from "next/link";
import {
  Label,
  MONO,
  MonoButton,
  MonoPage,
  ProductImage,
  Section,
  SectionHead,
  formatUsd
} from "./kit";
import {
  featuredProduct,
  getCategoryProducts,
  newArrivals,
  popularProducts,
  topCategories
} from "@/features/design-lab/live-data";
import type { Product } from "@/lib/types";

/* DESIGN 2 — "MONO" — Index / home, wired to the real catalog. */

function primarySku(product: Product): string {
  return product.variants[0]?.sku ?? product.id;
}

export function D2Home() {
  const categoriesWithCounts = topCategories.map((category) => ({
    ...category,
    count: getCategoryProducts(category.slug).length
  }));
  const heroImage =
    featuredProduct.images[0]?.url ?? featuredProduct.variants[0]?.image;
  const featureRail = popularProducts.slice(0, 8);
  const arrivalsRail = newArrivals.slice(0, 6);
  const catalogueTotal = categoriesWithCounts.reduce(
    (sum, category) => sum + category.count,
    0
  );

  return (
    <MonoPage active="Index">
      {/* Hero — type-driven, asymmetric grid */}
      <Section
        className="pt-14 pb-16"
        style={{ borderBottom: `1px solid ${MONO.line}` }}
      >
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Label index="01">Steel &amp; Gate Hardware Supply</Label>
            <h1 className="mt-5 text-[48px] font-semibold leading-[0.98] tracking-[-0.04em] sm:text-[68px]">
              Hardware,
              <br />
              held to a line.
            </h1>
            <p
              className="mt-6 max-w-md text-[14px] leading-relaxed"
              style={{ color: MONO.steel }}
            >
              A working catalogue of gate latches, hinges, steel tubing, and
              fabrication parts. No noise, no clutter — every object on a clean
              grid, priced and in stock.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <MonoButton href="/design-lab/d2/category">
                Browse catalogue
              </MonoButton>
              <MonoButton href="/design-lab/d2/product" variant="outline">
                Featured object
              </MonoButton>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Link
              href="/design-lab/d2/product"
              className="group block"
              style={{ border: `1px solid ${MONO.lineStrong}` }}
            >
              <ProductImage
                alt={featuredProduct.title}
                className="aspect-[4/3]"
                priority
                sizes="(max-width: 1024px) 100vw, 440px"
                src={heroImage}
              />
              <div
                className="flex items-center justify-between gap-4 px-5 py-4"
                style={{ borderTop: `1px solid ${MONO.lineStrong}` }}
              >
                <div className="min-w-0">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: MONO.muted }}
                  >
                    Featured / {primarySku(featuredProduct)}
                  </p>
                  <p className="mt-1 truncate text-[14px] font-semibold tracking-[-0.01em]">
                    {featuredProduct.title}
                  </p>
                </div>
                <span className="text-[16px] font-semibold tabular-nums">
                  {formatUsd(featuredProduct.price)}
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Stat strip */}
        <div
          className="mt-12 grid grid-cols-2 sm:grid-cols-4"
          style={{ border: `1px solid ${MONO.line}` }}
        >
          {[
            { k: "Categories", v: String(categoriesWithCounts.length) },
            { k: "Catalogued objects", v: String(catalogueTotal) },
            { k: "Featured this week", v: String(featureRail.length) },
            { k: "Stocked & priced", v: "100%" }
          ].map((item, index) => (
            <div
              key={item.k}
              className="px-5 py-5"
              style={{
                borderLeft: index === 0 ? undefined : `1px solid ${MONO.line}`
              }}
            >
              <p className="text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                {item.v}
              </p>
              <p
                className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: MONO.muted }}
              >
                {item.k}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Categories — Swiss index grid */}
      <Section
        className="pt-14 pb-16"
        style={{ borderBottom: `1px solid ${MONO.line}` }}
      >
        <SectionHead
          index="02"
          kicker="Departments"
          title="The catalogue, by category"
          action={
            <Link
              href="/design-lab/d2/category"
              className="text-[11px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4"
            >
              View all
            </Link>
          }
        />
        <div
          className="mt-px grid sm:grid-cols-2 lg:grid-cols-4"
          style={{ borderLeft: `1px solid ${MONO.line}` }}
        >
          {categoriesWithCounts.map((category, index) => (
            <Link
              key={category.id}
              href="/design-lab/d2/category"
              className="group flex flex-col justify-between gap-8 p-5 transition-colors hover:bg-[#0a0a0a] hover:text-white"
              style={{
                borderRight: `1px solid ${MONO.line}`,
                borderBottom: `1px solid ${MONO.line}`
              }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] tabular-nums opacity-50">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <span className="block text-[16px] font-semibold leading-tight tracking-[-0.015em]">
                  {category.name}
                </span>
                <span className="mt-1 block text-[11px] uppercase tracking-[0.16em] opacity-60">
                  {category.count}{" "}
                  {category.count === 1 ? "object" : "objects"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* Popular — featured product rail */}
      <Section
        className="pt-14 pb-16"
        style={{ borderBottom: `1px solid ${MONO.line}` }}
      >
        <SectionHead
          index="03"
          kicker="Most specified"
          title="Popular this season"
        />
        <div
          className="mt-px grid grid-cols-2 lg:grid-cols-4"
          style={{ borderLeft: `1px solid ${MONO.line}` }}
        >
          {featureRail.map((product) => (
            <Link
              key={product.id}
              href="/design-lab/d2/product"
              className="group flex flex-col"
              style={{
                borderRight: `1px solid ${MONO.line}`,
                borderBottom: `1px solid ${MONO.line}`
              }}
            >
              <ProductImage
                alt={product.title}
                className="aspect-square transition-transform duration-300 group-hover:scale-[1.02]"
                sizes="(max-width: 1024px) 50vw, 300px"
                src={product.images[0]?.url ?? product.variants[0]?.image}
              />
              <div
                className="flex flex-1 flex-col gap-2 p-4"
                style={{ borderTop: `1px solid ${MONO.line}` }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: MONO.muted }}
                >
                  {primarySku(product)}
                </p>
                <p className="flex-1 text-[13px] font-medium leading-snug tracking-[-0.01em]">
                  {product.title}
                </p>
                <div className="flex items-baseline justify-between">
                  <span className="text-[15px] font-semibold tabular-nums">
                    {formatUsd(product.price)}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-[0.16em]"
                    style={{ color: MONO.muted }}
                  >
                    {product.variants.length}{" "}
                    {product.variants.length === 1 ? "variant" : "variants"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* New arrivals — horizontal editorial list */}
      <Section className="pt-14 pb-16">
        <SectionHead
          index="04"
          kicker="Latest additions"
          title="New to the catalogue"
        />
        <ul className="mt-px">
          {arrivalsRail.map((product, index) => (
            <li
              key={product.id}
              style={{ borderBottom: `1px solid ${MONO.line}` }}
            >
              <Link
                href="/design-lab/d2/product"
                className="group grid grid-cols-12 items-center gap-4 py-4 transition-colors hover:bg-[#fafafa]"
              >
                <span
                  className="col-span-1 text-[12px] font-semibold tabular-nums"
                  style={{ color: MONO.muted }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="col-span-2 sm:col-span-1">
                  <ProductImage
                    alt={product.title}
                    className="aspect-square"
                    pad="p-2"
                    sizes="64px"
                    src={product.images[0]?.url ?? product.variants[0]?.image}
                  />
                </div>
                <span className="col-span-6 text-[13px] font-medium tracking-[-0.01em]">
                  {product.title}
                </span>
                <span
                  className="col-span-3 sm:col-span-2 text-[11px] uppercase tracking-[0.14em]"
                  style={{ color: MONO.steel }}
                >
                  {product.category.name}
                </span>
                <span className="col-span-12 sm:col-span-2 text-right text-[15px] font-semibold tabular-nums">
                  {formatUsd(product.price)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </MonoPage>
  );
}
