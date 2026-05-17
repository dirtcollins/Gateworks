"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Eyebrow, IndustrialPage } from "./kit";
import { IndustrialProductGrid } from "./product-card";
import { searchProducts } from "@/lib/catalog";
import type { Category } from "@/lib/types";

type IndustrialSearchProps = {
  categories: Category[];
  initialQuery: string;
  initialCategory: string;
};

const SORTS = [
  "Best match",
  "Price: Low to High",
  "Price: High to Low"
] as const;

export function IndustrialSearch({
  categories,
  initialQuery,
  initialCategory
}: IndustrialSearchProps) {
  const router = useRouter();
  const [term, setTerm] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Best match");

  const results = useMemo(() => {
    const list = searchProducts(term, category);
    if (sort === "Price: Low to High") {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sort === "Price: High to Low") {
      return [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [term, category, sort]);

  function syncUrl(nextTerm: string, nextCategory: string) {
    const params = new URLSearchParams();
    if (nextTerm.trim()) params.set("q", nextTerm.trim());
    if (nextCategory !== "all") params.set("category", nextCategory);
    const query = params.toString();
    router.replace(query ? `/industrial/search?${query}` : "/industrial/search", {
      scroll: false
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    syncUrl(term, category);
  }

  function changeCategory(next: string) {
    setCategory(next);
    syncUrl(term, next);
  }

  return (
    <IndustrialPage>
      <header className="border-b-2 border-d1-ink py-8">
        <Eyebrow>Gateworks supply catalog</Eyebrow>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-d1-ink sm:text-5xl">
          Search the counter
        </h1>
        <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-d1-steel">
          Find gate hardware, structural steel, ornamental iron and welding
          supply by name, category or SKU. Trade pricing applies at checkout.
        </p>

        <form className="mt-6 flex flex-wrap gap-3" onSubmit={submit}>
          <div className="flex min-w-[260px] flex-1 items-center gap-2 border border-d1-ink bg-white px-4 py-3">
            <Search className="h-4 w-4 text-d1-steel" />
            <input
              className="w-full bg-transparent text-sm font-semibold text-d1-ink outline-none placeholder:text-d1-steel/70"
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search SKU, part name or category"
              value={term}
            />
          </div>
          <select
            className="border border-d1-ink bg-white px-4 py-3 text-sm font-bold text-d1-ink outline-none"
            onChange={(event) => changeCategory(event.target.value)}
            value={category}
          >
            <option value="all">All departments</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <button
            className="bg-d1-ink px-6 py-3 text-sm font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
            type="submit"
          >
            Search
          </button>
        </form>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-d1-line py-4">
        <p className="flex items-center gap-2 text-sm font-bold text-d1-ink">
          <SlidersHorizontal className="h-4 w-4 text-d1-pine" />
          {results.length} product{results.length === 1 ? "" : "s"}
          {term.trim() ? (
            <span className="font-semibold text-d1-steel">
              &mdash; &ldquo;{term.trim()}&rdquo;
            </span>
          ) : null}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
            Sort
          </span>
          <select
            className="border border-d1-line bg-white px-2.5 py-1.5 text-sm font-bold text-d1-ink outline-none"
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

      <div className="py-8">
        <IndustrialProductGrid products={results} />
      </div>
    </IndustrialPage>
  );
}
