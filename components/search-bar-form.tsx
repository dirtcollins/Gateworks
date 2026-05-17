"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { Category } from "@/lib/types";

type SearchBarFormProps = {
  categories: Category[];
  query: string;
  category: string;
  action?: string;
};

export function SearchBarForm({
  categories,
  query,
  category,
  action = "/search"
}: SearchBarFormProps) {
  const router = useRouter();

  function buildSearchUrl(form: HTMLFormElement) {
    const formData = new FormData(form);
    const params = new URLSearchParams();
    const nextQuery = String(formData.get("q") || "").trim();
    const nextCategory = String(formData.get("category") || "all");

    if (nextQuery) {
      params.set("q", nextQuery);
    }

    if (nextCategory !== "all") {
      params.set("category", nextCategory);
    }

    const queryString = params.toString();
    return queryString ? `${action}?${queryString}` : action;
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildSearchUrl(event.currentTarget));
  }

  return (
    <form
      className="grid gap-3 rounded-lg border border-black/10 bg-white p-2 md:grid-cols-[1fr_240px]"
      action={action}
      onSubmit={submitSearch}
    >
      <label className="relative block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-industrial-muted" size={18} />
        <input
          className="h-12 w-full rounded-lg border border-transparent bg-[#f7f7f4] pl-11 pr-14 text-base text-industrial-ink outline-none transition placeholder:text-industrial-muted focus:border-black/10 focus:bg-white"
          defaultValue={query}
          name="q"
          placeholder="Message Gateworks or search SKU, product, category"
          type="search"
        />
        <button
          aria-label="Search products"
          className="absolute right-2 top-2 grid size-8 place-items-center rounded-md bg-industrial-ink text-white transition hover:bg-jobsite-pine"
          type="submit"
        >
          <Search size={16} />
        </button>
      </label>
      <select
        className="h-12 w-full rounded-lg border border-transparent bg-[#f7f7f4] px-4 text-sm font-medium text-industrial-ink outline-none transition focus:border-black/10 focus:bg-white"
        defaultValue={category}
        name="category"
        onChange={(event) => {
          const form = event.currentTarget.form;
          if (form) {
            router.push(buildSearchUrl(form));
          }
        }}
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
