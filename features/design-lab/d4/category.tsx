"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Heart,
  LayoutGrid,
  MapPin,
  Search,
  ShoppingCart,
  SlidersHorizontal
} from "lucide-react";
import {
  featuredCategoryProducts,
  topCategories
} from "@/features/design-lab/live-data";
import type { Product } from "@/lib/types";
import { D4Shell, D4Stars, brandClasses } from "./shell";

// Real catalog products for the featured category.
const PRODUCTS: Product[] = featuredCategoryProducts;
const CATEGORIES = topCategories;
const SORTS = ["Most popular", "Price: low to high", "Price: high to low", "Top rated"];
const tints = [
  "from-amber-200 to-amber-50",
  "from-sky-200 to-sky-50",
  "from-emerald-200 to-emerald-50",
  "from-violet-200 to-violet-50",
  "from-orange-200 to-orange-50",
  "from-rose-200 to-rose-50",
  "from-slate-200 to-slate-50"
];

const maxCatalogPrice = Math.max(
  100,
  Math.ceil(PRODUCTS.reduce((max, p) => Math.max(max, p.price), 0))
);

export function D4Category() {
  const [maxPrice, setMaxPrice] = useState(maxCatalogPrice);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState(SORTS[0]);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = PRODUCTS.filter((p) => {
      const matchesPrice = p.price <= maxPrice;
      const hasStock = p.variants.some(
        (variant) => variant.inventory === "in_stock"
      );
      const matchesQuery =
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.variants.some((variant) =>
          variant.sku.toLowerCase().includes(query.toLowerCase())
        );
      return matchesPrice && (!inStockOnly || hasStock) && matchesQuery;
    });
    if (sort === "Price: low to high")
      list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "Price: high to low")
      list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "Top rated")
      list = [...list].sort((a, b) => b.variants.length - a.variants.length);
    if (sort === "Most popular")
      list = [...list].sort((a, b) => b.variants.length - a.variants.length);
    return list;
  }, [maxPrice, inStockOnly, sort, query]);

  return (
    <D4Shell active="category">
      {/* hero strip */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="mx-auto max-w-6xl px-5 py-7">
          <nav className="flex items-center gap-1 text-xs text-slate-400">
            <Link href="/design-lab/d4/home" className="hover:text-orange-600">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-slate-600">
              {PRODUCTS[0]?.category.name ?? "All products"}
            </span>
          </nav>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            {PRODUCTS[0]?.category.name ?? "Shop all products"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {PRODUCTS.length} contractor-grade items · honest stock counts ·
            free pickup today
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Filters */}
        <aside className="space-y-4">
          <div className={`${brandClasses.card} p-4`}>
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search results..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className={`${brandClasses.card} p-4`}>
            <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <SlidersHorizontal className="h-4 w-4 text-orange-500" /> Category
            </p>
            <div className="mt-3 space-y-1">
              {CATEGORIES.map((c) => {
                const isCurrent = c.slug === PRODUCTS[0]?.category.slug;
                return (
                  <Link
                    key={c.slug}
                    href="/design-lab/d4/category"
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-slate-50 ${
                      isCurrent ? "bg-orange-50 font-semibold text-orange-600" : ""
                    }`}
                  >
                    <span className="flex-1 text-slate-700">{c.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className={`${brandClasses.card} p-4`}>
            <p className="text-sm font-bold text-slate-900">Max price</p>
            <input
              type="range"
              min={0}
              max={maxCatalogPrice}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="mt-3 w-full accent-orange-500"
            />
            <p className="mt-1 text-sm text-slate-500">
              Up to{" "}
              <span className="font-bold text-slate-900">${maxPrice}</span>
            </p>
          </div>

          <div className={`${brandClasses.card} p-4`}>
            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-sm font-bold text-slate-900">
                In stock only
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={inStockOnly}
                onClick={() => setInStockOnly((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition ${
                  inStockOnly ? "bg-orange-500" : "bg-slate-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                    inStockOnly ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </label>
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <LayoutGrid className="h-4 w-4 text-orange-500" />
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">
                Sort by
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-xl border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 focus:ring-orange-400"
              >
                {SORTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="grid place-items-center rounded-2xl bg-slate-50 py-20 text-center ring-1 ring-slate-100">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-orange-500 ring-1 ring-slate-100">
                <Search className="h-6 w-6" />
              </div>
              <p className="mt-3 text-base font-bold text-slate-900">
                No matches yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try widening your price range or clearing filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMaxPrice(maxCatalogPrice);
                  setInStockOnly(false);
                  setQuery("");
                }}
                className={`${brandClasses.btnSoft} mt-4 px-4 py-2 text-sm`}
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {filtered.map((p, index) => {
                const variant = p.variants[0];
                const out =
                  !p.variants.some((v) => v.inventory === "in_stock");
                return (
                  <article
                    key={p.id}
                    className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-100"
                  >
                    <div
                      className={`relative aspect-square bg-gradient-to-br ${tints[index % tints.length]}`}
                    >
                      <Image
                        alt={p.title}
                        src={p.images[0]?.url ?? variant?.image ?? "/assets/logo.svg"}
                        fill
                        quality={75}
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-contain p-6"
                      />
                      <button
                        type="button"
                        aria-label="Save item"
                        className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-400 shadow-sm transition hover:text-rose-500"
                      >
                        <Heart className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-orange-500">
                        {p.specifications.Brand ?? p.category.name}
                      </p>
                      <Link
                        href="/design-lab/d4/product"
                        className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-orange-600"
                      >
                        {p.title}
                      </Link>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <D4Stars value={4.7} />
                        <span className="text-xs text-slate-400">
                          ({p.variants.length} variant
                          {p.variants.length === 1 ? "" : "s"})
                        </span>
                      </div>
                      <div className="mt-2 flex items-end gap-2">
                        <span className="text-lg font-extrabold text-slate-900">
                          ${p.price.toFixed(2)}
                        </span>
                      </div>
                      {out ? (
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          Out of stock
                        </p>
                      ) : (
                        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <MapPin className="h-3.5 w-3.5" /> Pickup today
                        </p>
                      )}
                      <div className="mt-auto pt-3">
                        <Link
                          href="/design-lab/d4/product"
                          className="flex items-center justify-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-sm font-bold text-orange-600 transition hover:bg-orange-500 hover:text-white"
                        >
                          <ShoppingCart className="h-4 w-4" /> View product
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </D4Shell>
  );
}
