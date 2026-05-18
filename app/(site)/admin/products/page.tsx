// Wayfinder admin — products list route. Server component: loads the real
// catalog (Supabase-backed, with the local catalog as fallback) and hands the
// serializable products to the presentational list.
import { WayfinderProductsList } from "@/features/sites/wayfinder/admin/products-list";
import { products as fallbackProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Products"
};

export const dynamic = "force-dynamic";

export default async function WayfinderAdminProductsPage() {
  const catalogProducts = (await fetchSupabaseProducts()) || fallbackProducts;
  return <WayfinderProductsList products={catalogProducts} />;
}
