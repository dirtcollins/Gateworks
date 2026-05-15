import { categories, searchProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-grid";
import { SearchBar } from "@/components/search-bar";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";

export default function Home() {
  const activeProducts = searchProducts("", "all");
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
      title="Contractor ordering catalog"
    >
      <SearchBar categories={categories} category="all" query="" />

      <div className="mt-5 flex items-center justify-between border-b border-jobsite-rail pb-3">
        <p className="text-sm font-bold text-jobsite-ink">
          {activeProducts.length} product{activeProducts.length === 1 ? "" : "s"}
        </p>
        <p className="hidden text-xs font-semibold text-jobsite-steel sm:block">
          Sort by: Best Match
        </p>
      </div>

      <div className="mt-4">
        <ProductGrid products={activeProducts} />
      </div>
    </PageShell>
  );
}
