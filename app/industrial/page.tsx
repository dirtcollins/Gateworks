import { categories, products, searchProducts } from "@/lib/catalog";
import { IndustrialHome } from "@/features/sites/industrial/home";

export const metadata = {
  title: "Industrial Pro storefront"
};

export default function IndustrialHomePage() {
  const departments = categories
    .map((category) => ({
      name: category.name,
      slug: category.slug,
      count: searchProducts("", category.slug).length
    }))
    .filter((department) => department.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);

  const featured = [...products]
    .sort((left, right) => right.variants.length - left.variants.length)
    .slice(0, 4);

  return (
    <IndustrialHome
      departments={departments}
      featured={featured}
      totalProducts={products.length}
    />
  );
}
