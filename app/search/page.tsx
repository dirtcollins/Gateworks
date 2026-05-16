import { categories, searchProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-grid";
import { SearchBar } from "@/components/search-bar";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

export const metadata = {
  title: "Search | Gateworks"
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";
  const category = params.category || "all";
  const activeProducts = searchProducts("", "all");
  const normalized = query.trim().toLowerCase();
  const filteredProducts = activeProducts.filter((product) => {
    const matchesCategory =
      category === "all" || product.category.slug === category;
    const matchesSearch =
      !normalized ||
      product.title.toLowerCase().includes(normalized) ||
      product.category.name.toLowerCase().includes(normalized) ||
      product.variants.some((variant) =>
        variant.sku.toLowerCase().includes(normalized)
      );

    return matchesCategory && matchesSearch;
  });
  const variantCount = activeProducts.reduce(
    (total, product) => total + product.variants.length,
    0
  );

  return (
    <PageShell
      actions={
        <StatGrid
          stats={[
            { label: "Products", value: activeProducts.length },
            { label: "Variants", value: variantCount },
            { label: "Pickup", value: "Today" }
          ]}
        />
      }
      description="Search and order gate hardware, metal supply, ornamental iron, welding supplies, fence materials, and contractor-ready stock."
      eyebrow="Gateworks Supply"
      title="Contractor ordering products"
    >
      <SearchBar categories={categories} category={category} query={query} />

      <div className="mt-5 flex items-center justify-between border-b border-jobsite-rail pb-3">
        <p className="text-sm font-bold text-jobsite-ink">
          {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
        </p>
        <p className="hidden text-xs font-semibold text-jobsite-steel sm:block">
          Sort by: Best Match
        </p>
      </div>

      <div className="mt-4">
        <ProductGrid products={filteredProducts} />
      </div>
    </PageShell>
  );
}
