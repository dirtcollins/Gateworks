import type { Metadata } from "next";
import { LedgerAdminProducts } from "@/features/sites/ledger/admin/admin-products";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

export default async function LedgerAdminProductsPage() {
  const supabaseProducts = await fetchSupabaseProducts().catch(() => null);
  const catalog = mergeCatalogProducts(supabaseProducts, products);
  return <LedgerAdminProducts products={catalog} />;
}
