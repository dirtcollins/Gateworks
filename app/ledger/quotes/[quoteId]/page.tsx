import type { Metadata } from "next";
import { LedgerQuoteDetailView } from "@/features/sites/ledger/quote-detail";

export const metadata: Metadata = { title: "Quote" };
export const dynamic = "force-dynamic";

type LedgerQuoteDetailPageProps = {
  params: Promise<{ quoteId: string }>;
};

export default async function LedgerQuoteDetailPage({
  params
}: LedgerQuoteDetailPageProps) {
  const { quoteId } = await params;
  return <LedgerQuoteDetailView quoteId={quoteId} />;
}
