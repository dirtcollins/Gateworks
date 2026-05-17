import Link from "next/link";
import { categories, searchProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-grid";
import { ProductRail } from "@/components/product-rail";
import { SearchBar } from "@/components/search-bar";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";

const metalCategoryPattern = /tubing|metal|steel|iron|bar|sheet/;

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
  const isBrowsing = Boolean(normalized) || category !== "all";
  const contractorFavorites = [...activeProducts]
    .sort((left, right) => right.variants.length - left.variants.length)
    .slice(0, 12);
  const metalSupply = activeProducts
    .filter((product) => metalCategoryPattern.test(product.category.slug))
    .slice(0, 12);

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
      description="Gate hardware, steel tubing, ornamental iron, fence materials, and welding supply — priced for contractors and ready for same-day pickup."
      eyebrow="Gateworks Supply"
      title="Everything your crew needs to frame, hang, and finish the job."
    >
      <Link
        className="mb-4 flex items-center justify-between gap-3 rounded-md border border-dashed border-industrial-ink/30 bg-industrial-paper px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-industrial-ink transition hover:border-industrial-ink"
        href="/design-lab"
      >
        <span>Design Lab — preview 10 new site designs and compare them side by side</span>
        <span aria-hidden="true">→</span>
      </Link>

      <div className="mb-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-industrial-ink bg-industrial-ink px-5 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-industrial-pine active:translate-y-px"
          href="/quote"
        >
          Request a contractor quote
        </Link>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-industrial-rail bg-white px-5 text-sm font-black uppercase tracking-[0.08em] text-industrial-ink transition hover:border-industrial-ink active:translate-y-px"
          href="/search"
        >
          Browse the full catalog
        </Link>
        <p className="text-xs font-semibold text-industrial-muted sm:ml-1">
          Volume pricing for shops &amp; crews — retail welcome.
        </p>
      </div>

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

      {!isBrowsing ? (
        <div className="mt-6 border-t border-black/10">
          <ProductRail products={contractorFavorites} title="Contractor favorites" />
          <ProductRail products={metalSupply} title="Steel & metal supply" />
        </div>
      ) : null}
    </PageShell>
  );
}
