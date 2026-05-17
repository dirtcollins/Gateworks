import { notFound } from "next/navigation";
import { categories, searchProducts } from "@/lib/catalog";
import { LedgerCategoryView } from "@/features/sites/ledger/category";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  return { title: category ? category.name : "Category not found" };
}

export default async function LedgerCategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  const categoryProducts = searchProducts("", slug);
  const siblingCategories = categories
    .map((item) => ({
      name: item.name,
      slug: item.slug,
      count: searchProducts("", item.slug).length
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <LedgerCategoryView
      category={category}
      categoryProducts={categoryProducts}
      siblingCategories={siblingCategories}
    />
  );
}
