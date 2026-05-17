// Wayfinder admin — quote detail route.
import { WayfinderQuoteDetail } from "@/features/sites/wayfinder/admin/quote-detail";

type QuoteDetailRouteProps = {
  params: Promise<{ quoteId: string }>;
};

export const metadata = {
  title: "Quote detail"
};

export default async function WayfinderAdminQuoteDetailPage({
  params
}: QuoteDetailRouteProps) {
  const { quoteId } = await params;
  return <WayfinderQuoteDetail quoteId={decodeURIComponent(quoteId)} />;
}
