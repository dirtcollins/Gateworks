"use client";

/* DESIGN 2 — "MONO" — Catalogue / category listing, wired to the catalog. */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Label,
  MONO,
  MonoPage,
  Pill,
  ProductImage,
  Section,
  formatUsd
} from "./kit";
import {
  categories,
  featuredCategoryProducts,
  featuredProduct,
  getCategoryProducts,
  topCategories
} from "@/features/design-lab/live-data";
import type { Product } from "@/lib/types";

const CATEGORY = featuredProduct.category;

// Facet list: real categories with object counts.
const FACETS = (() => {
  const base = topCategories.length ? topCategories : categories;
  return base
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      count: getCategoryProducts(category.slug).length
    }))
    .filter((facet) => facet.count > 0);
})();

const SORTS = [
  { key: "az", label: "A — Z" },
  { key: "price-asc", label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
  { key: "variants", label: "Variants" }
] as const;

type SortKey = (typeof SORTS)[number]["key"];

function primarySku(product: Product): string {
  return product.variants[0]?.sku ?? product.id;
}

export function D2Category() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("az");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = featuredCategoryProducts.filter((product) => {
      if (!normalized) return true;
      return (
        product.title.toLowerCase().includes(normalized) ||
        product.variants.some((variant) =>
          variant.sku.toLowerCase().includes(normalized)
        )
      );
    });
    return [...filtered].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "variants") return b.variants.length - a.variants.length;
      return a.title.localeCompare(b.title);
    });
  }, [query, sort]);

  return (
    <MonoPage active="Catalogue">
      {/* Department header */}
      <Section
        className="pt-12 pb-10"
        style={{ borderBottom: `1px solid ${MONO.lineStrong}` }}
      >
        <Label index="CAT">Department</Label>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <h1 className="text-[44px] font-semibold leading-[0.98] tracking-[-0.035em] sm:text-[56px]">
            {CATEGORY.name}
          </h1>
          <p
            className="max-w-xs text-[13px] leading-relaxed"
            style={{ color: MONO.steel }}
          >
            {featuredCategoryProducts.length} catalogued objects in this
            department, every one priced and stocked.
          </p>
        </div>
      </Section>

      <Section className="pt-10 pb-16">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Facet rail */}
          <aside className="lg:col-span-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em]">
              Departments
            </p>
            <ul
              className="mt-4"
              style={{ borderTop: `1px solid ${MONO.line}` }}
            >
              {FACETS.map((facet) => {
                const on = facet.slug === CATEGORY.slug;
                return (
                  <li
                    key={facet.slug}
                    style={{ borderBottom: `1px solid ${MONO.line}` }}
                  >
                    <Link
                      href="/design-lab/d2/category"
                      className="flex items-center justify-between py-2.5 text-[12px] transition-colors"
                      style={{
                        fontWeight: on ? 600 : 400,
                        color: on ? MONO.ink : MONO.steel
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-1.5 w-1.5"
                          style={{
                            background: on ? MONO.ink : "transparent",
                            border: `1px solid ${
                              on ? MONO.ink : MONO.line
                            }`
                          }}
                        />
                        {facet.name}
                      </span>
                      <span
                        className="tabular-nums"
                        style={{ color: MONO.muted }}
                      >
                        {String(facet.count).padStart(2, "0")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div
              className="mt-8 p-4"
              style={{ border: `1px solid ${MONO.lineStrong}` }}
            >
              <p className="text-[12px] font-semibold tracking-[-0.01em]">
                Trade pricing
              </p>
              <p
                className="mt-1.5 text-[12px] leading-relaxed"
                style={{ color: MONO.steel }}
              >
                Sign in to unlock tiered crew and yard rates across the full
                catalogue.
              </p>
            </div>
          </aside>

          {/* Results */}
          <div className="lg:col-span-9">
            {/* Toolbar */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 pb-4"
              style={{ borderBottom: `1px solid ${MONO.lineStrong}` }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ border: `1px solid ${MONO.line}` }}
              >
                <span
                  className="text-[11px] uppercase tracking-[0.16em]"
                  style={{ color: MONO.muted }}
                >
                  Find
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Name or SKU"
                  className="w-40 bg-transparent text-[12px] outline-none placeholder:text-[#b5b5b3]"
                />
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-[11px] uppercase tracking-[0.16em]"
                  style={{ color: MONO.muted }}
                >
                  Sort
                </span>
                <div className="flex" style={{ border: `1px solid ${MONO.line}` }}>
                  {SORTS.map((option, index) => {
                    const on = option.key === sort;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setSort(option.key)}
                        className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors"
                        style={{
                          background: on ? MONO.ink : "transparent",
                          color: on ? MONO.paper : MONO.steel,
                          borderLeft:
                            index === 0
                              ? undefined
                              : `1px solid ${MONO.line}`
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <p
              className="mt-3 text-[11px] uppercase tracking-[0.18em]"
              style={{ color: MONO.muted }}
            >
              {results.length} of {featuredCategoryProducts.length} objects
            </p>

            {/* Grid */}
            {results.length === 0 ? (
              <div
                className="mt-6 grid place-items-center py-24 text-center"
                style={{ border: `1px solid ${MONO.line}` }}
              >
                <div>
                  <p className="text-[16px] font-semibold tracking-[-0.01em]">
                    No objects match.
                  </p>
                  <p
                    className="mt-1 text-[12px]"
                    style={{ color: MONO.steel }}
                  >
                    Clear the search to see the full department.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="mt-5 grid grid-cols-2 lg:grid-cols-3"
                style={{ borderLeft: `1px solid ${MONO.line}` }}
              >
                {results.map((product) => {
                  const inStock =
                    product.variants[0]?.inventory === "in_stock";
                  return (
                    <Link
                      key={product.id}
                      href="/design-lab/d2/product"
                      className="group flex flex-col"
                      style={{
                        borderRight: `1px solid ${MONO.line}`,
                        borderBottom: `1px solid ${MONO.line}`
                      }}
                    >
                      <div className="relative">
                        <ProductImage
                          alt={product.title}
                          className="aspect-square transition-transform duration-300 group-hover:scale-[1.02]"
                          sizes="(max-width: 1024px) 50vw, 280px"
                          src={
                            product.images[0]?.url ??
                            product.variants[0]?.image
                          }
                        />
                        <span className="absolute left-2.5 top-2.5">
                          <Pill>{inStock ? "Stock" : "Order"}</Pill>
                        </span>
                      </div>
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
                            className="text-[10px] uppercase tracking-[0.14em]"
                            style={{ color: MONO.muted }}
                          >
                            {product.variants.length}{" "}
                            {product.variants.length === 1
                              ? "variant"
                              : "variants"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Section>
    </MonoPage>
  );
}
