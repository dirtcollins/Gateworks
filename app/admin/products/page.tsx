import { CatalogManager } from "@/features/admin/catalog/catalog-manager";
import { products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Products | Gateworks Operations"
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabaseProducts = await fetchSupabaseProducts();

  return <CatalogManager products={supabaseProducts || products} />;
}

