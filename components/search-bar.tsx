import { SearchBarForm } from "@/components/search-bar-form";
import type { Category } from "@/lib/types";

type SearchBarProps = {
  categories: Category[];
  query: string;
  category: string;
  action?: string;
};

export function SearchBar({ categories, query, category, action = "/search" }: SearchBarProps) {
  return (
    <SearchBarForm
      action={action}
      categories={categories}
      category={category}
      query={query}
    />
  );
}
