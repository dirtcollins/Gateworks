// Wayfinder admin — dashboard route. Server component: resolves catalog stock
// counts and server-aggregated financials (revenue trend, AOV, receivables),
// then hands them to the client dashboard, which adds the live order pipeline.
import { WayfinderAdminDashboard } from "@/features/sites/wayfinder/admin/dashboard";
import { products as fallbackProducts } from "@/lib/catalog";
import { fetchReportData } from "@/lib/reports-data";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";
import type { Product } from "@/lib/types";

export const metadata = {
  title: "Dashboard"
};

export const dynamic = "force-dynamic";

function productStock(product: Product) {
  return product.variants.reduce(
    (total, variant) => total + (variant.inventoryQuantity || 0),
    0
  );
}

function lowStockCount(products: Product[]) {
  return products.filter((product) => {
    const reorder = Number.parseInt(product.specifications["Reorder Point"] || "5", 10);
    return productStock(product) <= (Number.isFinite(reorder) ? reorder : 5);
  }).length;
}

export default async function WayfinderAdminDashboardPage() {
  const [catalog, reportData] = await Promise.all([
    fetchSupabaseProducts().then((products) => products || fallbackProducts),
    fetchReportData()
  ]);
  return (
    <WayfinderAdminDashboard
      reportData={reportData}
      productCount={catalog.length}
      lowStockCount={lowStockCount(catalog)}
    />
  );
}
