import { notFound } from "next/navigation";
import { categories, products, searchProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-grid";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";
import { breadcrumbJsonLd, categoryMetadata, jsonLdScript } from "@/lib/seo";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  const slugsWithProducts = new Set(products.map((product) => product.category.slug));
  return categories
    .filter((category) => slugsWithProducts.has(category.slug))
    .map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    return { title: "Category not found" };
  }

  return categoryMetadata(category.name, category.slug, searchProducts("", slug).length);
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  const categoryProducts = searchProducts("", slug);
  const variantCount = categoryProducts.reduce(
    (total, product) => total + product.variants.length,
    0
  );
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: category.name, path: `/categories/${category.slug}` }
  ]);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }}
        type="application/ld+json"
      />
      <PageShell
        actions={
          <StatGrid
            stats={[
              { label: "Products", value: categoryProducts.length },
              { label: "Variants", value: variantCount },
              { label: "Pickup", value: "Today" }
            ]}
          />
        }
        description={`Contractor-ready ${category.name.toLowerCase()} for gate, fence, and metal fabrication work — stocked and priced for the trade, ready for same-day pickup.`}
        eyebrow="Shop by category"
        title={category.name}
      >
        <div className="mt-2">
          <ProductGrid products={categoryProducts} />
        </div>
      </PageShell>
    </>
  );
}
