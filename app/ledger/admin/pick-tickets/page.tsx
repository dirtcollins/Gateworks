import type { Metadata } from "next";
import { LedgerAdminPickTickets } from "@/features/sites/ledger/admin/admin-pick-tickets";
import { buildInventoryRows } from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata: Metadata = { title: "Pick tickets" };
export const dynamic = "force-dynamic";

export default async function LedgerAdminPickTicketsPage() {
  const supabaseProducts = await fetchSupabaseProducts().catch(() => null);
  const catalog = mergeCatalogProducts(supabaseProducts, products);
  const inventoryRows = buildInventoryRows(catalog);

  return <LedgerAdminPickTickets inventoryRows={inventoryRows} />;
}
