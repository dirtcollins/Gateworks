"use client";

import { FormEvent, useEffect, useState } from "react";
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
  const [searchTerm, setSearchTerm] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState(category);

  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  useEffect(() => {
    setSelectedCategory(category);
  }, [category]);

  function navigate(nextQuery: string, nextCategory: string) {
    const nextParams = new URLSearchParams();
    const trimmedQuery = nextQuery.trim();

    if (trimmedQuery) nextParams.set("q", trimmedQuery);
    if (nextCategory !== "all") nextParams.set("category", nextCategory);
    const nextUrl = nextParams.toString() ? `/?${nextParams.toString()}` : "/";
    router.push(nextUrl);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(searchTerm, selectedCategory);
  }

  function handleCategoryChange(nextCategory: string) {
    setSelectedCategory(nextCategory);
    navigate(searchTerm, nextCategory);
  }

  return (
    <form
      className="grid gap-3 bg-white p-3 shadow-toolbar md:grid-cols-[1fr_260px]"
      onSubmit={handleSubmit}
    >
      <label className="relative block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-jobsite-steel" size={20} />
        <input
          className="h-12 w-full border border-jobsite-rail pl-12 pr-4 text-base outline-none focus:border-jobsite-ink"
          value={searchTerm}
          placeholder="Search title, SKU, or category"
          type="search"
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <button
          aria-label="Search products"
          className="absolute right-0 top-0 grid h-12 w-12 place-items-center border-l border-jobsite-rail bg-jobsite-ink text-white hover:bg-jobsite-pine"
          type="submit"
        >
          <Search size={18} />
        </button>
      </label>
      <select
        className="h-12 w-full border border-jobsite-rail bg-white px-4 text-base font-semibold text-jobsite-ink outline-none focus:border-jobsite-ink"
        value={selectedCategory}
        onChange={(event) => handleCategoryChange(event.target.value)}
      >
        <option value="all">All categories</option>
        {categories.map((item) => (
          <option key={item.slug} value={item.slug}>
            {item.name}
          </option>
        ))}
      </select>
    </form>
  );
}
