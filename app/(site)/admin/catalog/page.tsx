// Wayfinder admin — catalog manager route. Server component: loads the real
// catalog and passes it to the category / CWT-pricing manager.
import { WayfinderCatalogManager } from "@/features/sites/wayfinder/admin/catalog-manager";
import { products as fallbackProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Catalog"
};

export const dynamic = "force-dynamic";

export default async function WayfinderAdminCatalogPage() {
  const catalogProducts = (await fetchSupabaseProducts()) || fallbackProducts;
  return <WayfinderCatalogManager products={catalogProducts} />;
}
