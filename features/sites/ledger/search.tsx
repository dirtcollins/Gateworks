"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Package } from "lucide-react";
import {
  Breadcrumb,
  Card,
  Eyebrow,
  LedgerPage,
  LedgerSearch,
  LEDGER,
  Pill
} from "./kit";
import { LedgerProductCard } from "./product-card";
import { categories, searchProducts } from "@/lib/catalog";

/* Ledger search results — real catalog query + category filtering.
 * Reads the q/category search params, runs searchProducts() over the
 * live catalog, supports client-side sorting and an empty state. */

type SortKey = "relevance" | "price-asc" | "price-desc" | "variants";

const facetCategories = categories
  .map((category) => ({
    ...category,
    count: searchProducts("", category.slug).length
  }))
  .filter((category) => category.count > 0)
  .sort((a, b) => b.count - a.count);

export function LedgerSearchView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "all";
  const [sort, setSort] = useState<SortKey>("relevance");

  const results = useMemo(() => {
    const base = searchProducts(query, category);
    const sorted = [...base];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "variants") {
      sorted.sort((a, b) => b.variants.length - a.variants.length);
    }
    return sorted;
  }, [query, category, sort]);

  const activeCategory = categories.find((item) => item.slug === category);

  function setCategory(slug: string) {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (slug !== "all") params.set("category", slug);
    const queryString = params.toString();
    router.push(queryString ? `/ledger/search?${queryString}` : "/ledger/search");
  }

  return (
    <LedgerPage wide>
      <div className="py-5">
        <Breadcrumb
          trail={[
            { label: "Overview", href: "/ledger" },
            { label: "Catalog", href: "/ledger/search" },
            { label: activeCategory ? activeCategory.name : query ? `“${query}”` : "All products" }
          ]}
        />
      </div>

      {/* Header */}
      <header
        className="rounded-2xl p-6 sm:p-8"
        style={{ backgroundColor: LEDGER.ink }}
      >
        <Eyebrow>Procurement catalog</Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {activeCategory
            ? activeCategory.name
            : query
              ? `Results for “${query}”`
              : "Browse the full catalog"}
        </h1>
        <p
          className="mt-2 max-w-xl text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          {results.length} SKU{results.length === 1 ? "" : "s"} match. Volume
          pricing and Net-30 terms apply across every item.
        </p>
        <div className="mt-5 max-w-xl">
          <LedgerSearch initialQuery={query} />
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
              <button
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition"
                onClick={() => setCategory("all")}
                style={{
                  backgroundColor: category === "all" ? LEDGER.indigoSoft : "transparent",
                  color: category === "all" ? LEDGER.indigo : LEDGER.body,
                  fontWeight: category === "all" ? 600 : 500
                }}
                type="button"
              >
                <span>All categories</span>
              </button>
              {facetCategories.map((facet) => {
                const active = facet.slug === category;
                return (
                  <button
                    key={facet.slug}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition"
                    onClick={() => setCategory(facet.slug)}
                    style={{
                      backgroundColor: active ? LEDGER.indigoSoft : "transparent",
                      color: active ? LEDGER.indigo : LEDGER.body,
                      fontWeight: active ? 600 : 500
                    }}
                    type="button"
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
                  </button>
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

        {/* Results */}
        <div className="lg:col-span-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-medium" style={{ color: LEDGER.muted }}>
                {results.length} result{results.length === 1 ? "" : "s"}
              </span>
              {activeCategory ? (
                <Pill bg={LEDGER.indigoSoft} fg={LEDGER.indigo}>
                  {activeCategory.name}
                </Pill>
              ) : null}
            </div>
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

          {results.length === 0 ? (
            <Card className="mt-5 p-16 text-center">
              <Package className="mx-auto h-10 w-10" style={{ color: LEDGER.muted }} />
              <p className="mt-3 text-sm font-semibold" style={{ color: LEDGER.ink }}>
                No SKUs match this search.
              </p>
              <p className="mt-1 text-[13px]" style={{ color: LEDGER.body }}>
                Try a different part number, broaden the category filter, or
                clear the search field.
              </p>
              <button
                className="mt-4 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition"
                onClick={() => router.push("/ledger/search")}
                style={{ backgroundColor: LEDGER.indigo }}
                type="button"
              >
                Clear search
              </button>
            </Card>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((product) => (
                <LedgerProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </LedgerPage>
  );
}
