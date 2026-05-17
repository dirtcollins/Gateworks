import { notFound } from "next/navigation";
import { getProduct, getRelatedProducts } from "@/lib/catalog";
import { IndustrialProduct } from "@/features/sites/industrial/product";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);

  return {
    title: product ? product.title : "Product not found"
  };
}

export default async function IndustrialProductPage({
  params
}: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <IndustrialProduct
      product={product}
      related={getRelatedProducts(product, 4)}
    />
  );
}
