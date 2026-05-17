import { IndustrialWarehouseBoard } from "@/features/sites/industrial/admin/warehouse";
import { buildInventoryRows } from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Warehouse"
};

export const dynamic = "force-dynamic";

export default async function IndustrialAdminWarehousePage() {
  const supabaseProducts = await fetchSupabaseProducts();
  const catalog = mergeCatalogProducts(supabaseProducts, products);
  const inventoryRows = buildInventoryRows(catalog);

  return (
    <IndustrialWarehouseBoard inventoryRows={inventoryRows} variant="warehouse" />
  );
}
