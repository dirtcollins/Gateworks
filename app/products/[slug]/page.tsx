import { notFound } from "next/navigation";
import {
  getProduct,
  getRelatedProducts,
  mergeCatalogProducts,
  products
} from "@/lib/catalog";
import { ProductPageClient } from "@/components/product-page-client";
import { fetchSupabaseProduct, fetchSupabaseProducts } from "@/lib/supabase-catalog";
import { UserStorageScope } from "@/components/user-storage-scope";
import {
  breadcrumbJsonLd,
  jsonLdScript,
  productJsonLd,
  productMetadata
} from "@/lib/seo";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug
  }));
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = (await fetchSupabaseProduct(slug)) || getProduct(slug);

  if (!product) {
    return { title: "Product not found" };
  }

  return productMetadata(product);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const supabaseProducts = await fetchSupabaseProducts();
  const activeProducts = mergeCatalogProducts(supabaseProducts, products);
  const product = activeProducts.find((item) => item.slug === slug) || getProduct(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = activeProducts
    .filter(
      (candidate) =>
        candidate.id !== product.id && candidate.category.slug === product.category.slug
    )
    .slice(0, 8);

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: product.category.name, path: `/?category=${product.category.slug}` },
    { name: product.title, path: `/products/${product.slug}` }
  ]);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd(product)) }}
        type="application/ld+json"
      />
      <script
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbs) }}
        type="application/ld+json"
      />
      <UserStorageScope />
      <ProductPageClient
        product={product}
        relatedProducts={relatedProducts.length ? relatedProducts : getRelatedProducts(product)}
        products={activeProducts}
      />
    </>
  );
}
