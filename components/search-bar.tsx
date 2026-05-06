"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { Category } from "@/lib/types";

type SearchBarProps = {
  categories: Category[];
  query: string;
  category: string;
};

export function SearchBar({ categories, query, category }: SearchBarProps) {
  const router = useRouter();

  function update(params: { q?: string; category?: string }) {
    const nextParams = new URLSearchParams();
    const nextQuery = params.q ?? query;
    const nextCategory = params.category ?? category;

    if (nextQuery) nextParams.set("q", nextQuery);
    if (nextCategory !== "all") nextParams.set("category", nextCategory);
    router.push(`/?${nextParams.toString()}`);
  }

  return (
    <div className="grid gap-3 bg-white p-3 shadow-toolbar md:grid-cols-[1fr_260px]">
      <label className="relative block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-jobsite-steel" size={20} />
        <input
          className="h-12 w-full border border-jobsite-rail pl-12 pr-4 text-base outline-none focus:border-jobsite-ink"
          defaultValue={query}
          placeholder="Search title, SKU, or category"
          type="search"
          onChange={(event) => update({ q: event.target.value })}
        />
      </label>
      <select
        className="h-12 w-full border border-jobsite-rail bg-white px-4 text-base font-semibold text-jobsite-ink outline-none focus:border-jobsite-ink"
        value={category}
        onChange={(event) => update({ category: event.target.value })}
      >
        <option value="all">All categories</option>
        {categories.map((item) => (
          <option key={item.slug} value={item.slug}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
  );
}
