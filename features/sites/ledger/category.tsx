"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
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
import type { Category, Product } from "@/lib/types";

/* Ledger category landing — a real category page. Receives the
 * resolved category + its products from the server route, then runs
 * client-side in-category search and sorting over the live catalog. */

type SortKey = "relevance" | "price-asc" | "price-desc" | "variants";

export function LedgerCategoryView({
  category,
  categoryProducts,
  siblingCategories
}: {
  category: Category;
  categoryProducts: Product[];
  siblingCategories: Array<{ name: string; slug: string; count: number }>;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("relevance");

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = categoryProducts.filter(
      (product) =>
        !normalized ||
        product.title.toLowerCase().includes(normalized) ||
        product.variants.some((variant) =>
          variant.sku.toLowerCase().includes(normalized)
        )
    );
    const sorted = [...filtered];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "variants") {
      sorted.sort((a, b) => b.variants.length - a.variants.length);
    }
    return sorted;
  }, [categoryProducts, query, sort]);

  const prices = categoryProducts.map((product) => product.price).filter((price) => price > 0);
  const priceLow = prices.length ? Math.min(...prices) : 0;
  const priceHigh = prices.length ? Math.max(...prices) : 0;
  const variantCount = categoryProducts.reduce(
    (total, product) => total + product.variants.length,
    0
  );

  return (
    <LedgerPage wide>
      <div className="py-5">
        <Breadcrumb
          trail={[
            { label: "Overview", href: "/ledger" },
            { label: "Catalog", href: "/ledger/search" },
            { label: category.name }
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
          {category.name}
        </h1>
        <p
          className="mt-2 max-w-xl text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          {categoryProducts.length} SKUs catalogued in this line, spanning{" "}
          {variantCount} stocked variants. Volume pricing and Net-30 terms apply
          across every item.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Pill bg="rgba(255,255,255,0.1)" fg="#ffffff">
            {categoryProducts.length} SKUs
          </Pill>
          {priceHigh > 0 ? (
            <Pill bg="rgba(255,255,255,0.1)" fg="#ffffff">
              {formatUsd(priceLow)} &ndash; {formatUsd(priceHigh)} per unit
            </Pill>
          ) : null}
          <Pill bg="rgba(255,255,255,0.1)" fg="#aab1ff">
            Tier 2 pricing active
          </Pill>
        </div>
      </header>

      <div className="grid gap-6 py-8 lg:grid-cols-12">
        {/* Sibling categories */}
        <aside className="lg:col-span-3">
          <Card className="p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: LEDGER.muted }}
            >
              Related lines
            </p>
            <div className="mt-3 space-y-1">
              {siblingCategories.map((sibling) => {
                const active = sibling.slug === category.slug;
                return (
                  <Link
                    key={sibling.slug}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] transition"
                    href={`/ledger/categories/${sibling.slug}`}
                    style={{
                      backgroundColor: active ? LEDGER.indigoSoft : "transparent",
                      color: active ? LEDGER.indigo : LEDGER.body,
                      fontWeight: active ? 600 : 500
                    }}
                  >
                    <span className="truncate">{sibling.name}</span>
                    <span
                      className="ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[11px]"
                      style={{
                        backgroundColor: active ? LEDGER.indigo : LEDGER.canvas,
                        color: active ? "#ffffff" : LEDGER.muted
                      }}
                    >
                      {sibling.count}
                    </span>
                  </Link>
                );
              })}
            </div>
            <Link
              className="mt-4 flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition"
              href="/ledger/search"
              style={{ backgroundColor: LEDGER.indigoSoft, color: LEDGER.indigo }}
            >
              Search all categories <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </aside>

        {/* Grid */}
        <div className="lg:col-span-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                backgroundColor: LEDGER.surface,
                border: `1px solid ${LEDGER.line}`
              }}
            >
              <input
                className="w-56 bg-transparent text-sm outline-none"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter this category by SKU or name"
                style={{ color: LEDGER.ink }}
                value={query}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium" style={{ color: LEDGER.muted }}>
                {rows.length} result{rows.length === 1 ? "" : "s"}
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
                <option value="variants">Most variants</option>
              </select>
            </div>
          </div>

          {rows.length === 0 ? (
            <Card className="mt-5 p-16 text-center">
              <Package className="mx-auto h-10 w-10" style={{ color: LEDGER.muted }} />
              <p className="mt-3 text-sm font-semibold" style={{ color: LEDGER.ink }}>
                No SKUs match this filter.
              </p>
              <p className="mt-1 text-[13px]" style={{ color: LEDGER.body }}>
                Clear the filter field to see the full {category.name} line.
              </p>
            </Card>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((product) => (
                <LedgerProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </LedgerPage>
  );
}
