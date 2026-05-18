// Wayfinder admin — new product/service route. Server component: loads the
// full category list and renders the guided creation wizard, which persists
// via POST /api/admin/products.
import { WayfinderProductWizard } from "@/features/sites/wayfinder/admin/product-wizard";
import { fetchCategories } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Add a product"
};

export const dynamic = "force-dynamic";

export default async function WayfinderAdminNewProductPage() {
  const categories = await fetchCategories();
  return <WayfinderProductWizard categories={categories} />;
}
