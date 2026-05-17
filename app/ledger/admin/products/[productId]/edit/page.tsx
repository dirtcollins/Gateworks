import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LedgerAdminProductForm } from "@/features/sites/ledger/admin/admin-product-form";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata: Metadata = { title: "Edit product" };
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ productId: string }>;
};

export default async function LedgerAdminEditProductPage({ params }: PageProps) {
  const { productId } = await params;
  const decodedId = decodeURIComponent(productId);
  const supabaseProducts = await fetchSupabaseProducts().catch(() => null);
  const catalog = mergeCatalogProducts(supabaseProducts, products);
  const product =
    catalog.find((entry) => entry.id === decodedId) ??
    catalog.find((entry) => entry.slug === decodedId);

  if (!product) notFound();

  return <LedgerAdminProductForm mode="edit" product={product} />;
}
