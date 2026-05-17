// Wayfinder admin — pick-tickets route. Server component: builds InventoryRow
// data from the real catalog (Supabase-backed, local fallback) so pick lines
// resolve real bin/availability data, then renders the pick-desk board view.
import { WayfinderPickTicketsBoard } from "@/features/sites/wayfinder/admin/pick-tickets-board";
import { buildInventoryRows } from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products as fallbackProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Pick Tickets"
};

export const dynamic = "force-dynamic";

export default async function WayfinderAdminPickTicketsPage() {
  const supabaseProducts = await fetchSupabaseProducts();
  const activeProducts = mergeCatalogProducts(supabaseProducts, fallbackProducts);
  const inventoryRows = buildInventoryRows(activeProducts);

  return <WayfinderPickTicketsBoard inventoryRows={inventoryRows} view="board" />;
}
