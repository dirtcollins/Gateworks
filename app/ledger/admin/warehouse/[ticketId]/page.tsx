import type { Metadata } from "next";
import { LedgerAdminWarehouseTicket } from "@/features/sites/ledger/admin/admin-warehouse-ticket";
import { buildInventoryRows } from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

type PageProps = {
  params: Promise<{ ticketId: string }>;
};

export const metadata: Metadata = { title: "Pick ticket" };
export const dynamic = "force-dynamic";

export default async function LedgerAdminWarehouseTicketPage({
  params
}: PageProps) {
  const { ticketId } = await params;
  const supabaseProducts = await fetchSupabaseProducts().catch(() => null);
  const catalog = mergeCatalogProducts(supabaseProducts, products);
  const inventoryRows = buildInventoryRows(catalog);

  return (
    <LedgerAdminWarehouseTicket
      inventoryRows={inventoryRows}
      ticketId={decodeURIComponent(ticketId)}
    />
  );
}
