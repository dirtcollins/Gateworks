import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";
import { IndustrialCatalogManager } from "@/features/sites/industrial/admin/catalog-manager";

export const metadata = {
  title: "Catalog"
};

export const dynamic = "force-dynamic";

export default async function IndustrialAdminCatalogPage() {
  const supabaseProducts = await fetchSupabaseProducts();
  const catalog = mergeCatalogProducts(supabaseProducts, products);

  return <IndustrialCatalogManager products={catalog} />;
}
