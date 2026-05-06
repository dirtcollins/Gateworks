import { notFound } from "next/navigation";
import { getProduct, getRelatedProducts, products } from "@/lib/catalog";
import { ProductPageClient } from "@/components/product-page-client";
import { fetchSupabaseProduct, fetchSupabaseProducts } from "@/lib/supabase-catalog";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug
  }));
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = (await fetchSupabaseProduct(slug)) || getProduct(slug);

  return {
    title: product ? `${product.title} | Contractor Supply` : "Product"
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const supabaseProducts = await fetchSupabaseProducts();
  const product = supabaseProducts?.find((item) => item.slug === slug) || getProduct(slug);

  if (!product) {
    notFound();
  }

  const activeProducts = supabaseProducts || products;
  const relatedProducts = activeProducts
    .filter(
      (candidate) =>
        candidate.id !== product.id && candidate.category.slug === product.category.slug
    )
    .slice(0, 8);

  return (
    <ProductPageClient
      product={product}
      relatedProducts={relatedProducts.length ? relatedProducts : getRelatedProducts(product)}
      products={activeProducts}
    />
  );
}
