// Wayfinder admin — inventory route. Server component: builds inventory rows
// from the real catalog (Supabase-backed, local fallback) and hands them, plus
// the summary, to the stock board. The board further refreshes from the live
// `/api/admin/inventory` GET on the client.
import { WayfinderInventoryBoard } from "@/features/sites/wayfinder/admin/inventory-board";
import {
  buildInventoryRows,
  getInventorySummary
} from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products as fallbackProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Inventory"
};

export const dynamic = "force-dynamic";

export default async function WayfinderAdminInventoryPage() {
  const supabaseProducts = await fetchSupabaseProducts();
  const activeProducts = mergeCatalogProducts(supabaseProducts, fallbackProducts);
  const rows = buildInventoryRows(activeProducts);
  const summary = getInventorySummary(rows);
  return <WayfinderInventoryBoard rows={rows} summary={summary} />;
}
