import { notFound } from "next/navigation";
import { getProduct, getRelatedProducts } from "@/lib/catalog";
import { LedgerProductView } from "@/features/sites/ledger/product";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);
  return { title: product ? product.title : "Product not found" };
}

export default async function LedgerProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProduct(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = getRelatedProducts(product, 8);

  return (
    <LedgerProductView product={product} relatedProducts={relatedProducts} />
  );
}
