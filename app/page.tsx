import { Suspense } from "react";
import { categories, searchProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-grid";
import { SearchBar } from "@/components/search-bar";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

type HomeProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const query = params.q || "";
  const category = params.category || "all";
  const supabaseProducts = await fetchSupabaseProducts();
  const activeProducts = supabaseProducts || searchProducts("", "all");
  const activeCategories =
    supabaseProducts
      ? Array.from(
          new Map(
            activeProducts.map((product) => [product.category.slug, product.category])
          ).values()
        )
      : categories;
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

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-4 md:py-6">
      <div className="mb-4 border border-jobsite-rail bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-jobsite-steel">
              TrueWerk Supply
            </p>
            <h1 className="text-2xl font-black text-jobsite-ink md:text-3xl">
              Technical gate and fence hardware
            </h1>
          </div>
          <div className="grid grid-cols-3 divide-x divide-jobsite-rail border border-jobsite-rail text-center text-xs font-bold">
            <div className="px-4 py-2">
              <span className="block text-jobsite-pine">50</span>
              Products
            </div>
            <div className="px-4 py-2">
              <span className="block text-jobsite-pine">68</span>
              Variants
            </div>
            <div className="px-4 py-2">
              <span className="block text-jobsite-pine">Today</span>
              Pickup
            </div>
          </div>
        </div>
      </div>

      <Suspense>
        <SearchBar categories={activeCategories} category={category} query={query} />
      </Suspense>

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
    </main>
  );
}
