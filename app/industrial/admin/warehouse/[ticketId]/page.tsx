import { IndustrialWarehouseTicket } from "@/features/sites/industrial/admin/warehouse-ticket";
import { buildInventoryRows } from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Pick ticket"
};

export const dynamic = "force-dynamic";

type IndustrialWarehouseTicketPageProps = {
  params: Promise<{ ticketId: string }>;
};

export default async function IndustrialWarehouseTicketPage({
  params
}: IndustrialWarehouseTicketPageProps) {
  const { ticketId } = await params;
  const supabaseProducts = await fetchSupabaseProducts();
  const catalog = mergeCatalogProducts(supabaseProducts, products);
  const inventoryRows = buildInventoryRows(catalog);

  return (
    <IndustrialWarehouseTicket
      inventoryRows={inventoryRows}
      ticketId={decodeURIComponent(ticketId)}
    />
  );
}
