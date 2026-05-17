"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  LayoutGrid,
  Rows3,
  SlidersHorizontal,
  Star
} from "lucide-react";
import { D1DesignBadge, D1Page, Eyebrow, formatUsd } from "./kit";

type Product = {
  name: string;
  sku: string;
  price: number;
  rating: number;
  group: string;
  tone: string;
  inStock: boolean;
};

const PRODUCTS: Product[] = [
  { name: "Heavy-Duty Cantilever Roller Kit", sku: "GW-CR-2400", price: 289.0, rating: 4.8, group: "Rollers & Track", tone: "#16150f", inStock: true },
  { name: "Welded Box Hinge Set — Bolt-On", sku: "GW-BH-880", price: 64.0, rating: 4.6, group: "Hinges", tone: "#2f6f4e", inStock: true },
  { name: "Slide Gate Latch — Lockable", sku: "GW-SL-440", price: 52.0, rating: 4.7, group: "Latches", tone: "#6c685c", inStock: true },
  { name: "Cantilever Track — 21 ft", sku: "GW-CT-2100", price: 178.0, rating: 4.5, group: "Rollers & Track", tone: "#d6a93f", inStock: true },
  { name: "Adjustable Gate Wheel — 6 in", sku: "GW-GW-060", price: 38.5, rating: 4.4, group: "Wheels", tone: "#16150f", inStock: false },
  { name: "Drop Rod & Catch Assembly", sku: "GW-DR-300", price: 29.75, rating: 4.3, group: "Latches", tone: "#2f6f4e", inStock: true },
  { name: "Self-Closing Spring Hinge — Pair", sku: "GW-SH-220", price: 47.0, rating: 4.6, group: "Hinges", tone: "#6c685c", inStock: true },
  { name: "Internal Track Roller Set", sku: "GW-IR-090", price: 88.5, rating: 4.5, group: "Rollers & Track", tone: "#d6a93f", inStock: true },
  { name: "Heavy Barrel Bolt — 12 in", sku: "GW-BB-120", price: 21.25, rating: 4.2, group: "Latches", tone: "#16150f", inStock: true },
  { name: "Gate Frame Corner Bracket — 4pk", sku: "GW-CB-040", price: 33.0, rating: 4.4, group: "Brackets", tone: "#2f6f4e", inStock: true },
  { name: "Industrial Caster Wheel — 8 in", sku: "GW-CW-080", price: 56.5, rating: 4.7, group: "Wheels", tone: "#6c685c", inStock: true },
  { name: "Weld-On Strap Hinge — Heavy", sku: "GW-WH-150", price: 26.0, rating: 4.5, group: "Hinges", tone: "#d6a93f", inStock: true }
];

const GROUPS = ["Rollers & Track", "Hinges", "Latches", "Wheels", "Brackets"];
const SORTS = ["Featured", "Price: Low to High", "Price: High to Low", "Top rated"];

