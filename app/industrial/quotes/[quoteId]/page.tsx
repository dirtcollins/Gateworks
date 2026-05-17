import { UserStorageScope } from "@/components/user-storage-scope";
import { IndustrialQuoteDetail } from "@/features/sites/industrial/quote-detail";

export const metadata = {
  title: "Quote detail"
};

type IndustrialQuoteDetailPageProps = {
  params: Promise<{ quoteId: string }>;
};

export default async function IndustrialQuoteDetailPage({
  params
}: IndustrialQuoteDetailPageProps) {
  const { quoteId } = await params;

  return (
    <>
      <UserStorageScope />
      <IndustrialQuoteDetail quoteId={quoteId} />
    </>
  );
}
