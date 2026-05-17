"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Eyebrow, IndustrialPage } from "./kit";
import { IndustrialProductGrid } from "./product-card";
import type { Category, Product } from "@/lib/types";

type IndustrialCategoryProps = {
  category: Category;
  products: Product[];
};

const SORTS = [
  "Featured",
  "Price: Low to High",
  "Price: High to Low"
] as const;

function finishOf(product: Product): string {
  const first = product.variants[0];
  return first?.options.finish || first?.options.material || "Standard";
}

function inStock(product: Product): boolean {
  return product.variants.some((variant) => variant.inventory === "in_stock");
}

export function IndustrialCategory({
  category,
  products
}: IndustrialCategoryProps) {
  const finishes = useMemo(
    () => Array.from(new Set(products.map(finishOf))).sort(),
    [products]
  );

  const [activeFinishes, setActiveFinishes] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Featured");

  const visible = useMemo(() => {
    let list = products.filter(
      (product) =>
        (activeFinishes.length === 0 ||
          activeFinishes.includes(finishOf(product))) &&
        (!inStockOnly || inStock(product))
    );
    if (sort === "Price: Low to High") {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sort === "Price: High to Low") {
      list = [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [products, activeFinishes, inStockOnly, sort]);

  function toggleFinish(finish: string) {
    setActiveFinishes((current) =>
      current.includes(finish)
        ? current.filter((item) => item !== finish)
        : [...current, finish]
    );
  }

  return (
    <IndustrialPage>
      <nav className="flex items-center gap-1.5 py-5 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
        <Link className="hover:text-d1-ink" href="/industrial">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link className="hover:text-d1-ink" href="/industrial/search">
          Catalog
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-d1-ink">{category.name}</span>
      </nav>

      <header className="border-y-2 border-d1-ink py-8">
        <Eyebrow>Department</Eyebrow>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-d1-ink sm:text-5xl">
            {category.name}
          </h1>
          <span className="text-sm font-bold uppercase tracking-[0.12em] text-d1-steel">
            {visible.length} of {products.length} SKUs
          </span>
        </div>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-d1-steel">
          Contractor-grade {category.name.toLowerCase()} stocked deep at the
          counter. Trade pricing is applied at checkout and every order is
          ready for same-day will-call pickup.
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
            {finishes.length > 1 ? (
              <div className="border-b border-d1-line px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-d1-steel">
                  Finish &amp; material
                </p>
                <div className="mt-3 space-y-2.5">
                  {finishes.map((finish) => (
                    <label
                      key={finish}
                      className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-d1-ink"
                    >
                      <input
                        checked={activeFinishes.includes(finish)}
                        className="h-4 w-4 accent-d1-pine"
                        onChange={() => toggleFinish(finish)}
                        type="checkbox"
                      />
                      {finish}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
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
                setActiveFinishes([]);
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
              Need a bulk quote on {category.name.toLowerCase()}? Our counter
              team will spec the full assembly.
            </p>
            <Link
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-d1-amber hover:underline"
              href="/industrial/quote"
            >
              Request a quote <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>

        {/* Results */}
        <div className="lg:col-span-9">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-d1-line bg-d1-card px-4 py-2.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
              {visible.length} result{visible.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                Sort
              </span>
              <select
                className="border border-d1-line bg-d1-paper px-2.5 py-1.5 text-sm font-bold text-d1-ink outline-none"
                onChange={(event) =>
                  setSort(event.target.value as (typeof SORTS)[number])
                }
                value={sort}
              >
                {SORTS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <IndustrialProductGrid products={visible} />
        </div>
      </div>
    </IndustrialPage>
  );
}
