import { QuotePageClient } from "@/components/quote-page-client";
import { UserStorageScope } from "@/components/user-storage-scope";

type QuoteDetailsPageProps = {
  params: Promise<{
    quoteId: string;
  }>;
};

export default async function QuoteDetailsPage({ params }: QuoteDetailsPageProps) {
  const { quoteId } = await params;

  return (
    <>
      <UserStorageScope />
      <QuotePageClient quoteId={quoteId} />
    </>
  );
}
