import type { Metadata } from "next";
import { LedgerAdminDemand } from "@/features/sites/ledger/admin/admin-demand";
import {
  buildDemandMetrics,
  getDemandSummary
} from "@/features/admin/demand/demand-data";
import { buildInventoryRows } from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata: Metadata = { title: "Demand" };
export const dynamic = "force-dynamic";

export default async function LedgerAdminDemandPage() {
  const supabaseProducts = await fetchSupabaseProducts().catch(() => null);
  const catalog = mergeCatalogProducts(supabaseProducts, products);
  const inventoryRows = buildInventoryRows(catalog);
  const metrics = buildDemandMetrics(inventoryRows);
  const summary = getDemandSummary(metrics);

  return <LedgerAdminDemand metrics={metrics} summary={summary} />;
}
