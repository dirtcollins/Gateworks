import { QuoteDetailPage } from "@/features/admin/quotes/quote-detail-page";
import { products as fallbackCatalogProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

type QuoteDetailPageProps = {
  params: Promise<{
    quoteId: string;
  }>;
};

export const metadata = {
  title: "Quote Detail | Gateworks Operations"
};

export const dynamic = "force-dynamic";

export default async function AdminQuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { quoteId } = await params;
  const catalogProducts = (await fetchSupabaseProducts()) || fallbackCatalogProducts;

  return (
    <QuoteDetailPage
      backHref="/admin/quotes"
      catalogProducts={catalogProducts}
      quoteId={decodeURIComponent(quoteId)}
    />
  );
}
