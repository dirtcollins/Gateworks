import { InventoryDashboard } from "@/features/admin/inventory/inventory-dashboard";
import {
  buildInventoryRows,
  getInventoryCategories,
  getInventorySummary
} from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Inventory | Gateworks Operations"
};

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const supabaseProducts = await fetchSupabaseProducts();
  const activeProducts = mergeCatalogProducts(supabaseProducts, products);
  const rows = buildInventoryRows(activeProducts);
  const summary = getInventorySummary(rows);
  const categories = getInventoryCategories(rows);

  return <InventoryDashboard categories={categories} rows={rows} summary={summary} />;
}
