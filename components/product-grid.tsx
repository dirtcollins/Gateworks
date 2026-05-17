import type { Product } from "@/lib/types";
import { ProductSummaryCard } from "@/components/product-summary-card";
import { ProductCardSkeleton } from "@/components/product-card-skeleton";

type ProductGridLayout = "grid" | "list" | "rail";

type ProductGridProps = {
  products: Product[];
  layout?: ProductGridLayout;
  isLoading?: boolean;
  skeletonCount?: number;
};

function gridClassName(layout: ProductGridLayout) {
  if (layout === "rail") {
    return "grid grid-flow-col auto-cols-[220px] grid-rows-1 gap-3 overflow-x-auto pb-3";
  }
  if (layout === "list") {
    return "grid grid-cols-1 gap-3";
  }
  return "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
}

export function ProductGrid({
  products,
  layout = "grid",
  isLoading = false,
  skeletonCount = 8
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className={gridClassName(layout)}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ProductCardSkeleton key={index} layout={layout === "list" ? "list" : "grid"} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-card border border-dashed border-black/15 bg-white/70 p-10 text-center text-industrial-muted">
        No products match that search.
      </div>
    );
  }

  return (
    <div className={gridClassName(layout)}>
      {products.map((product) => (
        <ProductSummaryCard
          key={product.id}
          product={product}
          layout={layout === "list" ? "list" : "grid"}
        />
      ))}
    </div>
  );
}
