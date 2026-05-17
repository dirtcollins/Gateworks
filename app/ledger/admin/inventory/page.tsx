import type { Metadata } from "next";
import { LedgerAdminInventory } from "@/features/sites/ledger/admin/admin-inventory";
import {
  buildInventoryRows,
  getInventorySummary
} from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata: Metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

export default async function LedgerAdminInventoryPage() {
  const supabaseProducts = await fetchSupabaseProducts().catch(() => null);
  const catalog = mergeCatalogProducts(supabaseProducts, products);
  const rows = buildInventoryRows(catalog);
  const summary = getInventorySummary(rows);

  return <LedgerAdminInventory initialRows={rows} initialSummary={summary} />;
}
