import { CatalogManager } from "@/features/admin/catalog/catalog-manager";
import { products as fallbackCatalogProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

type AdminProductEditPageProps = {
  params: Promise<{
    productId: string;
  }>;
};

export const metadata = {
  title: "Edit Product | Gateworks Operations"
};

export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({ params }: AdminProductEditPageProps) {
  const { productId } = await params;
  const catalogProducts = (await fetchSupabaseProducts()) || fallbackCatalogProducts;

  return (
    <CatalogManager
      initialMode="editor"
      initialProductId={decodeURIComponent(productId)}
      products={catalogProducts}
    />
  );
}

