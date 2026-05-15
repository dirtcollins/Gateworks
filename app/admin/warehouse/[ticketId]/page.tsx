import { PickTicketPageClient } from "@/features/admin/warehouse/pick-ticket-page-client";
import { buildInventoryRows } from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

type PickTicketPageProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

export const metadata = {
  title: "Pick Ticket | Gateworks Operations"
};

export const dynamic = "force-dynamic";

export default async function PickTicketPage({ params }: PickTicketPageProps) {
  const { ticketId } = await params;
  const supabaseProducts = await fetchSupabaseProducts();
  const activeProducts = mergeCatalogProducts(supabaseProducts, products);
  const inventoryRows = buildInventoryRows(activeProducts);

  return (
    <PickTicketPageClient
      inventoryRows={inventoryRows}
      ticketId={decodeURIComponent(ticketId)}
    />
  );
}
