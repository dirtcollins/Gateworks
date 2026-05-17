"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  featuredCategoryProducts,
  featuredCategorySlug,
  getCategoryProducts,
  topCategories
} from "@/features/design-lab/live-data";
import type { Product } from "@/lib/types";
import { Card, Kbd, Pill, SIGNAL, SignalShell, formatUsd } from "./kit";

// d10 "Signal" — category. Fast keyboard-first client-side search, facet
// filter and sort over real catalog products. No page reloads.

type SortKey = "relevance" | "price-asc" | "price-desc" | "variants";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "relevance", label: "Relevance" },
  { key: "price-asc", label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
  { key: "variants", label: "Most options" }
];

function productImage(product: Product): string {
  return (
    product.images[0]?.url ?? product.variants[0]?.image ?? "/assets/logo.svg"
  );
}

export function D10Category() {
  const [activeSlug, setActiveSlug] = useState<string>(featuredCategorySlug);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("relevance");

  const base = useMemo<Product[]>(
    () =>
      activeSlug === featuredCategorySlug
        ? featuredCategoryProducts
        : getCategoryProducts(activeSlug),
    [activeSlug]
  );

  const filtered = useMemo<Product[]>(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? base.filter(
          (product) =>
            product.title.toLowerCase().includes(q) ||
            product.variants.some((variant) =>
              variant.sku.toLowerCase().includes(q)
            )
        )
      : [...base];

    switch (sort) {
      case "price-asc":
        return matched.sort((a, b) => a.price - b.price);
      case "price-desc":
        return matched.sort((a, b) => b.price - a.price);
      case "variants":
        return matched.sort(
          (a, b) => b.variants.length - a.variants.length
        );
      default:
        return matched;
    }
  }, [base, query, sort]);

  const activeCategory =
    topCategories.find((category) => category.slug === activeSlug) ??
    topCategories[0];

  return (
    <SignalShell active="category">
      <div className="mx-auto max-w-6xl px-5 py-7">
        <div className="flex items-center gap-2">
          <Pill tone="accent">Catalog</Pill>
          <span className="text-[12px]" style={{ color: SIGNAL.sub }}>
            Live client-side index — filters apply instantly
          </span>
        </div>
        <h1
          className="mt-3 text-[26px] font-semibold tracking-tight"
          style={{ color: SIGNAL.ink }}
        >
          {activeCategory?.name ?? "Catalog"}
        </h1>

        <div className="mt-5 grid gap-6 lg:grid-cols-[200px_1fr]">
          {/* facet sidebar */}
          <aside>
            <Card className="p-3">
              <p
                className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: SIGNAL.sub }}
              >
                Categories
              </p>
              <div className="space-y-0.5">
                {topCategories.map((category) => {
                  const on = category.slug === activeSlug;
                  const count = getCategoryProducts(category.slug).length;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setActiveSlug(category.slug);
                        setQuery("");
                      }}
                      className="flex w-full items-center justify-between rounded-[7px] px-2 py-1.5 text-left text-[12px] transition-colors"
                      style={{
                        background: on ? SIGNAL.accentSoft : "transparent",
                        color: on ? SIGNAL.accent : SIGNAL.ink,
                        fontWeight: on ? 600 : 500
                      }}
                    >
                      <span className="truncate">{category.name}</span>
                      <span
                        className="ml-2 shrink-0 text-[10px] tabular-nums"
                        style={{ color: on ? SIGNAL.accent : SIGNAL.sub }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </aside>

          {/* results */}
          <div>
            {/* search + sort toolbar */}
            <Card className="flex flex-wrap items-center gap-3 p-2.5">
              <div
                className="flex flex-1 items-center gap-2 rounded-[8px] border px-2.5 py-1.5"
                style={{ borderColor: SIGNAL.line, background: SIGNAL.canvas }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 shrink-0"
                  fill="none"
                  stroke={SIGNAL.accent}
                  strokeWidth={2.4}
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4-4" />
                </svg>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter this category by name or SKU…"
                  className="w-full bg-transparent text-[13px] outline-none placeholder:text-[#9aa0ac]"
                  style={{ color: SIGNAL.ink }}
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear filter"
                    className="text-[11px] font-medium"
                    style={{ color: SIGNAL.sub }}
                  >
                    Clear
                  </button>
                ) : (
                  <Kbd>/</Kbd>
                )}
              </div>
              <div className="flex items-center gap-1">
                {SORTS.map((option) => {
                  const on = option.key === sort;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSort(option.key)}
                      className="rounded-[7px] px-2 py-1.5 text-[11px] font-medium transition-colors"
                      style={{
                        background: on ? SIGNAL.accentSoft : "transparent",
                        color: on ? SIGNAL.accent : SIGNAL.sub
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </Card>

            <p className="mt-3 text-[12px]" style={{ color: SIGNAL.sub }}>
              <span className="font-semibold" style={{ color: SIGNAL.ink }}>
                {filtered.length}
              </span>{" "}
              result{filtered.length === 1 ? "" : "s"}
              {query ? ` for “${query}”` : ""}
            </p>

            {filtered.length === 0 ? (
              <Card className="mt-3 px-5 py-16 text-center">
                <p
                  className="text-[14px] font-semibold"
                  style={{ color: SIGNAL.ink }}
                >
                  Nothing matches that filter
                </p>
                <p className="mt-1 text-[12px]" style={{ color: SIGNAL.sub }}>
                  Try a shorter term or clear the filter to see the full
                  category.
                </p>
              </Card>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((product) => {
                  const sku = product.variants[0]?.sku ?? "—";
                  return (
                    <Link
                      key={product.id}
                      href="/design-lab/d10/product"
                      className="group block overflow-hidden rounded-[12px] border bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-22px_rgba(15,17,23,0.45)]"
                      style={{ borderColor: SIGNAL.line }}
                    >
                      <div
                        className="relative aspect-square"
                        style={{ background: SIGNAL.canvas }}
                      >
                        <Image
                          src={productImage(product)}
                          alt={product.title}
                          fill
                          quality={75}
                          sizes="(max-width: 1024px) 50vw, 220px"
                          className="object-contain p-5 transition-transform duration-300 group-hover:scale-105"
                        />
                        {product.variants.length > 1 ? (
                          <div className="absolute left-2 top-2">
                            <Pill tone="neutral">
                              {product.variants.length} options
                            </Pill>
                          </div>
                        ) : null}
                      </div>
                      <div
                        className="border-t p-3"
                        style={{ borderColor: SIGNAL.line }}
                      >
                        <p
                          className="line-clamp-2 min-h-[34px] text-[12px] font-medium leading-tight"
                          style={{ color: SIGNAL.ink }}
                        >
                          {product.title}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className="text-[14px] font-semibold tabular-nums"
                            style={{ color: SIGNAL.ink }}
                          >
                            {formatUsd(product.price)}
                          </span>
                          <span
                            className="text-[10px] tabular-nums"
                            style={{ color: SIGNAL.sub }}
                          >
                            {sku}
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
      </div>
    </SignalShell>
  );
}
