import type { Metadata } from "next";
import { LedgerAdminQuoteDetail } from "@/features/sites/ledger/admin/admin-quote-detail";

export const metadata: Metadata = { title: "Quote detail" };
export const dynamic = "force-dynamic";

type LedgerAdminQuoteDetailPageProps = {
  params: Promise<{ quoteId: string }>;
};

export default async function LedgerAdminQuoteDetailPage({
  params
}: LedgerAdminQuoteDetailPageProps) {
  const { quoteId } = await params;
  return <LedgerAdminQuoteDetail quoteId={decodeURIComponent(quoteId)} />;
}
