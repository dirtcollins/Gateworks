import {
  buildInventoryRows,
  getInventorySummary
} from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";
import { IndustrialInventory } from "@/features/sites/industrial/admin/inventory";

export const metadata = {
  title: "Inventory"
};

export const dynamic = "force-dynamic";

export default async function IndustrialAdminInventoryPage() {
  const supabaseProducts = await fetchSupabaseProducts();
  const catalog = mergeCatalogProducts(supabaseProducts, products);
  const rows = buildInventoryRows(catalog);
  const summary = getInventorySummary(rows);

  return <IndustrialInventory initialRows={rows} initialSummary={summary} />;
}
