// Wayfinder admin — edit product route. Server component: resolves the catalog
// product by id and hands it (plus the category list) to the editable form.
import { notFound } from "next/navigation";
import { WayfinderProductForm } from "@/features/sites/wayfinder/admin/product-form";
import { products as fallbackProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

type PageProps = {
  params: Promise<{ productId: string }>;
};

export const metadata = {
  title: "Edit product"
};

export const dynamic = "force-dynamic";

export default async function WayfinderAdminEditProductPage({ params }: PageProps) {
  const { productId } = await params;
  const catalogProducts = (await fetchSupabaseProducts()) || fallbackProducts;
  const id = decodeURIComponent(productId);
  const product =
    catalogProducts.find((item) => item.id === id) ||
    catalogProducts.find((item) => item.slug === id);

  if (!product) notFound();

  const categoryList = Array.from(
    new Map(catalogProducts.map((item) => [item.category.slug, item.category])).values()
  );

  return <WayfinderProductForm mode="edit" product={product} categories={categoryList} />;
}
