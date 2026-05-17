"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowRight, Filter, Package, Search } from "lucide-react";
import {
  Breadcrumb,
  Card,
  D7DesignBadge,
  D7Page,
  Eyebrow,
  LEDGER,
  Pill,
  formatUsd
} from "./kit";
import {
  categories,
  featuredCategoryProducts,
  featuredCategorySlug,
  getCategoryProducts,
  topCategories
} from "@/features/design-lab/live-data";

/* d7 "Ledger" catalog — a procurement catalog view.
 * Marketing: facets reduce friction for buyers sourcing a specific
 * line. Finance: each row shows unit price + variant span so a buyer
 * can scan total cost exposure. Category facets use real SKU counts. */

const ACTIVE_CATEGORY =
  categories.find((category) => category.slug === featuredCategorySlug) ??
  categories[0];

const FACETS = topCategories.map((category) => ({
  name: category.name,
  slug: category.slug,
  count: getCategoryProducts(category.slug).length
}));

type SortKey = "relevance" | "price-asc" | "price-desc";

export function D7Category() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("relevance");

  const rows = useMemo(() => {
    const filtered = featuredCategoryProducts.filter((product) =>
      query.trim() === ""
        ? true
        : product.title.toLowerCase().includes(query.trim().toLowerCase()) ||
          product.variants.some((variant) =>
            variant.sku.toLowerCase().includes(query.trim().toLowerCase())
          )
    );
    const sorted = [...filtered];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [query, sort]);

  const priceLow = featuredCategoryProducts.length
    ? Math.min(...featuredCategoryProducts.map((product) => product.price))
    : 0;
  const priceHigh = featuredCategoryProducts.length
    ? Math.max(...featuredCategoryProducts.map((product) => product.price))
    : 0;

  return (
    <D7Page wide>
      <div className="pt-5">
        <D7DesignBadge />
      </div>

      <div className="py-5">
        <Breadcrumb
          trail={[
            { label: "Overview", href: "/design-lab/d7/home" },
            { label: "Catalog", href: "/design-lab/d7/category" },
            { label: ACTIVE_CATEGORY?.name ?? "Category" }
          ]}
        />
      </div>

      {/* Category header */}
      <header
        className="rounded-2xl p-6 sm:p-8"
        style={{ backgroundColor: LEDGER.ink }}
      >
        <Eyebrow>Procurement catalog</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {ACTIVE_CATEGORY?.name ?? "Catalog"}
        </h1>
        <p
          className="mt-2 max-w-xl text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          {featuredCategoryProducts.length} SKUs catalogued in this line.
          Volume pricing and Net-30 terms apply across every item.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Pill bg="rgba(255,255,255,0.1)" fg="#ffffff">
            {featuredCategoryProducts.length} SKUs
          </Pill>
          <Pill bg="rgba(255,255,255,0.1)" fg="#ffffff">
            {formatUsd(priceLow)} &ndash; {formatUsd(priceHigh)} per unit
          </Pill>
          <Pill bg="rgba(255,255,255,0.1)" fg="#aab1ff">
            Tier 2 pricing active
          </Pill>
        </div>
      </header>

      <div className="grid gap-6 py-8 lg:grid-cols-12">
        {/* Facet rail */}
        <aside className="lg:col-span-3">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" style={{ color: LEDGER.indigo }} />
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: LEDGER.muted }}
              >
                Lines of supply
              </p>
            </div>
            <div className="mt-3 space-y-1">
              {FACETS.map((facet) => {
                const active = facet.slug === featuredCategorySlug;
                return (
                  <Link
                    key={facet.slug}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] transition"
                    href="/design-lab/d7/category"
                    style={{
                      backgroundColor: active ? LEDGER.indigoSoft : "transparent",
                      color: active ? LEDGER.indigo : LEDGER.body,
                      fontWeight: active ? 600 : 500
                    }}
                  >
                    <span className="truncate">{facet.name}</span>
                    <span
                      className="ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[11px]"
                      style={{
                        backgroundColor: active ? LEDGER.indigo : LEDGER.canvas,
                        color: active ? "#ffffff" : LEDGER.muted
                      }}
                    >
                      {facet.count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card className="mt-3 p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Account benefits
            </p>
            <ul className="mt-3 space-y-2.5 text-[13px]" style={{ color: LEDGER.body }}>
              {[
                "Net-30 billing on every order",
                "Automatic volume price breaks",
                "Saved reorder lists per jobsite",
                "Spend rolls into account reports"
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: LEDGER.indigo }}
                  />
                  {line}
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        {/* Grid */}
        <div className="lg:col-span-9">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                backgroundColor: LEDGER.surface,
                border: `1px solid ${LEDGER.line}`
              }}
            >
              <Search className="h-4 w-4" style={{ color: LEDGER.muted }} />
              <input
                className="w-52 bg-transparent text-sm outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search SKU or product"
                style={{ color: LEDGER.ink }}
                value={query}
              />
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[12px] font-medium"
                style={{ color: LEDGER.muted }}
              >
                {rows.length} results
              </span>
              <select
                className="rounded-xl px-3 py-2 text-[13px] font-medium outline-none"
                onChange={(event) => setSort(event.target.value as SortKey)}
                style={{
                  backgroundColor: LEDGER.surface,
                  border: `1px solid ${LEDGER.line}`,
                  color: LEDGER.ink
                }}
                value={sort}
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="price-asc">Price: Low to high</option>
                <option value="price-desc">Price: High to low</option>
              </select>
            </div>
          </div>

          {rows.length === 0 ? (
            <Card className="mt-5 p-16 text-center">
              <Package
                className="mx-auto h-10 w-10"
                style={{ color: LEDGER.muted }}
              />
              <p
                className="mt-3 text-sm font-semibold"
                style={{ color: LEDGER.ink }}
              >
                No SKUs match this search.
              </p>
              <p className="mt-1 text-[13px]" style={{ color: LEDGER.body }}>
                Try a different part number or clear the search field.
              </p>
            </Card>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((product) => {
                const variant = product.variants[0];
                const image = product.images[0]?.url ?? variant?.image;
                return (
                  <Link
                    key={product.id}
                    className="group flex flex-col overflow-hidden rounded-2xl transition"
                    href="/design-lab/d7/product"
                    style={{
                      backgroundColor: LEDGER.surface,
                      border: `1px solid ${LEDGER.line}`
                    }}
                  >
                    <div
                      className="flex h-44 items-center justify-center"
                      style={{ backgroundColor: LEDGER.canvas }}
                    >
                      {image ? (
                        <Image
                          alt={product.title}
                          className="h-full w-full object-contain p-5"
                          height={300}
                          quality={75}
                          src={image}
                          width={300}
                        />
                      ) : (
                        <Package
                          className="h-10 w-10"
                          style={{ color: LEDGER.muted }}
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                          style={{ color: LEDGER.muted }}
                        >
                          SKU {variant?.sku ?? product.id}
                        </span>
                        {product.variants.length > 1 ? (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{
                              backgroundColor: LEDGER.indigoSoft,
                              color: LEDGER.indigo
                            }}
                          >
                            {product.variants.length} variants
                          </span>
                        ) : null}
                      </div>
                      <p
                        className="mt-1.5 flex-1 text-[14px] font-semibold leading-snug"
                        style={{ color: LEDGER.ink }}
                      >
                        {product.title}
                      </p>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <p
                            className="text-base font-semibold tracking-tight"
                            style={{ color: LEDGER.ink }}
                          >
                            {formatUsd(product.price)}
                          </p>
                          <p
                            className="text-[11px] font-medium"
                            style={{ color: LEDGER.muted }}
                          >
                            per unit &middot; volume breaks
                          </p>
                        </div>
                        <span
                          className="flex items-center gap-1 text-[12px] font-semibold transition group-hover:gap-1.5"
                          style={{ color: LEDGER.indigo }}
                        >
                          Details <ArrowRight className="h-3.5 w-3.5" />
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
    </D7Page>
  );
}
