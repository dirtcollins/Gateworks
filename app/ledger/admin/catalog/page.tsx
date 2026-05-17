import type { Metadata } from "next";
import { LedgerAdminCatalog } from "@/features/sites/ledger/admin/admin-catalog";
import { mergeCatalogProducts, products } from "@/lib/catalog";
import { DEFAULT_STEEL_CWT_PRICE } from "@/lib/pricing";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata: Metadata = { title: "Catalog" };
export const dynamic = "force-dynamic";

export default async function LedgerAdminCatalogPage() {
  const supabaseProducts = await fetchSupabaseProducts().catch(() => null);
  const catalog = mergeCatalogProducts(supabaseProducts, products);

  // Derive the current steel CWT rate from any priced tubing variant; the
  // catalog manager persists overrides via /api/admin/settings.
  const steelCwtPrice =
    catalog
      .flatMap((product) => product.variants)
      .find((variant) => Number(variant.steel_cwt_price) > 0)?.steel_cwt_price ??
    DEFAULT_STEEL_CWT_PRICE;

  return <LedgerAdminCatalog products={catalog} steelCwtPrice={steelCwtPrice} />;
}
