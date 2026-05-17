import { products as fallbackProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";
import { IndustrialAdminNewOrder } from "@/features/sites/industrial/admin/new-order";

export const metadata = {
  title: "New order"
};

export const dynamic = "force-dynamic";

export default async function IndustrialAdminNewOrderPage() {
  const catalogProducts = (await fetchSupabaseProducts()) || fallbackProducts;

  return <IndustrialAdminNewOrder catalogProducts={catalogProducts} />;
}
