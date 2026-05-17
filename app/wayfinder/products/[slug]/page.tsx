// Wayfinder — product detail route. Renders dynamically (no
// generateStaticParams) to keep the build light across ~400 products. Looks
// the product up in the real catalog and passes it plus its related products
// to the client component.
import { notFound } from "next/navigation";
import { getProduct, getRelatedProducts } from "@/lib/catalog";
import { WayfinderProduct } from "@/features/sites/wayfinder/product-page";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);
  return { title: product ? product.title : "Product not found" };
}

export default async function WayfinderProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  const related = getRelatedProducts(product, 4);
  return <WayfinderProduct product={product} related={related} />;
}
