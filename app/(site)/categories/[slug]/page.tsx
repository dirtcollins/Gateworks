// Wayfinder — category landing route. Pre-renders every catalog category as
// static HTML and revalidates hourly via ISR; dynamicParams keeps unknown
// slugs rendering on demand. Emits category-specific metadata and a
// BreadcrumbList JSON-LD block.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories } from "@/lib/catalog";
import { categoryProducts, findCategory } from "@/features/sites/wayfinder/data";
import {
  breadcrumbJsonLd,
  categoryMetadata,
  jsonLdScript
} from "@/lib/seo";
import { WayfinderCategory } from "@/features/sites/wayfinder/category-page";

export const revalidate = 3600;
export const dynamicParams = true;

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = findCategory(slug);

  if (!category) {
    return { title: "Category not found", robots: { index: false } };
  }

  return categoryMetadata(category.name, category.slug, categoryProducts(slug).length);
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

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: category.name, path: `/categories/${category.slug}` }
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />
      <WayfinderCategory category={category} products={products} />
    </>
  );
}
