// Wayfinder — product detail route. Pre-renders every catalog product as
// static HTML via generateStaticParams (the catalog is ~450 products, so the
// build stays reasonable) and revalidates hourly via ISR. dynamicParams keeps
// any slug not in the build set rendering on demand. Emits per-product
// metadata and Product/Offer/BreadcrumbList JSON-LD for crawlers.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getRelatedProducts, products } from "@/lib/catalog";
import {
  breadcrumbJsonLd,
  jsonLdScript,
  productJsonLd,
  productMetadata
} from "@/lib/seo";
import { WayfinderProduct } from "@/features/sites/wayfinder/product-page";

export const revalidate = 3600;
export const dynamicParams = true;

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    return { title: "Product not found", robots: { index: false } };
  }

  return productMetadata(product);
}

export default async function WayfinderProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  const related = getRelatedProducts(product, 4);

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: product.category.name, path: `/categories/${product.category.slug}` },
    { name: product.title, path: `/products/${product.slug}` }
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd(product)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }}
      />
      <WayfinderProduct product={product} related={related} />
    </>
  );
}
