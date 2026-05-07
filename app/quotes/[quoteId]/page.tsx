import { QuotePageClient } from "@/components/quote-page-client";

type QuoteDetailsPageProps = {
  params: Promise<{
    quoteId: string;
  }>;
};

export default async function QuoteDetailsPage({ params }: QuoteDetailsPageProps) {
  const { quoteId } = await params;

  return <QuotePageClient quoteId={quoteId} />;
}
