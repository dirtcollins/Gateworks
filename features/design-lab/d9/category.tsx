"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
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
  categories,
  featuredCategoryProducts,
  featuredCategorySlug,
  getCategoryProducts,
  topCategories
} from "@/features/design-lab/live-data";

/* DESIGN 9 — "Showroom" — Collection. Real catalog grid + facets. */

const ACTIVE_CATEGORY =
  categories.find((category) => category.slug === featuredCategorySlug) ??
  topCategories[0];

/* Facets from real categories — topCategories first, then the rest. */
const FACETS = (() => {
  const seen = new Set<string>();
  const ordered = [...topCategories, ...categories];
  return ordered.filter((category) => {
    if (seen.has(category.slug)) return false;
    seen.add(category.slug);
    return getCategoryProducts(category.slug).length > 0;
  });
})();

const SORTS = ["Curated", "Price · low to high", "Price · high to low"] as const;

export function D9Category() {
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Curated");

  const products = useMemo(() => {
    const list = [...featuredCategoryProducts];
    if (sort === "Price · low to high") {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === "Price · high to low") {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [sort]);

  const priceLow = featuredCategoryProducts.length
    ? Math.min(...featuredCategoryProducts.map((product) => product.price))
    : 0;
  const priceHigh = featuredCategoryProducts.length
    ? Math.max(...featuredCategoryProducts.map((product) => product.price))
    : 0;

  return (
    <D9Page>
      <D9DesignBadge />

      {/* ---- Collection masthead ---- */}
      <section className="mx-auto max-w-[1240px] px-6 pb-10 pt-16 sm:px-8 sm:pt-20">
        <Eyebrow>The Collection</Eyebrow>
        <div className="mt-6 grid items-end gap-8 lg:grid-cols-[1.4fr_1fr]">
          <h1
            className="text-[2.8rem] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[4rem]"
            style={{ ...serif, color: d9.ink }}
          >
            {ACTIVE_CATEGORY?.name ?? "The Collection"}
          </h1>
          <p
            className="max-w-sm text-sm leading-relaxed"
            style={{ color: d9.graphite }}
          >
            {featuredCategoryProducts.length} pieces, presented as a curated
            gallery. Each object is documented, specified, and held at the
            showroom — chosen for craft, not catalogue depth.
          </p>
        </div>
        <dl
          className="mt-10 grid grid-cols-3 gap-px sm:max-w-xl"
          style={{ background: d9.rule, border: `1px solid ${d9.rule}` }}
        >
          {[
            { value: String(featuredCategoryProducts.length), label: "Pieces" },
            { value: formatUsd(priceLow), label: "From" },
            { value: formatUsd(priceHigh), label: "Up to" }
          ].map((stat) => (
            <div key={stat.label} className="px-6 py-5" style={{ background: d9.card }}>
              <dt className="text-xl" style={{ ...serif, color: d9.ink }}>
                {stat.value}
              </dt>
              <dd
                className="mt-1 text-[0.58rem] font-semibold uppercase tracking-[0.18em]"
                style={{ color: d9.haze }}
              >
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---- Facets + gallery grid ---- */}
      <section className="mx-auto max-w-[1240px] px-6 pb-20 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          {/* Facet rail */}
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <p
              className="text-[0.6rem] font-semibold uppercase tracking-[0.24em]"
              style={{ color: d9.bronze }}
            >
              Collections
            </p>
            <ul className="mt-4 space-y-px" style={{ borderTop: `1px solid ${d9.rule}` }}>
              {FACETS.map((facet) => {
                const active = facet.slug === featuredCategorySlug;
                const count = getCategoryProducts(facet.slug).length;
                return (
                  <li key={facet.slug} style={{ borderBottom: `1px solid ${d9.rule}` }}>
                    <Link
                      className="flex items-center justify-between py-3 text-sm transition-colors"
                      href="/design-lab/d9/category"
                      style={{ color: active ? d9.ink : d9.graphite }}
                    >
                      <span
                        className="flex items-center gap-2.5"
                        style={active ? serif : undefined}
                      >
                        {active ? (
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: d9.bronze }}
                          />
                        ) : null}
                        {facet.name}
                      </span>
                      <span
                        className="text-[0.66rem] font-semibold"
                        style={{ color: d9.haze }}
                      >
                        {count}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div
              className="mt-8 px-6 py-7"
              style={{ background: d9.ink, color: d9.bone }}
            >
              <p
                className="text-[0.58rem] font-semibold uppercase tracking-[0.24em]"
                style={{ color: d9.bronzeLite }}
              >
                Atelier service
              </p>
              <p className="mt-3 text-lg leading-snug" style={serif}>
                Unsure which edition? A specification advisor will guide you.
              </p>
              <Link
                className="mt-5 inline-flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.18em]"
                href="/design-lab/d9/orders"
                style={{ color: d9.bronzeLite }}
              >
                Book an appointment <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </aside>

          {/* Grid */}
          <div>
            <div
              className="flex flex-wrap items-center justify-between gap-4 pb-5"
              style={{ borderBottom: `1px solid ${d9.rule}` }}
            >
              <p
                className="text-[0.62rem] font-semibold uppercase tracking-[0.2em]"
                style={{ color: d9.haze }}
              >
                Showing {products.length} pieces
              </p>
              <div className="flex flex-wrap gap-2">
                {SORTS.map((option) => {
                  const active = sort === option;
                  return (
                    <button
                      key={option}
                      className="px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] transition-colors"
                      onClick={() => setSort(option)}
                      style={{
                        background: active ? d9.ink : "transparent",
                        border: `1px solid ${active ? d9.ink : d9.rule}`,
                        color: active ? d9.bone : d9.graphite
                      }}
                      type="button"
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {products.length ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product, index) => (
                  <GalleryCard
                    key={product.id}
                    badge={index === 0 ? "Flagship" : undefined}
                    href="/design-lab/d9/product"
                    image={product.images[0]?.url ?? product.variants[0]?.image}
                    index={index}
                    price={product.price}
                    sku={product.variants[0]?.sku ?? product.id}
                    title={product.title}
                  />
                ))}
              </div>
            ) : (
              <div
                className="mt-8 px-8 py-20 text-center"
                style={{ background: d9.card, border: `1px solid ${d9.rule}` }}
              >
                <p className="text-xl" style={{ ...serif, color: d9.ink }}>
                  This collection is being curated.
                </p>
                <Link
                  className="mt-5 inline-flex items-center gap-2 px-7 py-3.5 text-[0.66rem] font-semibold uppercase tracking-[0.18em]"
                  href="/design-lab/d9/home"
                  style={{ background: d9.ink, color: d9.bone }}
                >
                  Return to the showroom <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </D9Page>
  );
}
