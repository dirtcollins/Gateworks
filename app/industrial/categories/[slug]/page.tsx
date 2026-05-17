import { notFound } from "next/navigation";
import { categories, searchProducts } from "@/lib/catalog";
import { IndustrialCategory } from "@/features/sites/industrial/category";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);

  return {
    title: category ? category.name : "Category not found"
  };
}

export default async function IndustrialCategoryPage({
  params
}: CategoryPageProps) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  return (
    <IndustrialCategory
      category={category}
      products={searchProducts("", slug)}
    />
  );
}
