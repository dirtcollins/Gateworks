import { notFound } from "next/navigation";
import { categories, mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";
import { IndustrialProductEditor } from "@/features/sites/industrial/admin/product-editor";

type IndustrialAdminEditProductPageProps = {
  params: Promise<{ productId: string }>;
};

export const metadata = {
  title: "Edit Product"
};

export const dynamic = "force-dynamic";

export default async function IndustrialAdminEditProductPage({
  params
}: IndustrialAdminEditProductPageProps) {
  const { productId } = await params;
  const decodedId = decodeURIComponent(productId);
  const supabaseProducts = await fetchSupabaseProducts();
  const catalog = mergeCatalogProducts(supabaseProducts, products);
  const product =
    catalog.find(
      (entry) => entry.id === decodedId || entry.slug === decodedId
    ) || null;

  if (!product) {
    notFound();
  }

  return (
    <IndustrialProductEditor
      mode="edit"
      product={product}
      categories={categories}
    />
  );
}
