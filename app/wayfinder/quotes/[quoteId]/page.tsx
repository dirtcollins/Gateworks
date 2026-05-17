// Wayfinder — quote detail route. Opens a specific quote in the builder so it
// can be reviewed and edited (line items, customer, terms, submit).
import { WayfinderQuoteBuilder } from "@/features/sites/wayfinder/quote-page";

type QuoteDetailPageProps = {
  params: Promise<{ quoteId: string }>;
};

export default async function WayfinderQuoteDetailPage({
  params
}: QuoteDetailPageProps) {
  const { quoteId } = await params;
  return <WayfinderQuoteBuilder quoteId={quoteId} />;
}
