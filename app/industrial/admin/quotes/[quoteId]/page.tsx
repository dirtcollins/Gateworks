import { products as fallbackProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";
import { IndustrialAdminQuoteDetail } from "@/features/sites/industrial/admin/quote-detail";

export const metadata = {
  title: "Quote detail"
};

export const dynamic = "force-dynamic";

type IndustrialAdminQuoteDetailPageProps = {
  params: Promise<{ quoteId: string }>;
};

export default async function IndustrialAdminQuoteDetailPage({
  params
}: IndustrialAdminQuoteDetailPageProps) {
  const { quoteId } = await params;
  const catalogProducts = (await fetchSupabaseProducts()) || fallbackProducts;

  return (
    <IndustrialAdminQuoteDetail
      catalogProducts={catalogProducts}
      quoteId={quoteId}
    />
  );
}
