import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";
import { IndustrialAdminProducts } from "@/features/sites/industrial/admin/products-list";

export const metadata = {
  title: "Products"
};

export const dynamic = "force-dynamic";

export default async function IndustrialAdminProductsPage() {
  const supabaseProducts = await fetchSupabaseProducts();
  const catalog = mergeCatalogProducts(supabaseProducts, products);

  return <IndustrialAdminProducts products={catalog} />;
}
