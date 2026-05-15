import { Search } from "lucide-react";
import type { Category } from "@/lib/types";

type SearchBarProps = {
  categories: Category[];
  query: string;
  category: string;
  action?: string;
};

export function SearchBar({ categories, query, category, action = "/search" }: SearchBarProps) {
  return (
    <form
      className="grid gap-3 bg-white p-3 shadow-toolbar md:grid-cols-[1fr_260px]"
      action={action}
    >
      <label className="relative block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-jobsite-steel" size={20} />
        <input
          className="h-12 w-full border border-jobsite-rail pl-12 pr-4 text-base outline-none focus:border-jobsite-ink"
          defaultValue={query}
          name="q"
          placeholder="Search title, SKU, or category"
          type="search"
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
        defaultValue={category}
        name="category"
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
