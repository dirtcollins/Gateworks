import { WarehouseDashboard } from "@/features/admin/warehouse/warehouse-dashboard";
import { buildInventoryRows } from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Pick Tickets | Gateworks Operations"
};

export const dynamic = "force-dynamic";

export default async function AdminPickTicketsPage() {
  const supabaseProducts = await fetchSupabaseProducts();
  const activeProducts = mergeCatalogProducts(supabaseProducts, products);
  const inventoryRows = buildInventoryRows(activeProducts);

  return <WarehouseDashboard inventoryRows={inventoryRows} />;
}

