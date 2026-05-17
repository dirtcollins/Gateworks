import { IndustrialAdminQuoteDetail } from "@/features/sites/industrial/admin/quote-detail";

export const metadata = {
  title: "Quote detail"
};

type IndustrialAdminQuoteDetailPageProps = {
  params: Promise<{ quoteId: string }>;
};

export default async function IndustrialAdminQuoteDetailPage({
  params
}: IndustrialAdminQuoteDetailPageProps) {
  const { quoteId } = await params;

  return <IndustrialAdminQuoteDetail quoteId={quoteId} />;
}
