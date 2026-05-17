import { categories } from "@/lib/catalog";
import { IndustrialProductEditor } from "@/features/sites/industrial/admin/product-editor";

export const metadata = {
  title: "New Product"
};

export const dynamic = "force-dynamic";

export default function IndustrialAdminNewProductPage() {
  return (
    <IndustrialProductEditor mode="create" product={null} categories={categories} />
  );
}
