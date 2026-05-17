// Wayfinder admin — new order route. Server component resolves the catalog
// (Supabase, falling back to the bundled catalog) so the counter builder can
// search real SKUs.
import { WayfinderNewOrder } from "@/features/sites/wayfinder/admin/new-order";
import { products as fallbackProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "New order"
};

export const dynamic = "force-dynamic";

export default async function WayfinderAdminNewOrderPage() {
  const catalogProducts = (await fetchSupabaseProducts()) || fallbackProducts;
  return <WayfinderNewOrder catalogProducts={catalogProducts} />;
}
