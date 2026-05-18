// Wayfinder admin — warehouse pick-ticket detail route. Server component:
// builds InventoryRow data from the real catalog so each pick line resolves a
// real bin/availability, then hands the decoded ticket id to the client
// detail walker.
import { WayfinderPickTicketDetail } from "@/features/sites/wayfinder/admin/pick-ticket-detail";
import { buildInventoryRows } from "@/features/admin/inventory/inventory-data";
import { mergeCatalogProducts, products as fallbackProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

type PageProps = {
  params: Promise<{ ticketId: string }>;
};

export const metadata = {
  title: "Pick Ticket"
};

export const dynamic = "force-dynamic";

export default async function WayfinderAdminPickTicketPage({
  params
}: PageProps) {
  const { ticketId } = await params;
  const supabaseProducts = await fetchSupabaseProducts();
  const activeProducts = mergeCatalogProducts(supabaseProducts, fallbackProducts);
  const inventoryRows = buildInventoryRows(activeProducts);

  return (
    <WayfinderPickTicketDetail
      inventoryRows={inventoryRows}
      ticketId={decodeURIComponent(ticketId)}
    />
  );
}
