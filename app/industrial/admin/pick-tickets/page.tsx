import { IndustrialWarehouseBoard } from "@/features/sites/industrial/admin/warehouse";
import { buildInventoryRows } from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Pick tickets"
};

export const dynamic = "force-dynamic";

export default async function IndustrialAdminPickTicketsPage() {
  const supabaseProducts = await fetchSupabaseProducts();
  const catalog = mergeCatalogProducts(supabaseProducts, products);
  const inventoryRows = buildInventoryRows(catalog);

  return (
    <IndustrialWarehouseBoard inventoryRows={inventoryRows} variant="pick-tickets" />
  );
}
