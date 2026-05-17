import { IndustrialDemand } from "@/features/sites/industrial/admin/demand";
import { buildDemandMetrics } from "@/features/admin/demand/demand-data";
import { buildInventoryRows } from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Demand"
};

export const dynamic = "force-dynamic";

export default async function IndustrialAdminDemandPage() {
  const supabaseProducts = await fetchSupabaseProducts();
  const catalog = mergeCatalogProducts(supabaseProducts, products);
  const inventoryRows = buildInventoryRows(catalog);
  const metrics = buildDemandMetrics(inventoryRows);

  return <IndustrialDemand metrics={metrics} />;
}