export function D1Category() {
  const [activeGroups, setActiveGroups] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState(SORTS[0]);
  const [view, setView] = useState<"grid" | "list">("grid");

  const visible = useMemo(() => {
    let list = PRODUCTS.filter(
      (product) =>
        (activeGroups.length === 0 || activeGroups.includes(product.group)) &&
        (!inStockOnly || product.inStock)
    );
    if (sort === "Price: Low to High") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sort === "Price: High to Low") {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sort === "Top rated") {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [activeGroups, inStockOnly, sort]);

  function toggleGroup(group: string) {
    setActiveGroups((current) =>
      current.includes(group)
        ? current.filter((item) => item !== group)
        : [...current, group]
    );
  }

  return (
    <D1Page>
      <div className="pt-5">
        <D1DesignBadge />
      </div>

      <nav className="flex items-center gap-1.5 py-5 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
        <Link className="hover:text-d1-ink" href="/design-lab/d1/home">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-d1-ink">Gate Hardware</span>
      </nav>

      {/* Department header */}
      <header className="border-y-2 border-d1-ink py-8">
        <Eyebrow>Department</Eyebrow>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-d1-ink sm:text-5xl">
            Gate Hardware
          </h1>
          <span className="text-sm font-bold uppercase tracking-[0.12em] text-d1-steel">
            {visible.length} of {PRODUCTS.length} SKUs
          </span>
        </div>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-d1-steel">
          Rollers, hinges, latches and structural brackets for swing and
          slide gates. Contractor-grade hardware, deep counter stock, trade
          pricing applied at checkout.
        </p>
      </header>

      <div className="grid gap-8 py-8 lg:grid-cols-12">
        {/* Filter rail */}
        <aside className="lg:col-span-3">
          <div className="border border-d1-line bg-d1-card">
            <div className="flex items-center gap-2 border-b-2 border-d1-ink px-4 py-3">
              <SlidersHorizontal className="h-4 w-4 text-d1-pine" />
              <span className="text-[12px] font-bold uppercase tracking-[0.14em] text-d1-ink">
                Refine
              </span>
            </div>
            <div className="border-b border-d1-line px-4 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-d1-steel">
                Product group
              </p>
              <div className="mt-3 space-y-2.5">
                {GROUPS.map((group) => (
                  <label
                    key={group}
                    className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-d1-ink"
                  >
                    <input
                      checked={activeGroups.includes(group)}
                      className="h-4 w-4 accent-d1-pine"
                      onChange={() => toggleGroup(group)}
                      type="checkbox"
                    />
                    {group}
                  </label>
                ))}
              </div>
            </div>
            <div className="border-b border-d1-line px-4 py-4">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-d1-ink">
                <input
                  checked={inStockOnly}
                  className="h-4 w-4 accent-d1-pine"
                  onChange={() => setInStockOnly((value) => !value)}
                  type="checkbox"
                />
                In stock only
              </label>
            </div>
            <button
              className="w-full px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-d1-pine transition hover:bg-d1-paper"
              onClick={() => {
                setActiveGroups([]);
                setInStockOnly(false);
              }}
              type="button"
            >
              Clear all filters
            </button>
          </div>

          <div className="mt-5 border border-d1-line bg-d1-ink p-5 text-d1-paper">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-d1-amber">
              Trade desk
            </p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-d1-paper/80">
              Need a bulk quote on gate hardware? Our counter team will spec
              the full assembly.
            </p>
            <Link
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-d1-amber hover:underline"
              href="/design-lab/d1/product"
            >
              Request a quote <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>

        {/* Results */}
        <div className="lg:col-span-9">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-d1-line bg-d1-card px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                Sort
              </span>
              <select
                className="border border-d1-line bg-d1-paper px-2.5 py-1.5 text-sm font-bold text-d1-ink outline-none"
                onChange={(event) => setSort(event.target.value)}
                value={sort}
              >
                {SORTS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { key: "grid", icon: LayoutGrid },
                  { key: "list", icon: Rows3 }
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  aria-label={`${option.key} view`}
                  className={`grid h-9 w-9 place-items-center border transition ${
                    view === option.key
                      ? "border-d1-ink bg-d1-ink text-d1-paper"
                      : "border-d1-line text-d1-steel hover:border-d1-ink"
                  }`}
                  onClick={() => setView(option.key)}
                  type="button"
                >
                  <option.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {view === "grid" ? (
            <div className="grid gap-px border border-d1-line bg-d1-line sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((product) => (
                <Link
                  key={product.sku}
                  className="group flex flex-col bg-d1-card transition hover:bg-white"
                  href="/design-lab/d1/product"
                >
                  <div
                    className="relative flex h-40 items-center justify-center"
                    style={{ backgroundColor: product.tone }}
                  >
                    <span
                      className="text-4xl font-black"
                      style={{ color: "rgba(246,243,236,0.16)" }}
                    >
                      GW
                    </span>
                    {!product.inStock ? (
                      <span className="absolute left-3 top-3 bg-d1-red px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                        Backorder
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                        {product.sku}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-d1-ink">
                        <Star className="h-3 w-3 fill-d1-amber text-d1-amber" />
                        {product.rating}
                      </span>
                    </div>
                    <p className="mt-1.5 flex-1 text-sm font-bold leading-snug text-d1-ink">
                      {product.name}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-d1-line pt-3">
                      <span className="text-lg font-extrabold text-d1-ink">
                        {formatUsd(product.price)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-pine">
                        View <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border border-d1-line bg-d1-line">
              <div className="flex flex-col gap-px">
                {visible.map((product) => (
                  <Link
                    key={product.sku}
                    className="flex items-center gap-4 bg-d1-card p-4 transition hover:bg-white"
                    href="/design-lab/d1/product"
                  >
                    <div
                      className="grid h-16 w-16 shrink-0 place-items-center"
                      style={{ backgroundColor: product.tone }}
                    >
                      <span
                        className="text-lg font-black"
                        style={{ color: "rgba(246,243,236,0.2)" }}
                      >
                        GW
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                        {product.sku} &middot; {product.group}
                      </p>
                      <p className="truncate text-sm font-bold text-d1-ink">
                        {product.name}
                      </p>
                    </div>
                    <span className="hidden items-center gap-1 text-[11px] font-bold text-d1-ink sm:flex">
                      <Star className="h-3 w-3 fill-d1-amber text-d1-amber" />
                      {product.rating}
                    </span>
                    <span className="text-lg font-extrabold text-d1-ink">
                      {formatUsd(product.price)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {visible.length === 0 ? (
            <div className="border border-dashed border-d1-line bg-d1-card px-6 py-16 text-center">
              <p className="text-sm font-bold text-d1-ink">
                No products match those filters.
              </p>
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between border-t border-d1-line pt-5">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-d1-steel">
              Page 1 of 4
            </span>
            <div className="flex gap-1.5">
              {["1", "2", "3", "4"].map((page) => (
                <button
                  key={page}
                  className={`grid h-9 w-9 place-items-center border text-sm font-bold transition ${
                    page === "1"
                      ? "border-d1-ink bg-d1-ink text-d1-paper"
                      : "border-d1-line text-d1-ink hover:border-d1-ink"
                  }`}
                  type="button"
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </D1Page>
  );
}
