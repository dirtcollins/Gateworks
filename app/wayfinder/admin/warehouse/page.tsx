// Wayfinder admin — warehouse route. Server component: builds InventoryRow data
// from the real catalog (Supabase-backed, local fallback), then renders the
// warehouse floor list view of the shared pick-ticket queue.
import { WayfinderPickTicketsBoard } from "@/features/sites/wayfinder/admin/pick-tickets-board";
import { buildInventoryRows } from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products as fallbackProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Warehouse"
};

export const dynamic = "force-dynamic";

export default async function WayfinderAdminWarehousePage() {
  const supabaseProducts = await fetchSupabaseProducts();
  const activeProducts = mergeCatalogProducts(supabaseProducts, fallbackProducts);
  const inventoryRows = buildInventoryRows(activeProducts);

  return <WayfinderPickTicketsBoard inventoryRows={inventoryRows} view="list" />;
}
