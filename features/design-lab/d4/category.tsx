"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Heart,
  LayoutGrid,
  MapPin,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Star
} from "lucide-react";
import { D4Shell, D4Stars, brandClasses } from "./shell";

type Product = {
  id: number;
  name: string;
  brand: string;
  price: number;
  was?: number;
  rating: number;
  reviews: number;
  stock: number;
  cat: string;
  badge?: string;
  tint: string;
};

const PRODUCTS: Product[] = [
  { id: 1, name: "Heavy-Duty Cantilever Gate Roller Kit", brand: "ForgeLine", price: 142, was: 189, rating: 4.8, reviews: 214, stock: 38, cat: "Gate Hardware", badge: "Best Seller", tint: "from-amber-200 to-amber-50" },
  { id: 2, name: "Self-Closing Gravity Gate Hinge — Pair", brand: "ForgeLine", price: 54.99, was: 71, rating: 4.7, reviews: 332, stock: 120, cat: "Gate Hardware", tint: "from-emerald-200 to-emerald-50" },
  { id: 3, name: "Lockable Drop-Rod Gate Latch", brand: "BoltCraft", price: 31.5, rating: 4.6, reviews: 96, stock: 60, cat: "Gate Hardware", tint: "from-sky-200 to-sky-50" },
  { id: 4, name: '2" x 2" x 11ga Galvanized Steel Tube — 24 ft', brand: "MillStock", price: 78.5, was: 96, rating: 4.9, reviews: 88, stock: 9, cat: "Steel & Tube", badge: "Low Stock", tint: "from-slate-200 to-slate-50" },
  { id: 5, name: "#4 Grade-60 Rebar — 20 ft Bundle", brand: "MillStock", price: 64, rating: 4.8, reviews: 51, stock: 200, cat: "Steel & Tube", tint: "from-orange-200 to-orange-50" },
  { id: 6, name: '1/2"-13 Hot-Dip Carriage Bolts — 50 ct', brand: "BoltCraft", price: 22.75, rating: 4.5, reviews: 410, stock: 480, cat: "Fasteners", tint: "from-violet-200 to-violet-50" },
  { id: 7, name: "Structural Hex Bolt Assortment — 240 pc", brand: "BoltCraft", price: 89, was: 110, rating: 4.7, reviews: 162, stock: 33, cat: "Fasteners", badge: "Deal", tint: "from-rose-200 to-rose-50" },
  { id: 8, name: "MIG Welding Wire ER70S-6 — 33 lb Spool", brand: "ArcMaster", price: 96.5, rating: 4.9, reviews: 77, stock: 18, cat: "Welding", tint: "from-amber-200 to-orange-50" },
  { id: 9, name: "Auto-Darkening Welding Helmet", brand: "ArcMaster", price: 134, was: 169, rating: 4.8, reviews: 245, stock: 0, cat: "Welding", badge: "Sold Out", tint: "from-slate-300 to-slate-100" },
  { id: 10, name: "M18 FUEL Brushless Impact Driver Kit", brand: "RedPoint", price: 219, was: 259, rating: 4.9, reviews: 1204, stock: 25, cat: "Power Tools", badge: "Top Rated", tint: "from-emerald-200 to-sky-50" },
  { id: 11, name: "7-1/4 in Circular Saw — Corded", brand: "RedPoint", price: 128, rating: 4.6, reviews: 318, stock: 14, cat: "Power Tools", tint: "from-sky-200 to-violet-50" },
  { id: 12, name: "Cut-Resistant Work Gloves — 6 Pack", brand: "SiteSafe", price: 27.99, rating: 4.7, reviews: 540, stock: 300, cat: "Safety Gear", tint: "from-orange-200 to-rose-50" }
];

const CATEGORIES = [
  "Gate Hardware",
  "Steel & Tube",
  "Fasteners",
  "Welding",
  "Power Tools",
  "Safety Gear"
];

const SORTS = ["Most popular", "Price: low to high", "Price: high to low", "Top rated"];

export function D4Category() {
  const [cats, setCats] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(260);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState(SORTS[0]);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = PRODUCTS.filter(
      (p) =>
        (cats.length === 0 || cats.includes(p.cat)) &&
        p.price <= maxPrice &&
        (!inStockOnly || p.stock > 0) &&
        p.name.toLowerCase().includes(query.toLowerCase())
    );
    if (sort === "Price: low to high") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "Price: high to low") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "Top rated") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === "Most popular") list = [...list].sort((a, b) => b.reviews - a.reviews);
    return list;
  }, [cats, maxPrice, inStockOnly, sort, query]);

  const toggleCat = (c: string) =>
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

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
            <span className="font-semibold text-slate-600">All products</span>
          </nav>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Shop all products
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
                const n = PRODUCTS.filter((p) => p.cat === c).length;
                return (
                  <label
                    key={c}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={cats.includes(c)}
                      onChange={() => toggleCat(c)}
                      className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                    />
                    <span className="flex-1 text-slate-700">{c}</span>
                    <span className="text-xs text-slate-400">{n}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className={`${brandClasses.card} p-4`}>
            <p className="text-sm font-bold text-slate-900">Max price</p>
            <input
              type="range"
              min={20}
              max={260}
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
                  setCats([]);
                  setMaxPrice(260);
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
              {filtered.map((p) => {
                const out = p.stock === 0;
                return (
                  <article
                    key={p.id}
                    className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-100"
                  >
                    <div className={`relative aspect-square bg-gradient-to-br ${p.tint}`}>
                      {p.badge ? (
                        <span
                          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm ${
                            out
                              ? "bg-slate-700 text-white"
                              : "bg-white/90 text-slate-700"
                          }`}
                        >
                          {p.badge}
                        </span>
                      ) : null}
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
                        {p.brand}
                      </p>
                      <Link
                        href="/design-lab/d4/product"
                        className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-orange-600"
                      >
                        {p.name}
                      </Link>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <D4Stars value={p.rating} />
                        <span className="text-xs text-slate-400">
                          ({p.reviews})
                        </span>
                      </div>
                      <div className="mt-2 flex items-end gap-2">
                        <span className="text-lg font-extrabold text-slate-900">
                          ${p.price.toFixed(2)}
                        </span>
                        {p.was ? (
                          <span className="text-sm text-slate-400 line-through">
                            ${p.was.toFixed(2)}
                          </span>
                        ) : null}
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
                          href={out ? "#" : "/design-lab/d4/cart"}
                          aria-disabled={out}
                          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
                            out
                              ? "cursor-not-allowed bg-slate-100 text-slate-400"
                              : "bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white"
                          }`}
                        >
                          {out ? (
                            <>
                              <Star className="h-4 w-4" /> Notify me
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4" /> Add to cart
                            </>
                          )}
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
