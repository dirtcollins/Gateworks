// Wayfinder admin — new product route. Server component: provides the catalog
// category list for the create form.
import { WayfinderProductForm } from "@/features/sites/wayfinder/admin/product-form";
import { categories, products as fallbackProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "New product"
};

export const dynamic = "force-dynamic";

export default async function WayfinderAdminNewProductPage() {
  const catalogProducts = (await fetchSupabaseProducts()) || fallbackProducts;
  const categoryList = catalogProducts.length
    ? Array.from(
        new Map(
          catalogProducts.map((product) => [product.category.slug, product.category])
        ).values()
      )
    : categories;
  return <WayfinderProductForm mode="create" categories={categoryList} />;
}
