import { DashboardOverview } from "@/features/admin/dashboard/dashboard-overview";
import { products as fallbackProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";
import type { Product } from "@/lib/types";

export const metadata = {
  title: "Operations | Gateworks"
};

export const dynamic = "force-dynamic";

function getProductStock(product: Product) {
  return product.variants.reduce(
    (total, variant) => total + (variant.inventoryQuantity || 0),
    0
  );
}

function getLowStockCount(products: Product[]) {
  return products.filter((product) => {
    const reorderPoint = Number.parseInt(
      product.specifications["Reorder Point"] || "5",
      10
    );

    return getProductStock(product) <= (Number.isFinite(reorderPoint) ? reorderPoint : 5);
  }).length;
}

export default async function AdminPage() {
  const catalog = (await fetchSupabaseProducts()) || fallbackProducts;

  return (
    <DashboardOverview
      lowStockCount={getLowStockCount(catalog)}
      productCount={catalog.length}
    />
  );
}
