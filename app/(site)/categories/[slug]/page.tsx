// Wayfinder — category landing route. Renders dynamically to keep the build
// light. Resolves the category and its products from the real catalog.
import { notFound } from "next/navigation";
import { categoryProducts, findCategory } from "@/features/sites/wayfinder/data";
import { WayfinderCategory } from "@/features/sites/wayfinder/category-page";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = findCategory(slug);
  return { title: category ? category.name : "Category not found" };
}

export default async function WayfinderCategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = findCategory(slug);

  if (!category) {
    notFound();
  }

  const products = categoryProducts(slug);

  if (products.length === 0) {
    notFound();
  }

  return <WayfinderCategory category={category} products={products} />;
}
