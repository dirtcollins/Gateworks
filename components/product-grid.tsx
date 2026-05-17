import type { Product } from "@/lib/types";
import { ProductSummaryCard } from "@/components/product-summary-card";

type ProductGridProps = {
  products: Product[];
  layout?: "grid" | "list" | "rail";
};

export function ProductGrid({ products, layout = "grid" }: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="rounded-lg border border-dashed border-black/15 bg-white/70 p-10 text-center text-industrial-muted">
        No products match that search.
      </div>
    );
  }

  return (
    <div
      className={
        layout === "rail"
          ? "grid grid-flow-col auto-cols-[220px] grid-rows-1 gap-3 overflow-x-auto pb-3"
          : layout === "list"
          ? "grid grid-cols-1 gap-3"
          : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      }
    >
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
