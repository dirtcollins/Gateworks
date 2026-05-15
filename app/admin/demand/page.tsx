import { DemandDashboard } from "@/features/admin/demand/demand-dashboard";
import {
  buildDemandMetrics,
  getDemandSummary
} from "@/features/admin/demand/demand-data";
import { buildInventoryRows } from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Demand Intelligence | Gateworks Operations"
};

export default async function AdminDemandPage() {
  const supabaseProducts = await fetchSupabaseProducts();
  const activeProducts = mergeCatalogProducts(supabaseProducts, products);
  const inventoryRows = buildInventoryRows(activeProducts);
  const metrics = buildDemandMetrics(inventoryRows);

  getDemandSummary(metrics);

  return <DemandDashboard metrics={metrics} />;
}
