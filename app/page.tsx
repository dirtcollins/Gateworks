import Link from "next/link";
import { categories, searchProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-grid";
import { SearchBar } from "@/components/search-bar";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";

const homeProductLimit = 24;

type HomePageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

function makeSearchHref(query: string, category: string) {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.set("q", query.trim());
  }

  if (category !== "all") {
    params.set("category", category);
  }

  const queryString = params.toString();
  return queryString ? `/search?${queryString}` : "/search";
}

export default async function Home({ searchParams }: HomePageProps) {
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
  const visibleProducts = filteredProducts.slice(0, homeProductLimit);
  const selectedCategory = categories.find((item) => item.slug === category);
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
      title="What are you sourcing today?"
    >
      <SearchBar action="/" categories={categories} category={category} query={query} />

      <div className="mt-5 flex items-center justify-between border-b border-black/10 pb-3">
        <p className="text-sm font-semibold text-industrial-ink">
          {selectedCategory ? selectedCategory.name : "Featured products"}
        </p>
        <Link
          className="text-xs font-semibold text-industrial-steel transition hover:text-industrial-ink"
          href={makeSearchHref(query, category)}
        >
          View all {filteredProducts.length}
        </Link>
      </div>

      <div className="mt-4">
        <ProductGrid products={visibleProducts} />
      </div>
    </PageShell>
  );
}
