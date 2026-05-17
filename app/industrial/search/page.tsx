import { categories } from "@/lib/catalog";
import { IndustrialSearch } from "@/features/sites/industrial/search";

export const metadata = {
  title: "Search the catalog"
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

export default async function IndustrialSearchPage({
  searchParams
}: SearchPageProps) {
  const params = await searchParams;

  return (
    <IndustrialSearch
      categories={categories}
      initialCategory={params.category || "all"}
      initialQuery={params.q || ""}
    />
  );
}
