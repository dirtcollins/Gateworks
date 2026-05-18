// Wayfinder admin — demand route. Server component: builds InventoryRow data
// from the real catalog, runs the demand/reorder intelligence model
// (features/admin/demand/demand-data), and hands the metrics to the demand
// signals board.
import { WayfinderDemandBoard } from "@/features/sites/wayfinder/admin/demand-board";
import { buildDemandMetrics } from "@/features/admin/demand/demand-data";
import { buildInventoryRows } from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products as fallbackProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Demand"
};

export const dynamic = "force-dynamic";

export default async function WayfinderAdminDemandPage() {
  const supabaseProducts = await fetchSupabaseProducts();
  const activeProducts = mergeCatalogProducts(supabaseProducts, fallbackProducts);
  const inventoryRows = buildInventoryRows(activeProducts);
  const metrics = buildDemandMetrics(inventoryRows);

  return <WayfinderDemandBoard metrics={metrics} />;
}
