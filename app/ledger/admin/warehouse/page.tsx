import type { Metadata } from "next";
import { LedgerAdminWarehouse } from "@/features/sites/ledger/admin/admin-warehouse";
import { buildInventoryRows } from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata: Metadata = { title: "Warehouse" };
export const dynamic = "force-dynamic";

export default async function LedgerAdminWarehousePage() {
  const supabaseProducts = await fetchSupabaseProducts().catch(() => null);
  const catalog = mergeCatalogProducts(supabaseProducts, products);
  const inventoryRows = buildInventoryRows(catalog);

  return <LedgerAdminWarehouse inventoryRows={inventoryRows} />;
}
